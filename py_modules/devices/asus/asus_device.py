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

    def supports_wmi_tdp(self) -> bool:
        return (
            os.path.exists(FAST_WMI_PATH)
            and os.path.exists(SLOW_WMI_PATH)
            and os.path.exists(STAPM_WMI_PATH)
        )

    def _get_power_info_via_asus_wmi(self) -> str | None:
        if not self.supports_wmi_tdp():
            return None
        try:
            lines = ["ASUS WMI TDP Info:"]
            for label, path in (
                ("STAPM_PL1", STAPM_WMI_PATH),
                ("SLOW_PL2", SLOW_WMI_PATH),
                ("FAST_FPPT", FAST_WMI_PATH),
            ):
                with open(path, "r") as f:
                    lines.append(f"{label}: {f.read().strip()}")
            return "\n".join(lines) + "\n"
        except Exception as e:
            logger.error(f"Failed to get ASUS WMI power info: {e}", exc_info=True)
            return None

    def _supports_wmi_tdp(self) -> bool:
        # Keep private alias for any existing call sites.
        return self.supports_wmi_tdp()

    def _set_tdp_via_asus_wmi(self, tdp: int) -> bool:
        if not self.supports_wmi_tdp():
            logger.error("ASUS WMI TDP not available")
            return False
        try:
            logger.debug(f"Setting TDP to {tdp} by ASUS WMI")
            self._set_stapm(tdp)
            self._set_slow(tdp)
            self._set_fast(tdp)
            return True
        except Exception as e:
            logger.error(f"Failed to set TDP via ASUS WMI: {e}", exc_info=True)
            return False

    def _set_tdp_unlimited_via_asus_wmi(self) -> bool:
        if not self.supports_wmi_tdp():
            return False
        try:
            from ..power_device import PowerDevice

            # Prefer chain max when present; fall back to cpu/config max.
            max_tdp = self.get_tdpMax()
            if not max_tdp:
                max_tdp = PowerDevice.get_tdpMax(self)
            logger.debug(f"Setting TDP unlimited to {max_tdp} by ASUS WMI")
            return self._set_tdp_via_asus_wmi(max_tdp)
        except Exception as e:
            logger.error(
                f"Failed to set TDP unlimited via ASUS WMI: {e}", exc_info=True
            )
            return False

    def _do_set_tdp(self, tdp: int) -> None:
        logger.debug(f"Setting TDP to {tdp}")
        if self.supports_attribute_tdp():
            super()._do_set_tdp(tdp)
        elif self.supports_wmi_tdp():
            if not self._set_tdp_via_asus_wmi(tdp):
                super()._do_set_tdp(tdp)
        else:
            # Call parent's _do_set_tdp which will continue the fallback chain
            super()._do_set_tdp(tdp)

    def _set_tdp_unlimited_auto(self) -> None:
        """Clear TDP cap using the same interface that applied the limit.

        Legacy ASUS WMI can set TDP via ppt_* files, but the parent unlimited
        path only touches firmware-attributes / PowerStation / RyzenAdj. Without
        writing WMI max values, the previous WMI cap remains active.
        """
        logger.info("AsusDevice Setting TDP unlimited")
        if self.supports_attribute_tdp():
            super()._set_tdp_unlimited_auto()
        elif self.supports_wmi_tdp():
            if not self._set_tdp_unlimited_via_asus_wmi():
                super()._set_tdp_unlimited_auto()
        else:
            super()._set_tdp_unlimited_auto()

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
