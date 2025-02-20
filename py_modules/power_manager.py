from devices import IDevice


class PowerManager:
    def __init__(self):
        self.device = None
        self.device = IDevice.get_current()
        self.device.load()

    def get_bypass_charge(self) -> bool | None:
        return self.device.get_bypass_charge()

    def set_bypass_charge(self, value: bool) -> None:
        self.device.set_bypass_charge(value)

    def set_charge_limit(self, value: int) -> None:
        self.device.set_charge_limit(value)

    def load(self) -> None:
        self.device.load()

    def unload(self) -> None:
        self.device.unload()