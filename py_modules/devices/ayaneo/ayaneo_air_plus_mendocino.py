from ec import EC
from utils import logger

from .ayaneo_air_plus import AyaneoAirPlus


class AyaneoAirPlusMendocino(AyaneoAirPlus):
    def __init__(self) -> None:
        super().__init__()
        # 7.0.0.0.13 or later
        self.ec_version_of_bypass_charge = [7, 0, 0, 0, 13]

    def supports_bypass_charge(self) -> bool:
        ec_version = EC.Read(0x04)
        logger.info(f">>>>>>>>>>>>>> EC version: {hex(ec_version)}")
        return (
            self.ec_version_of_bypass_charge is not None
            and ec_version >= self.ec_version_of_bypass_charge
        )
