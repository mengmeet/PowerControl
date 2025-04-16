import os
from time import sleep

from config import logger

from ..power_device import PowerDevice

LENOVO_WIM_PATH = "/sys/class/firmware-attributes/lenovo-wmi-other-0/attributes/"

LENOVO_WIM_FAST_PATH = f"{LENOVO_WIM_PATH}/ppt_pl3_fppt/current_value"
LENOVO_WIM_SLOW_PATH = f"{LENOVO_WIM_PATH}/ppt_pl2_sppt/current_value"
LENOVO_WIM_STAPM_PATH = f"{LENOVO_WIM_PATH}/ppt_pl1_spl/current_value"

PLATFORM_PROFILE_PREFIX = "/sys/class/platform-profile"
HWMON_PREFIX = "/sys/class/hwmon"

PLATFORM_PROFILE_NAME = "lenovo-wmi-gamezone"
SUGGESTED_DEFAULT = "custom"


class LenovoDevice(PowerDevice):
    def __init__(self) -> None:
        super().__init__()

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

    def set_platform_profile(self, name: str, profile: str) -> None:
        base_path = self.find_platform_profile(name)
        try:
            with open(os.path.join(base_path, "profile"), "w") as f:
                f.write(profile)
        except FileNotFoundError:
            logger.error(f"Platform profile {name} not found")
        except Exception as e:
            logger.error(f"Failed to set platform profile {name}: {e}")

    def set_tdp(self, tdp: int) -> None:
        logger.debug(f"Setting TDP to {tdp}")
        if tdp < 5:
            logger.info("TDP is too low, use default tdp method")
            super().set_tdp(tdp)
            return

        self.set_platform_profile(PLATFORM_PROFILE_NAME, SUGGESTED_DEFAULT)

        fast_val = tdp + 2
        slow_val = tdp
        stapm_val = tdp
        if (
            os.path.exists(LENOVO_WIM_FAST_PATH)
            and os.path.exists(LENOVO_WIM_SLOW_PATH)
            and os.path.exists(LENOVO_WIM_STAPM_PATH)
        ):
            logger.debug(f"Setting TDP to {tdp} by Lenovo WMI")
            with open(LENOVO_WIM_FAST_PATH, "w") as f:
                f.write(str(fast_val))
            sleep(0.1)
            with open(LENOVO_WIM_SLOW_PATH, "w") as f:
                f.write(str(slow_val))
            sleep(0.1)
            with open(LENOVO_WIM_STAPM_PATH, "w") as f:
                f.write(str(stapm_val))
            sleep(0.1)
        else:
            super().set_tdp(tdp)

    def _supports_wmi_tdp(self):
        if (
            os.path.exists(LENOVO_WIM_FAST_PATH)
            and os.path.exists(LENOVO_WIM_SLOW_PATH)
            and os.path.exists(LENOVO_WIM_STAPM_PATH)
        ):
            return True
        return False
