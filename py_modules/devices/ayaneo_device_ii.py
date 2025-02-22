from config import logger
from ec import EC

from .ayaneo_device import AyaneoDevice

EC_BYPASS_CHARGE_ADDR = 0xD1
EC_BYPASS_CHARGE_OPEN = 0x01
EC_BYPASS_CHARGE_CLOSE = 0x65
EC_COMM_PORT = 0x4E
EC_DATA_PORT = 0x4F


# from https://github.com/Valkirie/HandheldCompanion/blob/main/HandheldCompanion/Devices/AYANEO/AYANEODeviceCEii.cs
class AyaneoDeviceII(AyaneoDevice):
    def __init__(self) -> None:
        super().__init__()
        self.ec_bypass_charge_addr = EC_BYPASS_CHARGE_ADDR
        self.ec_bypass_charge_open = EC_BYPASS_CHARGE_OPEN
        self.ec_bypass_charge_close = EC_BYPASS_CHARGE_CLOSE
        self.ec_comm_port = EC_COMM_PORT
        self.ec_data_port = EC_DATA_PORT

    def _ec_ram_direct_read(self, address: int, offset=0xD1) -> int:
        address2 = address | (offset << 8)
        return EC.RamRead(self.ec_comm_port, self.ec_data_port, address2)

    def _ec_ram_direct_write(self, address: int, data: int, offset=0xD1) -> None:
        address2 = address | (offset << 8)
        logger.info(f"Directly writing to EC RAM: address={hex(address2)} data={hex(data)}")
        EC.RamWrite(self.ec_comm_port, self.ec_data_port, address2, data)

    def supports_bypass_charge(self) -> bool:
        ec_version = EC.Read(0x01)
        logger.info(f">>>>>>>>>>>>>> EC version: {hex(ec_version)}")
        return (
            self.ec_version_of_bypass_charge is not None
            and ec_version >= self.ec_version_of_bypass_charge
        )

    def supports_charge_limit(self) -> bool:
        return self.supports_bypass_charge()

    def get_bypass_charge(self) -> bool:
        """
        Get the status of the bypass charge switch
        :return:
        """
        value = self._ec_ram_direct_read(self.ec_bypass_charge_addr)
        logger.info(f"Bypass charge status: {hex(value)}")
        return value == self.ec_bypass_charge_open

    def set_bypass_charge(self, value: bool) -> None:
        """
        Set the status of the bypass charge switch
        :param value:
        :return:
        """
        current_value = self._ec_ram_direct_read(self.ec_bypass_charge_addr)
        write_value = (
            self.ec_bypass_charge_open if value else self.ec_bypass_charge_close
        )
        logger.info(
            f"Setting bypass charge: {value}, current: {hex(current_value)}, write: {hex(write_value)}"
        )

        if current_value != write_value:
            self._ec_ram_direct_write(self.ec_bypass_charge_addr, write_value)
