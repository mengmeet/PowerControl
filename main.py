import sys
import traceback
import decky_plugin
from settings import SettingsManager

# 获取插件路径 加载backend中各个py文件
try:
    from helpers import get_homebrew_path

    HOMEBREW_PATH = get_homebrew_path()
    sys.path.append("{}/plugins/PowerControl/backend".format(HOMEBREW_PATH))
    from config import logging, CONFIG_KEY
    from gpu import gpuManager
    from cpu import cpuManager
    from fan import fanManager
    from sysInfo import sysInfoManager
    import update

except Exception as e:
    # 堆栈跟踪
    logging.error(traceback.format_exc())
    logging.error(e)


class Plugin:
    async def _main(self):
        self.settings = SettingsManager(
            name="config", settings_directory=decky_plugin.DECKY_PLUGIN_SETTINGS_DIR
        )

    async def get_settings(self):
        return self.settings.getSetting(CONFIG_KEY)
    
    async def set_settings(self, settings):
        self.settings.setSetting(CONFIG_KEY, settings)
        # logging.info(f"save Settings: {settings}")
        return True

    async def _unload(self):
        gpuManager.unload()
        logging.info("End PowerControl")

    async def get_hasRyzenadj(self):
        try:
            return cpuManager.get_hasRyzenadj()
        except Exception as e:
            logging.error(e)
            return False

    async def get_cpuMaxNum(self):
        try:
            return cpuManager.get_cpuMaxNum()
        except Exception as e:
            logging.error(e)
            return 0

    async def get_isSupportSMT(self):
        try:
            return cpuManager.get_isSupportSMT()
        except Exception as e:
            logging.error(e)
            return False

    async def get_tdpMax(self):
        try:
            return cpuManager.get_tdpMax()
        except Exception as e:
            logging.error(e)
            return 0

    async def get_gpuFreqRange(self):
        try:
            return gpuManager.get_gpuFreqRange()
        except Exception as e:
            logging.error(e)
            return 0

    # 弃用
    async def get_cpu_AvailableFreq(self):
        try:
            return cpuManager.get_cpu_AvailableFreq()
        except Exception as e:
            logging.error(e)
            return []

    async def get_language(self):
        try:
            return sysInfoManager.get_language()
        except Exception as e:
            logging.error(e)
            return ""

    async def get_fanRPM(self, index):
        try:
            return fanManager.get_fanRPM(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanRPMPercent(self, index):
        try:
            return fanManager.get_fanRPMPercent(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanTemp(self, index):
        try:
            return fanManager.get_fanTemp(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanIsAuto(self, index):
        try:
            return fanManager.get_fanIsAuto(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanConfigList(self):
        try:
            return fanManager.get_fanConfigList()
        except Exception as e:
            logging.error(e)
            return []

    async def set_fanAuto(self, index: int, value: bool):
        try:
            return fanManager.set_fanAuto(index, value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_fanPercent(self, index: int, value: int):
        try:
            return fanManager.set_fanPercent(index, value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_gpuAuto(self, value: bool):
        try:
            return gpuManager.set_gpuAuto(value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_gpuAutoFreqRange(self, min: int, max: int):
        try:
            return gpuManager.set_gpuAutoFreqRange(min, max)
        except Exception as e:
            logging.error(e)
            return False

    async def set_gpuFreq(self, value: int):
        try:
            return gpuManager.set_gpuFreqFix(value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_gpuFreqRange(self, value: int, value2: int):
        try:
            return gpuManager.set_gpuFreqRange(value, value2)
        except Exception as e:
            logging.error(e)
            return False

    async def set_cpuTDP(self, value: int):
        try:
            return cpuManager.set_cpuTDP(value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_cpuOnline(self, value: int):
        try:
            return cpuManager.set_cpuOnline(value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_smt(self, value: bool):
        try:
            return cpuManager.set_smt(value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_cpuBoost(self, value: bool):
        try:
            return cpuManager.set_cpuBoost(value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_cpuFreq(self, value: int):
        try:
            return cpuManager.set_cpuFreq(value)
        except Exception as e:
            logging.error(e)
            return False

    async def receive_suspendEvent(self):
        try:
            return True
        except Exception as e:
            logging.error(e)
            return False

    async def fix_gpuFreqSlider(self):
        try:
            return gpuManager.fix_gpuFreqSlider()
        except Exception as e:
            logging.error(e)
            return False

    async def update_latest(self):
        logging.info("Updating latest")
        return update.update_latest()

    async def get_version(self):
        return update.get_version()

    async def get_latest_version(self):
        return update.get_latest_version()

    async def get_ryzenadj_info(self):
        return cpuManager.get_ryzenadj_info()
