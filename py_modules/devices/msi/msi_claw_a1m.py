from .msi_device import SM_COMFORT_NAME, SM_ECO_NAME, SM_SPORT_NAME, MsiDevice

SHIFT_MODES_DICT = {
    SM_ECO_NAME: 0xC2,
    SM_COMFORT_NAME: 0xC1,
    SM_SPORT_NAME: 0xC0,
}


class MsiClawA1M(MsiDevice):
    def __init__(self):
        super().__init__()
        self.shift_mode_dict = SHIFT_MODES_DICT
