import os
import re
import subprocess
import threading
import time

import sysInfo
from config import (
    AMD_GPUFREQ_PATH,
    AMD_GPULEVEL_PATH,
    INTEL_GPU_MAX_FREQ,
    INTEL_GPU_MAX_LIMIT,
    INTEL_GPU_MIN_FREQ,
    INTEL_GPU_MIN_LIMIT,
    logger,
)
from inotify import IN_MODIFY, notify
from utils import fix_gpuFreqSlider_AMD, fix_gpuFreqSlider_INTEL, get_env


class GPUAutoFreqManager(threading.Thread):
    def __init__(self, gpuManager):
        self._gpu_enableAutoFreq = False  # 标记是否开启GPU频率优化
        self._gpu_autoFreqCheckInterval = 0.005  # gpu占用率数据检测间隔
        self._gpu_adjustFreqInterval = 0.2  # gpu调整间隔
        self._gpu_addFreqBase = 50  # 自动优化频率的基准大小
        self._gpu_minBusyPercent = 75  # 优化占用率的区间最小值
        self._gpu_maxBusyPercent = 90  # 优化占用率的区间最大值
        self._cpu_maxBusyPercent = (
            80  # cpu最大占用率 超过该占用率认定为gpu抢电 需要降低频率给cpu供电
        )
        self._isRunning = False  # 标记是否正在运行gpu频率优化
        self._gpuManager = gpuManager  # 用来获取和设置gpu频率

        threading.Thread.__init__(self)

    def Set_gpuFreq(self, freq: int):
        try:
            return self._gpuManager.set_gpuFreq(freq, freq)
        except Exception as e:
            logger.error(e)
            return False

    def GPU_enableAutoFreq(self, enable):
        # 初始化并开启自动优化线程
        self._gpu_enableAutoFreq = enable
        # 自动频率开启时去开启数据收集，避免不必要的性能浪费
        sysInfo.sysInfoManager.EnableCPUINFO(enable)
        sysInfo.sysInfoManager.EnableGPUINFO(enable)
        if enable and not self._isRunning:
            self.start()

    def optimization_GPUFreq(self):
        try:
            gpu_nowFreq = self._gpuManager.gpu_nowFreq[0]
            gpu_autoFreqMin = self._gpuManager.gpu_autoFreqRange[0]
            gpu_autoFreqMax = self._gpuManager.gpu_autoFreqRange[1]
            gpu_addFreqOnce = self._gpu_addFreqBase
            gpu_avgPercent = sysInfo.gpu_busyPercent
            cpu_avgPercent = sysInfo.cpu_busyPercent
            # cpu占用率过高 判定为被抢电 降低一点频率让电
            if cpu_avgPercent >= self._cpu_maxBusyPercent:
                gpu_addFreqOnce = min(
                    gpu_nowFreq - gpu_autoFreqMin, self._gpu_addFreqBase
                )
                gpu_nowFreq = gpu_nowFreq - gpu_addFreqOnce
                if gpu_addFreqOnce != 0:
                    self.Set_gpuFreq(gpu_nowFreq)
                logger.debug(
                    f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 大于最大值:{self._cpu_maxBusyPercent}% 降低{gpu_addFreqOnce}mhz GPU频率 降低后的GPU频率:{gpu_nowFreq} "
                )
            # 未抢电则判断gpu占用率 过高时认定gpu不够用 增加频率
            elif gpu_avgPercent >= self._gpu_maxBusyPercent:
                gpu_addFreqOnce = min(
                    gpu_autoFreqMax - gpu_nowFreq, self._gpu_addFreqBase
                )
                gpu_nowFreq = (
                    gpu_nowFreq + gpu_addFreqOnce * 2
                    if gpu_avgPercent >= 99
                    else gpu_nowFreq + gpu_addFreqOnce
                )
                if gpu_addFreqOnce != 0:
                    self.Set_gpuFreq(gpu_nowFreq)
                logger.debug(
                    f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 大于目标范围最大值:{self._gpu_maxBusyPercent}% 增加{gpu_addFreqOnce}mhz GPU频率 增加后的GPU频率:{gpu_nowFreq}"
                )
            # 未抢电则判断gpu占用率 过低时认定gpu富余 降低频率
            elif gpu_avgPercent <= self._gpu_minBusyPercent:
                gpu_addFreqOnce = min(
                    gpu_nowFreq - gpu_autoFreqMin, self._gpu_addFreqBase
                )
                gpu_nowFreq = gpu_nowFreq - gpu_addFreqOnce
                if gpu_addFreqOnce != 0:
                    self.Set_gpuFreq(gpu_nowFreq)
                logger.debug(
                    f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 小于目标范围最小值:{self._gpu_minBusyPercent}% 降低{gpu_addFreqOnce}mhz GPU频率 降低后的GPU频率:{gpu_nowFreq} "
                )
            # 不做任何调整
            else:
                logger.debug(
                    f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 处于目标范围{self._gpu_minBusyPercent}%-{self._gpu_maxBusyPercent}% 无需修改GPU频率  当前的GPU频率:{gpu_nowFreq}"
                )
        except Exception as e:
            logger.error(e)

    def run(self):
        logger.info("开始自动优化频率:" + self.name)
        adjust_count = 0
        self._isRunning = True
        gpu_autoFreqMin = self._gpuManager.gpu_autoFreqRange[0]
        gpu_autoFreqMax = self._gpuManager.gpu_autoFreqRange[1]
        while True:
            try:
                if not self._gpu_enableAutoFreq:
                    self._isRunning = False
                    logger.debug("退出自动优化频率：" + self.name)
                    break
                if not sysInfo.has_gpuData:
                    self.GPU_enableAutoFreq(False)
                    self.Set_gpuFreq(gpu_autoFreqMin, gpu_autoFreqMax)
                    self._isRunning = False
                    logger.debug("退出自动优化频率：" + self.name)
                    break
                adjust_count = adjust_count + 1
                if adjust_count >= int(
                    self._gpu_adjustFreqInterval / self._gpu_autoFreqCheckInterval
                ):
                    self.optimization_GPUFreq()
                    adjust_count = 0
                time.sleep(self._gpu_autoFreqCheckInterval)
            except Exception as e:
                logger.error(e)
                time.sleep(self._gpu_autoFreqCheckInterval)


