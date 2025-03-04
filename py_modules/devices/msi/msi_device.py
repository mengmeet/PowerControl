from config import logger
from utils import support_charge_control_end_threshold

from ..power_device import PowerDevice

EC_CHARGE_LIMIT_ADDR = 0xD7
EC_CHARGE_LIMIT_DISABLE = 0x80


class MsiDevice(PowerDevice):
    def __init__(self):
        super().__init__()

    def supports_reset_charge_limit(self) -> bool:
        return True

    def supports_charge_limit(self) -> bool:
        return True

    def reset_charge_limit(self) -> None:
        self._ec_write(EC_CHARGE_LIMIT_ADDR, EC_CHARGE_LIMIT_DISABLE)

    def set_charge_limit(self, value: int) -> None:
        if support_charge_control_end_threshold():
            super().set_charge_limit(value)
        else:
            if not 0 <= value <= 100:
                logger.error(
                    f"Charge limit must be between 0-100, current value: {value}"
                )
                return
            write_value = value + EC_CHARGE_LIMIT_DISABLE
            self._ec_write(EC_CHARGE_LIMIT_ADDR, write_value)
