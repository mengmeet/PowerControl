import os
from time import sleep

from config import logger

from ..firmware_attribute_device import FirmwareAttributeDevice

PLATFORM_PROFILE_PATH = "/sys/firmware/acpi/platform_profile"

LEGACY_WMI_PATH = "/sys/devices/platform/asus-nb-wmi"

FAST_WMI_PATH = f"{LEGACY_WMI_PATH}/ppt_fppt"
SLOW_WMI_PATH = f"{LEGACY_WMI_PATH}/ppt_pl2_sppt"
STAPM_WMI_PATH = f"{LEGACY_WMI_PATH}/ppt_pl1_spl"


ATTRIBUTE_NAME = "asus-armoury"
PLATFORM_PROFILE_NAME = "asus-wmi"
SUGGESTED_DEFAULT = ["custom", "performance"]


# credit:  https://github.com/aarron-lee/SimpleDeckyTDP/blob/main/py_modules/devices/rog_ally.py
class AsusDevice(FirmwareAttributeDevice):
    def __init__(self) -> None:
        super().__init__()
        self.init_attribute(ATTRIBUTE_NAME, PLATFORM_PROFILE_NAME)

    def set_tdp(self, tdp: int) -> None:
        return False
        logger.debug(f"Setting TDP to {tdp}")
        if self.supports_attribute_tdp():
            super().set_tdp(tdp)
        elif self._supports_wmi_tdp():
            logger.debug(f"Setting TDP to {tdp} by ASUS WMI")
            self._set_stapm(tdp)
            self._set_slow(tdp)
            self._set_fast(tdp)
        else:
            super().fallback_set_tdp(tdp)

    def _set_stapm(self, stapm: int) -> None:
        logger.debug(f"Setting STAPM to {stapm}")
        if os.path.exists(STAPM_WMI_PATH):
            with open(STAPM_WMI_PATH, "w") as f:
                f.write(str(stapm))
            sleep(0.1)

    def _set_slow(self, slow: int) -> None:
        logger.debug(f"Setting SLOW to {slow}")
        if os.path.exists(SLOW_WMI_PATH):
            with open(SLOW_WMI_PATH, "w") as f:
                f.write(str(slow))
            sleep(0.1)

    def _set_fast(self, fast: int) -> None:
        logger.debug(f"Setting FAST to {fast}")
        if os.path.exists(FAST_WMI_PATH):
            with open(FAST_WMI_PATH, "w") as f:
                f.write(str(fast))
            sleep(0.1)

    def _supports_wmi_tdp(self) -> bool:
        return (
            os.path.exists(FAST_WMI_PATH)
            and os.path.exists(SLOW_WMI_PATH)
            and os.path.exists(STAPM_WMI_PATH)
        )
