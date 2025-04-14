import os
import subprocess
from time import sleep

from config import logger
from utils import get_bios_settings, get_env

from ..power_device import PowerDevice

PLATFORM_PROFILE_PATH = "/sys/firmware/acpi/platform_profile"

LEGACY_WMI_PATH = "/sys/devices/platform/asus-nb-wmi"

FAST_WMI_PATH = f"{LEGACY_WMI_PATH}/ppt_fppt"
SLOW_WMI_PATH = f"{LEGACY_WMI_PATH}/ppt_pl2_sppt"
STAPM_WMI_PATH = f"{LEGACY_WMI_PATH}/ppt_pl1_spl"

ASUS_ARMORY_PATH = "/sys/class/firmware-attributes/asus-armoury"

ASUS_ARMORY_FAST_WMI_PATH = f"{ASUS_ARMORY_PATH}/attributes/ppt_fppt/current_value"
ASUS_ARMORY_SLOW_WMI_PATH = f"{ASUS_ARMORY_PATH}/attributes/ppt_pl2_sppt/current_value"
ASUS_ARMORY_STAPM_WMI_PATH = f"{ASUS_ARMORY_PATH}/attributes/ppt_pl1_spl/current_value"

LEGACY_MCU_POWERSAVE_PATH = f"{LEGACY_WMI_PATH}/mcu_powersave"
ASUS_ARMORY_MCU_POWERSAVE_PATH = f"{ASUS_ARMORY_PATH}/attributes/mcu_powersave"


# from https://github.com/aarron-lee/SimpleDeckyTDP/blob/main/py_modules/devices/rog_ally.py
class AsusDevice(PowerDevice):
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
        if self._supports_bios_wmi_tdp():
            tdp_values = {
                "ppt_fppt": fast_val,
                "ppt_pl2_sppt": slow_val,
                "ppt_pl1_spl": stapm_val,
            }
            for wmi_method, target_tdp in tdp_values.items():
                try:
                    cmd = f"fwupdmgr set-bios-setting {wmi_method} {target_tdp}"
                    subprocess.run(
                        cmd,
                        timeout=1,
                        shell=True,
                        check=True,
                        text=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        env=get_env(),
                    )
                    sleep(0.1)
                except Exception:
                    logger.error(
                        f"Error set_tdp by fwupdmgr {wmi_method} {target_tdp}",
                        exc_info=True,
                    )
                    return
        elif (
            os.path.exists(ASUS_ARMORY_FAST_WMI_PATH)
            and os.path.exists(ASUS_ARMORY_SLOW_WMI_PATH)
            and os.path.exists(ASUS_ARMORY_STAPM_WMI_PATH)
        ):
            logger.debug(f"Setting TDP to {tdp} by ASUS Armoury")
            with open(ASUS_ARMORY_FAST_WMI_PATH, "w") as f:
                f.write(str(fast_val))
            sleep(0.1)
            with open(ASUS_ARMORY_SLOW_WMI_PATH, "w") as f:
                f.write(str(slow_val))
            sleep(0.1)
            with open(ASUS_ARMORY_STAPM_WMI_PATH, "w") as f:
                f.write(str(stapm_val))
            sleep(0.1)

        elif (
            os.path.exists(FAST_WMI_PATH)
            and os.path.exists(SLOW_WMI_PATH)
            and os.path.exists(STAPM_WMI_PATH)
        ):
            logger.debug(f"Setting TDP to {tdp} by ASUS WMI")
            with open(FAST_WMI_PATH, "w") as f:
                f.write(str(fast_val))
            sleep(0.1)
            with open(SLOW_WMI_PATH, "w") as f:
                f.write(str(slow_val))
            sleep(0.1)
            with open(STAPM_WMI_PATH, "w") as f:
                f.write(str(stapm_val))
            sleep(0.1)
        else:
            super().set_tdp(tdp)

    def _supports_bios_wmi_tdp(self):
        tdp_methods = {"ppt_fppt", "ppt_pl2_sppt", "ppt_pl1_spl"}

        settings = get_bios_settings()
        filtered_data = [
            item
            for item in settings.get("BiosSettings")
            if item.get("Name") in tdp_methods
        ]

        if len(filtered_data) == 3:
            return True

        return False

    def _supports_wmi_tdp(self):
        if self._supports_bios_wmi_tdp():
            return True

        if (
            os.path.exists(FAST_WMI_PATH)
            and os.path.exists(SLOW_WMI_PATH)
            and os.path.exists(STAPM_WMI_PATH)
        ):
            return True
        elif (
            os.path.exists(ASUS_ARMORY_FAST_WMI_PATH)
            and os.path.exists(ASUS_ARMORY_SLOW_WMI_PATH)
            and os.path.exists(ASUS_ARMORY_STAPM_WMI_PATH)
        ):
            return True
        return False
