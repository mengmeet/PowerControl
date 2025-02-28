from .ayaneo_air_plus import AyaneoAirPlus


class AyaneoAirPlusIntel(AyaneoAirPlus):
    def __init__(self) -> None:
        super().__init__()
        # 
        self.ec_version_of_bypass_charge = 0x0B
