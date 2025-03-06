import sys
import threading

from config import logger
from ec import EC
from utils import version_compare

from ..power_device import PowerDevice

EC_BYPASS_CHARGE_ADDR = 0x1E
EC_BYPASS_CHARGE_OPEN = 0x55
EC_BYPASS_CHARGE_CLOSE = 0xAA
EC_COMM_PORT = 0x4E
EC_DATA_PORT = 0x4F


# from https://github.com/Valkirie/HandheldCompanion/blob/main/HandheldCompanion/Devices/AYANEO/AYANEODeviceCEc.cs
class AyaneoDevice(PowerDevice):
    def __init__(self) -> None:
        super().__init__()
        self.ec_comm_port = EC_COMM_PORT
        self.ec_data_port = EC_DATA_PORT
        self.ec_bypass_charge_addr = EC_BYPASS_CHARGE_ADDR
        self.ec_bypass_charge_open = EC_BYPASS_CHARGE_OPEN
        self.ec_bypass_charge_close = EC_BYPASS_CHARGE_CLOSE
        self._charge_limit: int | None = None
        self._monitor_thread = None
        self.ec_version_of_bypass_charge = None

    def _get_ec_version(self) -> list[int]:
        return [
            EC.Read(0x00),
            EC.Read(0x01),
            EC.Read(0x02),
            EC.Read(0x03),
            EC.Read(0x04),
        ]

    def supports_bypass_charge(self) -> bool:
        ec_version = self._get_ec_version()
        # 格式化输出EC版本号
        ec_version_hex = [hex(v) for v in ec_version]
        logger.info(
            f"EC version (decimal): {ec_version}, EC version (hex): {ec_version_hex}"
        )
        compare_result = version_compare(ec_version, self.ec_version_of_bypass_charge)

        if self.ec_version_of_bypass_charge is not None:
            logger.info(f"Required EC version: {self.ec_version_of_bypass_charge}")
            logger.info(f"Version comparison result: {compare_result}")

        return self.ec_version_of_bypass_charge is not None and compare_result >= 0

    def supports_charge_limit(self) -> bool:
        return self.supports_bypass_charge()

    def software_charge_limit(self) -> bool:
        return self.supports_bypass_charge()

    def get_bypass_charge(self) -> bool | None:
        """
        获取旁路供电开关状态
        :return:
        """
        value = self._ec_read(self.ec_bypass_charge_addr)
        if value == self.ec_bypass_charge_open:
            return True
        elif value == self.ec_bypass_charge_close:
            return False
        else:
            return None

    def _set_bypass_charge(self, value: bool) -> None:
        self._ec_write(
            self.ec_bypass_charge_addr,
            self.ec_bypass_charge_open if value else self.ec_bypass_charge_close,
        )

    def set_bypass_charge(self, value: bool) -> None:
        """
        设置旁路供电
        :param value: True 开启旁路供电，False 关闭旁路供电
        :return: None
        """
        logger.info(f"Setting bypass charge: {value}")

        if value:
            # 如果手动开启旁路供电，暂时停止充电限制监控
            self._stop_monitor()
        else:
            # 如果关闭旁路供电，且有充电限制，重新启动监控
            if self._charge_limit is not None:
                self._start_monitor()

        self._set_bypass_charge(value)

    class _MonitorThread(threading.Thread):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.exc = None

        def run(self):
            try:
                super().run()
            except Exception:
                self.exc = sys.exc_info()

    def _monitor_battery(self):
        """
        监控电池状态的线程函数
        """
        import sys
        import time

        from config import logger
        from utils import get_battery_percentage, is_battery_charging

        SLEEP_TIME = 10

        logger.info("Start monitoring battery status")
        logger.debug(
            f"Thread status: {self._monitor_thread and self._monitor_thread.is_alive()}"
        )

        last_battery_status = None

        logger.info(f"Battery limit: {self._charge_limit}%")

        while self._monitor_thread and self._monitor_thread.is_alive():
            try:
                battery_percentage = get_battery_percentage()
                is_charging = is_battery_charging()

                logger.debug(
                    f"Battery status: {battery_percentage}%, charging: {is_charging}, limit: {self._charge_limit}%"
                )

                # 获取当前旁路供电状态
                current_bypass = self.get_bypass_charge()

                # Only log when status changes
                current_status = (
                    battery_percentage,
                    is_charging,
                    current_bypass,
                    self._charge_limit,
                )
                if current_status != last_battery_status:
                    logger.info(
                        f"Battery status: {battery_percentage}%, charging: {is_charging}, bypass: {current_bypass}, limit: {self._charge_limit}%"
                    )
                    last_battery_status = current_status

                if (
                    battery_percentage >= self._charge_limit
                    and not current_bypass
                    # and is_charging
                ):
                    logger.info(
                        f"Battery level >= limit {self._charge_limit}%, enabling bypass charge"
                    )
                    self._set_bypass_charge(True)
                elif (
                    battery_percentage < self._charge_limit
                    and current_bypass
                    # and not is_charging
                ):
                    logger.info(
                        f"Battery level < limit {self._charge_limit}%, disabling bypass charge"
                    )
                    self._set_bypass_charge(False)
            except Exception as e:
                logger.error(f"Error monitoring battery status: {str(e)}")
                logger.error(f"Error details: {str(sys.exc_info())}")
                raise  # 重新抛出异常，让外部能够捕获

            time.sleep(SLEEP_TIME)

    def _start_monitor(self):
        """
        启动电池监控线程
        """
        if self._monitor_thread and self._monitor_thread.is_alive():
            # logger.info(f"Monitor thread is already running, thread ID: {id(self._monitor_thread)}")
            return

        logger.info("Creating new monitor thread")
        self._monitor_thread = self._MonitorThread(
            target=self._monitor_battery, daemon=True
        )
        thread_id = id(self._monitor_thread)
        self._monitor_thread.start()
        logger.debug(
            f"Monitor thread started, thread ID: {thread_id}, is alive: {self._monitor_thread.is_alive()}"
        )

    def _stop_monitor(self):
        """
        停止电池监控线程
        """
        if self._monitor_thread and self._monitor_thread.is_alive():
            logger.info("Stopping monitor thread")
            self._monitor_thread.join()

            # 检查线程是否有异常
            if hasattr(self._monitor_thread, "exc") and self._monitor_thread.exc:
                logger.error("Monitor thread encountered an error")
                exc_type, exc_value, exc_traceback = self._monitor_thread.exc
                logger.error(f"Exception type: {exc_type}")
                logger.error(f"Exception value: {exc_value}")
                import traceback

                logger.error(
                    f"Exception traceback: {''.join(traceback.format_tb(exc_traceback))}"
                )

            self._monitor_thread = None
            logger.info("Monitor thread stopped")

    def load(self) -> None:
        """
        加载设备时的初始化工作
        """
        # logger.info(f"Loading device, current charge limit: {self._charge_limit}")
        pass
        # 设置默认的充电限制
        # if self._charge_limit is None:
        #     self.set_charge_limit(50)

    def set_charge_limit(self, value: int) -> None:
        """
        设置充电限制电量
        :param value: 充电限制电量，0-100
        :return: None
        """
        if not 0 <= value <= 100:
            logger.error(f"Charge limit must be between 0-100, current value: {value}")
            return

        logger.debug(f"Setting charge limit to: {value}%")

        # 如果当前是手动旁路供电状态，先关闭旁路供电
        current_bypass = self.get_bypass_charge()
        if current_bypass:
            logger.info("Manual bypass charge detected, disabling bypass charge first")
            self._set_bypass_charge(False)

        self._charge_limit = value
        self._start_monitor()

    def unload(self) -> None:
        """
        卸载设备时的清理工作
        """
        logger.info("Starting device unload")
        self._stop_monitor()
        self._set_bypass_charge(False)
        logger.info("Device unload complete")
