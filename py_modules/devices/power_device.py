from abc import abstractmethod

from .idevice import IDevice


class PowerDevice(IDevice):
    @abstractmethod
    def get_bypass_charge(self) -> bool:
        """
        获取旁路供电开关状态
        :return:
        """
        pass

    @abstractmethod
    def set_bypass_charge(self, value: bool) -> None:
        """
        设置旁路供电开关状态
        :param value:
        :return:
        """
        pass
