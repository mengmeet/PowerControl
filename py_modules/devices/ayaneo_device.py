from ec import EC

from .power_device import PowerDevice

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

    def get_bypass_charge(self) -> bool | None:
        """
        获取旁路供电开关状态
        :return:
        """
        value = self._ec_read(self.ec_bypass_charge_addr)
        if value == self.ec_bypass_charge_open:
            return True
        elif value == self.ec_bypass_charge_close:
            return False
        else:
            return None

    def set_bypass_charge(self, value: bool) -> None:
        """
        设置旁路供电开关状态
        :param value:
        :return:
        """
        current_value = self.get_bypass_charge()

        if current_value != value:
            self._ec_write(
                self.ec_bypass_charge_addr,
                self.ec_bypass_charge_open if value else self.ec_bypass_charge_close,
            )
