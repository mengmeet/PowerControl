import subprocess
import collections
import threading
import time
import os
from config import logging,SH_PATH,GPUFREQ_PATH
import sysInfo
#初始参数
gpu_freqMax=1600
gpu_freqMin=200
gpu_nowFreq=0
gpu_autofreqManager = None
gpu_autoFreqMax=1600
gpu_autoFreqMin=200
gpu_rangeFreqMax=1600
gpu_rangeFreqMin=200

class GPU_AutoFreqManager (threading.Thread):

    def __init__(self):
        self._gpu_enableAutoFreq = False        #标记是否开启GPU频率优化
        self._gpu_autoFreqCheckInterval = 0.005   #gpu占用率数据检测间隔
        self._gpu_adjustFreqInterval = 0.5      #gpu调整间隔
        self._gpu_addFreqBase=50        #自动优化频率的基准大小
        self._gpu_minBusyPercent = 75       #优化占用率的区间最小值
        self._gpu_maxBusyPercent = 90       #优化占用率的区间最大值
        self._cpu_maxBusyPercent = 80       #cpu最大占用率 超过该占用率认定为gpu抢电 需要降低频率给cpu供电
        self._isRunning = False     #标记是否正在运行gpu频率优化
        threading.Thread.__init__(self)

    def Check_gpuNeedSet(self, freqMin:int, freqMax:int):
        try:
            #可查询gpu设置频率时，判断当前设置是否与系统相同
            if os.path.exists(GPUFREQ_PATH):
                maxCommand="sudo sh {} get_gpu_nowFreqMaxLimit ".format(SH_PATH)
                minCommand="sudo sh {} get_gpu_nowFreqMinLimit ".format(SH_PATH)
                qfreqMax=int(subprocess.getoutput(maxCommand))
                qfreqMin=int(subprocess.getoutput(minCommand))
                logging.info(f"当前要设置的频率区间 freqMin={freqMin} freqMax={freqMax} 当前系统频率区间 qfreqMin={qfreqMin} qfreMax={qfreqMax}  是否满足设置条件{qfreqMin!=freqMin or qfreqMax != freqMax}")
                return qfreqMin!=freqMin or qfreqMax != freqMax
            #查不到gpu设置频率时，只要合法则进行设置
            else:
                logging.info(f"当前要设置的频率区间 freqMin={freqMin} freqMax={freqMax} 当前频率={gpu_nowFreq} 是否满足设置条件{freqMax>=0 and freqMin >=0}")
                return freqMax>=0 and freqMin >=0 
        except Exception as e:
            logging.error(e)
            return freqMax>=0 and freqMin >=0

    def Set_gpuFreq(self, freqMin: int, freqMax:int):
        try:
            if self.Check_gpuNeedSet(freqMin, freqMax):
                command="sudo sh {} set_clock_limits {} {}".format(SH_PATH,freqMin,freqMax)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.error(e)
            return False

    def GPU_enableAutoFreq(self,enable):
        #初始化并开启自动优化线程
        self._gpu_enableAutoFreq = enable
        if enable:
            self.start()
    
    def check_LegalGPUFreq(self):
        try:
            global gpu_autoFreqMax
            global gpu_autoFreqMin
            global gpu_nowFreq
            gpu_oldFreq = gpu_nowFreq
            gpu_nowFreq = min(gpu_nowFreq,gpu_autoFreqMax)
            gpu_nowFreq = max(gpu_nowFreq, gpu_autoFreqMin)
            if gpu_oldFreq != gpu_nowFreq:
                self.Set_gpuFreq(gpu_nowFreq,gpu_nowFreq)
                logging.debug(f"当前的GPU频率:{gpu_oldFreq}mhz 不在限制范围  GPU最大限制频率{gpu_autoFreqMax}mhz GPU最小限制频率{gpu_autoFreqMin}mhz")
        except Exception as e:
            logging.error(e)

    def optimization_GPUFreq(self):
        try:
            global gpu_autoFreqMax
            global gpu_autoFreqMin
            global gpu_nowFreq
            gpu_addFreqOnce = self._gpu_addFreqBase
            gpu_avgPercent = sysInfo.gpu_busyPercent
            cpu_avgPercent = sysInfo.cpu_busyPercent
            #cpu占用率过高 判定为被抢电 降低一点频率让电
            if cpu_avgPercent >= self._cpu_maxBusyPercent:
                gpu_addFreqOnce = min(gpu_nowFreq - gpu_autoFreqMin,self._gpu_addFreqBase)
                gpu_nowFreq = gpu_nowFreq - gpu_addFreqOnce
                self.Set_gpuFreq(gpu_nowFreq,gpu_nowFreq)
                logging.debug(f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 大于最大值:{self._cpu_maxBusyPercent}% 降低{gpu_addFreqOnce}mhz GPU频率 降低后的GPU频率:{gpu_nowFreq} ")
            #未抢电则判断gpu占用率 过高时认定gpu不够用 增加频率
            elif gpu_avgPercent >= self._gpu_maxBusyPercent:
                gpu_addFreqOnce = min(gpu_autoFreqMax - gpu_nowFreq, self._gpu_addFreqBase)
                gpu_nowFreq = gpu_nowFreq + gpu_addFreqOnce*2 if gpu_avgPercent>=99 else gpu_nowFreq + gpu_addFreqOnce
                self.Set_gpuFreq(gpu_nowFreq,gpu_nowFreq)
                logging.debug(f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 大于目标范围最大值:{self._gpu_maxBusyPercent}% 增加{gpu_addFreqOnce}mhz GPU频率 增加后的GPU频率:{gpu_nowFreq}")
            #未抢电则判断gpu占用率 过低时认定gpu富余 降低频率
            elif gpu_avgPercent <= self._gpu_minBusyPercent:
                gpu_addFreqOnce = min(gpu_nowFreq - gpu_autoFreqMin,self._gpu_addFreqBase)
                gpu_nowFreq = gpu_nowFreq - gpu_addFreqOnce
                self.Set_gpuFreq(gpu_nowFreq,gpu_nowFreq)
                logging.debug(f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 小于目标范围最小值:{self._gpu_minBusyPercent}% 降低{gpu_addFreqOnce}mhz GPU频率 降低后的GPU频率:{gpu_nowFreq} ")
            #不做任何调整
            else:
                logging.debug(f"当前平均CPU使用率::{cpu_avgPercent}% 当前平均GPU使用率::{gpu_avgPercent}% 处于目标范围{self._gpu_minBusyPercent}%-{self._gpu_maxBusyPercent}% 无需修改GPU频率  当前的GPU频率:{gpu_nowFreq}")
            self.check_LegalGPUFreq()
        except Exception as e:
            logging.error(e)

    def run(self):
        logging.info("开始自动优化频率:" + self.name)
        adjust_count = 0
        self._isRunning = True
        while True:
            try:
                if not self._gpu_enableAutoFreq:
                    self._isRunning = False
                    logging.info("退出自动优化频率：" + self.name)
                    break
                if not sysInfo.has_gpuData:
                    self.GPU_enableAutoFreq(False)
                    self.Set_gpuFreq(gpu_autoFreqMin,gpu_autoFreqMax)
                    self._isRunning = False
                    logging.info("退出自动优化频率：" + self.name)
                    break
                adjust_count = adjust_count + 1
                if adjust_count >= int(self._gpu_adjustFreqInterval / self._gpu_autoFreqCheckInterval):
                    self.optimization_GPUFreq()
                    adjust_count = 0
                time.sleep(self._gpu_autoFreqCheckInterval)
            except Exception as e:
                logging.error(e)
                time.sleep(self._gpu_autoFreqCheckInterval)

class GPU_Manager ():

    def get_gpuFreqMax(self):
        try:
            global gpu_freqMax
            maxCommand="sudo sh {} get_gpuFreqMax".format(SH_PATH)
            gpu_freqMax=int(subprocess.getoutput(maxCommand))
            logging.info("get_gpuFreqMax {}".format(gpu_freqMax))
            return gpu_freqMax
        except Exception as e:
            logging.error(e)
            logging.error(f"maxResult={subprocess.getoutput(maxCommand)}|")
            return 0
    
    def get_gpuFreqMin(self):
        try:
            global gpu_freqMin
            minCommand="sudo sh {} get_gpuFreqMin".format(SH_PATH)
            gpu_freqMin=int(subprocess.getoutput(minCommand))
            logging.info("get_gpuFreqMin {}".format(gpu_freqMin))
            return gpu_freqMin
        except Exception as e:
            logging.error(e)
            logging.error(f"minResult={subprocess.getoutput(minCommand)}|")
            return 0

    def set_gpuAuto(self, value:bool):
        try:
            logging.info(f"set_gpuAuto  isAuto: {value}")
            global gpu_autofreqManager
            #设置GPU自动频率时判断是否已经有自动频率设置管理器
            if gpu_autofreqManager is None or not gpu_autofreqManager._isRunning:
                #没有管理器或者当前管理器已经停止运行，且当前为开启设置，则实例化一个并开启
                if value:
                    gpu_autofreqManager = GPU_AutoFreqManager()
                    gpu_autofreqManager.GPU_enableAutoFreq(True)
            else:
                #有管理器且管理器正在运行，且当前为关闭设置，则直接关闭当前的管理器
                if not value:
                    gpu_autofreqManager.GPU_enableAutoFreq(False)
                    gpu_autofreqManager = None
                    
        except Exception as e:
            logging.error(e)
            return False

    def set_gpuAutoMaxFreq(self, value: int):
        try:
            logging.info(f"set_gpuAutoMaxFreq {value}")
            global gpu_autoFreqMax
            if value >= gpu_freqMax:
                gpu_autoFreqMax = gpu_freqMax
            elif value <= gpu_freqMin:
                gpu_autoFreqMax = gpu_freqMin
            else:
                gpu_autoFreqMax = value
        except Exception as e:
            logging.error(e)
            return False
    
    def set_gpuAutoMinFreq(self, value: int):
        try:
            logging.info(f"set_gpuAutoMinFreq {value}")
            global gpu_autoFreqMin
            if value >= gpu_freqMax:
                gpu_autoFreqMin = gpu_freqMax
            elif value <= gpu_freqMin:
                gpu_autoFreqMin = gpu_freqMin
            else:
                gpu_autoFreqMin = value
        except Exception as e:
            logging.error(e)
            return False

    def set_gpuFreq(self, value: int):
        try:
            if value >= 0:
                global gpu_nowFreq
                gpu_nowFreq = value
                command="sudo sh {} set_clock_limits {} {}".format(SH_PATH,value,value)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.error(e)
            return False

    def set_gpuFreqRange(self, value: int, value2:int):
        try:
            if value >= 0:
                global gpu_rangeFreqMin
                global gpu_rangeFreqMax
                gpu_rangeFreqMax = value2
                gpu_rangeFreqMin = value
                command="sudo sh {} set_clock_limits {} {}".format(SH_PATH,value,value2)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.error(e)
            return False

gpuManager = GPU_Manager()
