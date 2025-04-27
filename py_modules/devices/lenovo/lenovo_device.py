import os
from time import sleep

from config import logger

from ..power_device import PowerDevice

LENOVO_WIM_PATH = "/sys/class/firmware-attributes/lenovo-wmi-other-0/attributes/"

LENOVO_WIM_FAST_PATH = f"{LENOVO_WIM_PATH}/ppt_pl3_fppt/current_value"
LENOVO_WIM_SLOW_PATH = f"{LENOVO_WIM_PATH}/ppt_pl2_sppt/current_value"
LENOVO_WIM_STAPM_PATH = f"{LENOVO_WIM_PATH}/ppt_pl1_spl/current_value"

LENOVO_WIM_FAST_MAX_PATH = f"{LENOVO_WIM_PATH}/ppt_pl3_fppt/max_value"
LENOVO_WIM_SLOW_MAX_PATH = f"{LENOVO_WIM_PATH}/ppt_pl2_sppt/max_value"
LENOVO_WIM_STAPM_MAX_PATH = f"{LENOVO_WIM_PATH}/ppt_pl1_spl/max_value"

LENOVO_WIM_FAST_MIN_PATH = f"{LENOVO_WIM_PATH}/ppt_pl3_fppt/min_value"
LENOVO_WIM_SLOW_MIN_PATH = f"{LENOVO_WIM_PATH}/ppt_pl2_sppt/min_value"
LENOVO_WIM_STAPM_MIN_PATH = f"{LENOVO_WIM_PATH}/ppt_pl1_spl/min_value"

PLATFORM_PROFILE_NAME = "lenovo-wmi-gamezone"
SUGGESTED_DEFAULT = "custom"


class LenovoDevice(PowerDevice):
    def __init__(self) -> None:
        super().__init__()

    def set_tdp_unlimited(self) -> None:
        logger.info("Setting TDP unlimited")
        try:
            if self._supports_wmi_tdp():
                fast_max = 0
                slow_max = 0
                stapm_max = 0
                with open(LENOVO_WIM_FAST_MAX_PATH, "r") as f:
                    fast_max = f.read().strip()
                with open(LENOVO_WIM_SLOW_MAX_PATH, "r") as f:
                    slow_max = f.read().strip()
                with open(LENOVO_WIM_STAPM_MAX_PATH, "r") as f:
                    stapm_max = f.read().strip()

                if int(fast_max) > 0:
                    logger.info(f"Setting TDP max to {fast_max} for fast")
                    with open(LENOVO_WIM_FAST_PATH, "w") as f:
                        f.write(fast_max)
                if int(slow_max) > 0:
                    logger.info(f"Setting TDP max to {slow_max} for slow")
                    with open(LENOVO_WIM_SLOW_PATH, "w") as f:
                        f.write(slow_max)
                if int(stapm_max) > 0:
                    logger.info(f"Setting TDP max to {stapm_max} for stapm")
                    with open(LENOVO_WIM_STAPM_PATH, "w") as f:
                        f.write(stapm_max)
            else:
                super().set_tdp_unlimited()
        except Exception as e:
            logger.error(f"Failed to set TDP unlimited: {e}")

    def set_tdp(self, tdp: int) -> None:
        logger.info(f"Setting TDP to {tdp}")
        if tdp < 5:
            logger.info("TDP is too low, use default tdp method")
            super().set_tdp(tdp)
            return

        current_profile = self.get_platform_profile(PLATFORM_PROFILE_NAME)
        if current_profile != SUGGESTED_DEFAULT:
            logger.info(f"Setting platform profile to {SUGGESTED_DEFAULT}")
            self.set_platform_profile(PLATFORM_PROFILE_NAME, SUGGESTED_DEFAULT)
            sleep(1)

        fast_val = tdp + 2
        slow_val = tdp
        stapm_val = tdp
        if (
            os.path.exists(LENOVO_WIM_FAST_PATH)
            and os.path.exists(LENOVO_WIM_SLOW_PATH)
            and os.path.exists(LENOVO_WIM_STAPM_PATH)
        ):
            logger.info(f"Setting TDP to {tdp} by Lenovo WMI")
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