class GPUFreqNotifier:
    def __init__(self, manager: "GPUManager"):
        self._gpuManager: "GPUManager" = manager
        self._isRunning = False

    def gpuFreq_IN_MODIFY(self, path, mask):
        logger.info(f"gpuFreq_IN_MODIFY path:{path} mask:{mask}")
        # gpu频率文件发生修改时，检查与插件目标是否相同，不同则设置回来
        if self.checkGPUNeedSet(
            self._gpuManager.gpu_nowFreq[0], self._gpuManager.gpu_nowFreq[1]
        ):
            logger.info(f"set_gpuFreq: gpu_nowFreq={self._gpuManager.gpu_nowFreq}")
            self._gpuManager.set_gpuFreq(
                self._gpuManager.gpu_nowFreq[0], self._gpuManager.gpu_nowFreq[1]
            )

    def gpuLevel_IN_MODIFY(self, path, mask):
        level_string = open(AMD_GPULEVEL_PATH, "r").read().strip()
        logger.info(
            f"gpuLevel_IN_MODIFY path:{path} mask:{mask} minFreq:{self._gpuManager.gpu_nowFreq[0]} maxFreq:{self._gpuManager.gpu_nowFreq[1]} level:{level_string}"
        )
        # 目标频率非[0,0]时，如果power_dpm_force_performance_level被改成auto，则设置回来
        if (
            self._gpuManager.gpu_nowFreq[0] != 0
            and self._gpuManager.gpu_nowFreq[1] != 0
            and level_string == "auto"
        ):
            logger.info(
                f"set_gpuFreq: gpu_nowFreq={self._gpuManager.gpu_nowFreq} level: manual"
            )
            open(AMD_GPULEVEL_PATH, "w").write("manual")
            self._gpuManager.set_gpuFreq(
                self._gpuManager.gpu_nowFreq[0], self._gpuManager.gpu_nowFreq[1]
            )

    def checkGPUNeedSet(self, freqMin: int, freqMax: int):
        gpu_freqMax = self._gpuManager.gpu_freqRange[1]
        gpu_freqMin = self._gpuManager.gpu_freqRange[0]
        try:
            # 可查询gpu设置频率时，判断当前设置是否与系统相同
            if os.path.exists(AMD_GPUFREQ_PATH):
                freq_string = open(AMD_GPUFREQ_PATH, "r").read()
                # 使用正则表达式提取频率信息
                od_sclk_matches = re.findall(
                    r"OD_SCLK:?\s*0:\s*(\d+)Mhz\s*1:\s*(\d+)Mhz", freq_string
                )
                logger.debug(
                    f"get_gpuFreqRange {od_sclk_matches[0][0]} {od_sclk_matches[0][1]}"
                )

                if od_sclk_matches:
                    qfreqMin = int(od_sclk_matches[0][0])
                    qfreqMax = int(od_sclk_matches[0][1])
                    logger.debug(
                        f"匹配到OD_SCLK中的频率信息 min={qfreqMin} max={qfreqMax}"
                    )
                else:
                    logger.debug("无法匹配到OD_SCLK中的频率信息")
                    return False

                # 当前设置与查询的设置不相同时设置一次(特殊情况：0，0对应区间最小和区间最大 即不限制)
                if (
                    (qfreqMin != freqMin or qfreqMax != freqMax)
                    and freqMin != 0
                    and freqMax != 0
                ) or (
                    freqMin == 0
                    and freqMax == 0
                    and (qfreqMin != gpu_freqMin or qfreqMax != gpu_freqMax)
                ):
                    logger.info(
                        f"检测到当前设置与系统不同 当前检查的频率 freqMin={freqMin} freqMax={freqMax} 当前系统频率 qfreqMin={qfreqMin} qfreqMax={qfreqMax}"
                    )
                    return True
                else:
                    return False
            # 查不到gpu设置频率时，不进行设置
            else:
                logger.debug("无法查询当前系统GPU频率")
                return False
        except Exception as e:
            logger.error(e)
            return False

    def run(self):
        if self._isRunning:
            return
        logger.info("开始监听 gpu sysfs 文件")
        self._isRunning = True
        notify.add_watch(AMD_GPUFREQ_PATH, IN_MODIFY, self.gpuFreq_IN_MODIFY)
        notify.add_watch(AMD_GPULEVEL_PATH, IN_MODIFY, self.gpuLevel_IN_MODIFY)

    def stop(self):
        if not self._isRunning:
            return
        logger.info("停止监听 gpu sysfs 文件")
        self._isRunning = False
        notify.remove_watch(AMD_GPUFREQ_PATH)
        notify.remove_watch(AMD_GPULEVEL_PATH)


