import sys

import decky
from ec import EC

try:
    import update
    from conf_manager import confManager
    from config import CPU_VENDOR, logger
    from cpu import cpuManager
    from fan import fanManager
    from fuse_manager import FuseManager
    from gpu import gpuManager
    from power_manager import PowerManager
    from sysInfo import sysInfoManager

    sys.path.append(f"{decky.DECKY_PLUGIN_DIR}/py_modules/site-packages")
except Exception as e:
    decky.logger.error(e, exc_info=True)


class Plugin:
    def __init__(self):
        self.fuseManager = None
        self.confManager = confManager
        self.powerManager = PowerManager()

    async def _migration(self):
        decky.logger.info("start _migration")
        ec_version = [
            EC.Read(0x00),
            EC.Read(0x01),
            EC.Read(0x02),
            EC.Read(0x03),
            EC.Read(0x04),
        ]
        ec_version_hex = [hex(v) for v in ec_version]
        decky.logger.info(
            f"EC version (decimal): {ec_version}, EC version (hex): {ec_version_hex}"
        )

        self.fuseManager = FuseManager()
        # self.fuseManager.fuse_init()

    async def _main(self):
        decky.logger.info("start _main")
        self.powerManager.load()
        pass

    async def _unload(self):
        decky.logger.info("start _unload")
        gpuManager.unload()
        self.fuseManager.unload()
        self.powerManager.unload()
        logger.info("End PowerControl")

    async def get_settings(self):
        return self.confManager.getSettings()

    async def set_settings(self, settings):
        self.confManager.setSettings(settings)
        return True

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

    async def get_cpu_vendor(self):
        try:
            return CPU_VENDOR
        except Exception as e:
            logger.error(e, exc_info=True)
            return ""

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
            # return cpuManager.set_cpuTDP(value)
            return self.powerManager.set_tdp(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def is_intel(self):
        try:
            return cpuManager.is_intel()
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

    async def set_auto_cpumax_pct(self, value: bool):
        try:
            return cpuManager.set_auto_cpumax_pct(value)
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

    async def get_bypass_charge(self) -> bool | None:
        """获取 Bypass Charge 值。"""
        try:
            return self.powerManager.get_bypass_charge()
        except Exception as e:
            logger.error(e, exc_info=True)
            return None

    async def set_bypass_charge(self, value: int):
        """设置旁路供电值。"""
        logger.info(f"Main 设置旁路供电值为 {value}")
        try:
            return self.powerManager.set_bypass_charge(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def set_charge_limit(self, value: int):
        """设置充电限制电量"""
        logger.debug(f"设置充电限制电量为 {value}")
        try:
            return self.powerManager.set_charge_limit(value)
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def supports_bypass_charge(self) -> bool:
        """判断设备是否支持旁路供电"""
        try:
            result = self.powerManager.supports_bypass_charge()
            logger.info(f"当前设备支持旁路供电: {result}")
            return result
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    async def supports_charge_limit(self) -> bool:
        """判断设备是否支持充电限制"""
        try:
            result = self.powerManager.supports_charge_limit()
            logger.info(f"当前设备支持充电限制: {result}")
            return result
        except Exception as e:
            logger.error(e, exc_info=True)
            return False
