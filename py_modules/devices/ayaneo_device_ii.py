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
        logger.info(f"_ec_ram_direct_write address={hex(address2)} data={hex(data)}")
        EC.RamWrite(self.ec_comm_port, self.ec_data_port, address2, data)

    def get_bypass_charge(self) -> bool:
        """
        获取旁路供电开关状态
        :return:
        """
        value = self._ec_ram_direct_read(self.ec_bypass_charge_addr)
        logger.info(f"get_bypass_charge: {hex(value)}")
        return value == self.ec_bypass_charge_open

    def set_bypass_charge(self, value: bool) -> None:
        """
        设置旁路供电开关状态
        :param value:
        :return:
        """
        current_value = self._ec_ram_direct_read(self.ec_bypass_charge_addr)
        write_value = (
            self.ec_bypass_charge_open if value else self.ec_bypass_charge_close
        )
        logger.info(
            f"set_bypass_charge: {value} current: {hex(current_value)}, write: {hex(write_value)}"
        )

        if current_value != write_value:
            self._ec_ram_direct_write(self.ec_bypass_charge_addr, write_value)
