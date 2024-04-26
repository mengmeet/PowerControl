import subprocess
import os
import re
import traceback
from config import logging, SH_PATH, RYZENADJ_PATH
from config import (
    TDP_LIMIT_CONFIG_CPU,
    TDP_LIMIT_CONFIG_PRODUCT,
    PRODUCT_NAME,
    CPU_ID,
)

# 初始参数
cpu_boost = True
cpu_smt = True
enable_cpu_num = 4
cpu_maxNum = 0
cpu_tdpMax = 15
cpu_avaFreq = []
cpu_avaMaxFreq = 1600000
cpu_avaMinFreq = 1600000
cpu_nowLimitFreq = 0


class CPUManager:
    def __init__(self):
        self.cpu_topology = {}

        # 获取 cpu_topology
        self.set_enable_All()  # 先开启所有cpu, 否则拓扑信息不全
        self.is_support_smt = None
        self.get_isSupportSMT()  # 获取 is_support_smt
        self.get_cpuMaxNum()  # 获取 cpu_maxNum

        _cpu_topology: dict = self.get_cpu_topology()
        self.cpu_topology = _cpu_topology
        self.cps_ids = sorted(list(set(_cpu_topology.values())))

        logging.info(f"self.cpu_topology {self.cpu_topology}")
        logging.info(f"cpu_ids {self.cps_ids}")

    def get_hasRyzenadj(self):
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

    def get_cpuMaxNum(self):
        try:
            global cpu_maxNum
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
                cpu_maxNum = int(cpu_index / 2)
            else:
                cpu_maxNum = cpu_index
            logging.info("get_cpuMaxNum {}".format(cpu_maxNum))
            return cpu_maxNum
        except Exception as e:
            logging.error(e)
            return 0

    def get_tdpMax(self):
        try:
            # 根据机器型号或者CPU型号返回tdp最大值
            global cpu_tdpMax
            if PRODUCT_NAME in TDP_LIMIT_CONFIG_PRODUCT:
                cpu_tdpMax = TDP_LIMIT_CONFIG_PRODUCT[PRODUCT_NAME]
            else:
                for model in TDP_LIMIT_CONFIG_CPU:
                    if model in CPU_ID:
                        cpu_tdpMax = TDP_LIMIT_CONFIG_CPU[model]
                        break
                    else:
                        cpu_tdpMax = 15
            logging.info("get_tdpMax {}".format(cpu_tdpMax))
            return cpu_tdpMax
        except Exception as e:
            logging.error(e)
            return 0

    # 弃用
    def get_cpu_AvailableFreq(self):
        try:
            global cpu_avaFreq
            global cpu_avaMaxFreq
            global cpu_avaMinFreq
            # 当前已有cpu频率列表，直接返回
            if len(cpu_avaFreq) > 0:
                return cpu_avaFreq
            # 获取可用的cpu频率列表
            command = "sudo sh {} get_cpu_AvailableFreq ".format(SH_PATH)
            cpu_avaFreqRes = subprocess.getoutput(command)
            # 按空格分割获取的结果并且化为int存入
            cpu_avaFreqStr = cpu_avaFreqRes.split()
            for index in cpu_avaFreqStr:
                cpu_avaFreq.append(int(index))
            # 列表不为空时，先排序，最小值取第一个，最大值取倒数第一个
            if len(cpu_avaFreq) >= 1:
                cpu_avaFreq.sort()
                cpu_avaMinFreq = cpu_avaFreq[0]
                cpu_avaMaxFreq = cpu_avaFreq[len(cpu_avaFreq) - 1]
            logging.info(
                f"cpu_avaFreqData={[cpu_avaFreq,cpu_avaMinFreq,cpu_avaMaxFreq]}"
            )
            return cpu_avaFreq
        except Exception as e:
            logging.error(e)
            return []

    def set_cpuTDP(self, value: int):
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

    def set_cpuOnline(self, value: int):
        try:
            logging.debug("set_cpuOnline {} {}".format(value, cpu_maxNum))
            global enable_cpu_num
            enable_cpu_num = value

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
            max_enable_cpuid = self.cps_ids[enable_cpu_num - 1]
            logging.debug(
                f"enable_cpu_num {enable_cpu_num}, max_enable_cpuid {max_enable_cpuid}"
            )
            if enable_cpu_num is not None and enable_cpu_num < len(enabled_cores):
                for processor_id, core_id in cpu_topology.items():
                    if int(core_id) > max_enable_cpuid:
                        logging.info(
                            f"add offline - processor_id:{processor_id}, core_id:{core_id}"
                        )
                        to_offline.add(int(processor_id))

            # 如果关闭SMT，关闭每个核心中数字更大的线程
            if not cpu_smt:
                for core_id in enabled_cores[:enable_cpu_num]:
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

    def set_enable_All(self):
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
    def get_isSupportSMT(self):
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

    def set_smt(self, value: bool):
        try:
            if not self.get_isSupportSMT():
                logging.info("set_smt not support")
                return False
            logging.debug("set_smt {}".format(value))
            global cpu_smt
            cpu_smt = value
            return True
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
            return False

    def set_cpuBoost(self, value: bool):
        boost_path = "/sys/devices/system/cpu/cpufreq/boost"
        amd_pstate_path = "/sys/devices/system/cpu/amd_pstate/status"
        try:
            logging.debug("set_cpuBoost {}".format(value))
            global cpu_boost
            cpu_boost = value

            # 切换为 passive 模式
            if os.path.exists(amd_pstate_path):
                open(amd_pstate_path, "w").write("passive")

                # 关闭 amd_pstate 使用 acpi_cpufreq。但是会导致mangohud cpu显示不正常
                # open(amd_pstate_path, 'w').write('disable')
                # os.system("modprobe acpi_cpufreq")
                # result = subprocess.run(["modprobe", "acpi_cpufreq"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

                # if result.stderr:
                #     logging.error(f"modprobe acpi_cpufreq error:\n{result.stderr}")
                #     open(amd_pstate_path, 'w').write('active')
                #     return False

            # 设置 boost
            if os.path.exists(boost_path):
                with open(boost_path, "w") as file:
                    if cpu_boost:
                        file.write("1")
                    else:
                        file.write("0")

            return True
        except Exception as e:
            logging.error(traceback.format_exc())
            logging.error(e)
            return False

    def check_cpuFreq(self):
        try:
            logging.debug(f"check_cpuFreq cpu_nowLimitFreq = {cpu_nowLimitFreq}")
            if cpu_nowLimitFreq == 0:
                return False
            need_set = False
            # 检测已开启的cpu的频率是否全部低于限制频率
            for cpu in range(0, enable_cpu_num * 2):
                if cpu_smt or cpu % 2 == 0:
                    # command="sudo sh {} get_cpu_nowFreq {}".format(SH_PATH, cpu)
                    # cpu_freq=int(subprocess.getoutput(command))
                    cpu_path = (
                        "/sys/devices/system/cpu/cpu{}/cpufreq/scaling_cur_freq".format(
                            cpu
                        )
                    )
                    with open(cpu_path, "r") as file:
                        cpu_freq = int(file.read().strip())
                    if cpu_freq > cpu_nowLimitFreq:
                        need_set = True
                        return True
            return False
        except Exception as e:
            logging.error(e)
            return False

    def set_cpuFreq(self, value: int):
        try:
            global cpu_nowLimitFreq
            logging.debug(
                f"set_cpuFreq cpu_nowLimitFreq = {cpu_nowLimitFreq} value ={value}"
            )
            # 频率不同才可设置，设置相同频率时检测当前频率是否已经生效，未生效时再设置一次
            if cpu_nowLimitFreq != value:
                need_set = True
                cpu_nowLimitFreq = value
            else:
                need_set = self.check_cpuFreq()
            if need_set:
                # 除最小最大频率外 需要先设置到最小才能使该次设置生效
                if (
                    cpu_nowLimitFreq != cpu_avaMinFreq
                    or cpu_nowLimitFreq != cpu_avaMaxFreq
                ):
                    for cpu in range(0, cpu_maxNum * 2):
                        command = "sudo sh {} set_cpu_Freq {} {}".format(
                            SH_PATH, cpu, cpu_avaMinFreq
                        )
                        os.system(command)
                for cpu in range(0, cpu_maxNum * 2):
                    command = "sudo sh {} set_cpu_Freq {} {}".format(
                        SH_PATH, cpu, cpu_nowLimitFreq
                    )
                    os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.error(e)
            return False

    def get_cpu_topology(self):
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

    def offline_cpu(self, cpu_number: int):
        if int(cpu_number) == 0:
            return
        cpu_online_path = f"/sys/devices/system/cpu/cpu{cpu_number}/online"
        with open(cpu_online_path, "w") as file:
            file.write("0")

    def online_cpu(self, cpu_number: int):
        if int(cpu_number) == 0:
            return
        cpu_online_path = f"/sys/devices/system/cpu/cpu{cpu_number}/online"
        with open(cpu_online_path, "w") as file:
            file.write("1")

    def set_cpu_online(self, cpu_number, online):
        if online:
            self.online_cpu(cpu_number)
        else:
            self.offline_cpu(cpu_number)

    def get_ryzenadj_info(self):
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


cpuManager = CPUManager()
