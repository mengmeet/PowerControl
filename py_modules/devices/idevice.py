from abc import ABC, abstractmethod

from config import PRODUCT_NAME, PRODUCT_VERSION, VENDOR_NAME


class IDevice(ABC):
    device = None
    vendor_name = VENDOR_NAME
    product_name = PRODUCT_NAME
    product_version = PRODUCT_VERSION

    @staticmethod
    def get_current() -> "IDevice":
        if IDevice.device is not None:
            return IDevice.device
        match IDevice.vendor_name:
            case "AYADEVICE" | "AYANEO":
                match IDevice.product_name:
                    case (
                        "AIR"
                        | "AIR Pro"
                        | "AIR 1S"
                        | "AIR 1S Limited"
                        | "KUN"
                        | "AYANEO 2"
                        | "AYANEO 2S"
                        | "GEEK"
                        | "GEEK 1S"
                        | "FLIP KB"
                        | "FLIP DS"
                    ):
                        from .ayaneo_device import AyaneoDevice

                        IDevice.device = AyaneoDevice()
                    case "AIR Plus" | "SLIDE":
                        from .ayaneo_device_ii import AyaneoDeviceII

                        IDevice.device = AyaneoDeviceII()
                    case _:
                        from .default_device import DefaultDevice

                        IDevice.device = DefaultDevice()
            case _:
                from .default_device import DefaultDevice
                IDevice.device = DefaultDevice()

        return IDevice.device

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