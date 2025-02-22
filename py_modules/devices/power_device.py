from config import logger
from utils import (
    get_charge_behaviour,
    set_charge_behaviour,
    set_charge_control_end_threshold,
    support_charge_behaviour,
    support_charge_control_end_threshold,
)

from .idevice import IDevice


class PowerDevice(IDevice):
    def __init__(self):
        super().__init__()

    def load(self) -> None:
        pass

    def unload(self) -> None:
        pass

    def supports_bypass_charge(self) -> bool:
        return support_charge_behaviour()

    def supports_charge_limit(self) -> bool:
        return support_charge_control_end_threshold()

    def get_bypass_charge(self) -> bool:
        return get_charge_behaviour() == "inhibit-charge"

    def set_bypass_charge(self, value: bool) -> None:
        set_charge_behaviour("inhibit-charge" if value else "auto")

    def set_charge_limit(self, value: int) -> None:
        # check value
        if not 0 <= value <= 100:
            logger.error(f"充电限制电量必须在 0-100 之间，当前值: {value}")
            return
        if not support_charge_control_end_threshold():
            return
        set_charge_control_end_threshold(value)
