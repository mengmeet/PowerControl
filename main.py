import sys

import decky
from settings import SettingsManager

# 获取插件路径 加载backend中各个py文件
try:
    from helpers import get_homebrew_path

    HOMEBREW_PATH = get_homebrew_path()
    sys.path.append("{}/plugins/PowerControl/backend".format(HOMEBREW_PATH))
    import update
    from config import CONFIG_KEY, logger
    from cpu import cpuManager
    from fan import fanManager
    from gpu import gpuManager
    from sysInfo import sysInfoManager
except Exception as e:
    decky.logger.error(e, exc_info=True)


class Plugin:
    async def _main(self):
        self.settings = SettingsManager(
            name="config", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR
        )

    async def get_settings(self):
        return self.settings.getSetting(CONFIG_KEY)

    async def set_settings(self, settings):
        self.settings.setSetting(CONFIG_KEY, settings)
        # logger.info(f"save Settings: {settings}")
        return True

    async def _unload(self):
        gpuManager.unload()
        logger.info("End PowerControl")

    async def get_hasRyzenadj(self):
        try:
            return cpuManager.get_hasRyzenadj()
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def get_cpuMaxNum(self):
        try:
            return cpuManager.get_cpuMaxNum()
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def get_isSupportSMT(self):
        try:
            return cpuManager.get_isSupportSMT()
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def get_tdpMax(self):
        try:
            return cpuManager.get_tdpMax()
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def get_gpuFreqRange(self):
        try:
            return gpuManager.get_gpuFreqRange()
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    # 弃用
    async def get_cpu_AvailableFreq(self):
        try:
            return cpuManager.get_cpu_AvailableFreq()
        except Exception as e:
            logger.error(e, exc_info=True)
            return []

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

    async def set_gpuAuto(self, value: bool):
        try:
            return gpuManager.set_gpuAuto(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_gpuAutoFreqRange(self, min: int, max: int):
        try:
            return gpuManager.set_gpuAutoFreqRange(min, max)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_gpuFreq(self, value: int):
        try:
            return gpuManager.set_gpuFreqFix(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_gpuFreqRange(self, value: int, value2: int):
        try:
            return gpuManager.set_gpuFreqRange(value, value2)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_cpuTDP(self, value: int):
        try:
            return cpuManager.set_cpuTDP(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_cpuOnline(self, value: int):
        try:
            return cpuManager.set_cpuOnline(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_smt(self, value: bool):
        try:
            return cpuManager.set_smt(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_cpuBoost(self, value: bool):
        try:
            return cpuManager.set_cpuBoost(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_cpuFreq(self, value: int):
        try:
            return cpuManager.set_cpuFreq(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def receive_suspendEvent(self):
        try:
            return True
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def fix_gpuFreqSlider(self):
        try:
            return gpuManager.fix_gpuFreqSlider()
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

    async def get_max_perf_pct(self):
        try:
            return cpuManager.get_max_perf_pct()
        except Exception as e:
            logger.error(e, exc_info=True)
            return 0

    async def set_max_perf_pct(self, value: int):
        try:
            return cpuManager.set_max_perf_pct(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def get_cpu_governor(self):
        """获取当前 CPU 调度器"""
        try:
            return cpuManager.get_cpu_governor()
        except Exception as e:
            logger.error(e, exc_info=True)
            return ""

    async def get_available_governors(self):
        """获取所有可用的 CPU 调度器"""
        try:
            return cpuManager.get_available_governors()
        except Exception as e:
            logger.error(e, exc_info=True)
            return []

    async def set_cpu_governor(self, governor: str):
        """设置 CPU 调度器

        Args:
            governor (str): 调度器名称
        """
        try:
            return cpuManager.set_cpu_governor(governor)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def is_epp_supported(self):
        """检查系统是否支持 EPP 功能。"""
        try:
            return cpuManager.is_epp_supported()
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def get_epp_modes(self):
        """获取可用的 EPP 模式列表。"""
        try:
            return cpuManager.get_epp_modes()
        except Exception as e:
            logger.error(e, exc_info=True)
            return []

    async def get_current_epp(self):
        """获取当前的 EPP 模式。"""
        try:
            return cpuManager.get_current_epp()
        except Exception as e:
            logger.error(e, exc_info=True)
            return None

    async def set_epp(self, mode: str):
        """设置 EPP 模式。"""
        try:
            return cpuManager.set_epp(mode)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False
