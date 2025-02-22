from .ayaneo_air_plus import AyaneoAirPlus
from utils import logger
from ec import EC


class AyaneoAirPlusMendocino(AyaneoAirPlus):
    def __init__(self) -> None:
        super().__init__()
        # 7.0.0.0.13 or later
        self.ec_version_of_bypass_charge = 0x0D

    def supports_bypass_charge(self) -> bool:
        ec_version = EC.Read(0x04)
        logger.info(f">>>>>>>>>>>>>> EC version: {hex(ec_version)}")
        return (
            self.ec_version_of_bypass_charge is not None
            and ec_version >= self.ec_version_of_bypass_charge
        )
