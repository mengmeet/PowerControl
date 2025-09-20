import os
import sys
from typing import Dict, List

import decky

import update
from conf_manager import confManager
from cpu import cpuManager
from config import CPU_VENDOR, logger
from fan import fanManager
from sysInfo import sysInfoManager

sys.path.append(f"{decky.DECKY_PLUGIN_DIR}/py_modules/site-packages")

class Plugin:
    def __init__(self):
        self.confManager = confManager
        # 使用单例模式，不再存储 fuseManager 实例
        # 而是每次通过 FuseManager.get_instance() 获取

    async def _migration(self):
        decky.logger.info("start _migration")

        # 使用单例模式获取 FuseManager 实例
        # fuseManager = FuseManager.get_instance(power_manager=self.powerManager)
        # settings = self.confManager.getSettings()
        # enableNativeTDPSlider = (
        #     settings.get("enableNativeTDPSlider", False) if settings else False
        # )
        # if enableNativeTDPSlider:
        #     fuseManager.fuse_init()

    async def _main(self):
        decky.logger.info("start _main")
        pass

    async def _unload(self):
        decky.logger.info("start _unload")
        # 使用单例模式获取实例并卸载
        # FuseManager.get_instance().unload()
        logger.info("End PowerControl")

    async def get_settings(self):
        return self.confManager.getSettings()

    async def set_settings(self, settings):
        self.confManager.setSettings(settings)
        return True

    async def get_language(self):
        try:
            return sysInfoManager.get_language()
        except Exception as e:
            logger.error(e, exc_info=True)
            return ""

    async def get_fanRPM(self, index):
        try:
            return fanManager.get_fanRPM(index)
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def get_fanRPMPercent(self, index):
        try:
            return fanManager.get_fanRPMPercent(index)
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def get_fanTemp(self, index):
        try:
            return fanManager.get_fanTemp(index)
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def get_fanIsAuto(self, index):
        try:
            return fanManager.get_fanIsAuto(index)
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def get_fanConfigList(self):
        try:
            return fanManager.get_fanConfigList()
        except Exception as e:
            logger.error(e, exc_info=True)
            return []

    async def set_fanAuto(self, index: int, value: bool):
        try:
            return fanManager.set_fanAuto(index, value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_fanPercent(self, index: int, value: int):
        try:
            return fanManager.set_fanPercent(index, value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_fanCurve(self, index: int, temp_list: List[int], pwm_list: List[int]):
        try:
            return fanManager.set_fanCurve(index, temp_list, pwm_list)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def is_intel(self):
        try:
            return cpuManager.is_intel()
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def receive_suspendEvent(self):
        try:
            return True
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def update_latest(self):
        logger.info("Updating latest")
        # return update.update_latest()
        try:
            return update.update_latest()
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def get_version(self):
        return update.get_version()

    async def get_latest_version(self):
        try:
            return update.get_latest_version()
        except Exception as e:
            logger.error(e, exc_info=True)
            return ""

    async def get_ryzenadj_info(self):
        return cpuManager.get_ryzenadj_info()

    async def get_rapl_info(self):
        logger.info("Main get_rapl_info")
        return cpuManager.get_rapl_info()

    async def log_info(self, message: str):
        try:
            return logger.info(f"Frontend: {message}")
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def log_error(self, message: str):
        try:
            return logger.error(f"Frontend: {message}")
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def log_warn(self, message: str):
        try:
            return logger.warn(f"Frontend: {message}")
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def log_debug(self, message: str):
        try:
            return logger.debug(f"Frontend: {message}")
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def check_file_exist(self, file_path: str) -> bool:
        try:
            return os.path.exists(file_path)
        except Exception as e:
            logger.error(f"Error checking file exist: {e}", exc_info=True)
            return False
