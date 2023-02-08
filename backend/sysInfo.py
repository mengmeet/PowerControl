import subprocess
import collections
import threading
import time
import os
import asyncio
from ec import EC
from config import logging,SH_PATH,FAN_MANUAL_OFFSET,FAN_RPMREAD_OFFSET,FAN_IS_ADAPTED
from helpers import get_user

cpu_busyPercent = 0
has_cpuData = True
gpu_busyPercent = 0
has_gpuData = True

statPath="/proc/stat"
gpu_busy_percentPath="/sys/class/drm/card0/device/gpu_busy_percent"
#GPU单次监控数据
class GPUData:
    def __init__(self):
        #gpu占用率
        self.gpuBusyPercent=0
    
    def setBusyPercent(self,busyPercent):
        try:
            self.gpuBusyPercent = int(busyPercent)
            return True
        except Exception as e:
            logging.error(f"setBusyPercent数据异常 ={StatInfo}")
            return False
    def getBusyPercent(self):
        return self.gpuBusyPercent

#cpu单次监测数据
class CPUData:
    def __init__(self):
        #cpu各种处于状态的时间
        self.usertime=0
        self.nicetime=0
        self.systemtime=0
        self.idletime=0
        self.ioWait=0
        self.irq=0
        self.softIrq=0
        self.steal=0
        self.guest=0
        self.guestnice=0

    def setStatInfo(self,StatInfo):
        try:
            self.usertime=int(StatInfo[1])
            self.nicetime=int(StatInfo[2])
            self.systemtime=int(StatInfo[3])
            self.idletime=int(StatInfo[4])
            self.ioWait=int(StatInfo[5])
            self.irq=int(StatInfo[6])
            self.softIrq=int(StatInfo[7])
            self.steal=int(StatInfo[8])
            self.guest=int(StatInfo[9])
            self.guestnice=int(StatInfo[10])
            return True
        except Exception as e:
            logging.error(f"StatInfo数据异常 ={StatInfo}")
            return False

    def getFreeTime(self):
        idlealltime = self.idletime + self.ioWait
        return max(idlealltime,0)

    def getTotalTime(self):
        usertime = self.usertime - self.guest
        nicetime = self.nicetime - self.guestnice
        idlealltime = self.idletime + self.ioWait
        systemalltime = self.systemtime + self.irq + self.softIrq
        virtalltime = self.guest + self.guestnice
        totaltime = usertime + nicetime + systemalltime + idlealltime + self.steal + virtalltime;
        return max(totaltime,0)

class SysInfoManager (threading.Thread):
    def __init__(self):
        self._cpuDataQueue = collections.deque()    #记录cpu数据的队列
        self._cpuDataQueueHead=0                    #记录cpu数据的队列头元素 用于计算时间差
        self._cpu_NowQueueLength = 0                    #当前cpu记录的数据量
        self._cpu_QueueMaxLength=100                    #cpu记录的最大数据量

        self._gpuDataQueue = collections.deque()    #记录gpu占用率的队列
        self._gpu_busyPercentSum = 0    #当前所有的gpu占用率总和 用于计算平均值 无需每次遍历队列
        self._gpu_NowQueueLength = 0    #当前gpu占用率个数
        self._gpu_QueueMaxLength = 100     #gpu占用率最多记录几个

        self._collectInfoInterval=0.005           #记录数据的间隔
        self._isRunning = False     #标记是否正在运行gpu频率优化

        self._language = "schinese"     #当前客户端使用的语言

        threading.Thread.__init__(self)
    
    def get_language(self):
        try:
            lang_path=f"/home/{get_user()}/.steam/registry.vdf"
            if os.path.exists(lang_path):
                command="sudo sh {} get_language {}".format(SH_PATH, lang_path)
                self._language=subprocess.getoutput(command)
            else:
                logging.error(f"語言檢測路徑{lang_path}不存在該文件")
            logging.info(f"get_language {self._language} path={lang_path}")
            return self._language
        except Exception as e:
            logging.error(e)
            return self._language

    def get_fanRPM(self):
        try:
            if FAN_IS_ADAPTED:
                fanRPM=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)
                return fanRPM
            else:
                return 0
        except Exception as e:
            logging.debug(e)
            return 0

    def updateCpuData(self):
        try:
            cpuData = CPUData()
            global cpu_busyPercent
            StatInfoFile=open(statPath,'r')
            StatInfo = StatInfoFile.readline().rstrip("\n").split()
            if not cpuData.setStatInfo(StatInfo):
                raise Exception()
            self._cpuDataQueue.append(cpuData)
            self._cpu_NowQueueLength = self._cpu_NowQueueLength + 1
            if self._cpu_NowQueueLength>=self._cpu_QueueMaxLength:
                self._cpuDataQueueHead = self._cpuDataQueue.popleft()
                self._cpu_NowQueueLength = self._cpu_NowQueueLength - 1
            elif self._cpu_NowQueueLength == 1:
                self._cpuDataQueueHead = cpuData
            freeTimeIncrease = (cpuData.getFreeTime() - self._cpuDataQueueHead.getFreeTime())
            totaltimeIncrease = (max(cpuData.getTotalTime() - self._cpuDataQueueHead.getTotalTime(),1))
            cpu_busyPercent = 100 - freeTimeIncrease*100/totaltimeIncrease
        except Exception as e:
            has_cpuData = False
            logging.error(f"更新cpu信息时异常 {e}")
    
    def updateGpuData(self):
        try:
            global gpu_busyPercent
            gpuData=GPUData()
            gpu_busyPercentFile=open(gpu_busy_percentPath,'r')
            gpu_busy_percent = gpu_busyPercentFile.readline().rstrip("\n")
            if not gpuData.setBusyPercent(gpu_busy_percent):
                raise Exception()
            self._gpuDataQueue.append(gpuData)
            self._gpu_NowQueueLength = self._gpu_NowQueueLength + 1
            if self._gpu_NowQueueLength >= self._gpu_QueueMaxLength:
                headData=self._gpuDataQueue.popleft()
                self._gpu_busyPercentSum = self._gpu_busyPercentSum - headData.getBusyPercent()
                self._gpu_NowQueueLength = self._gpu_NowQueueLength - 1
            self._gpu_busyPercentSum = self._gpu_busyPercentSum + gpuData.getBusyPercent()
            gpu_busyPercent = self._gpu_busyPercentSum / max(self._gpu_NowQueueLength,1)
        except Exception as e:
            logging.error(f"添加gpu_busy_percent时出现异常{e}")
            has_gpuData = False

    def run(self):
        self._isRunning=True
        while True:
            self.updateCpuData()
            self.updateGpuData()
            #logging.debug(f"cpu_busyPercent={cpu_busyPercent} gpu_busyPercent={gpu_busyPercent}")
            time.sleep(self._collectInfoInterval)

sysInfoManager = SysInfoManager()
sysInfoManager.start()

