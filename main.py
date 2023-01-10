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
cpu_avaFreq=[]
cpu_avaMaxFreq=1600000
cpu_avaMinFreq=1600000
cpu_nowLimitFreq=0

gpu_freqMax=1600
gpu_freqMin=200
gpu_nowFreq=0
gpu_autofreqManager = None


sh_path="../plugins/PowerControl/TDP/tdp-control.sh"
 
class GPU_AutoFreqManager (threading.Thread):

    def __init__(self):
        self._gpu_enableAutoFreq = False        #标记是否开启GPU频率优化
        self._gpu_autoFreqCheckInterval = 0.5   #gpu占用率数据检测检测
        self._gpu_adjustFreqInterval = 1.5      #gpu调整间隔
        self._gpu_busyPercentQueue = collections.deque()    #记录gpu占用率的队列
        self._gpu_busyPercentMaxNum = 6     #gpu占用率最多记录几个
        self._gpu_busyPercentNum = 0    #当前gpu占用率个数
        self._gpu_busyPercentSum = 0    #当前所有的gpu占用率总和 方便计算平均值 无需每次遍历队列
        self._gpu_addFreqBase=50        #自动优化频率的基准大小
        self._gpu_minBusyPercent = 75       #优化占用率的区间最小值
        self._gpu_maxBusyPercent = 90       #优化占用率的区间最大值
        threading.Thread.__init__(self)

    def Set_gpuFreq(self, value: int):
        try:
            if value >= 0:
                command="sudo sh {} set_clock_limits {} {}".format(sh_path,value,value)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.info(e)
            return False

    def GPU_enableAutoFreq(self,enable):
        #初始化并开启自动优化线程
        self._gpu_enableAutoFreq = enable
        self._gpu_busyPercentQueue.clear()
        self._gpu_busyPercentSum = 0
        self._gpu_busyPercentNum = 0
        if enable:
            self.start()

    def Get_gpuBusyPercent(self):
        try:
            gpu_busy_percentPath="/sys/class/drm/card0/device/gpu_busy_percent"
            if os.path.exists(gpu_busy_percentPath):
                gpu_busyPercentFile=open(gpu_busy_percentPath,'r')
                gpu_busy_percent = gpu_busyPercentFile.readline().rstrip("\n")
                return int(gpu_busy_percent)
            else:
                logging.info("未找到gpu_busy_percent文件")
                self.GPU_enableAutoFreq(False)
                self.Set_gpuFreq(0)
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
        try:
            global gpu_freqMax
            global gpu_freqMin
            global gpu_nowFreq
            gpu_Avg = self.Get_gpuBusyPercentAvg()
            gpu_addFreqOnce = self._gpu_addFreqBase
            if gpu_Avg >= self._gpu_maxBusyPercent:
                gpu_addFreqOnce = min(gpu_freqMax - gpu_nowFreq,int((gpu_Avg - self._gpu_maxBusyPercent)/5)*self._gpu_addFreqBase)
                if gpu_nowFreq + gpu_addFreqOnce > gpu_freqMax:
                    logging.info(f"当前平均GPU使用率::{gpu_Avg}% 大于目标范围最大值:{self._gpu_maxBusyPercent}% 已达到GPU最大频率{gpu_freqMax}mhz,无法继续增加")
                    logging.info(f"当前的GPU频率:{gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
                else:
                    gpu_nowFreq = gpu_nowFreq + gpu_addFreqOnce
                    self.Set_gpuFreq(gpu_nowFreq)
                    logging.info(f"当前平均GPU使用率::{gpu_Avg}% 大于目标范围最大值:{self._gpu_maxBusyPercent}% 增加{gpu_addFreqOnce}mhz GPU频率")
                    logging.info(f"增加后的GPU频率:{gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
            elif gpu_Avg <= self._gpu_minBusyPercent:
                #gpu_addFreqOnce = min(self._gpu_nowFreq - gpu_freqMin,int((self._gpu_maxBusyPercent - gpu_Avg)*self._gpu_addFreqBase/10))
                gpu_addFreqOnce = min(gpu_nowFreq - gpu_freqMin,self._gpu_addFreqBase)
                if gpu_nowFreq - gpu_addFreqOnce < gpu_freqMin:
                    logging.info(f"当前平均GPU使用率::{gpu_Avg}% 小于目标范围最小值:{self._gpu_minBusyPercent}% 已达到GPU最小频率，无法继续降低")
                    logging.info(f"当前的GPU频率:{gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
                else:
                    gpu_nowFreq = gpu_nowFreq - gpu_addFreqOnce
                    self.Set_gpuFreq(gpu_nowFreq)
                    logging.info(f"当前平均GPU使用率::{gpu_Avg}% 小于目标范围最小值:{self._gpu_minBusyPercent}% 降低{gpu_addFreqOnce}mhz GPU频率")
                    logging.info(f"降低后的GPU频率:{gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
            else:
                logging.info(f"当前平均GPU使用率::{gpu_Avg}% 处于目标范围{self._gpu_minBusyPercent}%-{self._gpu_maxBusyPercent}% 无需修改GPU频率")
                logging.info(f"当前的GPU频率:{gpu_nowFreq} 当前GPU使用率标记队列: {self._gpu_busyPercentQueue}")
        except Exception as e:
            logging.info(e)

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
                await asyncio.sleep(3)

    async def get_hasRyzenadj(self):
        try:
            #查看ryzenadj路径是否有该文件
            ryzenAdj_path="../plugins/PowerControl/bin/ryzenadj"
            if os.path.exists(ryzenAdj_path):
                logging.info("get_hasRyzenadj {}".format(True))
                return True
            else:
                logging.info("get_hasRyzenadj {}".format(False))
                return False
        except Exception as e:
            logging.info(e)
            return False

    async def get_cpuMaxNum(self):
        try:
            global cpu_maxNum
            cpu_path="/sys/devices/system/cpu"
            cpu_index=0
            #循环查找cpu*文件夹，根据找到的文件夹数量确定cpu最大数量
            while True:
                cpu_dir="{}/cpu{}".format(cpu_path,cpu_index)
                if os.path.exists(cpu_dir):
                    cpu_index=cpu_index + 1
                else:
                    break
            #去掉超线程部分，物理核心只有cpu文件夹数量的一半
            cpu_maxNum = int(cpu_index/2)
            command="sudo sh {} get_cpuMaxNum {}".format(sh_path,cpu_maxNum)
            os.system(command)
            return cpu_maxNum
        except Exception as e:
            logging.info(e)
            return 0

    async def get_tdpMax(self):
        try:
            #获取cpu型号并根据型号返回tdp最大值
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
        except Exception as e:
            logging.info(e)
            return 0
    
    async def get_gpuFreqMax(self):
        try:
            global gpu_freqMax
            #获取cpu型号并根据型号返回gpu频率最大值
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
        except Exception as e:
            logging.info(e)
            return 0

    async def get_cpu_AvailableFreq(self):
        try:
            global cpu_avaFreq
            global cpu_avaMaxFreq
            global cpu_avaMinFreq
            #当前已有cpu频率列表，直接返回
            if len(cpu_avaFreq) > 0:
                return cpu_avaFreq
            #获取可用的cpu频率列表
            command="sudo sh {} get_cpu_AvailableFreq ".format(sh_path)
            cpu_avaFreqRes=subprocess.getoutput(command)
            #按空格分割获取的结果并且化为int存入
            cpu_avaFreqStr=cpu_avaFreqRes.split()
            for index in cpu_avaFreqStr:
                cpu_avaFreq.append(int(index))
            #列表不为空时，先排序，最小值取第一个，最大值取倒数第一个
            if len(cpu_avaFreq) >= 1 :
                cpu_avaFreq.sort()
                cpu_avaMinFreq = cpu_avaFreq[0]
                cpu_avaMaxFreq = cpu_avaFreq[len(cpu_avaFreq)-1]
            logger.info(f"cpu_avaFreqData={[cpu_avaFreq,cpu_avaMinFreq,cpu_avaMaxFreq]}")
            return cpu_avaFreq
        except Exception as e:
            logger.info(e)
            return []


    def set_gpuAuto(self, value:bool):
        try:
            logging.info(f"set_gpuAuto  isAuto: {value}")
            global gpu_autofreqManager
            #设置GPU自动频率时判断是否已经有自动频率设置管理器
            if gpu_autofreqManager is None:
                #没有管理器且当前为开启设置，则实例化一个并开启
                if value:
                    gpu_autofreqManager = GPU_AutoFreqManager()
                    gpu_autofreqManager.GPU_enableAutoFreq(True)
            else:
                #有管理器且当前为开启设置，则需要先关闭上一个管理器再开启
                if value:
                    gpu_autofreqManager.GPU_enableAutoFreq(False)
                    gpu_autofreqManager = GPU_AutoFreqManager()
                    gpu_autofreqManager.GPU_enableAutoFreq(True)
                #有管理器且当前为关闭设置，则直接关闭当前的管理器
                else:
                    gpu_autofreqManager.GPU_enableAutoFreq(False)
                    gpu_autofreqManager = None
        except Exception as e:
            logging.info(e)
            return False
            
    def set_gpuFreq(self, value: int):
        try:
            if value >= 0:
                global gpu_nowFreq
                gpu_nowFreq = value
                command="sudo sh {} set_clock_limits {} {}".format(sh_path,value,value)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.info(e)
            return False

    def set_cpuTDP(self, value: int):
        try:
            if value >= 3:
                command="sudo sh {} set_cpu_tdp {} {}".format(sh_path,value,value)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.info(e)
            return False

    def set_cpuOnline(self, value: int):
        try:
            logging.info("set_cpuOnline {} {}".format(value,cpu_maxNum))
            global cpu_num
            cpu_num=value
            #cpu0不可操作，从cpu1到开启物理核心数*2-1进行设置，如果关闭smt则只开启偶数编号的cpu
            for cpu in range(1, cpu_num*2):
                if cpu_smt or cpu%2==0:
                    command="sudo sh {} set_cpu_online {} {}".format(sh_path,cpu,1)
                else:
                    command="sudo sh {} set_cpu_online {} {}".format(sh_path,cpu,0)
                os.system(command)
            #开启的物理核心数*2以后的cpu全部关闭
            for cpu in range(cpu_num*2,cpu_maxNum*2):
                command="sudo sh {} set_cpu_online {} {}".format(sh_path,cpu,0)
                os.system(command)
            return True
        except Exception as e:
            logging.info(e)
            return False

    def set_smt(self, value: bool):
        try:
            logging.info("set_smt {}".format(value))
            global cpu_smt
            cpu_smt=value
            return True
        except Exception as e:
            logging.info(e)
            return False
    
    def set_cpuBoost(self, value: bool):
        try:
            logging.info("set_cpuBoost {}".format(value))
            global cpu_boost
            cpu_boost=value
            if cpu_boost:
                command="sudo sh {} set_cpu_boost {}".format(sh_path,1)
            else:
                command="sudo sh {} set_cpu_boost {}".format(sh_path,0)
            os.system(command)
            return True
        except Exception as e:
            logging.info(e)
            return False

    def check_cpuFreq(self):
        try:
            logging.info(f"check_cpuFreq cpu_nowLimitFreq = {cpu_nowLimitFreq}")
            if cpu_nowLimitFreq == 0:
                return False
            need_set=False
            #检测已开启的cpu的频率是否全部低于限制频率
            for cpu in range(0, cpu_num*2):
                if cpu_smt or cpu%2==0:
                    command="sudo sh {} get_cpu_nowFreq {}".format(sh_path, cpu)
                    cpu_freq=int(subprocess.getoutput(command))
                    if cpu_freq > cpu_nowLimitFreq:
                        need_set=True
                        return True
            return False
        except Exception as e:
            logging.info(e)
            return False

    def set_cpuFreq(self, value: int):
        try:
            global cpu_nowLimitFreq
            logging.info(f"set_cpuFreq cpu_nowLimitFreq = {cpu_nowLimitFreq} value ={value}")
            #频率不同才可设置，设置相同频率时检测当前频率是否已经生效，未生效时再设置一次
            if cpu_nowLimitFreq != value:
                need_set = True
                cpu_nowLimitFreq = value
            else:
                need_set=self.check_cpuFreq(self)
            if need_set:
                #除最小最大频率外 需要先设置到最小才能使该次设置生效
                if cpu_nowLimitFreq != cpu_avaMinFreq or cpu_nowLimitFreq != cpu_avaMaxFreq:
                    for cpu in range(0,cpu_maxNum*2):
                        command="sudo sh {} set_cpu_Freq {} {}".format(sh_path,cpu,cpu_avaMinFreq)
                        os.system(command)
                for cpu in range(0,cpu_maxNum*2):
                    command="sudo sh {} set_cpu_Freq {} {}".format(sh_path,cpu,cpu_nowLimitFreq)
                    os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.info(e)
            return False
    
    def receive_suspendEvent(self):
        try:
            return True
        except Exception as e:
            logging.info(e)
            return False
