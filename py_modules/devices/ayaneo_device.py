import threading
import sys

from config import logger

from .power_device import PowerDevice

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

    def supports_bypass_charge(self) -> bool:
        return True

    def supports_charge_limit(self) -> bool:
        return True

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

    def set_bypass_charge(self, value: bool) -> None:
        """
        设置旁路供电
        :param value: True 开启旁路供电，False 关闭旁路供电
        :return: None
        """
        logger.info(f"设置旁路供电: {value}")
        
        if value:
            # 如果手动开启旁路供电，暂时停止充电限制监控
            self._stop_monitor()
            write_value = self.ec_bypass_charge_open
        else:
            write_value = self.ec_bypass_charge_close
            # 如果关闭旁路供电，且有充电限制，重新启动监控
            if self._charge_limit is not None:
                self._start_monitor()
        
        self._ec_write(self.ec_bypass_charge_addr, write_value)

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
        import time
        import sys

        from utils import get_battery_percentage, is_battery_charging
        from config import logger

        logger.info("开始监控电池状态")
        logger.debug(
            f"线程状态: {self._monitor_thread and self._monitor_thread.is_alive()}"
        )

        while self._monitor_thread and self._monitor_thread.is_alive():
            try:
                battery_percentage = get_battery_percentage()
                is_charging = is_battery_charging()

                logger.info(
                    f"电池状态: 电量 {battery_percentage}%, 充电中: {is_charging}, 限制值: {self._charge_limit}%"
                )

                # 获取当前旁路供电状态
                current_bypass = self._ec_read(self.ec_bypass_charge_addr) == self.ec_bypass_charge_open

                if battery_percentage >= self._charge_limit and is_charging and not current_bypass:
                    logger.info(f"电量已达到限制值 {self._charge_limit}%，打开旁路供电")
                    self._ec_write(self.ec_bypass_charge_addr, self.ec_bypass_charge_open)
                elif battery_percentage < self._charge_limit - 2 and not is_charging and current_bypass:
                    logger.info(f"电量低于限制值 {self._charge_limit}%，关闭旁路供电")
                    self._ec_write(self.ec_bypass_charge_addr, self.ec_bypass_charge_close)
            except Exception as e:
                logger.error(f"监控电池状态时发生错误: {str(e)}")
                logger.error(f"错误详情: {str(sys.exc_info())}")
                raise  # 重新抛出异常，让外部能够捕获

            time.sleep(10)

        # logger.info(f"电池监控线程已停止，线程ID: {id(self._monitor_thread)}")

    def _start_monitor(self):
        """
        启动电池监控线程
        """
        if self._monitor_thread and self._monitor_thread.is_alive():
            # logger.info(f"监控线程已在运行，线程ID: {id(self._monitor_thread)}")
            return

        logger.info("创建新的监控线程")
        self._monitor_thread = self._MonitorThread(
            target=self._monitor_battery, daemon=True
        )
        thread_id = id(self._monitor_thread)
        self._monitor_thread.start()
        logger.debug(
            f"监控线程已启动，线程ID: {thread_id}, 是否活跃: {self._monitor_thread.is_alive()}"
        )

    def _stop_monitor(self):
        """
        停止电池监控线程
        """
        if self._monitor_thread and self._monitor_thread.is_alive():
            logger.info("正在停止监控线程")
            self._monitor_thread.join()

            # 检查线程是否有异常
            if hasattr(self._monitor_thread, "exc") and self._monitor_thread.exc:
                logger.error("监控线程发生异常")
                exc_type, exc_value, exc_traceback = self._monitor_thread.exc
                logger.error(f"异常类型: {exc_type}")
                logger.error(f"异常信息: {exc_value}")
                import traceback

                logger.error(f"异常堆栈: {''.join(traceback.format_tb(exc_traceback))}")

            self._monitor_thread = None
            logger.info("监控线程已停止")

    def load(self) -> None:
        """
        加载设备时的初始化工作
        """
        # logger.info(f"加载设备，当前充电限制: {self._charge_limit}")
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
            logger.error(f"充电限制电量必须在 0-100 之间，当前值: {value}")
            return

        logger.info(f"设置充电限制为: {value}%")
        
        # 如果当前是手动旁路供电状态，先关闭旁路供电
        current_bypass = self._ec_read(self.ec_bypass_charge_addr) == self.ec_bypass_charge_open
        if current_bypass:
            logger.info("检测到手动旁路供电已开启，先关闭旁路供电")
            self._ec_write(self.ec_bypass_charge_addr, self.ec_bypass_charge_close)
        
        self._charge_limit = value
        self._start_monitor()

    def unload(self) -> None:
        """
        卸载设备时的清理工作
        """
        logger.info("开始卸载设备")
        self._stop_monitor()
        self.set_bypass_charge(False)
        logger.info("设备卸载完成")
