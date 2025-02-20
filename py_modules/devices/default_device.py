
from .power_device import PowerDevice


class DefaultDevice(PowerDevice):
    def __init__(self):
        super().__init__()

    def load(self) -> None:
        pass

    def unload(self) -> None:
        pass

    def supports_bypass_charge(self) -> bool:
        return False

    def supports_charge_limit(self) -> bool:
        return False

    def get_bypass_charge(self) -> bool:
        return False

    def set_bypass_charge(self, value: bool) -> None:
        pass

    def set_charge_limit(self, value: int) -> None:
        pass