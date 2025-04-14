import os
from time import sleep

from config import logger

from ..power_device import PowerDevice

LENOVO_WIM_PATH = "/sys/class/firmware-attributes/lenovo-wmi-other-0/attributes/"

LENOVO_WIM_FAST_PATH = f"{LENOVO_WIM_PATH}/ppt_pl3_fppt/current_value"
LENOVO_WIM_SLOW_PATH = f"{LENOVO_WIM_PATH}/ppt_pl2_sppt/current_value"
LENOVO_WIM_STAPM_PATH = f"{LENOVO_WIM_PATH}/ppt_pl1_spl/current_value"


class LenovoDevice(PowerDevice):
    def __init__(self) -> None:
        super().__init__()

    def set_tdp(self, tdp: int) -> None:
        logger.debug(f"Setting TDP to {tdp}")
        if tdp < 5:
            logger.info("TDP is too low, use default tdp method")
            super().set_tdp(tdp)
            return
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
