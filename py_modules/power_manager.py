from devices import IDevice


class PowerManager:
    def __init__(self):
        self.device = None
        self.device = IDevice.get_current()

    def get_bypass_charge(self) -> bool | None:
        return self.device.get_bypass_charge()

    def set_bypass_charge(self, value: bool) -> None:
        self.device.set_bypass_charge(value)


powerManager = PowerManager()
