
from py_modules.devices.ayaneo_device import AyaneoDevice


class AyaneoFlipKB(AyaneoDevice):
    def __init__(self) -> None:
        super().__init__()
        # 8.7.0.0.33 or later
        self.ec_version_of_bypass_charge = 0x21