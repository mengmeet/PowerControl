from abc import abstractmethod

from .idevice import IDevice


class PowerDevice(IDevice):
    def __init__(self):
        super().__init__()

    def load(self) -> None:
        pass

    def unload(self) -> None:
        pass

    def get_bypass_charge(self) -> bool | None:
        pass

    def set_bypass_charge(self, value: bool) -> None:
        pass

    def set_charge_limit(self, value: int) -> None:
        pass
