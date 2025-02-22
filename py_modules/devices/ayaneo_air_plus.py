from .ayaneo_device_ii import AyaneoDeviceII
from ec import EC
from config import logger


class AyaneoAirPlus(AyaneoDeviceII):
    def __init__(self) -> None:
        super().__init__()

    def supports_bypass_charge(self) -> bool:
        ec_version = EC.Read(0x01)
        logger.info(f">>>>>>>>>>>>>> EC version: {hex(ec_version)}")
        return ec_version >= 0x1B

    def supports_charge_limit(self) -> bool:
        return self.supports_bypass_charge()
