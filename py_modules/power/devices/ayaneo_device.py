from ec import EC

EC_BYPASS_CHARGE_ADDR = 0x1E
EC_BYPASS_CHARGE_OPEN = 0x55
EC_BYPASS_CHARGE_CLOSE = 0xAA
EC_COMM_PORT = 0x4E
EC_DATA_PORT = 0x4F


# from https://github.com/Valkirie/HandheldCompanion/blob/main/HandheldCompanion/Devices/AYANEO/AYANEODeviceCEc.cs
class AyaneoDevice(PowerDevice):
    def __init__(self) -> None:
        super().__init__()
        self.ec_comm_port = EC_COMM_PORT
        self.ec_data_port = EC_DATA_PORT
        self.ec_bypass_charge_addr = EC_BYPASS_CHARGE_ADDR
        self.ec_bypass_charge_open = EC_BYPASS_CHARGE_OPEN
        self.ec_bypass_charge_close = EC_BYPASS_CHARGE_CLOSE

    def _ec_read(self, address: int) -> int:
        return EC.Read(address)

    def _ec_read_longer(self, address: int, length: int) -> int:
        return EC.ReadLonger(address, length)

    def _ec_write(self, address: int, data: int) -> None:
        EC.Write(address, data)

    def get_baypassCharge(self) -> bool:
        """
        获取旁路供电开关状态
        :return:
        """
        value = self._ec_read(self.ec_bypass_charge_addr)
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
            self._ec_write(self.ec_bypass_charge_addr, data)
