import pathlib
import subprocess
import asyncio
import os
import sys
import json
import logging

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
sh_path="../plugins/PowerControl/TDP/tdp-control.sh"

class Plugin:
    async def _main(self):
        # startup
        while True:
            #check_gpu_clock()
            await asyncio.sleep(5)

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
