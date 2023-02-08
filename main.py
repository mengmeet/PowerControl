import subprocess
import asyncio
import os
import sys

#获取插件路径 加载backend中各个py文件
try:
    from helpers import get_homebrew_path,get_home_path,get_user
    HOMEBREW_PATH = get_homebrew_path(get_home_path(get_user()))   
    sys.path.append("{}/plugins/PowerControl/backend".format(HOMEBREW_PATH))
    from config import logging
    from gpu import gpuManager
    from cpu import cpuManager
    from sysInfo import sysInfoManager
    logging.info("PowerControl main.py")
except Exception as e:
    logging.error(e)

class Plugin:
    async def _main(self):
        while True:
                await asyncio.sleep(3)

    async def get_hasRyzenadj(self):
        try:
            return cpuManager.get_hasRyzenadj()
        except Exception as e:
            logging.error(e)
            return False

    async def get_cpuMaxNum(self):
        try:
            return cpuManager.get_cpuMaxNum()
        except Exception as e:
            logging.error(e)
            return 0

    async def get_tdpMax(self):
        try:
            return cpuManager.get_tdpMax()
        except Exception as e:
            logging.error(e)
            return 0
    
    async def get_gpuFreqMax(self):
        try:
            return gpuManager.get_gpuFreqMax()
        except Exception as e:
            logging.error(e)
            return 0
    
    async def get_gpuFreqMin(self):
        try:
            return gpuManager.get_gpuFreqMin()
        except Exception as e:
            logging.error(e)
            return 0

    async def get_cpu_AvailableFreq(self):
        try:
            return cpuManager.get_cpu_AvailableFreq()
        except Exception as e:
            logging.error(e)
            return []
    async def get_language(self):
        try:
            return sysInfoManager.get_language()
        except Exception as e:
            logging.error(e)
            return ""

    async def get_fanRPM(self):
        try:
            return sysInfoManager.get_fanRPM()
        except Exception as e:
            logging.error(e)
            return 0

    def set_gpuAuto(self, value:bool):
        try:
            return gpuManager.set_gpuAuto(value)        
        except Exception as e:
            logging.error(e)
            return False

    def set_gpuAutoMaxFreq(self, value: int):
        try:
            return gpuManager.set_gpuAutoMaxFreq(value)
        except Exception as e:
            logging.error(e)
            return False
    
    def set_gpuAutoMinFreq(self, value: int):
        try:
            return gpuManager.set_gpuAutoMinFreq(value)
        except Exception as e:
            logging.error(e)
            return False

    def set_gpuFreq(self, value: int):
        try:
            return gpuManager.set_gpuFreq(value)
        except Exception as e:
            logging.error(e)
            return False
    
    def set_gpuFreqRange(self, value: int, value2: int):
        try:
            return gpuManager.set_gpuFreqRange(value,value2)
        except Exception as e:
            logging.error(e)
            return False

    def set_cpuTDP(self, value: int):
        try:
            return cpuManager.set_cpuTDP(value)
        except Exception as e:
            logging.error(e)
            return False

    def set_cpuOnline(self, value: int):
        try:
            return cpuManager.set_cpuOnline(value)
        except Exception as e:
            logging.error(e)
            return False

    def set_smt(self, value: bool):
        try:
            return cpuManager.set_smt(value)
        except Exception as e:
            logging.error(e)
            return False
    
    def set_cpuBoost(self, value: bool):
        try:
            return cpuManager.set_cpuBoost(value)
        except Exception as e:
            logging.error(e)
            return False

    def set_cpuFreq(self, value: int):
        try:
            return cpuManager.set_cpuFreq(value)
        except Exception as e:
            logging.error(e)
            return False
    
    def receive_suspendEvent(self):
        try:
            return True
        except Exception as e:
            logging.error(e)
            return False
