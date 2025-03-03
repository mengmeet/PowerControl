from config import logger
from devices import IDevice


class PowerManager:
    def __init__(self):
        self._device = IDevice.get_current()
        logger.info(f"当前使用的设备类型: {type(self._device)}")
        self._device.load()

    def __getattr__(self, name):
        """动态委托到设备实例"""
        return getattr(self._device, name)

    def __del__(self):
        self._device.unload()
