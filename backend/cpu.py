import glob
import subprocess
import os
import re
import traceback
from typing import Dict, List, Optional, Tuple, Union
from config import (
    TDP_LIMIT_CONFIG_CPU,
    TDP_LIMIT_CONFIG_PRODUCT,
    PRODUCT_NAME,
    CPU_ID,
    CPU_VENDOR,
    logging,
    SH_PATH,
    RYZENADJ_PATH,
)


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
        
        # 初始化CPU信息
        self.set_enable_All()  # 先开启所有cpu, 否则拓扑信息不全
        self.get_isSupportSMT()  # 获取 is_support_smt
        self.get_cpuMaxNum()  # 获取 cpu_maxNum
        
        # 获取并存储CPU拓扑信息
        self.cpu_topology = self.get_cpu_topology()
        self.cps_ids: List[int] = sorted(list(set(self.cpu_topology.values())))
        
        logging.info(f"self.cpu_topology {self.cpu_topology}")
        logging.info(f"cpu_ids {self.cps_ids}")

    def get_hasRyzenadj(self) -> bool:
        """检查系统是否安装了ryzenadj工具。
        
        Returns:
            bool: True如果ryzenadj可用，否则False
        """
        try:
            # 查看ryzenadj路径是否有该文件
            if os.path.exists(RYZENADJ_PATH) or os.path.exists("/usr/bin/ryzenadj"):
                logging.info("get_hasRyzenadj {}".format(True))
                return True
            else:
                logging.info("get_hasRyzenadj {}".format(False))
                return False
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
            return False

    def get_cpuMaxNum(self) -> int:
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
            if self.get_isSupportSMT():
                # 去掉超线程部分，物理核心只有cpu文件夹数量的一半
                self.cpu_maxNum = int(cpu_index / 2)
            else:
                self.cpu_maxNum = cpu_index
            logging.info("get_cpuMaxNum {}".format(self.cpu_maxNum))
            return self.cpu_maxNum
        except Exception as e:
            logging.error(e)
            return 0

    def get_tdpMax(self) -> int:
        """获取最大TDP值。
        
        Returns:
            int: 最大TDP值（瓦特）
        """
        try:
            # 根据机器型号或者CPU型号返回tdp最大值
            if PRODUCT_NAME in TDP_LIMIT_CONFIG_PRODUCT:
                self.cpu_tdpMax = TDP_LIMIT_CONFIG_PRODUCT[PRODUCT_NAME]
            else:
                for model in TDP_LIMIT_CONFIG_CPU:
                    if model in CPU_ID:
                        self.cpu_tdpMax = TDP_LIMIT_CONFIG_CPU[model]
                        break
                    else:
                        self.cpu_tdpMax = 15
            logging.info("get_tdpMax {}".format(self.cpu_tdpMax))
            return self.cpu_tdpMax
        except Exception as e:
            logging.error(e)
            return 0

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
            logging.info(
                f"cpu_avaFreqData={[self.cpu_avaFreq,self.cpu_avaMinFreq,self.cpu_avaMaxFreq]}"
            )
            return self.cpu_avaFreq
        except Exception as e:
            logging.error(e)
            return []

    def set_cpuTDP(self, value: int) -> bool:
        """设置CPU TDP值。
        
        Args:
            value (int): TDP值（瓦特）
        
        Returns:
            bool: True如果设置成功，否则False
        """
        if CPU_VENDOR == "GenuineIntel":
            return self.set_cpuTDP_Intel(value)
        elif CPU_VENDOR == "AuthenticAMD":
            self.set_cpuTDP_AMD(value)
        else:
            logging.error("set_cpuTDP error: unknown CPU_VENDOR")
            return False

    def __get_intel_rapl_path(self) -> Tuple[str, str]:
        """获取Intel RAPL路径。
        
        Returns:
            Tuple[str, str]: RAPL路径
        """
        rapl_path = ""
        rapl_long = ""
        rapl_short = ""
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
            return rapl_long, rapl_short
        except Exception as e:
            logging.error(e, exc_info=True)

    def set_cpuTDP_Intel(self, value: int) -> bool:
        """设置Intel CPU TDP值。
        
        Args:
            value (int): TDP值（瓦特）
        
        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            # 遍历 /sys/class/powercap/intel-rapl/*/ 如果 name 是 package-0 则是cpu
            logging.debug("set_cpuTDP_Intel {}".format(value))
            tdp = value * 1000000
            rapl_long, rapl_short = self.__get_intel_rapl_path()
            if rapl_long == "" or rapl_short == "":
                logging.error("set_cpuTDP_Intel error: rapl path not found")
                return False
            with open(rapl_long, "w") as file:
                file.write(str(tdp))
            with open(rapl_short, "w") as file:
                file.write(str(tdp))
            return True

        except Exception as e:
            logging.error(e, exc_info=True)
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
                logging.debug(f"set_cpuTDP command: {command}")
                logging.debug(f"set_cpuTDP {value}")
                process = subprocess.run(
                    command_args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                stdout, stderr = process.stdout, process.stderr
                logging.debug(f"set_cpuTDP result:\n{stdout}")
                if stderr:
                    logging.error(f"set_cpuTDP error:\n{stderr}")

                return True
            else:
                return False
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
            return False

    def set_cpuOnline(self, value: int) -> bool:
        """设置CPU在线状态。
        
        Args:
            value (int): CPU在线状态
        
        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logging.debug("set_cpuOnline {} {}".format(value, self.cpu_maxNum))
            self.enable_cpu_num = value

            cpu_topology = self.cpu_topology
            enabled_cores = list(set(int(core) for core in cpu_topology.values()))

            # 初始化关闭 Set
            to_offline = set()

            # 超过 enable_cpu_num 个核心之外的线程, 都关闭
            # if enable_cpu_num is not None and enable_cpu_num < len(enabled_cores):
            #     for processor_id, core_id in cpu_topology.items():
            #         if int(core_id) >= enable_cpu_num:
            #             to_offline.add(int(processor_id))

            # cpuid 可能存在不连续的情况
            # 如 4500u 为 [0, 1, 2, 4, 5, 6] {0: 0, 1: 1, 2: 2, 3: 4, 4: 5, 5: 6}
            # 所以不能直接关掉 大于 enable_cpu_num 的线程
            #
            # cpu_num 作为索引, 取出对应的核心, 作为开启的最大 cpuid, 关闭大于最大 cpuid 的线程
            max_enable_cpuid = self.cps_ids[self.enable_cpu_num - 1]
            logging.debug(
                f"enable_cpu_num {self.enable_cpu_num}, max_enable_cpuid {max_enable_cpuid}"
            )
            if self.enable_cpu_num is not None and self.enable_cpu_num < len(enabled_cores):
                for processor_id, core_id in cpu_topology.items():
                    if int(core_id) > max_enable_cpuid:
                        logging.info(
                            f"add offline - processor_id:{processor_id}, core_id:{core_id}"
                        )
                        to_offline.add(int(processor_id))

            # 如果关闭SMT，关闭每个核心中数字更大的线程
            if not self.cpu_smt:
                for core_id in enabled_cores[:self.enable_cpu_num]:
                    core_threads = [
                        cpu
                        for cpu, core in cpu_topology.items()
                        if int(core) == core_id
                    ]
                    core_threads = sorted(core_threads, key=lambda x: int(x))
                    core_to_keep = core_threads[0]
                    to_offline.update(set(core_threads[1:]))

            logging.debug(f"to_offline {sorted(to_offline)}")

            # 遍历判断，执行关闭和启用操作
            for cpu in cpu_topology.keys():
                if cpu in to_offline:
                    self.offline_cpu(int(cpu))
                else:
                    self.online_cpu(int(cpu))
            return True
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
            return False

    def set_enable_All(self) -> bool:
        """启用所有CPU核心。
        
        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logging.debug("set_enable_All")
            cpu_path = "/sys/devices/system/cpu/"
            cpu_pattern = re.compile(r"^cpu(\d+)$")

            for cpu_dir in os.listdir(cpu_path):
                match = cpu_pattern.match(cpu_dir)
                if match:
                    cpu_number = match.group(1)
                    self.online_cpu(int(cpu_number))
            return True
        except Exception as e:
            logging.error(e)
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
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logging.error(f"is_support_smt error:\n{stderr}")
                self.is_support_smt = False
            else:
                self.is_support_smt = int(stdout) > 1
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
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
                logging.info("set_smt not support")
                return False
            logging.debug("set_smt {}".format(value))
            self.cpu_smt = value
            return True
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
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
        pstate_boost_path = "${pstate_path}/cpb_boost"
        amd_state_path = "${pstate_path}/status"

        # intel
        hwp_dynamic_boost_path = (
            "/sys/devices/system/cpu/intel_pstate/hwp_dynamic_boost"
        )
        no_turbo_path = "/sys/devices/system/cpu/intel_pstate/no_turbo"

        try:
            logging.debug("set_cpuBoost {}".format(value))
            self.cpu_boost = value

            # 如果不存在 pstate_boost_path
            if not os.path.exists(pstate_boost_path):
                # 切换为 passive 模式
                if os.path.exists(amd_state_path) and os.path.exists(amd_pstate_dir):
                    open(amd_state_path, "w").write("passive")

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
            logging.error(traceback.format_exc())
            logging.error(e)
            return False

    def check_cpuFreq(self) -> bool:
        """检查CPU频率是否低于限制频率。
        
        Returns:
            bool: True如果频率低于限制频率，否则False
        """
        try:
            logging.debug(f"check_cpuFreq cpu_nowLimitFreq = {self.cpu_nowLimitFreq}")
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
            logging.error(e)
            return False

    def set_cpuFreq(self, value: int) -> bool:
        """设置CPU频率。
        
        Args:
            value (int): 频率值
        
        Returns:
            bool: True如果设置成功，否则False
        """
        try:
            logging.debug(
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
            logging.error(e)
            return False

    def get_cpu_topology(self) -> Dict[int, int]:
        """获取CPU拓扑信息。
        
        Returns:
            Dict[int, int]: CPU拓扑信息，键为处理器ID，值为核心ID
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
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logging.error(f"get_ryzenadj_info error:\n{stderr}")
                return f"get_ryzenadj_info error:\n{stderr}"
            else:
                return stdout
        except Exception as e:
            logging.error(e)
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
            logging.error(e)
            return False


cpuManager = CPUManager()
