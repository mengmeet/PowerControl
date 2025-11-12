import os

from config import logger
from ec import EC
from sched_ext.manager import SchedExtManager
from utils import (
    get_charge_behaviour,
    get_charge_type,
    set_charge_behaviour,
    set_charge_control_end_threshold,
    set_charge_type,
    support_charge_behaviour,
    support_charge_control_end_threshold,
    support_charge_type,
)

from .idevice import IDevice

PLATFORM_PROFILE_PREFIX = "/sys/class/platform-profile"
HWMON_PREFIX = "/sys/class/hwmon"


class PowerDevice(IDevice):

    def __init__(self):
        super().__init__()
        self._cpuManager = None
        self._schedExtManager = SchedExtManager()

        try:
            from cpu import cpuManager

            self._cpuManager = cpuManager
        except ImportError:
            logger.warning("Failed to import cpu module")

    def load(self) -> None:
        pass

    def unload(self) -> None:
        pass

    def _ec_read(self, address: int) -> int:
        return EC.Read(address)

    def _ec_read_longer(self, address: int, length: int) -> int:
        return EC.ReadLonger(address, length)

    def _ec_write(self, address: int, data: int) -> None:
        logger.info(f"_ec_write address={hex(address)} data={hex(data)}")
        EC.Write(address, data)

    def find_sysdir(self, prefix: str, name: str) -> str:
        for dir in os.listdir(prefix):
            base_path = os.path.join(prefix, dir)
            if os.path.exists(os.path.join(base_path, "name")):
                with open(os.path.join(base_path, "name"), "r") as f:
                    if f.read().strip() == name:
                        return base_path
        return None

    def find_hwmon(self, name: str) -> str:
        return self.find_sysdir(HWMON_PREFIX, name)

    def find_platform_profile(self, name: str) -> str:
        return self.find_sysdir(PLATFORM_PROFILE_PREFIX, name)

    def get_platform_profile(self, name: str) -> str:
        base_path = self.find_platform_profile(name)
        try:
            with open(os.path.join(base_path, "profile"), "r") as f:
                return f.read().strip()
        except FileNotFoundError:
            logger.error(f"Platform profile {name} not found")
            return None
        except Exception as e:
            logger.error(f"Failed to get platform profile {name}: {e}")
            return None

    def get_available_platform_profiles(self, name: str) -> list[str]:
        base_path = self.find_platform_profile(name)
        try:
            with open(os.path.join(base_path, "choices"), "r") as f:
                return f.read().strip().splitlines()
        except FileNotFoundError:
            logger.error(f"Platform profile {name} not found")
            return None
        except Exception as e:
            logger.error(f"Failed to get platform profile {name}: {e}")
            return None

    def set_platform_profile(self, name: str, profile: str) -> None:
        base_path = self.find_platform_profile(name)
        try:
            with open(os.path.join(base_path, "profile"), "w") as f:
                f.write(profile)
        except FileNotFoundError:
            logger.error(f"Platform profile {name} not found")
        except Exception as e:
            logger.error(f"Failed to set platform profile {name}: {e}")

    # ------ Charge ------ #

    def supports_bypass_charge(self) -> bool:
        return support_charge_behaviour() or support_charge_type()

    def supports_charge_limit(self) -> bool:
        return support_charge_control_end_threshold()

    def software_charge_limit(self) -> bool:
        return False

    def get_bypass_charge(self) -> bool:
        if support_charge_behaviour():
            return get_charge_behaviour() == "inhibit-charge"
        if support_charge_type():
            return get_charge_type() == "Bypass"
        return False

    def set_bypass_charge(self, value: bool) -> None:
        if support_charge_behaviour():
            set_charge_behaviour("inhibit-charge" if value else "auto")
        if support_charge_type():
            set_charge_type("Bypass" if value else "Standard")

    def set_charge_limit(self, value: int) -> None:
        # check value
        if not 0 <= value <= 100:
            logger.error(f"Charge limit must be between 0-100, current value: {value}")
            return
        if not support_charge_control_end_threshold():
            return
        set_charge_control_end_threshold(value)

    def supports_reset_charge_limit(self) -> bool:
        return (
            support_charge_control_end_threshold()
            or support_charge_behaviour()
            or support_charge_type()
        )

    def reset_charge_limit(self) -> None:
        if support_charge_control_end_threshold():
            set_charge_control_end_threshold(100)
        self.set_bypass_charge(False)

    # ------ TDP ------ #

    def set_tdp(self, tdp: int) -> None:
        if self._cpuManager is None:
            logger.error("Failed to set TDP: cpuManager is None")
            return
        self._cpuManager.set_cpuTDP(tdp)

    def set_tdp_unlimited(self) -> None:
        if self._cpuManager is None:
            logger.error("Failed to set TDP: cpuManager is None")
            return
        self._cpuManager.set_cpuTDP_unlimited()

    def get_power_info(self) -> str:
        if self._cpuManager is None:
            logger.error("Failed to get power info: cpuManager is None")
            return ""
        if self._cpuManager.is_intel():
            return self._cpuManager.get_rapl_info()
        elif self._cpuManager.is_amd():
            return self._cpuManager.get_ryzenadj_info()
        else:
            logger.error("Failed to get power info: unknown CPU_VENDOR")
            return ""

    def get_tdpMax(self) -> int:
        logger.info("PowerDevice get_tdpMax")
        if self._cpuManager is None:
            logger.error("PowerDevice get_tdpMax: cpuManager is None")
            return 15
        tdpMax = self._cpuManager.get_tdpMax()
        logger.info(f"PowerDevice get_tdpMax: {tdpMax}")
        return tdpMax

    # ------ sched_ext ------ #

    def supports_sched_ext(self) -> bool:
        """
        检查当前系统是否支持 sched-ext

        Returns:
            bool: 如果支持返回 True，否则返回 False
        """
        return self._schedExtManager.supports_sched_ext()

    def get_sched_ext_list(self) -> list[str]:
        """
        获取可用的 sched_ext 调度器列表

        Returns:
            list[str]: 可用的调度器列表
        """
        return self._schedExtManager.get_sched_ext_list()

    def set_sched_ext(
        self, value: str, param: str = "", use_service: bool = False
    ) -> None:
        """
        设置 sched_ext 调度器

        Args:
            value (str): 调度器名称，如 "none", "scx_userspace", "scx_cfs", "scx_simple"
            param (str, optional): 调度器参数，默认为空字符串
            use_service (bool, optional): 是否使用 scx_loader 服务设置，默认为 False
        """
        self._schedExtManager.set_sched_ext(value, param, use_service)

    def get_current_sched_ext_scheduler(self) -> str:
        """
        获取当前运行的 sched_ext 调度器

        Returns:
            str: 当前调度器名称，如果没有运行则返回空字符串
        """
        return self._schedExtManager.get_current_scheduler()