class GPUManager:
    def __init__(self):
        self._gpuAutoFreqManager = None
        self.gpu_nowFreq = [0, 0]  # 当前设置的gpu频率
        self.gpu_freqRange = [0, 0]  # 系统gpu频率调整的区间
        self.gpu_autoFreqRange = [0, 0]  # 自动gpu频率调整的区间
        self.__init_gpu_info()  # 初始化gpu信息
        self._gpu_notifier = GPUFreqNotifier(self)  # 监视gpu频率文件
        # self._gpu_notifier.run()

    def __init_gpu_info(self):
        self.get_gpuFreqRange()  # 获取gpu频率范围
        self.gpu_autoFreqRange = [
            self.gpu_freqRange[0],
            self.gpu_freqRange[1],
        ]  # 自动gpu频率调整的区间

    def unload(self):
        self.set_gpuAuto(False)
        self._gpu_notifier.stop()

    def start_gpu_notify(self):
        self._gpu_notifier.run()

    def stop_gpu_notify(self):
        self._gpu_notifier.stop()

    def get_gpuFreqRange(self):
        try:
            if os.path.exists(AMD_GPUFREQ_PATH):
                freq_string = open(AMD_GPUFREQ_PATH, "r").read()
                # 使用正则表达式提取频率信息
                od_sclk_matches = re.findall(
                    r"OD_RANGE:?\s*SCLK:\s*(\d+)Mhz\s*(\d+)Mhz", freq_string
                )
                logger.debug(
                    f"get_gpuFreqRange {od_sclk_matches[0][0]} {od_sclk_matches[0][1]}"
                )

                if od_sclk_matches:
                    self.gpu_freqRange = [
                        int(od_sclk_matches[0][0]),
                        int(od_sclk_matches[0][1]),
                    ]
                    return self.gpu_freqRange[0], self.gpu_freqRange[1]
            elif os.path.exists(INTEL_GPU_MAX_LIMIT) and os.path.exists(
                INTEL_GPU_MIN_LIMIT
            ):
                logger.info(
                    f"get_gpuFreqRange intel gpu, max_limit: {INTEL_GPU_MAX_LIMIT}, min_limit: {INTEL_GPU_MIN_LIMIT}"
                )
                # intel gpu
                with open(INTEL_GPU_MAX_LIMIT, "r") as file:
                    max_freq = int(file.read().strip())
                with open(INTEL_GPU_MIN_LIMIT, "r") as file:
                    min_freq = int(file.read().strip())
                self.gpu_freqRange = [min_freq, max_freq]

                return min_freq, max_freq
            else:
                return 0, 0

        except Exception as e:
            logger.error(e, exc_info=True)
            return 0, 0

    def set_gpuAuto(self, value: bool):
        try:
            logger.debug(f"set_gpuAuto  isAuto: {value}")
            # 判断是否已经有自动频率管理
            if (
                self._gpuAutoFreqManager is None
                or not self._gpuAutoFreqManager._isRunning
            ):
                # 没有管理器或者当前管理器已经停止运行，则实例化一个并开启
                if value:
                    self._gpuAutoFreqManager = GPUAutoFreqManager(self)
                    self._gpuAutoFreqManager.GPU_enableAutoFreq(True)
            else:
                # 有管理器且管理器正在运行，则直接关闭当前的管理器
                if not value:
                    self._gpuAutoFreqManager.GPU_enableAutoFreq(False)
                    self._gpuAutoFreqManager = None

        except Exception as e:
            logger.error(e)
            return False

    def set_gpuAutoFreqRange(self, value1: int, value2: int):
        try:
            logger.debug(f"set_gpuAutoFreqRange: [{value1},{value2}]")
            self.gpu_autoFreqRange = [
                min(max(value1, self.gpu_freqRange[0]), self.gpu_freqRange[1]),
                min(max(value2, self.gpu_freqRange[0]), self.gpu_freqRange[1]),
            ]
        except Exception as e:
            logger.error(e)
            return False

    def set_gpuFreq(self, minValue: int, maxValue: int):
        try:
            logger.debug(
                f"set_gpuFreq: [{minValue}, {maxValue}], gpu_freqRange={self.gpu_freqRange}"
            )
            if (
                (
                    minValue >= self.gpu_freqRange[0]
                    and maxValue <= self.gpu_freqRange[1]
                )
                or (minValue == 0 and maxValue == 0)
            ) and maxValue >= minValue:
                self.gpu_nowFreq = [minValue, maxValue]

                logger.debug(f"set_gpuFreq: gpu_nowFreq={self.gpu_nowFreq}")
                if os.path.exists(AMD_GPULEVEL_PATH):
                    # amd gpu
                    if minValue == 0 and maxValue == 0:
                        open(AMD_GPULEVEL_PATH, "w").write("auto")
                    else:
                        open(AMD_GPULEVEL_PATH, "w").write("manual")
                        open(AMD_GPUFREQ_PATH, "w").write("s 0 {}".format(minValue))
                        open(AMD_GPUFREQ_PATH, "w").write("s 1 {}".format(maxValue))
                        open(AMD_GPUFREQ_PATH, "w").write("c")
                    return True
                elif os.path.exists(INTEL_GPU_MAX_FREQ) and os.path.exists(
                    INTEL_GPU_MIN_FREQ
                ):
                    logger.debug(
                        f"set_gpuFreq: intel gpu, INTEL_GPU_MAX_FREQ={INTEL_GPU_MAX_FREQ}, INTEL_GPU_MIN_FREQ={INTEL_GPU_MIN_FREQ}"
                    )
                    # intel gpu
                    if minValue == 0 and maxValue == 0:
                        minValue = self.gpu_freqRange[0]
                        maxValue = self.gpu_freqRange[1]
                    currentMin = 0
                    currentMax = 0
                    with open(INTEL_GPU_MIN_FREQ, "r") as file:
                        currentMin = int(file.read().strip())
                    with open(INTEL_GPU_MAX_FREQ, "r") as file:
                        currentMax = int(file.read().strip())
                    logger.debug(
                        f"set_gpuFreq: intel gpu, currentMin={currentMin} currentMax={currentMax}"
                    )
                    # 如果要设置 min 大于当前 max，要先设置 max
                    if minValue > currentMax or maxValue < currentMin:
                        logger.debug(
                            f"set_gpuFreq: intel gpu, set maxValue={maxValue} before minValue={minValue}"
                        )
                        try:
                            if maxValue != currentMax:
                                with open(INTEL_GPU_MAX_FREQ, "w") as file:
                                    file.write(str(maxValue))
                                time.sleep(0.1)
                        except Exception as e:
                            logger.error(e, exc_info=True)
                        try:
                            if minValue != currentMin:
                                with open(INTEL_GPU_MIN_FREQ, "w") as file:
                                    file.write(str(minValue))
                        except Exception as e:
                            logger.error(e, exc_info=True)
                    else:
                        logger.debug(
                            f"set_gpuFreq: intel gpu, set minValue={minValue} before maxValue={maxValue}"
                        )
                        try:
                            if minValue != currentMin:
                                with open(INTEL_GPU_MIN_FREQ, "w") as file:
                                    file.write(str(minValue))
                            time.sleep(0.1)
                        except Exception as e:
                            logger.error(e, exc_info=True)
                        try:
                            if maxValue != currentMax:
                                with open(INTEL_GPU_MAX_FREQ, "w") as file:
                                    file.write(str(maxValue))
                            time.sleep(0.1)
                        except Exception as e:
                            logger.error(e, exc_info=True)
                    return True
            else:
                return False
        except Exception as e:
            logger.error(e, exc_info=True)
            return False

    def set_gpuFreqFix(self, value: int):
        try:
            logger.debug(f"set_gpuFixFreq {value}")
            # 有自动频率时关闭它
            if self._gpuAutoFreqManager is not None:
                self._gpuAutoFreqManager.GPU_enableAutoFreq(False)
                self._gpuAutoFreqManager = None
            self.set_gpuFreq(value, value)
            return True
        except Exception as e:
            logger.error(e)
            return False

    def set_gpuFreqRange(self, value: int, value2: int):
        try:
            logger.debug(f"set_gpuRangeFreq {value}  {value2}")
            # 有自动频率时关闭它
            if self._gpuAutoFreqManager is not None:
                self._gpuAutoFreqManager.GPU_enableAutoFreq(False)
                self._gpuAutoFreqManager = None
            self.set_gpuFreq(value, value2)
        except Exception as e:
            logger.error(e)
            return False

    def fix_gpuFreqSlider(self):
        try:
            # 执行 lsb_release 命令并捕获输出
            result = subprocess.run(
                ["/usr/bin/lsb_release", "-is"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
                env=get_env(),
            )
            # 获取输出并去除空白字符
            distribution = result.stdout.strip()
            logger.debug(f"当前系统为 {distribution}")
            result = None
            # 判断是否为 ChimeraOS
            if distribution == "chimeraos":
                result = subprocess.run(["frzr-unlock"], env=get_env(), check=True)
            elif distribution == "SteamOS":
                result = subprocess.run(
                    ["steamos-readonly", "disable"], env=get_env(), check=True
                )

            if result is not None:
                if result.stdout:
                    logger.info(f"stdout {result.stdout.strip()}")
                if result.stderr:
                    logger.error(result.stderr.strip())
                    return

            if os.path.exists(AMD_GPULEVEL_PATH):
                fix_gpuFreqSlider_AMD()
            elif os.path.exists(INTEL_GPU_MAX_FREQ) and os.path.exists(
                INTEL_GPU_MIN_FREQ
            ):
                fix_gpuFreqSlider_INTEL()
        except Exception as e:
            logger.error(e, exc_info=True)
        pass

    def get_gpuFreqMin(self):
        gpuFreqMin, _ = self.get_gpuFreqRange()
        return gpuFreqMin

    def get_gpuFreqMax(self):
        _, gpuFreqMax = self.get_gpuFreqRange()
        return gpuFreqMax


gpuManager = GPUManager()
