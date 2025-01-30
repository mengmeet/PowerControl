import collections
import os
import subprocess
import threading
import time

from config import AMD_GPU_DEVICE_PATH, logger
from helpers import get_user
from utils import get_env

cpu_busyPercent = 0
cpu_DataErrCnt = 0
has_cpuData = True

gpu_busyPercent = 0
gpu_DataErrCnt = 0
has_gpuData = True

statPath = "/proc/stat"
gpu_busy_percentPath = "{}/gpu_busy_percent".format(AMD_GPU_DEVICE_PATH)
hwmon_path = "/sys/class/hwmon"


# GPU单次监控数据
class GPUData:
    def __init__(self):
        # gpu占用率
        self.gpuBusyPercent = 0

    def setBusyPercent(self, busyPercent):
        try:
            self.gpuBusyPercent = int(busyPercent)
            return True
        except Exception as e:
            logger.error(f"setBusyPercent数据异常{e}", exc_info=True)
            return False

    def getBusyPercent(self):
        return self.gpuBusyPercent


# cpu单次监测数据
class CPUData:
    def __init__(self):
        # cpu各种处于状态的时间
        self.usertime = 0
        self.nicetime = 0
        self.systemtime = 0
        self.idletime = 0
        self.ioWait = 0
        self.irq = 0
        self.softIrq = 0
        self.steal = 0
        self.guest = 0
        self.guestnice = 0

    def setStatInfo(self, StatInfo):
        try:
            self.usertime = int(StatInfo[1])
            self.nicetime = int(StatInfo[2])
            self.systemtime = int(StatInfo[3])
            self.idletime = int(StatInfo[4])
            self.ioWait = int(StatInfo[5])
            self.irq = int(StatInfo[6])
            self.softIrq = int(StatInfo[7])
            self.steal = int(StatInfo[8])
            self.guest = int(StatInfo[9])
            self.guestnice = int(StatInfo[10])
            return True
        except Exception as e:
            logger.error(f"StatInfo数据异常{e} ={StatInfo}", exc_info=True)
            return False

    def getFreeTime(self):
        idlealltime = self.idletime + self.ioWait
        return max(idlealltime, 0)

    def getTotalTime(self):
        usertime = self.usertime - self.guest
        nicetime = self.nicetime - self.guestnice
        idlealltime = self.idletime + self.ioWait
        systemalltime = self.systemtime + self.irq + self.softIrq
        virtalltime = self.guest + self.guestnice
        totaltime = (
            usertime + nicetime + systemalltime + idlealltime + self.steal + virtalltime
        )
        return max(totaltime, 0)


