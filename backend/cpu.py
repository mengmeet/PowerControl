import subprocess
import os
from config import logging,SH_PATH,RYZENADJ_PATH
from config import TDP_LIMIT_CONFIG_CPU,TDP_LIMIT_CONFIG_PRODUCT,PRODUCT_NAME,CPU_ID
#初始参数
cpu_boost=True
cpu_smt=True
cpu_num=4
cpu_maxNum=0
cpu_tdpMax=15
cpu_avaFreq=[]
cpu_avaMaxFreq=1600000
cpu_avaMinFreq=1600000
cpu_nowLimitFreq=0

class CPU_Manager ():

    def get_hasRyzenadj(self):
        try:
            #查看ryzenadj路径是否有该文件
            if os.path.exists(RYZENADJ_PATH):
                logging.info("get_hasRyzenadj {}".format(True))
                return True
            else:
                logging.info("get_hasRyzenadj {}".format(False))
                return False
        except Exception as e:
            logging.error(e)
            return False

    def get_cpuMaxNum(self):
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
            logging.info("get_cpuMaxNum {}".format(cpu_maxNum))
            return cpu_maxNum
        except Exception as e:
            logging.error(e)
            return 0

    def get_tdpMax(self):
        try:
            #根据机器型号或者CPU型号返回tdp最大值
            global cpu_tdpMax
            if PRODUCT_NAME in TDP_LIMIT_CONFIG_PRODUCT:
                cpu_tdpMax=TDP_LIMIT_CONFIG_PRODUCT[PRODUCT_NAME]
            elif CPU_ID in TDP_LIMIT_CONFIG_CPU:
                cpu_tdpMax=TDP_LIMIT_CONFIG_CPU[CPU_ID]
            else:
                cpu_tdpMax=15
            logging.info("get_tdpMax {}".format(cpu_tdpMax))
            return cpu_tdpMax
        except Exception as e:
            logging.error(e)
            return 0

    def get_cpu_AvailableFreq(self):
        try:
            global cpu_avaFreq
            global cpu_avaMaxFreq
            global cpu_avaMinFreq
            #当前已有cpu频率列表，直接返回
            if len(cpu_avaFreq) > 0:
                return cpu_avaFreq
            #获取可用的cpu频率列表
            command="sudo sh {} get_cpu_AvailableFreq ".format(SH_PATH)
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
            logging.info(f"cpu_avaFreqData={[cpu_avaFreq,cpu_avaMinFreq,cpu_avaMaxFreq]}")
            return cpu_avaFreq
        except Exception as e:
            logging.error(e)
            return []

    def set_cpuTDP(self, value: int):
        try:
            if value >= 3:
                command="sudo sh {} set_cpu_tdp {} {} {}".format(SH_PATH,RYZENADJ_PATH,value,value)
                os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.error(e)
            return False

    def set_cpuOnline(self, value: int):
        try:
            logging.debug("set_cpuOnline {} {}".format(value,cpu_maxNum))
            global cpu_num
            cpu_num=value
            #cpu0不可操作，从cpu1到开启物理核心数*2-1进行设置，如果关闭smt则只开启偶数编号的cpu
            for cpu in range(1, cpu_num*2):
                if cpu_smt or cpu%2==0:
                    command="sudo sh {} set_cpu_online {} {}".format(SH_PATH,cpu,1)
                else:
                    command="sudo sh {} set_cpu_online {} {}".format(SH_PATH,cpu,0)
                os.system(command)
            #开启的物理核心数*2以后的cpu全部关闭
            for cpu in range(cpu_num*2,cpu_maxNum*2):
                command="sudo sh {} set_cpu_online {} {}".format(SH_PATH,cpu,0)
                os.system(command)
            return True
        except Exception as e:
            logging.error(e)
            return False

    def set_smt(self, value: bool):
        try:
            logging.debug("set_smt {}".format(value))
            global cpu_smt
            cpu_smt=value
            return True
        except Exception as e:
            logging.error(e)
            return False
    
    def set_cpuBoost(self, value: bool):
        try:
            logging.debug("set_cpuBoost {}".format(value))
            global cpu_boost
            cpu_boost=value
            if cpu_boost:
                command="sudo sh {} set_cpu_boost {}".format(SH_PATH,1)
            else:
                command="sudo sh {} set_cpu_boost {}".format(SH_PATH,0)
            os.system(command)
            return True
        except Exception as e:
            logging.error(e)
            return False

    def check_cpuFreq(self):
        try:
            logging.debug(f"check_cpuFreq cpu_nowLimitFreq = {cpu_nowLimitFreq}")
            if cpu_nowLimitFreq == 0:
                return False
            need_set=False
            #检测已开启的cpu的频率是否全部低于限制频率
            for cpu in range(0, cpu_num*2):
                if cpu_smt or cpu%2==0:
                    command="sudo sh {} get_cpu_nowFreq {}".format(SH_PATH, cpu)
                    cpu_freq=int(subprocess.getoutput(command))
                    if cpu_freq > cpu_nowLimitFreq:
                        need_set=True
                        return True
            return False
        except Exception as e:
            logging.error(e)
            return False

    def set_cpuFreq(self, value: int):
        try:
            global cpu_nowLimitFreq
            logging.debug(f"set_cpuFreq cpu_nowLimitFreq = {cpu_nowLimitFreq} value ={value}")
            #频率不同才可设置，设置相同频率时检测当前频率是否已经生效，未生效时再设置一次
            if cpu_nowLimitFreq != value:
                need_set = True
                cpu_nowLimitFreq = value
            else:
                need_set=self.check_cpuFreq()
            if need_set:
                #除最小最大频率外 需要先设置到最小才能使该次设置生效
                if cpu_nowLimitFreq != cpu_avaMinFreq or cpu_nowLimitFreq != cpu_avaMaxFreq:
                    for cpu in range(0,cpu_maxNum*2):
                        command="sudo sh {} set_cpu_Freq {} {}".format(SH_PATH,cpu,cpu_avaMinFreq)
                        os.system(command)
                for cpu in range(0,cpu_maxNum*2):
                    command="sudo sh {} set_cpu_Freq {} {}".format(SH_PATH,cpu,cpu_nowLimitFreq)
                    os.system(command)
                return True
            else:
                return False
        except Exception as e:
            logging.error(e)
            return False

cpuManager = CPU_Manager()
