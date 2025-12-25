import glob
import json
import os
import re
import subprocess
import threading
import time
import traceback
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import sysInfo
from config import CPU_VENDOR, RYZENADJ_PATH, SH_PATH, logger
from cpu_detector import create_cpu_detector
from utils import get_env, get_ryzenadj_path, getMaxTDP


@dataclass
class CPUCoreInfo:
    """CPU核心静态信息"""

    logical_id: int  # 逻辑处理器ID
    core_id: int  # 物理核心ID
    package_id: int  # 物理封装ID
    cluster_id: int  # 集群ID
    die_id: int  # Die ID

    # 硬件固有频率信息
    max_freq_hw: int  # 硬件最大频率 (cpuinfo_max_freq)
    min_freq_hw: int  # 硬件最小频率 (cpuinfo_min_freq)

    # 拓扑关系（初始化后填充）
    sibling_threads: List[int] = field(default_factory=list)
    cluster_cpus: List[int] = field(default_factory=list)
    package_cpus: List[int] = field(default_factory=list)


class CPUTopology:
    """CPU拓扑管理器"""

    def __init__(self):
        self.cores: Dict[int, CPUCoreInfo] = {}

    def add_core(self, core_info: CPUCoreInfo):
        """添加CPU核心信息"""
        self.cores[core_info.logical_id] = core_info

    def get_all_logical_ids(self) -> List[int]:
        """获取所有逻辑CPU ID（解决CPU编号不连续问题）"""
        return sorted(self.cores.keys())

    def get_physical_core_ids(self) -> List[int]:
        """获取所有物理核心ID（替代cps_ids）
        
        Note: 过滤掉 core_id 为 -1 的异常核心
        """
        valid_ids = set()
        invalid_logical_ids = []
        for core in self.cores.values():
            if core.core_id >= 0:
                valid_ids.add(core.core_id)
            else:
                invalid_logical_ids.append(core.logical_id)
        
        if invalid_logical_ids:
            from config import logger
            logger.warning(
                f"检测到异常逻辑核心 (core_id=-1): {sorted(invalid_logical_ids)}, "
                f"这些核心将被排除在物理核心计数之外"
            )
        
        return sorted(valid_ids)

    def get_physical_core_count(self) -> int:
        """获取物理核心数量（替代cpu_maxNum）"""
        return len(self.get_physical_core_ids())

    def get_logical_ids_by_physical_core(self) -> Dict[int, List[int]]:
        """按物理核心分组逻辑CPU（用于SMT处理）
        
        Note: 过滤掉 core_id 为 -1 的异常核心
        """
        result = {}
        for logical_id, core in self.cores.items():
            if core.core_id < 0:
                continue  # 跳过异常核心
            if core.core_id not in result:
                result[core.core_id] = []
            result[core.core_id].append(logical_id)
        # 每个核心内按逻辑ID排序
        for core_id in result:
            result[core_id].sort()
        return result

    def get_core_info(self, logical_id: int) -> Optional[CPUCoreInfo]:
        """获取指定逻辑CPU的核心信息"""
        return self.cores.get(logical_id)

    def get_sibling_threads(self, logical_id: int) -> List[int]:
        """获取指定CPU的兄弟线程"""
        core_info = self.cores.get(logical_id)
        return core_info.sibling_threads if core_info else []

    def is_smt_supported(self) -> bool:
        """检查是否支持SMT（通过拓扑信息判断）"""
        for core in self.cores.values():
            if len(core.sibling_threads) > 1:
                return True
        return False

    def get_max_freq_range(self) -> Tuple[int, int]:
        """获取所有CPU的频率范围"""
        if not self.cores:
            return (0, 0)
        min_freq = min(
            core.min_freq_hw for core in self.cores.values() if core.min_freq_hw > 0
        )
        max_freq = max(
            core.max_freq_hw for core in self.cores.values() if core.max_freq_hw > 0
        )
        return (min_freq, max_freq)


class CPUAutoMaxFreqManager(threading.Thread):
    def __init__(self, cpuManager: "CPUManager") -> None:
        self._cpu_enableAutoMaxFreq = False  # 标记是否开启CPU频率优化
        self._cpu_autoFreqCheckInterval = 0.005  # cpu占用率数据检测间隔
        self._cpu_adjustFreqInterval = 0.5  # cpu调整间隔
        self._cpu_addPctBase = 5  # 自动优化性能百分比的基准大小 (5%)
        self._cpu_minBusyPercent = 40  # 优化占用率的区间最小值
        self._cpu_maxBusyPercent = 70  # 优化占用率的区间最大值
        self._isRunning = False  # 标记是否正在运行cpu频率优化
        self._cpuManager = cpuManager  # 用来获取和设置cpu频率
        self._current_pct = 100  # 当前性能百分比

        threading.Thread.__init__(self)

    def Set_cpuMaxPct(self, pct: int):
        """设置 CPU 最大性能百分比

        Args:
            pct (int): 性能百分比 (0-100)
        """
        try:
            self._current_pct = max(0, min(100, pct))  # 确保百分比在 0-100 之间
            return self._cpuManager.set_max_perf_pct(self._current_pct)
        except Exception as e:
            logger.error(e)
            return False

    def CPU_enableAutoMaxFreq(self, enable):
        # 初始化并开启自动优化线程
        self._cpu_enableAutoMaxFreq = enable
        # 自动频率开启时去开启数据收集，避免不必要的性能浪费
        sysInfo.sysInfoManager.EnableCPUINFO(enable)
        if enable and not self._isRunning:
            self.start()

    def optimization_CPUFreq(self):
        try:
            cpu_avgPercent = sysInfo.cpu_busyPercent

            # 判断cpu占用率 过高时认定cpu不够用 增加性能百分比
            if cpu_avgPercent >= self._cpu_maxBusyPercent:
                pct_add = (
                    self._cpu_addPctBase * 2
                    if cpu_avgPercent >= 99
                    else self._cpu_addPctBase
                )
                new_pct = min(100, self._current_pct + pct_add)
                if new_pct != self._current_pct:
                    self.Set_cpuMaxPct(new_pct)
                    logger.debug(
                        f"当前平均CPU使用率::{cpu_avgPercent}% 大于目标范围最大值:{self._cpu_maxBusyPercent}% 增加{pct_add}% CPU性能上限 增加后的性能上限:{new_pct}%"
                    )
            # 判断cpu占用率 过低时认定cpu富余 降低性能百分比
            elif cpu_avgPercent <= self._cpu_minBusyPercent:
                pct_sub = self._cpu_addPctBase
                new_pct = max(30, self._current_pct - pct_sub)  # 保持最低 30% 性能
                if new_pct != self._current_pct:
                    self.Set_cpuMaxPct(new_pct)
                    logger.debug(
                        f"当前平均CPU使用率::{cpu_avgPercent}% 小于目标范围最小值:{self._cpu_minBusyPercent}% 降低{pct_sub}% CPU性能上限 降低后的性能上限:{new_pct}%"
                    )
            # 不做任何调整
            else:
                logger.debug(
                    f"当前平均CPU使用率::{cpu_avgPercent}% 处于目标范围{self._cpu_minBusyPercent}%-{self._cpu_maxBusyPercent}% 无需修改CPU性能上限 当前的性能上限:{self._current_pct}%"
                )
        except Exception as e:
            logger.error(e)

    def isRunning(self) -> bool:
        return self._isRunning

    def run(self):
        logger.info("开始自动优化CPU性能上限:" + self.name)
        adjust_count = 0
        self._isRunning = True
        while True:
            try:
                if not self._cpu_enableAutoMaxFreq:
                    self._isRunning = False
                    logger.debug("退出自动优化CPU性能上限：" + self.name)
                    break
                if not sysInfo.has_cpuData:
                    self.CPU_enableAutoMaxFreq(False)
                    self.Set_cpuMaxPct(100)  # 退出时恢复到 100% 性能
                    self._isRunning = False
                    logger.debug("退出自动优化CPU性能上限：" + self.name)
                    break
                adjust_count = adjust_count + 1
                if adjust_count >= int(
                    self._cpu_adjustFreqInterval / self._cpu_autoFreqCheckInterval
                ):
                    self.optimization_CPUFreq()
                    adjust_count = 0
                time.sleep(self._cpu_autoFreqCheckInterval)
            except Exception as e:
                logger.error(e)
                time.sleep(self._cpu_autoFreqCheckInterval)


