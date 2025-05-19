from ..firmware_attribute_device import FirmwareAttributeDevice

ATTRIBUTE_NAME = "lenovo-wmi-other-0"
PLATFORM_PROFILE_NAME = "lenovo-wmi-gamezone"
SUGGESTED_DEFAULT = "custom"


class LenovoDevice(FirmwareAttributeDevice):
    def __init__(self) -> None:
        super().__init__()
        self.init_attribute(ATTRIBUTE_NAME, PLATFORM_PROFILE_NAME)
