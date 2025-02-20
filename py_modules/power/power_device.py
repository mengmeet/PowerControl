from abc import ABC, abstractmethod


class PowerDevice(ABC):
    @abstractmethod
    def get_baypassCharge(self) -> bool:
        """
        获取旁路供电开关状态
        :return:
        """
        pass

    @abstractmethod
    def set_baypassCharge(self, value: bool) -> None:
        """
        设置旁路供电开关状态
        :param value:
        :return:
        """
        pass
