import os
from time import sleep
from typing import Optional

from config import logger

from .power_station_device import PowerStationDevice

PREFIX = "/sys/class/firmware-attributes"
SPL_SUFFIX = "ppt_pl1_spl"
SLOW_SUFFIX = "ppt_pl2_sppt"
FAST_SUFFIX = "ppt_pl3_fppt"

SUGGESTED_DEFAULT = ["custom", "balanced-performance", "performance"]


class FirmwareAttributeDevice(PowerStationDevice):
    def __init__(self):
        super().__init__()
        self.attribute = None
        self.profile_name = None
        self._attribute_available: bool = True

    def init_attribute(self, attribute: str, profile_name: str) -> None:
        self.attribute = attribute
        self.profile_name = profile_name

    def _mark_attribute_unavailable(self, reason: str) -> None:
        if self._attribute_available:
            logger.warning(
                f"Firmware attribute sysfs became unavailable: {reason}, "
                "falling back to PowerStationDevice"
            )
            self._attribute_available = False

    def _read_sysfs(self, path: str) -> Optional[str]:
        """Read a sysfs file, returning None and marking unavailable on driver error."""
        try:
            with open(path, "r") as f:
                return f.read().strip()
        except OSError as e:
            self._mark_attribute_unavailable(f"read {path}: {e}")
            return None

    def _write_sysfs(self, path: str, value: str) -> bool:
        """Write to a sysfs file, returning False and marking unavailable on driver error."""
        try:
            with open(path, "w") as f:
                f.write(value)
            return True
        except OSError as e:
            self._mark_attribute_unavailable(f"write {path}: {e}")
            return False

    def supports_attribute_tdp(self) -> bool:
        if not self.check_init():
            return False
        if not self._attribute_available:
            return False
        spl_path = f"{PREFIX}/{self.attribute}/attributes/{SPL_SUFFIX}"
        if not os.path.exists(spl_path):
            return False
        # Validate the driver is actually working by reading min_value
        min_path = f"{spl_path}/min_value"
        if os.path.exists(min_path) and self._read_sysfs(min_path) is None:
            return False
        return True

    def check_init(self) -> bool:
        if self.attribute is not None and self.profile_name is not None:
            return True
        logger.error("Attribute or profile name is not set")
        return False

    def get_power_info(self) -> str:
        if not self._attribute_available:
            return super().get_power_info()

        base_path = f"{PREFIX}/{self.attribute}/attributes"
        path_dict = {
            "SPL_PL1_CURRENT": f"{base_path}/{SPL_SUFFIX}/current_value",
            "SLOW_PL2_CURRENT": f"{base_path}/{SLOW_SUFFIX}/current_value",
            "FAST_PL3_CURRENT": f"{base_path}/{FAST_SUFFIX}/current_value",
            "SPL_PL1_MAX": f"{base_path}/{SPL_SUFFIX}/max_value",
            "SLOW_PL2_MAX": f"{base_path}/{SLOW_SUFFIX}/max_value",
            "FAST_PL3_MAX": f"{base_path}/{FAST_SUFFIX}/max_value",
            "SPL_PL1_MIN": f"{base_path}/{SPL_SUFFIX}/min_value",
            "SLOW_PL2_MIN": f"{base_path}/{SLOW_SUFFIX}/min_value",
            "FAST_PL3_MIN": f"{base_path}/{FAST_SUFFIX}/min_value",
        }

        power_info = {}
        for key, path in path_dict.items():
            if os.path.exists(path):
                val = self._read_sysfs(path)
                if val is None:
                    # Driver error detected, fall back entirely
                    return super().get_power_info()
                power_info[key] = val

        if not power_info:
            return super().get_power_info()

        power_info_str = ""
        for key, value in power_info.items():
            power_info_str += f"{key}: {value}\n"
        logger.info(f"power_info_str: {power_info_str}")
        return power_info_str

    def get_tdpMax(self) -> int:
        logger.info("FirmwareAttributeDevice get_tdpMax")
        if not self._attribute_available or not self.check_init():
            logger.info("FirmwareAttributeDevice get_tdpMax: fallback to parent")
            return super().get_tdpMax()
        max_tdp = self._get_max_tdp()
        if max_tdp is None:
            logger.info("FirmwareAttributeDevice get_tdpMax: max_tdp is None, fallback")
            return super().get_tdpMax()
        logger.info(f"FirmwareAttributeDevice get_tdpMax: {max_tdp}")
        return max_tdp

    def _do_set_tdp(self, tdp: int) -> None:
        logger.info(f"Setting TDP to {tdp}")
        if not self.supports_attribute_tdp():
            logger.info("Device does not support attribute TDP, use fallback method")
            return super()._do_set_tdp(tdp)
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
            if not self._attribute_available:
                logger.info("Attribute became unavailable during TDP read, fallback")
                return super()._do_set_tdp(tdp)
            if min_tdp is not None and tdp < min_tdp:
                logger.info(f"TDP is too low, min: {min_tdp}, use default method")
                return super()._do_set_tdp(tdp)
            if max_tdp is not None and tdp > max_tdp:
                logger.info(f"TDP is too high, max: {max_tdp}, set to max")
                tdp = max_tdp
            for suffix in [SPL_SUFFIX, SLOW_SUFFIX, FAST_SUFFIX]:
                path = f"{base_path}/{suffix}/current_value"
                if os.path.exists(path):
                    if not self._write_sysfs(path, str(tdp)):
                        logger.info("Attribute write failed, fallback to parent")
                        return super()._do_set_tdp(tdp)
                    sleep(0.1)
        except Exception as e:
            logger.error(f"Failed to set TDP: {e}", exc_info=True)
            self._mark_attribute_unavailable(str(e))
            super()._do_set_tdp(tdp)

    def set_tdp_unlimited(self) -> None:
        logger.info("Setting TDP unlimited")
        if not self.supports_attribute_tdp():
            return super().set_tdp_unlimited()

        try:
            base_path = f"{PREFIX}/{self.attribute}/attributes"
            suffixes = [
                (SPL_SUFFIX, "SPL"),
                (SLOW_SUFFIX, "SLOW"),
                (FAST_SUFFIX, "FAST"),
            ]
            for suffix, label in suffixes:
                max_path = f"{base_path}/{suffix}/max_value"
                cur_path = f"{base_path}/{suffix}/current_value"
                if not os.path.exists(max_path):
                    continue
                max_val = self._read_sysfs(max_path)
                if max_val is None:
                    logger.info("Attribute read failed during unlimited, fallback")
                    return super().set_tdp_unlimited()
                if int(max_val) > 0:
                    logger.info(f"Setting TDP max to {max_val} for {label}")
                    if not self._write_sysfs(cur_path, max_val):
                        logger.info("Attribute write failed during unlimited, fallback")
                        return super().set_tdp_unlimited()
        except Exception as e:
            logger.error(f"Failed to set TDP unlimited: {e}", exc_info=True)
            self._mark_attribute_unavailable(str(e))
            super().set_tdp_unlimited()

    def _get_min_tdp(self) -> Optional[int]:
        if not self.check_init():
            return None
        path = f"{PREFIX}/{self.attribute}/attributes/{SPL_SUFFIX}/min_value"
        if not os.path.exists(path):
            return None
        val = self._read_sysfs(path)
        if val is None:
            return None
        try:
            return int(val)
        except ValueError:
            logger.error(f"Invalid min_tdp value: {val}")
            return None

    def _get_max_tdp(self) -> Optional[int]:
        if not self.check_init():
            return None
        path = f"{PREFIX}/{self.attribute}/attributes/{SPL_SUFFIX}/max_value"
        if not os.path.exists(path):
            return None
        val = self._read_sysfs(path)
        if val is None:
            return None
        try:
            return int(val)
        except ValueError:
            logger.error(f"Invalid max_tdp value: {val}")
            return None

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
