import glob
import os
import re
import subprocess
import threading
import time
import traceback
from typing import Dict, List, Optional, Tuple

import sysInfo
from config import CPU_VENDOR, RYZENADJ_PATH, SH_PATH, logger
from utils import get_env, getMaxTDP


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
        cpu_topology (Dict[int, int]): CPU拓扑信息，键为处理器ID，值为核心ID
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

        # CPU拓扑相关属性
        self.cpu_topology: Dict[int, int] = {}
        self.is_support_smt: Optional[bool] = None

        # CPU自动优化线程
        self._cpuAutoMaxFreqManager = None

        # 初始化CPU信息
        self.__init_cpu_info()

    def __init_cpu_info(self) -> None:
        """初始化CPU信息。"""
        self.set_enable_All()  # 先开启所有cpu, 否则拓扑信息不全
        self.get_isSupportSMT()  # 获取 is_support_smt
        self.__get_tdpMax()  # 获取 cpu_tdpMax
        # 获取并存储CPU拓扑信息
        self.cpu_topology = self.get_cpu_topology()
        self.cps_ids: List[int] = sorted(list(set(self.cpu_topology.values())))
        self.cpu_maxNum = len(self.cps_ids)

        logger.info(f"self.cpu_topology {self.cpu_topology}")
        logger.info(f"cpu_ids {self.cps_ids}")
        logger.info(f"cpu_maxNum {self.cpu_maxNum}")

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

    def __get_tdpMax(self) -> int:
        """获取最大TDP值。

        Returns:
            int: 最大TDP值（瓦特）
        """
        self.cpu_tdpMax = getMaxTDP(0)
        if self.cpu_tdpMax == 0:
            if self.is_intel():
                self.cpu_tdpMax = self.get_cpuTDP_Intel()
            elif self.is_amd():
                self.cpu_tdpMax = self.get_cpuTDP_AMD()
            else:
                self.cpu_tdpMax = 0

    def get_tdpMax(self) -> int:
        return self.cpu_tdpMax

    def get_cpuTDP_Intel(self) -> int:
        """获取Intel CPU最大TDP值。

        Returns:
            int: Intel CPU最大TDP值
        """
        _, __, rapl_max = self.__get_intel_rapl_path()
        if rapl_max == "":
            logger.error("Failed to get Intel CPU TDP: RAPL path not found")
            return 0
        with open(rapl_max, "r") as file:
            tdp = int(file.read().strip())
            return tdp / 1000000

    def get_cpuTDP_AMD(self) -> int:
        """获取AMD CPU最大TDP值。

        Returns:
            int: AMD CPU最大TDP值
        """
        # 使用 ryzenadj 设置 200w 的 stapm-limit， 然后使用 ryzenadj -i 获取实际设置的 STAPM LIMIT， 保留整数
        try:
            subprocess.run(["ryzenadj", "-a", "200000"], check=True)
            process = subprocess.run(
                ["ryzenadj", "-i"],
                check=True,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
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
                        logger.info(f">>>>>>>>> get_cpuTDP_AMD {tdp}")
                        return tdp
        except Exception as e:
            logger.error(e)
            return getMaxTDP()

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
        """设置CPU TDP 为最大值。
        """
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
            for r_path in glob.glob(
                "/sys/class/powercap/intel-rapl-mmio/intel-rapl-mmio:?"
            ):
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
                sys_ryzenadj_path = "/usr/bin/ryzenadj"
                if not os.path.exists(sys_ryzenadj_path):
                    sys_ryzenadj_path = RYZENADJ_PATH

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
        except Exception:
            logger.error(f"Failed to set AMD CPU TDP: value={value}", exc_info=True)
            return False

    def set_cpuOnline(self, value: int) -> bool:
        """设置CPU在线状态。

        Args:
            value (int): CPU在线状态

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logger.debug("set_cpuOnline {} {}".format(value, self.cpu_maxNum))
            self.enable_cpu_num = value

            cpu_topology = self.cpu_topology
            enabled_cores = list(set(int(core) for core in cpu_topology.values()))

            # 初始化关闭 Set
            to_offline = set()

            # cpuid 可能存在不连续的情况
            # 如 4500u 为 [0, 1, 2, 4, 5, 6] {0: 0, 1: 1, 2: 2, 3: 4, 4: 5, 5: 6}
            # 所以不能直接关掉 大于 enable_cpu_num 的线程
            #
            # cpu_num 作为索引, 取出对应的核心, 作为开启的最大 cpuid, 关闭大于最大 cpuid 的线程
            max_enable_cpuid = self.cps_ids[self.enable_cpu_num - 1]
            logger.debug(
                f"enable_cpu_num {self.enable_cpu_num}, max_enable_cpuid {max_enable_cpuid}"
            )
            if self.enable_cpu_num is not None and self.enable_cpu_num < len(
                enabled_cores
            ):
                for processor_id, core_id in cpu_topology.items():
                    if int(core_id) > max_enable_cpuid:
                        logger.info(
                            f"add offline - processor_id:{processor_id}, core_id:{core_id}"
                        )
                        to_offline.add(int(processor_id))

            # 如果关闭SMT，关闭每个核心中数字更大的线程
            if not self.cpu_smt:
                for core_id in enabled_cores[: self.enable_cpu_num]:
                    core_threads = [
                        cpu
                        for cpu, core in cpu_topology.items()
                        if int(core) == core_id
                    ]
                    core_threads = sorted(core_threads, key=lambda x: int(x))
                    core_to_keep = core_threads[0]
                    to_offline.update(set(core_threads[1:]))

            logger.debug(f"to_offline {sorted(to_offline)}")

            # 遍历判断，执行关闭和启用操作
            for cpu in cpu_topology.keys():
                if cpu in to_offline:
                    self.offline_cpu(int(cpu))
                else:
                    self.online_cpu(int(cpu))
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
        """检查系统是否支持SMT。

        Returns:
            bool: True如果支持SMT，否则False
        """
        try:
            if self.is_support_smt is not None:
                return self.is_support_smt

            command = (
                "LANG=en_US.UTF-8 lscpu | grep 'Thread(s) per core' | awk '{print $4}'"
            )
            process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=get_env(),
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logger.error(f"Failed to check SMT support:\n{stderr}")
                self.is_support_smt = False
            else:
                self.is_support_smt = int(stdout) > 1
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
        """检查CPU频率是否低于限制频率。

        Returns:
            bool: True如果频率低于限制频率，否则False
        """
        try:
            logger.debug(f"check_cpuFreq cpu_nowLimitFreq = {self.cpu_nowLimitFreq}")
            if self.cpu_nowLimitFreq == 0:
                return False
            need_set = False
            # 检测已开启的cpu的频率是否全部低于限制频率
            for cpu in range(0, self.enable_cpu_num * 2):
                if self.cpu_smt or cpu % 2 == 0:
                    # command="sudo sh {} get_cpu_nowFreq {}".format(SH_PATH, cpu)
                    # cpu_freq=int(subprocess.getoutput(command))
                    cpu_path = (
                        "/sys/devices/system/cpu/cpu{}/cpufreq/scaling_cur_freq".format(
                            cpu
                        )
                    )
                    with open(cpu_path, "r") as file:
                        cpu_freq = int(file.read().strip())
                    if cpu_freq > self.cpu_nowLimitFreq:
                        need_set = True
                        return True
            return False
        except Exception as e:
            logger.error(e)
            return False

    def set_cpuFreq(self, value: int) -> bool:
        """设置CPU频率。

        Args:
            value (int): 频率值

        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logger.debug(
                f"set_cpuFreq cpu_nowLimitFreq = {self.cpu_nowLimitFreq} value ={value}"
            )
            # 频率不同才可设置，设置相同频率时检测当前频率是否已经生效，未生效时再设置一次
            if self.cpu_nowLimitFreq != value:
                need_set = True
                self.cpu_nowLimitFreq = value
            else:
                need_set = self.check_cpuFreq()
            if need_set:
                # 除最小最大频率外 需要先设置到最小才能使该次设置生效
                if (
                    self.cpu_nowLimitFreq != self.cpu_avaMinFreq
                    or self.cpu_nowLimitFreq != self.cpu_avaMaxFreq
                ):
                    for cpu in range(0, self.cpu_maxNum * 2):
                        command = "sudo sh {} set_cpu_Freq {} {}".format(
                            SH_PATH, cpu, self.cpu_avaMinFreq
                        )
                        os.system(command)
                for cpu in range(0, self.cpu_maxNum * 2):
                    command = "sudo sh {} set_cpu_Freq {} {}".format(
                        SH_PATH, cpu, self.cpu_nowLimitFreq
                    )
                    os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logger.error(e)
            return False

    def get_cpu_topology(self) -> Dict[int, int]:
        """获取CPU拓扑信息。

        Returns:
            Dict[int, int]: CPU拓扑信息，键为逻辑处理器ID，值为物理核心ID
        """
        cpu_topology = {}

        # 遍历每个 CPU
        cpu_path = "/sys/devices/system/cpu/"
        cpu_pattern = re.compile(r"^cpu(\d+)$")

        for cpu_dir in os.listdir(cpu_path):
            match = cpu_pattern.match(cpu_dir)
            if match:
                cpu_number = match.group(1)  # 提取匹配到的数字部分
                cpu_full_path = os.path.join(cpu_path, cpu_dir)

                # 获取核心信息
                core_id_path = os.path.join(cpu_full_path, "topology/core_id")

                with open(core_id_path, "r") as file:
                    core_id = file.read().strip()

                cpu_topology[int(cpu_number)] = int(core_id)

        return cpu_topology

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
            sys_ryzenadj_path = "/usr/bin/ryzenadj"
            if not os.path.exists(sys_ryzenadj_path):
                sys_ryzenadj_path = RYZENADJ_PATH
            command = f"{sys_ryzenadj_path} -i"
            process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=get_env(),
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logger.error(f"get_ryzenadj_info error:\n{stderr}")
                return f"get_ryzenadj_info error:\n{stderr}"
            else:
                return stdout
        except Exception as e:
            logger.error(e)
            return f"get_ryzenadj_info error:\n{e}"

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


cpuManager = CPUManager()