class CPUManager:
    """CPU管理器类，提供CPU相关的控制和监控功能。

    该类提供了对CPU的全面控制，包括：
    - TDP（热设计功耗）控制
    - CPU核心启用/禁用
    - SMT（超线程）控制
    - CPU频率管理
    - CPU Boost控制

    Attributes:
        cpu_boost (bool): CPU Boost状态
        cpu_smt (bool): SMT（超线程）状态
        enable_cpu_num (int): 启用的CPU核心数
        cpu_maxNum (int): 最大CPU核心数
        cpu_tdpMax (int): 最大TDP值（瓦特）
        cpu_avaFreq (List[int]): 可用的CPU频率列表
        cpu_avaMaxFreq (int): 最大可用频率
        cpu_avaMinFreq (int): 最小可用频率
        cpu_nowLimitFreq (int): 当前频率限制
        cpu_topology (CPUTopology): CPU拓扑信息，包含完整的硬件拓扑和频率信息
    """

    def __init__(self) -> None:
        """初始化CPU管理器。

        初始化过程包括：
        1. 设置默认属性值
        2. 获取CPU拓扑信息
        3. 检测SMT支持
        4. 获取最大CPU核心数
        """
        # CPU状态相关属性
        self.cpu_boost: bool = True
        self.cpu_smt: bool = True
        self.enable_cpu_num: int = 4
        self.cpu_maxNum: int = 0
        self.cpu_tdpMax: int = 15
        self.cpu_avaFreq: List[int] = []
        self.cpu_avaMaxFreq: int = 1600000
        self.cpu_avaMinFreq: int = 1600000
        self.cpu_nowLimitFreq: int = 0

        # 新的拓扑系统（替代原来的字典）
        self.cpu_topology: CPUTopology = None
        self.cps_ids: List[int] = []  # 保持兼容性
        self.is_support_smt: Optional[bool] = None

        # CPU自动优化线程
        self._cpuAutoMaxFreqManager = None

        # 初始化CPU信息
        self.__init_cpu_info()

    def __init_cpu_info(self) -> None:
        """初始化CPU信息 - 使用新拓扑系统"""
        self.set_enable_All()  # 先开启所有cpu, 否则拓扑信息不全
        self.set_cpuBoost(True)  # 先开启cpu boost, 否则频率信息范围不准确
        self.get_isSupportSMT()  # 获取 is_support_smt
        # self.__get_tdpMax()  # 获取 cpu_tdpMax

        # 获取新的拓扑信息
        self.cpu_topology = self.get_cpu_topology_extended()

        # 保持现有属性的兼容性
        self.cps_ids = self.cpu_topology.get_physical_core_ids()
        self.cpu_maxNum = self.cpu_topology.get_physical_core_count()

        # 更新频率范围信息
        min_freq, max_freq = self.cpu_topology.get_max_freq_range()
        if min_freq > 0:
            self.cpu_avaMinFreq = min_freq
        if max_freq > 0:
            self.cpu_avaMaxFreq = max_freq

        logger.info(
            f"CPU拓扑信息: 逻辑CPU数={len(self.cpu_topology.cores)}, 物理核心数={self.cpu_maxNum}"
        )
        logger.info(f"物理核心ID: {self.cps_ids}")
        logger.info(f"频率范围: {min_freq}-{max_freq} kHz")

        # 打印详细拓扑信息（调试用）
        logical_by_core = self.cpu_topology.get_logical_ids_by_physical_core()
        for core_id in sorted(logical_by_core.keys()):
            logical_ids = logical_by_core[core_id]
            logger.debug(f"物理核心{core_id}: 逻辑CPU {logical_ids}")

        # 🔥 新增：硬件检测增强
        self._init_hardware_detection()

    def _init_hardware_detection(self):
        """初始化硬件检测功能"""
        try:
            self.detector = create_cpu_detector()
            self.hw_analysis = self.detector.get_detailed_analysis()
            logger.info(f"CPU硬件检测完成: {self.get_cpu_architecture_summary()}")
            logger.info(
                f"CPU硬件检测详细信息: {json.dumps(self.hw_analysis, indent=2)}"
            )
        except Exception as e:
            logger.warning(f"硬件检测失败，使用传统方法: {e}")
            self.detector = None
            self.hw_analysis = {}

    def get_hasRyzenadj(self) -> bool:
        """检查系统是否安装了ryzenadj工具。

        Returns:
            bool: True如果ryzenadj可用，否则False
        """
        try:
            # 查看ryzenadj路径是否有该文件
            if os.path.exists(RYZENADJ_PATH) or os.path.exists("/usr/bin/ryzenadj"):
                logger.info("get_hasRyzenadj {}".format(True))
                return True
            else:
                logger.info("get_hasRyzenadj {}".format(False))
                return False
        except Exception:
            logger.error("Failed to check ryzenadj tool", exc_info=True)
            return False

    def get_cpuMaxNum_old(self) -> int:
        """获取最大CPU核心数。

        Returns:
            int: 最大CPU核心数
        """
        try:
            cpu_path = "/sys/devices/system/cpu"
            cpu_index = 0
            # 循环查找cpu*文件夹，根据找到的文件夹数量确定cpu最大数量
            while True:
                cpu_dir = "{}/cpu{}".format(cpu_path, cpu_index)
                if os.path.exists(cpu_dir):
                    cpu_index = cpu_index + 1
                else:
                    break
            if self.is_support_smt:
                # 去掉超线程部分，物理核心只有cpu文件夹数量的一半
                self.cpu_maxNum = int(cpu_index / 2)
            else:
                self.cpu_maxNum = cpu_index
            logger.info("get_cpuMaxNum {}".format(self.cpu_maxNum))
            return self.cpu_maxNum
        except Exception:
            logger.error("Failed to get max CPU cores", exc_info=True)
            return 0

    def get_cpuMaxNum(self) -> int:
        return self.cpu_maxNum

    def get_tdpMax(self) -> int:
        """获取最大TDP值。

        Returns:
            int: 最大TDP值（瓦特）
        """
        self.cpu_tdpMax = getMaxTDP(0)
        if self.cpu_tdpMax == 0:
            logger.info("get_tdpMax by config: 0, get from hardware")
            if self.is_intel():
                self.cpu_tdpMax = self.get_cpuTDP_Intel()
            elif self.is_amd():
                self.cpu_tdpMax = self.get_cpuTDP_AMD()
            else:
                self.cpu_tdpMax = 0

        logger.info(f"get_tdpMax: {self.cpu_tdpMax}")
        return self.cpu_tdpMax

    def get_cpuTDP_Intel(self) -> int:
        """获取Intel CPU最大TDP值。

        Returns:
            int: Intel CPU最大TDP值
        """
        logger.info("get tdpMax by intel rapl path")
        _, __, rapl_max = self.__get_intel_rapl_path()
        if rapl_max == "":
            logger.error("Failed to get Intel CPU TDP: RAPL path not found")
            return getMaxTDP(15)
        with open(rapl_max, "r") as file:
            tdp = int(file.read().strip())
            logger.info(f"get_cpuTDP_Intel: {tdp/1000000}")
            return int(tdp / 1000000)

    def get_cpuTDP_AMD(self) -> int:
        """获取AMD CPU最大TDP值。

        Returns:
            int: AMD CPU最大TDP值
        """
        logger.info("get tdpMax by amd ryzenadj")
        # 使用 ryzenadj 设置 200w 的 stapm-limit， 然后使用 ryzenadj -i 获取实际设置的 STAPM LIMIT， 保留整数
        try:
            subprocess.run(["ryzenadj", "-a", "200000"], check=True, timeout=3, env=get_env())
            process = subprocess.run(
                ["ryzenadj", "-i"],
                check=True,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=3,
                env=get_env(),
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logger.error(stderr)
            if stdout:
                # "| STAPM LIMIT" 开头的行
                stdout = stdout.splitlines()
                for line in stdout:
                    if line.startswith("| STAPM LIMIT"):
                        arrays = line.split("|")
                        # float arrays[2] to int
                        tdp = int(float(arrays[2]))
                        logger.info(f"get_cpuTDP_AMD: {tdp}")
                        return tdp
        except subprocess.TimeoutExpired:
            logger.error("get_cpuTDP_AMD: ryzenadj command timeout")
            return getMaxTDP(15)
        except Exception as e:
            logger.error(f"get_cpuTDP_AMD: failed to get tdp {e}", exc_info=True)
            return getMaxTDP(15)

    # 弃用
    def get_cpu_AvailableFreq(self) -> List[int]:
        """获取可用的CPU频率列表。

        Returns:
            List[int]: 可用的CPU频率列表
        """
        try:
            # 当前已有cpu频率列表，直接返回
            if len(self.cpu_avaFreq) > 0:
                return self.cpu_avaFreq
            # 获取可用的cpu频率列表
            command = "sudo sh {} get_cpu_AvailableFreq ".format(SH_PATH)
            cpu_avaFreqRes = subprocess.getoutput(command)
            # 按空格分割获取的结果并且化为int存入
            cpu_avaFreqStr = cpu_avaFreqRes.split()
            for index in cpu_avaFreqStr:
                self.cpu_avaFreq.append(int(index))
            # 列表不为空时，先排序，最小值取第一个，最大值取倒数第一个
            if len(self.cpu_avaFreq) >= 1:
                self.cpu_avaFreq.sort()
                self.cpu_avaMinFreq = self.cpu_avaFreq[0]
                self.cpu_avaMaxFreq = self.cpu_avaFreq[len(self.cpu_avaFreq) - 1]
            logger.info(
                f"cpu_avaFreqData={[self.cpu_avaFreq, self.cpu_avaMinFreq, self.cpu_avaMaxFreq]}"
            )
            return self.cpu_avaFreq
        except Exception:
            logger.error("Failed to get available CPU frequencies", exc_info=True)
            return []

    def set_cpuTDP(self, value: int) -> bool:
        """设置CPU TDP值。

        Args:
            value (int): TDP值（瓦特）

        Returns:
            bool: True如果设置成功，否则False
        """
        if self.is_intel():
            return self.set_cpuTDP_Intel(value)
        elif self.is_amd():
            return self.set_cpuTDP_AMD(value)
        else:
            logger.error("set_cpuTDP error: unknown CPU_VENDOR")
            return False

    def set_cpuTDP_unlimited(self) -> bool:
        """设置CPU TDP 为最大值。"""
        logger.info(f"set_cpuTDP_unlimited {self.cpu_tdpMax}")
        return self.set_cpuTDP(int(self.cpu_tdpMax))

    def is_intel(self):
        return CPU_VENDOR == "GenuineIntel"

    def is_amd(self):
        return CPU_VENDOR == "AuthenticAMD"

    def __get_legacy_intel_rapl_path(self) -> Tuple[str, str]:
        """获取Intel RAPL路径。

        Returns:
            Tuple[str, str]: RAPL路径
        """
        rapl_path = ""
        rapl_long = ""
        rapl_short = ""
        rapl_max = ""
        try:
            # 遍历 /sys/class/powercap/intel-rapl/intel-rapl:*/ 如果 name 是 package-0 则是cpu
            for r_path in glob.glob("/sys/class/powercap/intel-rapl/intel-rapl:?"):
                if os.path.isdir(r_path):
                    name_path = os.path.join(r_path, "name")
                    with open(name_path, "r") as file:
                        name = file.read().strip()
                    if name == "package-0":
                        rapl_path = r_path
                        break
            for f in glob.glob(f"{rapl_path}/constraint_?_name"):
                if os.path.isfile(f):
                    with open(f, "r") as file:
                        name = file.read().strip()
                    if name == "short_term":
                        rapl_short = f.replace("_name", "_power_limit_uw")
                    elif name == "long_term":
                        rapl_long = f.replace("_name", "_power_limit_uw")
                        rapl_max = f.replace("_name", "_max_power_uw")
            return rapl_long, rapl_short, rapl_max
        except Exception:
            logger.error("Failed to get Intel RAPL path", exc_info=True)
            return "", "", ""

    def __get_intel_rapl_path(self) -> Tuple[str, str]:
        """获取Intel RAPL路径。

        Returns:
            Tuple[str, str]: RAPL路径
        """
        rapl_path = ""
        rapl_long = ""
        rapl_short = ""
        rapl_max = ""
        try:
            # 遍历 /sys/class/powercap/intel-rapl-mmio/intel-rapl-mmio:*/ 如果 name 是 package-0 则是cpu
            for r_path in glob.glob("/sys/class/powercap/intel-rapl/intel-rapl:?"):
                if os.path.isdir(r_path):
                    name_path = os.path.join(r_path, "name")
                    with open(name_path, "r") as file:
                        name = file.read().strip()
                    if name == "package-0":
                        rapl_path = r_path
                        break
            for f in glob.glob(f"{rapl_path}/constraint_?_name"):
                if os.path.isfile(f):
                    with open(f, "r") as file:
                        name = file.read().strip()
                    if name == "short_term":
                        rapl_short = f.replace("_name", "_power_limit_uw")
                    elif name == "long_term":
                        rapl_long = f.replace("_name", "_power_limit_uw")
                        rapl_max = f.replace("_name", "_max_power_uw")
            return rapl_long, rapl_short, rapl_max
        except Exception:
            logger.error("Failed to get Intel RAPL path", exc_info=True)
            return "", "", ""

    def set_cpuTDP_Intel(self, value: int) -> bool:
        """设置Intel CPU TDP值。

        Args:
            value (int): TDP值（瓦特）

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            # 遍历 /sys/class/powercap/intel-rapl/*/ 如果 name 是 package-0 则是cpu
            logger.debug("set_cpuTDP_Intel {}".format(value))
            tdp = int(value * 1000000)
            tdp_short = int((value + 2) * 1000000)
            # tdp_short = tdp
            rapl_long, rapl_short, _ = self.__get_intel_rapl_path()
            legacy_rapl_long, legacy_rapl_short, _ = self.__get_legacy_intel_rapl_path()
            if (rapl_long == "" or rapl_short == "") and (
                legacy_rapl_long == "" or legacy_rapl_short == ""
            ):
                logger.error("Failed to set Intel CPU TDP: RAPL path not found")
                return False
            with open(rapl_long, "w") as file:
                logger.debug(f"set_cpuTDP_Intel {rapl_long} {tdp}")
                file.write(str(tdp))
            with open(rapl_short, "w") as file:
                logger.debug(f"set_cpuTDP_Intel {rapl_short} {tdp_short}")
                file.write(str(tdp_short))
            with open(legacy_rapl_long, "w") as file:
                logger.debug(f"set_cpuTDP_Intel {legacy_rapl_long} {tdp}")
                file.write(str(tdp))
            with open(legacy_rapl_short, "w") as file:
                logger.debug(f"set_cpuTDP_Intel {legacy_rapl_short} {tdp_short}")
                file.write(str(tdp_short))
            return True

        except Exception:
            logger.error(f"Failed to set Intel CPU TDP: value={value}", exc_info=True)
            return False

    def set_cpuTDP_AMD(self, value: int) -> bool:
        """设置AMD CPU TDP值。

        Args:
            value (int): TDP值（瓦特）

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            if value >= 3:
                tdp = value * 1000
                sys_ryzenadj_path = get_ryzenadj_path()

                stapm_limit = tdp
                fast_minit = tdp
                slow_limit = tdp
                tctl_temp = 90

                command = f"{sys_ryzenadj_path} -a {stapm_limit} -b {fast_minit} -c {slow_limit} -f {tctl_temp}"
                command_args = command.split()
                logger.debug(f"set_cpuTDP command: {command}")
                logger.debug(f"set_cpuTDP {value}")
                process = subprocess.run(
                    command_args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=3,
                    env=get_env(),
                )
                stdout, stderr = process.stdout, process.stderr
                logger.debug(f"set_cpuTDP result:\n{stdout}")
                if stderr:
                    logger.error(f"Failed to set AMD CPU TDP:\n{stderr}")
                    return False

                return True
            else:
                logger.error(
                    f"Failed to set AMD CPU TDP: value less than 3W (value={value})"
                )
                return False
        except subprocess.TimeoutExpired:
            logger.error(f"Failed to set AMD CPU TDP: timeout (value={value})")
        except Exception:
            logger.error(f"Failed to set AMD CPU TDP: value={value}", exc_info=True)
            return False

    def set_cpuOnline(self, value: int) -> bool:
        """设置CPU在线状态 - 使用新拓扑系统

        Args:
            value (int): CPU在线状态

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logger.info(f"set_cpuOnline {value} (总物理核心数: {self.cpu_maxNum})")
            self.enable_cpu_num = value

            # 使用新的拓扑方法，更加准确
            cpu_topology_by_core = self.cpu_topology.get_logical_ids_by_physical_core()

            # 核心数逻辑 - 基于实际物理核心
            core_ids = sorted(cpu_topology_by_core.keys())
            cores_to_keep = core_ids[: self.enable_cpu_num]
            cores_to_offline = core_ids[self.enable_cpu_num :]

            if len(cores_to_keep) == 0:
                logger.error(f"set_cpuOnline error: cores_to_keep is empty")
                return False

            logger.info(f"保留核心: {cores_to_keep}")
            logger.info(f"关闭核心: {cores_to_offline}")

            # 计算需要关闭的逻辑CPU
            to_offline = set()

            # 添加要关闭的物理核心的所有逻辑CPU
            for core_id in cores_to_offline:
                logical_cpus = cpu_topology_by_core[core_id]
                logger.info(f"关闭物理核心{core_id}的逻辑CPU: {logical_cpus}")
                to_offline.update(logical_cpus)

            # SMT逻辑 - 基于实际拓扑关系，修复原有错误
            if not self.cpu_smt:
                for core_id in cores_to_keep:
                    logical_cpus = cpu_topology_by_core[core_id]
                    if len(logical_cpus) > 1:
                        # 使用拓扑信息确定主线程（通常是编号最小的）
                        main_thread = min(logical_cpus)
                        smt_threads = [
                            cpu for cpu in logical_cpus if cpu != main_thread
                        ]
                        logger.info(
                            f"物理核心{core_id}: 保留主线程{main_thread}, 关闭SMT线程{smt_threads}"
                        )
                        to_offline.update(smt_threads)

            logger.debug(f"最终关闭的逻辑CPU: {sorted(to_offline)}")

            # 遍历所有实际存在的逻辑CPU
            for logical_id in self.cpu_topology.get_all_logical_ids():
                if logical_id in to_offline:
                    self.offline_cpu(logical_id)
                else:
                    self.online_cpu(logical_id)

            return True
        except Exception:
            logger.error(
                f"Failed to set CPU online status: value={value}", exc_info=True
            )
            return False

    def set_enable_All(self) -> bool:
        """启用所有CPU核心。

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logger.debug("set_enable_All")
            cpu_path = "/sys/devices/system/cpu/"
            cpu_pattern = re.compile(r"^cpu(\d+)$")

            for cpu_dir in os.listdir(cpu_path):
                match = cpu_pattern.match(cpu_dir)
                if match:
                    cpu_number = match.group(1)
                    self.online_cpu(int(cpu_number))
            return True
        except Exception:
            logger.error("Failed to enable all CPU cores", exc_info=True)
            return False

    # 不能在cpu offline 之后进行判断，会不准确
    def get_isSupportSMT(self) -> bool:
        """检查系统是否支持SMT - 使用拓扑信息改进

        Returns:
            bool: True如果支持SMT，否则False
        """
        try:
            if self.is_support_smt is not None:
                return self.is_support_smt

            # 方法1：使用拓扑信息检查（如果已初始化）
            if self.cpu_topology:
                self.is_support_smt = self.cpu_topology.is_smt_supported()
                logger.info(f"通过拓扑信息检测SMT支持: {self.is_support_smt}")
                return self.is_support_smt

            # 方法2：使用lscpu命令（备用方法）
            command = (
                "LANG=en_US.UTF-8 lscpu | grep 'Thread(s) per core' | awk '{print $4}'"
            )
            process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=3,
                env=get_env(),
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logger.error(f"Failed to check SMT support:\n{stderr}")
                self.is_support_smt = False
            else:
                threads_per_core = int(stdout.strip()) if stdout.strip() else 1
                self.is_support_smt = threads_per_core > 1
                logger.info(
                    f"通过lscpu检测SMT支持: {self.is_support_smt} (每核心线程数: {threads_per_core})"
                )

        except Exception:
            logger.error("Failed to check SMT support", exc_info=True)
            self.is_support_smt = False

        return self.is_support_smt

    def set_smt(self, value: bool) -> bool:
        """设置SMT状态。

        Args:
            value (bool): SMT状态

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            if not self.get_isSupportSMT():
                logger.debug("Failed to set SMT: system does not support SMT")
                return False
            logger.debug(f"set_smt {value}")
            self.cpu_smt = value
            return True
        except Exception:
            logger.error(f"Failed to set SMT: value={value}", exc_info=True)
            return False

    def set_cpuBoost(self, value: bool) -> bool:
        """设置CPU Boost状态。

        Args:
            value (bool): CPU Boost状态

        Returns:
            bool: True如果设置成功，否则False
        """
        boost_path = "/sys/devices/system/cpu/cpufreq/boost"

        # amd
        amd_pstate_dir = "/sys/devices/system/cpu/amd_pstate"
        pstate_boost_path = f"{amd_pstate_dir}/cpb_boost"
        amd_state_path = f"{amd_pstate_dir}/status"

        # intel
        hwp_dynamic_boost_path = (
            "/sys/devices/system/cpu/intel_pstate/hwp_dynamic_boost"
        )
        no_turbo_path = "/sys/devices/system/cpu/intel_pstate/no_turbo"

        try:
            logger.debug(f"set_cpuBoost {value}")
            self.cpu_boost = value

            # 如果不存在 pstate_boost_path
            # if not os.path.exists(pstate_boost_path):
            #     # 切换为 passive 模式
            #     if os.path.exists(amd_state_path) and os.path.exists(amd_pstate_dir):
            #         open(amd_state_path, "w").write("passive")

            # 设置 boost
            if os.path.exists(boost_path):
                with open(boost_path, "w") as file:
                    if self.cpu_boost:
                        file.write("1")
                    else:
                        file.write("0")

            # 设置 pstate_boost
            if os.path.exists(pstate_boost_path):
                with open(pstate_boost_path, "w") as file:
                    if self.cpu_boost:
                        file.write("1")
                    else:
                        file.write("0")

            # 设置 hwp_dynamic_boost
            if os.path.exists(hwp_dynamic_boost_path):
                with open(hwp_dynamic_boost_path, "w") as file:
                    file.write("1")

            # 设置 no_turbo
            if os.path.exists(no_turbo_path):
                with open(no_turbo_path, "w") as file:
                    if self.cpu_boost:
                        file.write("0")
                    else:
                        file.write("1")

            return True
        except Exception as e:
            logger.error(traceback.format_exc())
            logger.error(e)
            return False

    def check_cpuFreq(self) -> bool:
        """检查CPU频率是否低于限制频率 - 修复SMT假设错误

        Returns:
            bool: True如果频率低于限制频率，否则False
        """
        try:
            logger.debug(f"check_cpuFreq cpu_nowLimitFreq = {self.cpu_nowLimitFreq}")
            if self.cpu_nowLimitFreq == 0:
                return False

            # 获取当前在线的逻辑CPU（修复：不再假设CPU编号连续）
            online_cpus = self.get_online_logical_cpus()
            logger.debug(f"检查频率的在线CPU: {online_cpus}")

            # 检查在线CPU的频率
            for cpu_id in online_cpus:
                try:
                    current_freq = self.get_cpu_current_freq(cpu_id)
                    if current_freq > self.cpu_nowLimitFreq:
                        logger.debug(
                            f"CPU{cpu_id} 频率{current_freq} > 限制{self.cpu_nowLimitFreq}"
                        )
                        return True
                except Exception as e:
                    logger.warning(f"无法读取CPU{cpu_id}频率: {e}")
                    continue

            return False
        except Exception as e:
            logger.error(f"check_cpuFreq error: {e}")
            return False

    def set_cpuFreq(self, value: int) -> bool:
        """设置CPU频率 - 修复SMT和连续性假设错误

        Args:
            value (int): 频率值

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logger.debug(f"set_cpuFreq: 当前限制={self.cpu_nowLimitFreq}, 新值={value}")

            # 频率检查逻辑
            if self.cpu_nowLimitFreq != value:
                need_set = True
                self.cpu_nowLimitFreq = value
            else:
                need_set = self.check_cpuFreq()

            if need_set:
                # 获取所有在线的逻辑CPU（修复：不再使用cpu_maxNum*2假设）
                online_cpus = self.get_online_logical_cpus()
                logger.debug(f"设置频率的在线CPU: {online_cpus}")

                # 先设置到最小频率（如果需要）
                if (
                    self.cpu_nowLimitFreq != self.cpu_avaMinFreq
                    and self.cpu_nowLimitFreq != self.cpu_avaMaxFreq
                ):
                    logger.debug(f"先设置到最小频率: {self.cpu_avaMinFreq}")
                    for cpu_id in online_cpus:
                        command = f"sudo sh {SH_PATH} set_cpu_Freq {cpu_id} {self.cpu_avaMinFreq}"
                        os.system(command)

                # 设置目标频率
                logger.debug(f"设置目标频率: {self.cpu_nowLimitFreq}")
                for cpu_id in online_cpus:
                    command = f"sudo sh {SH_PATH} set_cpu_Freq {cpu_id} {self.cpu_nowLimitFreq}"
                    os.system(command)

                return True
            return False
        except Exception as e:
            logger.error(f"set_cpuFreq error: {e}")
            return False

    def get_cpu_topology_extended(self) -> CPUTopology:
        """获取扩展的CPU拓扑信息（只包含固有硬件属性）"""
        topology = CPUTopology()

        cpu_path = "/sys/devices/system/cpu/"
        cpu_pattern = re.compile(r"^cpu(\d+)$")

        for cpu_dir in os.listdir(cpu_path):
            match = cpu_pattern.match(cpu_dir)
            if match:
                logical_id = int(match.group(1))
                cpu_full_path = os.path.join(cpu_path, cpu_dir)

                # 只读取固有的硬件属性
                core_info = self._read_static_cpu_info(logical_id, cpu_full_path)
                if core_info:
                    topology.add_core(core_info)

        # 填充拓扑关系
        self._populate_topology_relationships(topology)

        return topology

    def _read_static_cpu_info(
        self, logical_id: int, cpu_path: str
    ) -> Optional[CPUCoreInfo]:
        """读取CPU的静态硬件信息"""
        try:
            topology_path = os.path.join(cpu_path, "topology")
            cpufreq_path = os.path.join(cpu_path, "cpufreq")

            # 读取拓扑信息
            core_id = self._read_sysfs_int(os.path.join(topology_path, "core_id"))
            package_id = self._read_sysfs_int(
                os.path.join(topology_path, "physical_package_id")
            )
            cluster_id = self._read_sysfs_int(os.path.join(topology_path, "cluster_id"))
            die_id = self._read_sysfs_int(os.path.join(topology_path, "die_id"))

            # 读取硬件频率范围
            max_freq_hw = self._read_sysfs_int(
                os.path.join(cpufreq_path, "cpuinfo_max_freq")
            )
            min_freq_hw = self._read_sysfs_int(
                os.path.join(cpufreq_path, "cpuinfo_min_freq")
            )

            return CPUCoreInfo(
                logical_id=logical_id,
                core_id=core_id,
                package_id=package_id,
                cluster_id=cluster_id,
                die_id=die_id,
                max_freq_hw=max_freq_hw,
                min_freq_hw=min_freq_hw,
            )
        except Exception as e:
            logger.error(f"Failed to read CPU {logical_id} info: {e}")
            return None

    def _read_sysfs_int(self, path: str) -> int:
        """读取sysfs整数值，失败时返回-1"""
        try:
            if os.path.exists(path):
                with open(path, "r") as f:
                    return int(f.read().strip())
            else:
                logger.debug(f"sysfs path does not exist: {path}")
        except Exception as e:
            logger.debug(f"Failed to read sysfs int from {path}: {e}")
        return -1

    def _populate_topology_relationships(self, topology: CPUTopology):
        """填充拓扑关系信息 - 智能大小核分组"""
        # 1. 按物理核心分组，填充sibling_threads
        logical_by_core = topology.get_logical_ids_by_physical_core()
        for core_id, logical_ids in logical_by_core.items():
            for logical_id in logical_ids:
                core_info = topology.get_core_info(logical_id)
                if core_info:
                    core_info.sibling_threads = logical_ids.copy()

        # 2. 智能cluster分组 - 基于频率特征处理大小核架构
        unique_clusters = set(core.cluster_id for core in topology.cores.values())
        if len(unique_clusters) <= 1 or 65535 in unique_clusters:
            # cluster_id无效(如65535)，使用频率分组
            logger.debug("检测到cluster_id无效，使用频率特征进行大小核分组")

            # 获取所有不同的最大频率
            freq_set = set(
                core.max_freq_hw
                for core in topology.cores.values()
                if core.max_freq_hw > 0
            )
            freq_list = sorted(freq_set, reverse=True)  # 按频率降序

            if len(freq_list) > 1:
                logger.info(
                    f"检测到{len(freq_list)}种频率类型: {[f/1000.0 for f in freq_list]}MHz"
                )

                # 为每个频率类型分配virtual cluster
                freq_to_cluster = {freq: i for i, freq in enumerate(freq_list)}

                cluster_groups = {}
                for logical_id, core in topology.cores.items():
                    if core.max_freq_hw > 0:
                        virtual_cluster = freq_to_cluster[core.max_freq_hw]
                    else:
                        virtual_cluster = 999  # 未知频率

                    if virtual_cluster not in cluster_groups:
                        cluster_groups[virtual_cluster] = []
                    cluster_groups[virtual_cluster].append(logical_id)

                # 填充cluster_cpus并更新cluster_id
                for cluster_id, logical_ids in cluster_groups.items():
                    sorted_logical_ids = sorted(logical_ids)
                    if cluster_id < len(freq_list):
                        freq = freq_list[cluster_id]
                        if freq > 4500000:
                            cluster_type = "P-Core"
                        elif freq > 3000000:
                            cluster_type = "E-Core"
                        else:
                            cluster_type = "LPE-Core"
                        logger.debug(
                            f"Virtual Cluster {cluster_id}: {cluster_type} {freq/1000:.1f}MHz, 逻辑CPU {sorted_logical_ids}"
                        )

                    for logical_id in logical_ids:
                        core_info = topology.get_core_info(logical_id)
                        if core_info:
                            core_info.cluster_cpus = sorted_logical_ids
                            core_info.cluster_id = cluster_id  # 更新为虚拟cluster ID
            else:
                # 只有一种频率，使用原有逻辑
                self._fallback_cluster_grouping(topology)
        else:
            # 使用系统提供的有效cluster_id
            logger.debug("使用系统提供的cluster_id分组")
            self._fallback_cluster_grouping(topology)

        # 3. 按package分组，填充package_cpus
        package_groups = {}
        for logical_id, core in topology.cores.items():
            if core.package_id not in package_groups:
                package_groups[core.package_id] = []
            package_groups[core.package_id].append(logical_id)

        for package_id, logical_ids in package_groups.items():
            for logical_id in logical_ids:
                core_info = topology.get_core_info(logical_id)
                if core_info:
                    core_info.package_cpus = logical_ids.copy()

    def _fallback_cluster_grouping(self, topology: CPUTopology):
        """回退到原有的cluster分组逻辑"""
        cluster_groups = {}
        for logical_id, core in topology.cores.items():
            if core.cluster_id not in cluster_groups:
                cluster_groups[core.cluster_id] = []
            cluster_groups[core.cluster_id].append(logical_id)

        for cluster_id, logical_ids in cluster_groups.items():
            for logical_id in logical_ids:
                core_info = topology.get_core_info(logical_id)
                if core_info:
                    core_info.cluster_cpus = logical_ids.copy()

    def get_cpu_online_status(self, logical_id: int) -> bool:
        """实时获取CPU在线状态"""
        if logical_id == 0:  # CPU0总是在线
            return True
        online_path = f"/sys/devices/system/cpu/cpu{logical_id}/online"
        try:
            if os.path.exists(online_path):
                with open(online_path, "r") as f:
                    return f.read().strip() == "1"
        except:
            pass
        return False

    def get_cpu_current_freq(self, logical_id: int) -> int:
        """实时获取CPU当前频率"""
        freq_path = f"/sys/devices/system/cpu/cpu{logical_id}/cpufreq/scaling_cur_freq"
        try:
            if os.path.exists(freq_path):
                with open(freq_path, "r") as f:
                    return int(f.read().strip())
        except:
            pass
        return 0

    def get_online_logical_cpus(self) -> List[int]:
        """获取当前在线的逻辑CPU列表"""
        online_cpus = []
        if self.cpu_topology:
            for logical_id in self.cpu_topology.get_all_logical_ids():
                if self.get_cpu_online_status(logical_id):
                    online_cpus.append(logical_id)
        return online_cpus

    def get_cpu_topology(self) -> Dict[int, int]:
        """保持向后兼容的拓扑接口

        Returns:
            Dict[int, int]: CPU拓扑信息，键为逻辑处理器ID，值为物理核心ID
        """
        if self.cpu_topology:
            return {
                logical_id: core.core_id
                for logical_id, core in self.cpu_topology.cores.items()
            }
        return {}

    def offline_cpu(self, cpu_number: int) -> None:
        """关闭CPU核心。

        Args:
            cpu_number (int): CPU核心号
        """
        if int(cpu_number) == 0:
            return
        cpu_online_path = f"/sys/devices/system/cpu/cpu{cpu_number}/online"
        with open(cpu_online_path, "w") as file:
            file.write("0")

    def online_cpu(self, cpu_number: int) -> None:
        """启用CPU核心。

        Args:
            cpu_number (int): CPU核心号
        """
        if int(cpu_number) == 0:
            return
        cpu_online_path = f"/sys/devices/system/cpu/cpu{cpu_number}/online"
        with open(cpu_online_path, "w") as file:
            file.write("1")

    def set_cpu_online(self, cpu_number: int, online: bool) -> None:
        """设置CPU核心状态。

        Args:
            cpu_number (int): CPU核心号
            online (bool): 核心状态
        """
        if online:
            self.online_cpu(cpu_number)
        else:
            self.offline_cpu(cpu_number)

    def get_ryzenadj_info(self) -> str:
        """获取Ryzenadj信息。

        Returns:
            str: Ryzenadj信息
        """
        try:
            sys_ryzenadj_path = get_ryzenadj_path()
            command = f"{sys_ryzenadj_path} -i"
            process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=3,
                env=get_env(),
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr and stdout == "":
                logger.error(f"get_ryzenadj_info error:\n{stderr}")
                return f"get_ryzenadj_info error:\n{stderr}"
            else:
                return stdout
        except subprocess.TimeoutExpired:
            logger.error("get_ryzenadj_info timeout")
            return "get_ryzenadj_info error: timeout"
        except Exception as e:
            logger.error(e)
            return f"get_ryzenadj_info error:\n{e}"

    def set_ryzenadj_undervolt(self, value: int) -> bool:
        """设置 RyzenAdj CPU 降压值。

        Args:
            value (int): 降压值 (0-30)

        Returns:
            bool: True 如果设置成功，否则 False
        """
        if self.is_intel():
            logger.warning("Intel 平台不支持 RyzenAdj 降压")
            return False

        if not (0 <= value <= 30):
            logger.error(f"降压值 {value} 超出范围 (0-30)")
            return False

        try:
            baseline = 0x100000
            sys_ryzenadj_path = get_ryzenadj_path()
            command = f"{sys_ryzenadj_path} --set-coall={hex(baseline - value)}"

            logger.info(f"设置 RyzenAdj 降压: {command}")

            process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=3,
                env=get_env(),
            )

            stdout, stderr = process.stdout, process.stderr

            if process.returncode == 0:
                logger.info(f"降压设置成功: value={value}, hex={hex(baseline - value)}")
                return True
            else:
                logger.error(f"降压设置失败: {stderr}")
                return False

        except subprocess.TimeoutExpired:
            logger.error("设置降压超时")
            return False
        except Exception as e:
            logger.error(f"设置降压异常: {e}", exc_info=True)
            return False

    def check_ryzenadj_coall_support(self) -> bool:
        """检测设备是否支持 RyzenAdj 降压功能。

        Returns:
            bool: True 如果支持降压，否则 False
        """
        if self.is_intel():
            logger.info("Intel 平台不支持 RyzenAdj 降压")
            return False

        try:
            # 尝试设置 0 值来测试是否支持
            logger.info("检测 RyzenAdj 降压支持情况...")
            result = self.set_ryzenadj_undervolt(0)
            logger.info(f"降压支持检测结果: {result}")
            return result
        except Exception as e:
            logger.error(f"检测降压支持时发生异常: {e}", exc_info=True)
            return False

    def apply_ryzenadj_undervolt(self, enable: bool, value: int) -> bool:
        """应用 RyzenAdj 降压设置。
        
        Args:
            enable (bool): 是否启用降压
            value (int): 降压值 (0-30)
        
        Returns:
            bool: True 如果应用成功或未启用降压，否则 False
        """
        try:
            if not enable:
                logger.debug("降压功能未启用，设置为 0")
                return self.set_ryzenadj_undervolt(0)
            
            if not isinstance(value, int) or not (0 <= value <= 30):
                logger.warning(f"降压值无效: {value}，跳过应用")
                return True
            
            logger.info(f"应用降压设置: enabled={enable}, value={value}")
            return self.set_ryzenadj_undervolt(value)
        
        except Exception as e:
            logger.error(f"应用降压设置时发生异常: {e}", exc_info=True)
            return False

    def get_rapl_info(self) -> str:
        """获取RAPL信息。

        Returns:
            str: RAPL信息
        """
        rapl_base_path = "/sys/class/powercap/intel-rapl:0"
        # if os.path.exists("/sys/class/powercap/intel-rapl/intel-rapl-mmio:0"):
        #     rapl_base_path = "/sys/class/powercap/intel-rapl-mmio/intel-rapl-mmio:0"

        rapl_info = {}

        for file in os.listdir(rapl_base_path):
            # 是文件并且可读
            if os.path.isfile(os.path.join(rapl_base_path, file)) and os.access(
                os.path.join(rapl_base_path, file), os.R_OK
            ):
                try:
                    with open(os.path.join(rapl_base_path, file), "r") as file:
                        rapl_info[file.name] = file.read().strip()
                except Exception as e:
                    logger.debug(f"get_rapl_info error: {e}")

        # sort by key
        rapl_info = dict(sorted(rapl_info.items(), key=lambda x: x[0]))

        logger.info(f"rapl_info: {rapl_info}")

        rapl_info_str = ""
        for key, value in rapl_info.items():
            rapl_info_str += f"{key}: {value}\n"

        logger.info(f"rapl_info_str: {rapl_info_str}")
        return rapl_info_str

    def get_max_perf_pct(self) -> int:
        """获取最大性能百分比。

        Returns:
            int: 最大性能百分比
        """
        max_perf_pct_path = "/sys/devices/system/cpu/intel_pstate/max_perf_pct"
        if os.path.exists(max_perf_pct_path):
            with open(max_perf_pct_path, "r") as file:
                return int(file.read().strip())
        else:
            return 0

    def set_max_perf_pct(self, value: int) -> bool:
        """设置最大性能百分比。

        Args:
            value (int): 最大性能百分比

        Returns:
            bool: True如果设置成功，否则False
        """
        max_perf_pct_path = "/sys/devices/system/cpu/intel_pstate/max_perf_pct"
        try:
            if value < 10 or value > 100:
                return False
            if os.path.exists(max_perf_pct_path):
                with open(max_perf_pct_path, "w") as file:
                    file.write(str(value))
                return True
            else:
                return False
        except Exception as e:
            logger.error(e)
            return False

    def set_auto_cpumax_pct(self, value: bool) -> bool:
        """设置自动调整CPU最大性能百分比。

        Args:
            value (bool): True启用,False禁用

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logger.debug(f"set_cpuMaxAuto  isAuto: {value}")
            # 判断是否已经有自动频率管理
            if (
                self._cpuAutoMaxFreqManager is None
                or not self._cpuAutoMaxFreqManager.isRunning()
            ):
                # 没有管理器或者当前管理器已经停止运行，则实例化一个并开启
                if value:
                    self._cpuAutoMaxFreqManager = CPUAutoMaxFreqManager(self)
                    self._cpuAutoMaxFreqManager.CPU_enableAutoMaxFreq(True)
            else:
                # 有管理器且管理器正在运行，则直接关闭当前的管理器
                if not value:
                    self._cpuAutoMaxFreqManager.CPU_enableAutoMaxFreq(False)
                    self._cpuAutoMaxFreqManager = None

        except Exception as e:
            logger.error(e)
            return False

    def get_cpu_governor(self) -> str:
        """获取当前 CPU 调度器。

        Returns:
            str: 当前的 CPU 调度器名称，如果获取失败则返回空字符串
        """
        try:
            governor_path = "/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"
            if os.path.exists(governor_path):
                with open(governor_path, "r") as f:
                    return f.read().strip()
            return ""
        except Exception as e:
            logger.error(f"获取 CPU 调度器失败: {e}")
            return ""

    def set_cpu_governor(self, governor: str) -> bool:
        """设置 CPU 调度器。

        Args:
            governor (str): 调度器名称

        Returns:
            bool: 设置成功返回 True，否则返回 False
        """
        try:
            if governor not in self.get_available_governors():
                logger.error(f"governor {governor} not available")
                return False

            success = False
            for cpu_id in self.get_online_cpus():
                logger.debug(f"set_cpu_governor {cpu_id} {governor}")
                governor_path = (
                    f"/sys/devices/system/cpu/cpu{cpu_id}/cpufreq/scaling_governor"
                )
                if os.path.exists(governor_path):
                    with open(governor_path, "w") as f:
                        f.write(governor)
                    success = True

            return success
        except Exception as e:
            logger.error(f"设置 CPU 调度器失败: {str(e)}")
            return False

    def get_available_governors(self) -> List[str]:
        """获取系统支持的所有 CPU 调度器。

        Returns:
            List[str]: 可用的调度器列表，如果获取失败则返回空列表
        """
        try:
            governor_path = (
                "/sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors"
            )
            if os.path.exists(governor_path):
                with open(governor_path, "r") as f:
                    governors = f.read().strip().split()
                    return governors
            return []
        except Exception as e:
            logger.error(f"获取可用 CPU 调度器失败: {e}")
            return []

    def is_epp_supported(self) -> bool:
        """检查系统是否支持 EPP 功能。

        Returns:
            bool: 如果系统支持 EPP 则返回 True，否则返回 False
        """
        try:
            epp_path = "/sys/devices/system/cpu/cpu0/cpufreq/energy_performance_available_preferences"
            return os.path.exists(epp_path)
        except Exception as e:
            logger.error(f"检查 EPP 支持失败: {str(e)}")
            return False

    def get_epp_modes(self) -> List[str]:
        """获取可用的 EPP 模式列表。

        Returns:
            List[str]: 系统支持的 EPP 模式列表，如果不支持或获取失败则返回空列表
        """
        try:
            if not self.is_epp_supported():
                return []

            with open(
                "/sys/devices/system/cpu/cpu0/cpufreq/energy_performance_available_preferences",
                "r",
            ) as f:
                return f.read().strip().split()
        except Exception as e:
            logger.error(f"获取可用 EPP 模式失败: {str(e)}")
            return []

    def get_current_epp(self) -> Optional[str]:
        """获取当前的 EPP 模式。

        Returns:
            Optional[str]: 当前的 EPP 模式，如果不支持或无法获取则返回 None
        """
        try:
            if not self.is_epp_supported():
                return None

            with open(
                "/sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference",
                "r",
            ) as f:
                return f.read().strip()
        except Exception as e:
            logger.error(f"获取 EPP 模式失败: {str(e)}")
            return None

    def get_online_cpus(self) -> List[int]:
        """获取在线的 CPU 核心 ID 列表。

        Returns:
            List[int]: 在线的 CPU ID 列表
        """
        try:
            cpu_pattern = "/sys/devices/system/cpu/cpu[0-9]*"
            cpu_dirs = glob.glob(cpu_pattern)
            cpu_ids = []
            for cpu_dir in cpu_dirs:
                try:
                    cpu_id = int(cpu_dir.split("cpu")[-1])
                    # 检查 CPU 是否在线
                    online_path = f"{cpu_dir}/online"
                    # cpu0 没有 online 文件，默认总是在线
                    if cpu_id == 0 or (
                        os.path.exists(online_path)
                        and open(online_path).read().strip() == "1"
                    ):
                        cpu_ids.append(cpu_id)
                except (ValueError, IOError):
                    continue
            return sorted(cpu_ids)
        except Exception as e:
            logger.error(f"获取在线 CPU 列表失败: {str(e)}")
            return []

    def set_epp(self, mode: str) -> bool:
        """设置 EPP 模式。

        Args:
            mode (str): EPP 模式，可用值可通过 get_epp_modes() 获取

        Returns:
            bool: 设置是否成功
        """
        try:
            if not self.is_epp_supported():
                logger.error("Failed to set EPP mode: system does not support EPP")
                return False

            if mode not in self.get_epp_modes():
                logger.error(f"Failed to set EPP mode: unsupported mode {mode}")
                return False

            current_governor = self.get_cpu_governor()
            if current_governor == "performance" and mode != "performance":
                logger.debug(
                    f"Current governor is performance, cannot set EPP mode to {mode}"
                )
                return False

            success = False
            for cpu_id in self.get_online_cpus():
                logger.debug(f"set_epp {cpu_id} {mode}")
                epp_path = f"/sys/devices/system/cpu/cpu{cpu_id}/cpufreq/energy_performance_preference"
                if os.path.exists(epp_path):
                    with open(epp_path, "w") as f:
                        f.write(mode)
                    success = True

            return success
        except Exception:
            logger.error(f"Failed to set EPP mode: mode={mode}", exc_info=True)
            return False

    # === 新增：硬件检测相关方法 ===

    def get_core_type(self, logical_id: int) -> str:
        """获取CPU核心类型"""
        if not hasattr(self, "hw_analysis") or not self.hw_analysis:
            return "Unknown-Core"

        core_type_mapping = self.hw_analysis.get("core_type_mapping", {})
        for core_type, cpu_list in core_type_mapping.items():
            if logical_id in cpu_list:
                return core_type
        return "Unknown-Core"

    def get_performance_cores(self) -> List[int]:
        """获取高性能核心列表"""
        if not hasattr(self, "hw_analysis") or not self.hw_analysis:
            return list(range(self.cpu_maxNum))  # 回退到所有核心

        core_mapping = self.hw_analysis.get("core_type_mapping", {})
        perf_cores = []
        perf_cores.extend(core_mapping.get("P-Core", []))
        perf_cores.extend(core_mapping.get("Zen-Core", []))
        return sorted(perf_cores)

    def get_efficiency_cores(self) -> List[int]:
        """获取效率核心列表"""
        if not hasattr(self, "hw_analysis") or not self.hw_analysis:
            return []  # 回退：假设没有效率核心

        core_mapping = self.hw_analysis.get("core_type_mapping", {})
        eff_cores = []
        eff_cores.extend(core_mapping.get("E-Core", []))
        eff_cores.extend(core_mapping.get("LPE-Core", []))
        eff_cores.extend(core_mapping.get("Zen-c-Core", []))
        return sorted(eff_cores)

    def is_heterogeneous_cpu(self) -> bool:
        """检测是否为混合架构CPU"""
        if not hasattr(self, "hw_analysis") or not self.hw_analysis:
            return False
        core_types = self.hw_analysis.get("core_types", {})
        return len(core_types) > 1

    def get_cpu_architecture_summary(self) -> str:
        """获取CPU架构摘要"""
        if not hasattr(self, "hw_analysis") or not self.hw_analysis:
            return "Traditional Architecture"

        vendor = self.hw_analysis.get("vendor", "Unknown")
        core_types = self.hw_analysis.get("core_types", {})

        if "Intel" in vendor:
            summary_parts = []
            for core_type, count in core_types.items():
                summary_parts.append(f"{count}×{core_type}")
            return f"Intel Heterogeneous: {' + '.join(summary_parts)}"
        elif "AMD" in vendor:
            summary_parts = []
            for core_type, count in core_types.items():
                summary_parts.append(f"{count}×{core_type}")
            return f"AMD Architecture: {' + '.join(summary_parts)}"
        else:
            return f"Unknown Vendor: {core_types}"

    def _set_cpu_max_freq_direct(self, cpu_id: int, freq: int) -> bool:
        """直接通过sysfs设置单个CPU的最大频率

        Args:
            cpu_id (int): CPU逻辑ID
            freq (int): 目标频率（kHz），0表示恢复硬件最大频率

        Returns:
            bool: 设置是否成功
        """
        try:
            # 频率值验证和修正
            if freq == 0:
                # 0表示恢复到硬件最大频率
                freq = self.cpu_avaMaxFreq
            else:
                # 确保频率在合法范围内
                freq = max(self.cpu_avaMinFreq, min(freq, self.cpu_avaMaxFreq))

            # 直接写入sysfs文件
            scaling_max_freq_path = (
                f"/sys/devices/system/cpu/cpu{cpu_id}/cpufreq/scaling_max_freq"
            )
            with open(scaling_max_freq_path, "w") as f:
                f.write(str(freq))

            logger.debug(f"CPU{cpu_id}最大频率已设置为 {freq}kHz")
            return True

        except (FileNotFoundError, PermissionError) as e:
            logger.error(f"设置CPU{cpu_id}频率失败，文件访问错误: {e}")
            return False
        except Exception as e:
            logger.error(f"设置CPU{cpu_id}频率失败: {e}")
            return False

    def set_cpu_freq_by_core_type(self, freq_config: Dict[str, int]) -> bool:
        """按核心类型设置CPU最大频率

        Args:
            freq_config (Dict[str, int]): 核心类型到频率的映射，例如:
                {'P-Core': 4000000, 'E-Core': 2500000}
                {'Zen-Core': 5000000, 'Zen-c-Core': 3300000}
                频率单位为kHz，值为0表示恢复该类型核心的硬件最大频率

        Returns:
            bool: 设置是否成功（至少一个CPU设置成功即返回True）

        Examples:
            # Intel三核心类型精确控制
            cpuManager.set_cpu_freq_by_core_type({
                'P-Core': 4500000,
                'E-Core': 3200000,
                'LPE-Core': 2000000
            })

            # AMD大小核控制
            cpuManager.set_cpu_freq_by_core_type({
                'Zen-Core': 5000000,
                'Zen-c-Core': 3300000
            })

            # 部分核心限制
            cpuManager.set_cpu_freq_by_core_type({'P-Core': 3000000})
        """
        try:
            # 参数验证
            if not freq_config or not isinstance(freq_config, dict):
                logger.error("freq_config参数必须是非空字典")
                return False

            # 获取核心类型映射
            if not hasattr(self, "hw_analysis") or not self.hw_analysis:
                logger.error("硬件检测信息不可用，无法按核心类型设置频率")
                return False

            core_type_mapping = self.hw_analysis.get("core_type_mapping", {})
            if not core_type_mapping:
                logger.error("核心类型映射信息不可用")
                return False

            # 获取在线CPU列表
            online_cpus = self.get_online_logical_cpus()
            if not online_cpus:
                logger.error("没有检测到在线CPU")
                return False

            # 执行频率设置
            success_count = 0
            total_count = 0

            logger.info(f"按核心类型设置CPU频率: {freq_config}")

            # 遍历用户配置的核心类型
            for core_type, target_freq in freq_config.items():
                if core_type not in core_type_mapping:
                    logger.warning(f"未知的核心类型: {core_type}，跳过")
                    continue

                cpu_list = core_type_mapping[core_type]
                logger.debug(f"核心类型 {core_type} 包含CPU: {cpu_list}")

                # 遍历该核心类型的所有CPU
                for cpu_id in cpu_list:
                    if cpu_id not in online_cpus:
                        logger.debug(f"CPU{cpu_id} 不在线，跳过")
                        continue

                    total_count += 1
                    if self._set_cpu_max_freq_direct(cpu_id, target_freq):
                        success_count += 1

            # 统计结果
            if success_count > 0:
                logger.info(
                    f"按核心类型设置CPU频率完成: {success_count}/{total_count} 成功"
                )
                return True
            else:
                logger.error("按核心类型设置CPU频率失败: 没有任何CPU设置成功")
                return False

        except Exception as e:
            logger.error(f"按核心类型设置CPU频率发生异常: {e}")
            return False

    def _get_core_type_freq_range(
        self, core_type: str, cpu_list: List[int]
    ) -> Tuple[int, int]:
        """获取指定核心类型的频率范围"""
        if not self.cpu_topology or not cpu_list:
            return (0, 0)

        valid_freqs = []
        for cpu_id in cpu_list:
            core_info = self.cpu_topology.get_core_info(cpu_id)
            if core_info and core_info.max_freq_hw > 0:
                valid_freqs.append((core_info.min_freq_hw, core_info.max_freq_hw))

        if not valid_freqs:
            return (0, 0)

        min_freq = min(freq[0] for freq in valid_freqs if freq[0] > 0)
        max_freq = max(freq[1] for freq in valid_freqs if freq[1] > 0)

        return (min_freq if min_freq > 0 else 0, max_freq if max_freq > 0 else 0)

    def get_cpu_core_info(self) -> Dict:
        """获取CPU核心类型详细信息

        Returns:
            Dict: {
                "is_heterogeneous": bool,
                "vendor": str,
                "architecture_summary": str,
                "core_types": {
                    "P-Core": {
                        "count": int,
                        "cpus": List[int],
                        "max_freq_khz": int,
                        "min_freq_khz": int
                    }
                }
            }
        """
        # 基础信息
        result = {
            "is_heterogeneous": self.is_heterogeneous_cpu(),
            "vendor": getattr(self, "hw_analysis", {}).get("vendor", "Unknown"),
            "architecture_summary": self.get_cpu_architecture_summary(),
            "core_types": {},
        }

        # 检查硬件检测数据
        if not hasattr(self, "hw_analysis") or not self.hw_analysis:
            return result

        # 获取核心类型映射
        core_type_mapping = self.hw_analysis.get("core_type_mapping", {})
        core_types_count = self.hw_analysis.get("core_types", {})

        if not core_type_mapping:
            return result

        # 构建核心类型详细信息
        for core_type, cpu_list in core_type_mapping.items():
            if cpu_list:
                min_freq, max_freq = self._get_core_type_freq_range(core_type, cpu_list)
                result["core_types"][core_type] = {
                    "count": core_types_count.get(core_type, len(cpu_list)),
                    "cpus": sorted(cpu_list),
                    "max_freq_khz": max_freq,
                    "min_freq_khz": min_freq,
                }

        return result


cpuManager = CPUManager()
