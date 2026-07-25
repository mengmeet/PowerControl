from config import logger
from devices import IDevice
from tdp_backend import (
    list_backends,
    resolve_power_info,
    resolve_tdp_max,
    resolve_tdp_min,
    set_preference,
)


class PowerManager:
    def __init__(self):
        self._device = IDevice.get_current()
        logger.info(f"当前使用的设备类型: {type(self._device)}")
        self._device.load()

    def __getattr__(self, name):
        """动态委托到设备实例"""
        return getattr(self._device, name)

    def get_tdpMax(self) -> int:
        return resolve_tdp_max(self._device)

    def get_tdpMin(self) -> int:
        return resolve_tdp_min(self._device)

    def get_power_info(self) -> str:
        return resolve_power_info(self._device)

    def get_tdp_backends(self) -> dict:
        return list_backends(self._device)

    def set_tdp_backend(self, backend_id: str) -> bool:
        info = list_backends(self._device)
        available_ids = {item["id"] for item in info["available"]}
        if backend_id not in available_ids and backend_id != "auto":
            logger.error(f"TDP backend not available: {backend_id}")
            return False
        return set_preference(backend_id)

    def __del__(self):
        self._device.unload()
