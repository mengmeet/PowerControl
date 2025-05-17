import os
from time import sleep

from config import logger
from utils import support_charge_control_end_threshold

from ..power_device import PowerDevice

EC_ADDR_UNSUPP = 0xFF01

EC_CHARGE_LIMIT_ADDR = 0xD7
EC_CHARGE_LIMIT_DISABLE = 0x80

EC_SHIFT_MODE_ADDR = 0xD2

SM_ECO_NAME = "eco"
SM_COMFORT_NAME = "comfort"
SM_SPORT_NAME = "sport"
SM_TURBO_NAME = "turbo"

SHIFT_MODES_DICT = {
    SM_ECO_NAME: 0xC2,
    SM_COMFORT_NAME: 0xC1,
    SM_SPORT_NAME: 0xC0,
    SM_TURBO_NAME: 0xC4,
}

SHIFT_MODE_PATH = "/sys/devices/platform/msi-ec/shift_mode"
AVAILBLE_SHIFT_MODES_PATH = "/sys/devices/platform/msi-ec/available_shift_modes"

MSI_WIM_PATH = "/sys/class/firmware-attributes/msi-wmi-platform/attributes/"

MSI_WIM_SLOW_PATH = f"{MSI_WIM_PATH}/ppt_pl2_sppt/current_value"
MSI_WIM_STAPM_PATH = f"{MSI_WIM_PATH}/ppt_pl1_spl/current_value"

MSI_WIM_SLOW_MAX_PATH = f"{MSI_WIM_PATH}/ppt_pl2_sppt/max_value"
MSI_WIM_STAPM_MAX_PATH = f"{MSI_WIM_PATH}/ppt_pl1_spl/max_value"

MSI_WIM_SLOW_MIN_PATH = f"{MSI_WIM_PATH}/ppt_pl2_sppt/min_value"
MSI_WIM_STAPM_MIN_PATH = f"{MSI_WIM_PATH}/ppt_pl1_spl/min_value"


PLATFORM_PROFILE_NAME = "msi-wmi-platform"
SUGGESTED_DEFAULT = "balanced-performance"


class MsiDevice(PowerDevice):
    def __init__(self):
        super().__init__()
        self.ec_addr_unsupp = EC_ADDR_UNSUPP
        self.ec_shift_mode_addr = EC_SHIFT_MODE_ADDR
        self.shift_mode_dict = SHIFT_MODES_DICT
        self.shift_mode_path = SHIFT_MODE_PATH
        self.availble_shift_modes_path = AVAILBLE_SHIFT_MODES_PATH

    def _shift_mode_sysfs(self, mode_name: str) -> None:
        # read available shift modes
        with open(self.availble_shift_modes_path, "r") as f:
            available_shift_modes = f.read().strip().split("\n")

        # check if mode is available
        if mode_name not in available_shift_modes:
            logger.error(f"Mode {mode_name} is not available")
            return
        # current mode
        with open(self.shift_mode_path, "r") as f:
            current_mode = f.read().strip()

        # write mode
        if current_mode == mode_name:
            return

        logger.info(f"Writing shift mode sysfs {mode_name}")
        with open(self.shift_mode_path, "w") as f:
            f.write(mode_name)

    def _shift_mode_ec(self, mode_name: str) -> None:
        # check if mode is available
        if mode_name not in self.shift_mode_dict:
            logger.error(f"Mode {mode_name} is not available")
            return

        # current mode
        current_mode = self._ec_read(self.ec_shift_mode_addr)
        if current_mode == self.shift_mode_dict[mode_name]:
            return

        # write mode
        logger.info(f"Writing shift mode EC {mode_name}")
        self._ec_write(self.ec_shift_mode_addr, self.shift_mode_dict[mode_name])

    def shift_mode_write(self, mode_name: str) -> None:
        if self.support_shift_mode():
            self._shift_mode_sysfs(mode_name)
        else:
            self._shift_mode_ec(mode_name)

    def support_shift_mode(self) -> bool:
        return os.path.exists(self.shift_mode_path)

    def supports_reset_charge_limit(self) -> bool:
        return True

    def supports_charge_limit(self) -> bool:
        return True

    def reset_charge_limit(self) -> None:
        self._ec_write(EC_CHARGE_LIMIT_ADDR, EC_CHARGE_LIMIT_DISABLE)

    def set_charge_limit(self, value: int) -> None:
        if support_charge_control_end_threshold():
            super().set_charge_limit(value)
        else:
            if not 0 <= value <= 100:
                logger.error(
                    f"Charge limit must be between 0-100, current value: {value}"
                )
                return
            write_value = value + EC_CHARGE_LIMIT_DISABLE
            self._ec_write(EC_CHARGE_LIMIT_ADDR, write_value)

    def set_tdp(self, tdp: int) -> None:
        logger.info(f"Setting TDP to {tdp}")
        if tdp < 8:
            logger.info("TDP is too low, use default tdp method")
            super().set_tdp(tdp)
            return

        current_profile = self.get_platform_profile(PLATFORM_PROFILE_NAME)
        if not current_profile:
            self._run_before_set_tdp()
        elif current_profile != SUGGESTED_DEFAULT:
            logger.info(f"Setting platform profile to {SUGGESTED_DEFAULT}")
            self.set_platform_profile(PLATFORM_PROFILE_NAME, SUGGESTED_DEFAULT)
            sleep(1)

        slow_val = tdp
        stapm_val = tdp
        if self._supports_wmi_tdp():
            logger.info(f"Setting TDP to {tdp} by MSI WMI")
            with open(MSI_WIM_SLOW_PATH, "w") as f:
                f.write(str(slow_val))
            sleep(0.1)
            with open(MSI_WIM_STAPM_PATH, "w") as f:
                f.write(str(stapm_val))
            sleep(0.1)
        else:
            super().set_tdp(tdp)

    def _supports_wmi_tdp(self):
        return os.path.exists(MSI_WIM_SLOW_PATH) and os.path.exists(MSI_WIM_STAPM_PATH)

    def _run_before_set_tdp(self):
        try:
            self.shift_mode_write(SM_SPORT_NAME)
        except Exception as e:
            logger.error(f"Failed to run before set tdp: {e}")
