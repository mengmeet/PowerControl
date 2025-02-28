from .ayaneo_device_ii import AyaneoDeviceII


class AyaneoAirPlus(AyaneoDeviceII):
    def __init__(self) -> None:
        super().__init__()
        self.ec_version_of_bypass_charge = [0, 0x1B, 0, 0, 0]
