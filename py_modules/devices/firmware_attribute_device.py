import os
from time import sleep
from .power_device import PowerDevice
from config import logger

PREFIX = "/sys/class/firmware-attributes"
SPL_SUFFIX = "ppt_pl1_spl"
SLOW_SUFFIX = "ppt_pl2_sppt"
FAST_SUFFIX = "ppt_pl3_fppt"

SUGGESTED_DEFAULT = ["custom", "performance"]


class FirmwareAttributeDevice(PowerDevice):
    def __init__(self):
        super().__init__()
        self.attribute = None
        self.profile_name = None

    def init_attribute(self, attribute: str, profile_name: str) -> None:
        self.attribute = attribute
        self.profile_name = profile_name

    def supports_attribute_tdp(self) -> bool:
        if not self.check_init():
            return False
        return os.path.exists(f"{PREFIX}/{self.attribute}/attributes/{SPL_SUFFIX}")

    def check_init(self) -> bool:
        if self.attribute is not None and self.profile_name is not None:
            return True
        logger.error("Attribute or profile name is not set")
        return False

    def set_tdp(self, tdp: int) -> None:
        logger.info(f"Setting TDP to {tdp}")
        if not self.supports_attribute_tdp():
            logger.info("Device does not support attribute TDP, use fallback method")
            return self.fallback_set_tdp(tdp)
        base_path = f"{PREFIX}/{self.attribute}/attributes"
        if not self.check_init():
            return
        if not os.path.exists(base_path):
            logger.error(f"Attribute {self.attribute} not found")
            return
        try:
            self.set_profile()
            min_tdp = self._get_min_tdp()
            max_tdp = self._get_max_tdp()
            if min_tdp is not None and tdp < min_tdp:
                logger.info(f"TDP is too low, min: {min_tdp}, use default method")
                return self.fallback_set_tdp(tdp)
            if max_tdp is not None and tdp > max_tdp:
                logger.info(f"TDP is too high, max: {max_tdp}, set to max")
                tdp = max_tdp
            if os.path.exists(f"{base_path}/{SPL_SUFFIX}/current_value"):
                with open(f"{base_path}/{SPL_SUFFIX}/current_value", "w") as f:
                    f.write(str(tdp))
                sleep(0.1)
            if os.path.exists(f"{base_path}/{SLOW_SUFFIX}/current_value"):
                with open(f"{base_path}/{SLOW_SUFFIX}/current_value", "w") as f:
                    f.write(str(tdp))
                sleep(0.1)
            if os.path.exists(f"{base_path}/{FAST_SUFFIX}/current_value"):
                with open(f"{base_path}/{FAST_SUFFIX}/current_value", "w") as f:
                    f.write(str(tdp))
                sleep(0.1)
        except Exception as e:
            logger.error(f"Failed to set TDP: {e}", exc_info=True)

    def set_tdp_unlimited(self) -> None:
        logger.info("Setting TDP unlimited")
        try:
            if self.supports_attribute_tdp():
                fast_max = 0
                slow_max = 0
                stapm_max = 0
                base_path = f"{PREFIX}/{self.attribute}/attributes"
                if os.path.exists(f"{base_path}/{SPL_SUFFIX}/max_value"):
                    with open(f"{base_path}/{SPL_SUFFIX}/max_value", "r") as f:
                        fast_max = f.read().strip()
                if os.path.exists(f"{base_path}/{SLOW_SUFFIX}/max_value"):
                    with open(f"{base_path}/{SLOW_SUFFIX}/max_value", "r") as f:
                        slow_max = f.read().strip()
                if os.path.exists(f"{base_path}/{FAST_SUFFIX}/max_value"):
                    with open(f"{base_path}/{FAST_SUFFIX}/max_value", "r") as f:
                        stapm_max = f.read().strip()

                if int(fast_max) > 0:
                    logger.info(f"Setting TDP max to {fast_max} for fast")
                    with open(f"{base_path}/{SPL_SUFFIX}/current_value", "w") as f:
                        f.write(fast_max)
                if int(slow_max) > 0:
                    logger.info(f"Setting TDP max to {slow_max} for slow")
                    with open(f"{base_path}/{SLOW_SUFFIX}/current_value", "w") as f:
                        f.write(slow_max)
                if int(stapm_max) > 0:
                    logger.info(f"Setting TDP max to {stapm_max} for stapm")
                    with open(f"{base_path}/{FAST_SUFFIX}/current_value", "w") as f:
                        f.write(stapm_max)
            else:
                self.fallback_set_tdp_unlimited()
        except Exception as e:
            logger.error(f"Failed to set TDP unlimited: {e}", exc_info=True)

    def _get_min_tdp(self) -> int:
        if not self.check_init():
            return None
        min_tdp = None
        base_path = f"{PREFIX}/{self.attribute}/attributes"
        if os.path.exists(f"{base_path}/{SPL_SUFFIX}/min_value"):
            with open(f"{base_path}/{SPL_SUFFIX}/min_value", "r") as f:
                min_tdp = int(f.read())
        return min_tdp

    def _get_max_tdp(self) -> int:
        if not self.check_init():
            return None
        max_tdp = None
        base_path = f"{PREFIX}/{self.attribute}/attributes"
        if os.path.exists(f"{base_path}/{SPL_SUFFIX}/max_value"):
            with open(f"{base_path}/{SPL_SUFFIX}/max_value", "r") as f:
                max_tdp = int(f.read())
        return max_tdp

    def fallback_set_tdp(self, tdp: int) -> None:
        logger.info("Device does not support attribute TDP, use fallback method")
        return super().set_tdp(tdp)

    def fallback_set_tdp_unlimited(self) -> None:
        logger.info("Device does not support attribute TDP, use fallback method")
        return super().set_tdp_unlimited()

    def set_profile(self) -> None:
        if not self.check_init():
            return
        current_profile = self.get_platform_profile(self.profile_name)
        available_profiles = self.get_available_platform_profiles(self.profile_name)
        profile = None
        for suggested_profile in SUGGESTED_DEFAULT:
            if suggested_profile in available_profiles:
                profile = suggested_profile
                break
        if current_profile != profile and profile is not None:
            logger.info(f"Setting platform profile to {profile}")
            self.set_platform_profile(self.profile_name, profile)
            sleep(0.5)
