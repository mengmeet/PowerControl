from abc import ABC, abstractmethod

from config import (
    PRODUCT_NAME,
    PRODUCT_VERSION,
    VENDOR_NAME,
    BOARD_NAME,
)


class IDevice(ABC):
    _instance: "IDevice" = None
    vendor_name = VENDOR_NAME
    product_name = PRODUCT_NAME
    product_version = PRODUCT_VERSION
    board_name = BOARD_NAME

    @classmethod
    def get_current(cls) -> "IDevice":
        if cls._instance is not None:
            return cls._instance

        match VENDOR_NAME:
            case "AYADEVICE" | "AYANEO":
                match BOARD_NAME:
                    case "AYANEO 2" | "AYANEO 2S" | "GEEK" | "GEEK 1S":
                        from .ayaneo_device import AyaneoDevice

                        cls._instance = AyaneoDevice()
                    case "AB05-AMD" | "AS01":
                        from .ayaneo_air_plus import AyaneoAirPlus

                        cls._instance = AyaneoAirPlus()

                    case "AB05-Intel":
                        from .ayaneo_air_plus_intel import AyaneoAirPlusIntel

                        cls._instance = AyaneoAirPlusIntel()
                    case "AB05-Mendocino":
                        from .ayaneo_air_plus_mendocino import AyaneoAirPlusMendocino

                        cls._instance = AyaneoAirPlusMendocino()
                    case "AIR" | "AIR Pro":
                        from .ayaneo_air import AyaneoAir

                        cls._instance = AyaneoAir()
                    case "AIR 1S" | "AIR 1S Limited":
                        from .ayaneo_air_1s import AyaneoAir1S

                        cls._instance = AyaneoAir1S()
                    case "FLIP KB":
                        from .ayaneo_flip_kb import AyaneoFlipKB

                        cls._instance = AyaneoFlipKB()
                    case "FLIP DS":
                        from .ayaneo_flip_ds import AyaneoFlipDS

                        cls._instance = AyaneoFlipDS()
                    case "KUN":
                        from .ayaneo_kun import AyaneoKun

                        cls._instance = AyaneoKun()
                    case _:
                        from .power_device import PowerDevice

                        cls._instance = PowerDevice()
            case _:
                from .power_device import PowerDevice

                cls._instance = PowerDevice()

        return cls._instance

    @abstractmethod
    def get_bypass_charge(self) -> bool | None:
        pass

    @abstractmethod
    def set_bypass_charge(self, value: bool) -> None:
        pass

    @abstractmethod
    def set_charge_limit(self, value: int) -> None:
        pass

    @abstractmethod
    def supports_bypass_charge(self) -> bool:
        pass

    @abstractmethod
    def supports_charge_limit(self) -> bool:
        pass

    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass
