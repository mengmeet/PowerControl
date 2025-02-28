from .ayaneo_air_plus import AyaneoAirPlus


class AyaneoAirPlusMendocino(AyaneoAirPlus):
    def __init__(self) -> None:
        super().__init__()
        # 7.0.0.0.13 or later
        self.ec_version_of_bypass_charge = [7, 0, 0, 0, 13]