class SysInfoManager(threading.Thread):
    def __init__(self):
        self._cpuDataQueue = collections.deque()  # 记录cpu数据的队列
        self._cpuDataQueueHead = 0  # 记录cpu数据的队列头元素 用于计算时间差
        self._cpu_NowQueueLength = 0  # 当前cpu记录的数据量
        self._cpu_QueueMaxLength = 100  # cpu记录的最大数据量
        self._enableUpdateCPUInfo = False  # 是否开启cpu数据记录收集

        self._gpuDataQueue = collections.deque()  # 记录gpu占用率的队列
        self._gpu_busyPercentSum = (
            0  # 当前所有的gpu占用率总和 用于计算平均值 无需每次遍历队列
        )
        self._gpu_NowQueueLength = 0  # 当前gpu占用率个数
        self._gpu_QueueMaxLength = 10  # gpu占用率最多记录几个
        self._enableUpdateGPUInfo = False  # 是否开启gpu数据记录收集

        self._collectInfoInterval = 0.005  # 记录数据的间隔
        self._isRunning = False  # 标记是否正在运行gpu频率优化

        self._language = "schinese"  # 当前客户端使用的语言

        threading.Thread.__init__(self)

    def get_language(self):
        try:
            lang_path = f"/home/{get_user()}/.steam/registry.vdf"
            if os.path.exists(lang_path):
                with open(lang_path, "r") as f:
                    for line in f.readlines():
                        if "language" in line:
                            self._language = line.split('"')[3]
                            break
            else:
                logger.error(f"語言檢測路徑{lang_path}不存在該文件")
            logger.info(f"get_language {self._language} path={lang_path}")
            return self._language
        except Exception as e:
            logger.error(e)
            return self._language

    def updateCpuData(self):
        global cpu_DataErrCnt
        global cpu_busyPercent
        try:
            cpuData = CPUData()
            StatInfoFile = open(statPath, "r")
            StatInfo = StatInfoFile.readline().rstrip("\n").split()
            if not cpuData.setStatInfo(StatInfo):
                raise Exception()
            self._cpuDataQueue.append(cpuData)
            self._cpu_NowQueueLength = self._cpu_NowQueueLength + 1
            if self._cpu_NowQueueLength >= self._cpu_QueueMaxLength:
                self._cpuDataQueueHead = self._cpuDataQueue.popleft()
                self._cpu_NowQueueLength = self._cpu_NowQueueLength - 1
            elif self._cpu_NowQueueLength == 1:
                self._cpuDataQueueHead = cpuData
            freeTimeIncrease = (
                cpuData.getFreeTime() - self._cpuDataQueueHead.getFreeTime()
            )
            totaltimeIncrease = max(
                cpuData.getTotalTime() - self._cpuDataQueueHead.getTotalTime(), 1
            )
            cpu_busyPercent = 100 - freeTimeIncrease * 100 / totaltimeIncrease
        except Exception as e:
            logger.error(f"更新CPU信息时异常 {e}")
            cpu_DataErrCnt = cpu_DataErrCnt + 1
            if cpu_DataErrCnt >= self._cpu_QueueMaxLength / 2:
                has_cpuData = False

    def getGpuBusyPercent(self):
        if os.path.exists(gpu_busy_percentPath):
            gpu_busyPercentFile = open(gpu_busy_percentPath, "r")
            gpu_busy_percent = gpu_busyPercentFile.readline().rstrip("\n")
            return gpu_busy_percent
        else:
            # 检查 intel_gpu_top 命令 是否可用
            if os.system("command -v intel_gpu_top") == 0:
                return self._getGPUBusyPercentByIntelGPUTop()
            else:
                return 0

    def _getGPUBusyPercentByIntelGPUTop(self):
        command = ["stdbuf", "-oL", "intel_gpu_top", "-l", "-s", "1"]
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=get_env(),
        )
        line_count = 0
        percent = 0
        try:
            while True:
                output = process.stdout.readline()
                if output == "" and process.poll() is not None:
                    break
                if output:
                    line_count += 1
                    # logger.info(f"Line {line_count}: {output.strip()}")
                    if line_count == 4:
                        # 按空格分割
                        parts = output.strip().split()
                        if len(parts) >= 7:
                            # 取第七项
                            seventh_item = parts[6]
                            # logger.info(f"The seventh item in the fourth line is: {seventh_item}")
                            percent = seventh_item
                        else:
                            logger.error(
                                "The fourth line does not have at least seven items."
                            )
                        process.terminate()  # 停止命令
                        break
            return round(float(percent))
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            return 0
        finally:
            process.stdout.close()
            process.stderr.close()
            process.wait()

    def updateGpuData(self):
        global gpuDataErrorCnt
        global gpu_busyPercent
        try:
            gpuData = GPUData()
            gpu_busy_percent = self.getGpuBusyPercent()
            if not gpuData.setBusyPercent(gpu_busy_percent):
                raise Exception()
            self._gpuDataQueue.append(gpuData)
            self._gpu_NowQueueLength = self._gpu_NowQueueLength + 1
            if self._gpu_NowQueueLength >= self._gpu_QueueMaxLength:
                headData = self._gpuDataQueue.popleft()
                self._gpu_busyPercentSum = (
                    self._gpu_busyPercentSum - headData.getBusyPercent()
                )
                self._gpu_NowQueueLength = self._gpu_NowQueueLength - 1
            self._gpu_busyPercentSum = (
                self._gpu_busyPercentSum + gpuData.getBusyPercent()
            )
            gpu_busyPercent = self._gpu_busyPercentSum / max(
                self._gpu_NowQueueLength, 1
            )
        except Exception as e:
            logger.error(f"更新GPU信息时异常 {e}")
            gpu_DataErrCnt = gpu_DataErrCnt + 1
            if gpu_DataErrCnt >= self._gpu_QueueMaxLength / 2:
                has_gpuData = False

    def EnableCPUINFO(self, isEnable):
        self._enableUpdateCPUInfo = isEnable

    def EnableGPUINFO(self, isEnable):
        self._enableUpdateGPUInfo = isEnable

    def run(self):
        self._isRunning = True
        while True:
            # 只在需要时开启数据更新，避免不必要的性能浪费
            if self._enableUpdateCPUInfo:
                self.updateCpuData()
            if self._enableUpdateGPUInfo:
                self.updateGpuData()
            # logger.info(f"cpu_busyPercent={cpu_busyPercent} gpu_busyPercent={gpu_busyPercent}")
            time.sleep(self._collectInfoInterval)


sysInfoManager = SysInfoManager()
sysInfoManager.start()
