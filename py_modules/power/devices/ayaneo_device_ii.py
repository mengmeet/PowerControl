from ec import EC

EC_BYPASS_CHARGE_ADDR = 0xD1
EC_BYPASS_CHARGE_OPEN = 0x65
EC_BYPASS_CHARGE_CLOSE = 0x01
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
        EC.RamWrite(self.ec_comm_port, self.ec_data_port, address2, data)

    def get_baypassCharge(self) -> bool:
        """
        获取旁路供电开关状态
        :return:
        """
        value = self._ec_ram_direct_read(self.ec_bypass_charge_addr)
        return value == self.ec_bypass_charge_open

    def set_baypassCharge(self, value: bool) -> None:
        """
        设置旁路供电开关状态
        :param value:
        :return:
        """
        if value:
            data = self.ec_bypass_charge_open
            need_write = self.get_baypassCharge() != value
        else:
            data = self.ec_bypass_charge_close
            need_write = self.get_baypassCharge() != value

        if need_write:
            self._ec_ram_direct_write(self.ec_bypass_charge_addr, data)
