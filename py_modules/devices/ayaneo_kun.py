
from .ayaneo_device import AyaneoDevice

class AyaneoKun(AyaneoDevice):
    def __init__(self) -> None:
        super().__init__()
        # 8.3.0.0.63 or later
        self.ec_version_of_bypass_charge = 0x3F