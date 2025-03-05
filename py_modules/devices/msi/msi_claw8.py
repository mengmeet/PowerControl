from .msi_device import SM_COMFORT_NAME, SM_ECO_NAME, SM_SPORT_NAME, MsiDevice

SHIFT_MODES_DICT = {
    SM_ECO_NAME: 0xC2,
    SM_COMFORT_NAME: 0xC1,
    SM_SPORT_NAME: 0xC0,
}


class MsiClaw8(MsiDevice):
    def __init__(self):
        super().__init__()
        self.shift_mode_dict = SHIFT_MODES_DICT

    def set_tdp(self, tdp: int) -> None:
        if tdp < 5:
            self.shift_mode_write(SM_ECO_NAME)
        elif tdp < 17:
            self.shift_mode_write(SM_COMFORT_NAME)
        else:
            self.shift_mode_write(SM_SPORT_NAME)
        super().set_tdp(tdp)
