from .ayaneo_air import AyaneoAir


class AyaneoAir1S(AyaneoAir):
    def __init__(self) -> None:
        super().__init__()
        # 8.4.0.0.27 or later
        self.ec_version_of_bypass_charge = [8, 4, 0, 0, 27]
