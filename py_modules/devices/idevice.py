from abc import ABC, abstractmethod

from config import PRODUCT_NAME, PRODUCT_VERSION, VENDOR_NAME


class IDevice(ABC):
    _instance: "IDevice" = None
    vendor_name = VENDOR_NAME
    product_name = PRODUCT_NAME
    product_version = PRODUCT_VERSION

    @classmethod
    def get_current(cls) -> "IDevice":
        if cls._instance is not None:
            return cls._instance

        match VENDOR_NAME:
            case "AYADEVICE" | "AYANEO":
                match PRODUCT_NAME:
                    case (
                        "AIR"
                        | "AIR Pro"
                        | "KUN"
                        | "AYANEO 2"
                        | "AYANEO 2S"
                        | "GEEK"
                        | "GEEK 1S"
                        | "FLIP KB"
                        | "FLIP DS"
                    ):
                        from .ayaneo_device import AyaneoDevice

                        cls._instance = AyaneoDevice()
                    case "AIR Plus" | "SLIDE":
                        from .ayaneo_air_plus import AyaneoAirPlus

                        cls._instance = AyaneoAirPlus()
                    case "AIR 1S" | "AIR 1S Limited":
                        from .ayaneo_air_1s import AyaneoAir1S

                        cls._instance = AyaneoAir1S()
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
