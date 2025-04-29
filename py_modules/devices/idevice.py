from abc import ABC, abstractmethod

from config import BOARD_NAME, BOARD_VENDOR, PRODUCT_NAME, PRODUCT_VERSION, VENDOR_NAME


class IDevice(ABC):
    _instance: "IDevice" = None
    vendor_name = VENDOR_NAME
    product_name = PRODUCT_NAME
    product_version = PRODUCT_VERSION
    board_name = BOARD_NAME
    board_vendor = BOARD_VENDOR

    @classmethod
    def get_current(cls) -> "IDevice":
        if cls._instance is not None:
            return cls._instance

        match BOARD_VENDOR:
            case "AYADEVICE" | "AYANEO":
                match BOARD_NAME:
                    case "AYANEO 2" | "AYANEO 2S" | "GEEK" | "GEEK 1S":
                        from . import AyaneoDevice

                        cls._instance = AyaneoDevice()
                    case "AB05-AMD" | "AS01":
                        from . import AyaneoAirPlus

                        cls._instance = AyaneoAirPlus()

                    case "AB05-Intel":
                        from . import AyaneoAirPlusIntel

                        cls._instance = AyaneoAirPlusIntel()
                    case "AB05-Mendocino":
                        from . import AyaneoAirPlusMendocino

                        cls._instance = AyaneoAirPlusMendocino()
                    case "AIR" | "AIR Pro":
                        from . import AyaneoAir

                        cls._instance = AyaneoAir()
                    case "AIR 1S" | "AIR 1S Limited":
                        from . import AyaneoAir1S

                        cls._instance = AyaneoAir1S()
                    case "FLIP KB":
                        from . import AyaneoFlipKB

                        cls._instance = AyaneoFlipKB()
                    case "FLIP DS":
                        from . import AyaneoFlipDS

                        cls._instance = AyaneoFlipDS()
                    case "KUN":
                        from . import AyaneoKun

                        cls._instance = AyaneoKun()
                    case _:
                        from . import PowerDevice

                        cls._instance = PowerDevice()
            case "ASUSTeK COMPUTER INC.":
                from . import AsusDevice

                cls._instance = AsusDevice()
            case "Micro-Star International Co., Ltd.":
                match BOARD_NAME:
                    # Claw 8
                    case "MS-1T52":
                        from . import MsiClaw8

                        cls._instance = MsiClaw8()
                    case "MS-1T41":
                        from . import MsiClawA1M

                        cls._instance = MsiClawA1M()
                    case _:
                        from . import MsiDevice

                        cls._instance = MsiDevice()
            case "LENOVO":
                from . import LenovoDevice

                cls._instance = LenovoDevice()
            case _:
                from . import PowerDevice

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
    def reset_charge_limit(self) -> None:
        pass

    # software_charge_limit
    @abstractmethod
    def software_charge_limit(self) -> bool:
        pass

    @abstractmethod
    def supports_reset_charge_limit(self) -> bool:
        pass

    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass

    @abstractmethod
    def supports_sched_ext(self) -> bool:
        pass

    @abstractmethod
    def get_sched_ext_list(self) -> list[str]:
        pass

    @abstractmethod
    def set_sched_ext(self, value: str, param: str) -> None:
        pass

    @abstractmethod
    def set_tdp(self, tdp: int) -> bool:
        pass

    @abstractmethod
    def set_tdp_unlimited(self) -> bool:
        pass
