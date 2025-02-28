from .ayaneo_device import AyaneoDevice


class AyaneoAir(AyaneoDevice):
    def __init__(self) -> None:
        super().__init__()
        # 3.1.0.4.78 or later
        self.ec_version_of_bypass_charge = [3, 1, 0, 4, 78]
