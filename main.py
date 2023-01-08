import pathlib
import subprocess
import asyncio
import os
import sys
import json
import logging
import collections
import threading
import time

LOG_LOCATION = "/tmp/PowerControl_py.log"
logging.basicConfig(
    filename = LOG_LOCATION,
    format = '%(asctime)s %(levelname)s %(message)s',
    filemode = 'w',
    force = True)

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logging.info(f"PowerControl main.py")

HOME_DIR = str(pathlib.Path(os.getcwd()).parent.parent.resolve())
PARENT_DIR = str(pathlib.Path(__file__).parent.resolve())

cpu_boost=True
cpu_smt=True
cpu_num=4
cpu_maxNum=0
cpu_tdpMax=15

gpu_freqMax=1600
gpu_freqMin=200
gpu_autofreqManager = None
gpu_minBusyPercent = 75
gpu_maxBusyPercent = 85

sh_path="../plugins/PowerControl/TDP/tdp-control.sh"


def min(a,b):
    return b if a > b else a

def max(a,b):
    return a if a > b else b
 
class GPU_AutoFreqManager (threading.Thread):

    def __init__(self):
        self._gpu_enableAutoFreq = False
        self._gpu_autoFreqCheckInterval = 0.5
        self._gpu_adjustFreqInterval = 2
        self._gpu_busyPercentQueue = collections.deque()
        self._gpu_busyPercentMaxNum = 10
        self._gpu_busyPercentNum = 0
        self._gpu_busyPercentSum = 0
        self._gpu_nowFreq=1600
        self._gpu_addFreqBase=50
        threading.Thread.__init__(self)

    def Set_gpuFreq(self, value: int):
        try:
            if value >= 0:
                command="sudo sh {} set_clock_limits {} {}".format(sh_path,value,value)
                os.system(command)
                return True
            else:
                return False
        except:
            return False

    def GPU_enableAutoFreq(self,enable,nowFreq):
        self._gpu_enableAutoFreq = enable
        self._gpu_busyPercentQueue.clear()
        self._gpu_busyPercentSum = 0
        self._gpu_busyPercentNum = 0
        self._gpu_nowFreq = nowFreq
        global gpu_freqMax
        if not enable and nowFreq == -1:
            self.Set_gpuFreq(0)
        elif nowFreq == 0:
            self._gpu_nowFreq = gpu_freqMax/2
        else:
            self._gpu_nowFreq = nowFreq

    def Get_gpuBusyPercent(self):
        try:
            gpu_busy_percentPath="/sys/class/drm/card0/device/gpu_busy_percent"
            if os.path.exists(gpu_busy_percentPath):
                gpu_busyPercentFile=open(gpu_busy_percentPath,'r')
                gpu_busy_percent = gpu_busyPercentFile.readline().rstrip("\n")
                return int(gpu_busy_percent)
            else:
                logging.info("未找到gpu_busy_percent文件")
                self.GPU_enableAutoFreq(False,-1)
                return 0
            return int(gpu_busy_percent)
        except Exception as e:
            logging.info(f"添加gpu_busy_percent时出现异常{e}")
            return 0

    def Get_gpuBusyPercentAvg(self):
        if self._gpu_busyPercentNum == 0:
            return 0
        else:
            return self._gpu_busyPercentSum / self._gpu_busyPercentNum

    def Add_gpuBusyPercentQueue(self):
        try:
            if self._gpu_enableAutoFreq:
                if self._gpu_busyPercentNum >= self._gpu_busyPercentMaxNum:
                    head=self._gpu_busyPercentQueue.popleft()
                    self._gpu_busyPercentSum = self._gpu_busyPercentSum - head
                    self._gpu_busyPercentNum = self._gpu_busyPercentNum - 1
                gpu_busyPercent = self.Get_gpuBusyPercent()
                self._gpu_busyPercentSum = self._gpu_busyPercentSum + gpu_busyPercent
                self._gpu_busyPercentQueue.append(gpu_busyPercent)
                self._gpu_busyPercentNum = self._gpu_busyPercentNum + 1
                return True
            else:
                return False
        except Exception as e:
            logging.info(e)
            return False
    
    def optimization_GPUFreq(self):
        global gpu_minBusyPercent
        global gpu_maxBusyPercent
        global gpu_freqMax
        global gpu_freqMin
        gpu_Avg = self.Get_gpuBusyPercentAvg()
        gpu_addFreqOnce = self._gpu_addFreqBase
        if gpu_Avg >= gpu_maxBusyPercent:
            gpu_addFreqOnce = min(gpu_freqMax - self._gpu_nowFreq,int((gpu_Avg - gpu_maxBusyPercent)/5)*self._gpu_addFreqBase)
            if self._gpu_nowFreq + gpu_addFreqOnce > gpu_freqMax:
                logging.info(f"当前平均GPU使用率::{gpu_Avg}% 大于目标范围最大值:{gpu_maxBusyPercent}% 已达到GPU最大频率{gpu_freqMax}mhz,无法继续增加")
                logging.info(f"当前的GPU频率:{self._gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
            else:
                self._gpu_nowFreq = self._gpu_nowFreq + gpu_addFreqOnce
                self.Set_gpuFreq(self._gpu_nowFreq)
                logging.info(f"当前平均GPU使用率::{gpu_Avg}% 大于目标范围最大值:{gpu_maxBusyPercent}% 增加{gpu_addFreqOnce}mhz GPU频率")
                logging.info(f"增加后的GPU频率:{self._gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
        elif gpu_Avg <= gpu_minBusyPercent:
            #gpu_addFreqOnce = min(self._gpu_nowFreq - gpu_freqMin,int((gpu_maxBusyPercent - gpu_Avg)*self._gpu_addFreqBase/10))
            gpu_addFreqOnce = min(self._gpu_nowFreq - gpu_freqMin,self._gpu_addFreqBase)
            if self._gpu_nowFreq - gpu_addFreqOnce < gpu_freqMin:
                logging.info(f"当前平均GPU使用率::{gpu_Avg}% 小于目标范围最小值:{gpu_minBusyPercent}% 已达到GPU最小频率，无法继续降低")
                logging.info(f"当前的GPU频率:{self._gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
            else:
                self._gpu_nowFreq = self._gpu_nowFreq - gpu_addFreqOnce
                self.Set_gpuFreq(self._gpu_nowFreq)
                logging.info(f"当前平均GPU使用率::{gpu_Avg}% 小于目标范围最小值:{gpu_minBusyPercent}% 降低{gpu_addFreqOnce}mhz GPU频率")
                logging.info(f"降低后的GPU频率:{self._gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
        else:
            logging.info(f"当前平均GPU使用率::{gpu_Avg}% 处于目标范围{gpu_minBusyPercent}%-{gpu_maxBusyPercent}% 无需修改GPU频率")
            logging.info(f"当前的GPU频率:{self._gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")

    def run(self):
        logging.info("开始自动优化频率:" + self.name)
        adjust_count = 0
        while True:
            try:
                if not self._gpu_enableAutoFreq:
                    logging.info("退出自动优化频率：" + self.name)
                    break
                self.Add_gpuBusyPercentQueue()
                adjust_count = adjust_count + 1
                if adjust_count >= int(self._gpu_adjustFreqInterval / self._gpu_autoFreqCheckInterval):
                    self.optimization_GPUFreq()
                    adjust_count = 0
                time.sleep(self._gpu_autoFreqCheckInterval)
            except Exception as e:
                logging.info(e)
                time.sleep(self._gpu_autoFreqCheckInterval)




class Plugin:
    async def _main(self):
        while True:
            await asyncio.sleep(1)

    async def get_hasRyzenadj(self):
        try:
            ryzenAdj_path="../plugins/PowerControl/bin/ryzenadj"
            if os.path.exists(ryzenAdj_path):
                command="sudo sh {} get_hasRyzenadj {}".format(sh_path,True)
                os.system(command)
                return True
            else:
                command="sudo sh {} get_cpuMaxNum {}".format(sh_path,False)
                os.system(command)
                return False
        except:
            return False

    async def get_cpuMaxNum(self):
        try:
            global cpu_maxNum
            cpu_path="/sys/devices/system/cpu"
            cpu_index=0
            while True:
                cpu_dir="{}/cpu{}".format(cpu_path,cpu_index)
                if os.path.exists(cpu_dir):
                    cpu_index=cpu_index + 1
                else:
                    break
            cpu_maxNum = int(cpu_index/2)
            command="sudo sh {} get_cpuMaxNum {}".format(sh_path,cpu_maxNum)
            os.system(command)
            return cpu_maxNum
        except:
            return 0

    async def get_tdpMax(self):
        try:
            global cpu_tdpMax
            command="sudo sh {} get_cpuID ".format(sh_path)
            cpu_ID=subprocess.getoutput(command)
            if cpu_ID in (
                'AMD Ryzen 5 5560U with Radeon Graphics',
            ):
                cpu_tdpMax=18
            elif cpu_ID in (
                'AMD Ryzen 7 5800U with Radeon Graphics',
                'AMD Ryzen 7 5825U with Radeon Graphics',
            ):
                cpu_tdpMax=30
            elif cpu_ID in (
                'AMD Ryzen 7 6800U with Radeon Graphics'
            ):
                cpu_tdpMax=40
            else:
                cpu_tdpMax=15
            command="sudo sh {} get_tdpMax {}".format(sh_path,cpu_tdpMax)
            os.system(command)
            return cpu_tdpMax
        except:
            return 0
    
    async def get_gpuFreqMax(self):
        try:
            global gpu_freqMax
            command="sudo sh {} get_cpuID ".format(sh_path)
            cpu_ID=subprocess.getoutput(command)
            if cpu_ID in (
                'AMD Ryzen 5 5560U with Radeon Graphics',
            ):
                gpu_freqMax=1600
            elif cpu_ID in (
                'AMD Ryzen 7 5800U with Radeon Graphics',
                'AMD Ryzen 7 5825U with Radeon Graphics',
            ):
                gpu_freqMax=2000
            elif cpu_ID in (
                'AMD Ryzen 7 6800U with Radeon Graphics'
            ):
                gpu_freqMax=2200
            else:
                gpu_freqMax=1600
            command="sudo sh {} get_gpuFreqMax {}".format(sh_path,gpu_freqMax)
            os.system(command)
            return gpu_freqMax
        except:
            return 0


    def set_gpuAuto(self, value:bool, value2:int):
        try:
            logging.info(f"set_gpuAuto  value: {value} value2: {value2}")
            global gpu_autofreqManager
            if gpu_autofreqManager is None:
                if value:
                    gpu_autofreqManager = GPU_AutoFreqManager()
                    gpu_autofreqManager.GPU_enableAutoFreq(value,value2)
                    gpu_autofreqManager.start()
            else:
                if value:
                    gpu_autofreqManager.GPU_enableAutoFreq(False,0)
                    gpu_autofreqManager = GPU_AutoFreqManager()
                    gpu_autofreqManager.GPU_enableAutoFreq(value,value2)
                    gpu_autofreqManager.start()
                else:
                    gpu_autofreqManager.GPU_enableAutoFreq(False,0)
                    gpu_autofreqManager = None
        except Exception as e:
            logging.info(e)
            return False
            
    def set_gpuFreq(self, value: int):
        try:
            if value >= 0:
                command="sudo sh {} set_clock_limits {} {}".format(sh_path,value,value)
                os.system(command)
                return True
            else:
                return False
        except:
            return False

    def set_cpuTDP(self, value: int):
        try:
            if value >= 3:
                command="sudo sh {} set_cpu_tdp {} {}".format(sh_path,value,value)
                os.system(command)
                return True
            else:
                return False
        except:
            return False

    def set_cpuOnline(self, value: int):
        try:
            command="sudo sh {} set_cpuOnline {} {}".format(sh_path,value,cpu_maxNum)
            os.system(command)
            global cpu_num
            cpu_num=value
            for cpu in range(1, cpu_num*2):
                if cpu_smt or cpu%2==0:
                    command="sudo sh {} set_cpu_online {} {}".format(sh_path,cpu,1)
                else:
                    command="sudo sh {} set_cpu_online {} {}".format(sh_path,cpu,0)
                os.system(command)
            for cpu in range(cpu_num*2,cpu_maxNum*2):
                command="sudo sh {} set_cpu_online {} {}".format(sh_path,cpu,0)
                os.system(command)
            return True
        except:
            return False

    def set_smt(self, value: bool):
        try:
            command="sudo sh {} set_smt {}".format(sh_path,value)
            os.system(command)
            global cpu_smt
            cpu_smt=value
            set_cpu_online(cpu_num)
            return True
        except:
            return False
    
    def set_cpuBoost(self, value: bool):
        try:
            command="sudo sh {} set_cpuBoost {}".format(sh_path,value)
            os.system(command)
            global cpu_boost
            cpu_boost=value
            if cpu_boost:
                command="sudo sh {} set_cpu_boost {}".format(sh_path,1)
            else:
                command="sudo sh {} set_cpu_boost {}".format(sh_path,0)
            os.system(command)
            return True
        except:
            return False
