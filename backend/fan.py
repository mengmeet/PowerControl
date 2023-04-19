import subprocess
import os
from ec import EC
from config import logging,SH_PATH,RYZENADJ_PATH,PRODUCT_NAME
from config import FAN_HWMON_LIST,FAN_MANUAL_OFFSET,FAN_RPMREAD_OFFSET,FAN_RPMWRITE_MAX,FAN_RPMWRITE_OFFSET,FAN_RPMVALUE_MAX,FAN_ECIO_ADAPTED
from config import FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_MANUAL_OFFSET,FAN_RAM_RPMWRITE_OFFSET,FAN_RAM_RPMREAD_OFFSET,FAN_RAM_RPMREAD_LENGTH,FAN_ECRAM_ADAPTED
FAN_ISFIND_HWMON=False  #是否找到风扇hwmon
FAN_HWMON_NAME=""       #风扇hwmon名字
FAN_HWMON_PWMENABLE_PATH=""     #风扇自动控制hwmon地址
FAN_HWMON_PWM_PATH=""       #风扇写入转速hwmon地址
FAN_HWMON_INPUT_PATH=""     #风扇读取转速hwmon地址
FAN_IS_ADAPTED=False        #风扇是否适配

class FAN_Manager ():
    def __init__(self):
        global FAN_ISFIND_HWMON
        global FAN_HWMON_NAME
        global FAN_HWMON_PWMENABLE_PATH
        global FAN_HWMON_PWM_PATH
        global FAN_HWMON_INPUT_PATH
        global FAN_IS_ADAPTED
        hwmon_path="/sys/class/hwmon"
        hwmon_files=os.listdir(hwmon_path)
        for file in hwmon_files:
            try:
                path=hwmon_path+"/"+file
                name = open(path+"/name").read().strip()
                if(name=="amdgpu"):
                    temp=int(open(path+"/temp1_input").read().strip())
                    FAN_GPUTEMP_PATH=path+"/temp1_input"
                if(name=="k10temp"):
                    temp=int(open(path+"/temp1_input").read().strip())
                    FAN_CPUTEMP_PATH=path+"/temp1_input"
                if(name in FAN_HWMON_LIST):
                    FAN_HWMON_NAME=name
                    FAN_ISFIND_HWMON=True
                    FAN_HWMON_PWMENABLE_PATH=path+"/"+FAN_HWMON_LIST[name]["pwm_enable"]
                    FAN_HWMON_PWM_PATH=path+"/"+FAN_HWMON_LIST[name]["pwm"]
                    FAN_HWMON_INPUT_PATH=path+"/"+FAN_HWMON_LIST[name]["fan_input"]
                    logging.debug(f"FAN_HWMON_NAME={FAN_HWMON_NAME}")
                    logging.debug(f"FAN_ISFIND_HWMON={FAN_ISFIND_HWMON}")
                    logging.debug(f"FAN_HWMON_PWMENABLE_PATH={FAN_HWMON_PWMENABLE_PATH}")
                    logging.debug(f"FAN_HWMON_PWM_PATH={FAN_HWMON_PWM_PATH}")
                    logging.debug(f"FAN_HWMON_INPUT_PATH={FAN_HWMON_INPUT_PATH}")
            except Exception as e:
                logging.error(e)
        FAN_IS_ADAPTED = FAN_ISFIND_HWMON or FAN_ECRAM_ADAPTED or FAN_ECIO_ADAPTED


    def get_fanRPM(self):
        try:
            if FAN_IS_ADAPTED:
                try:
                    if FAN_ISFIND_HWMON:
                        fanRPM=int(open(FAN_HWMON_INPUT_PATH).read().strip())
                        logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} hwmon地址:{FAN_HWMON_INPUT_PATH} 风扇转速:{fanRPM}")
                        return fanRPM
                except Exception as e:
                        logging.error(f"使用hwmon获取风扇转速异常:{e}")
                
                try:
                    if FAN_ECIO_ADAPTED:
                        fanRPM=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)
                        logging.debug(f"使用ECIO数据 当前机型:{PRODUCT_NAME} EC地址:{hex(FAN_RPMREAD_OFFSET)} 风扇转速:{fanRPM}")
                        return fanRPM
                except Exception as e:
                        logging.error(f"使用ECIO获取风扇转速异常:{e}")
                
                try:
                    if FAN_ECRAM_ADAPTED:
                        if FAN_RAM_RPMREAD_LENGTH > 0:
                            fanRPM=EC.RamReadLonger(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_RPMREAD_OFFSET,FAN_RAM_RPMREAD_LENGTH)
                        else:
                            fanRPM=int(EC.RamRead(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_RPMREAD_OFFSET) * FAN_RPMVALUE_MAX / FAN_RPMWRITE_MAX)
                        logging.debug(f"使用ECRAM数据 当前机型:{PRODUCT_NAME} EC_ADDR:{hex(FAN_RAM_REG_ADDR)} EC_DATA={hex(FAN_RAM_REG_DATA)} EC地址:{hex(FAN_RAM_RPMREAD_OFFSET)} 风扇转速:{fanRPM}")
                        return fanRPM
                except Exception as e:
                        logging.error(f"使用ECRAM获取风扇转速异常:{e}")
                
                return 0
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return 0
        except Exception as e:
            logging.error(f"获取风扇转速异常:{e}")
            return 0
    
    def get_fanIsAuto(self):
        try:
            if FAN_IS_ADAPTED:
                try:
                    if FAN_ISFIND_HWMON:
                        fanIsManual=int(open(FAN_HWMON_PWMENABLE_PATH).read().strip())
                        logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} 读取hwmon地址:{FAN_HWMON_INPUT_PATH} 风扇是否控制:{fanIsManual}")
                        return not fanIsManual
                except Exception as e:
                    logging.error(f"使用hwmon获取风扇状态异常:{e}")
                
                try:
                    if FAN_ECRAM_ADAPTED:
                        fanIsManual=EC.RamRead(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_MANUAL_OFFSET)
                        logging.debug(f"使用ECRAM数据 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_RAM_MANUAL_OFFSET)} 风扇是否控制:{fanIsManual}")
                        return not fanIsManual
                except Exception as e:
                    logging.error(f"使用ECRAM获取风扇状态异常:{e}")

                try:
                    if FAN_ECIO_ADAPTED:
                        fanIsManual=EC.Read(FAN_MANUAL_OFFSET)
                        logging.debug(f"使用ECIO数据 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_MANUAL_OFFSET)} 风扇是否控制:{fanIsManual}")
                        return not fanIsManual
                except Exception as e:
                    logging.error(f"使用ECIO获取风扇状态异常:{e}")

                return False
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return False
        except Exception as e:
            logging.error(f"获取风扇状态异常:{e}")
            return False
    
    def set_fanAuto(self, value:bool):
        try:
            if FAN_IS_ADAPTED:
                try:
                    if FAN_ISFIND_HWMON:
                        fanIsManual = int(not value)
                        open(FAN_HWMON_PWMENABLE_PATH,'w').write(str(fanIsManual))
                        logging.debug(f"写入hwmon数据 当前机型:{PRODUCT_NAME} 写入hwmon地址:{FAN_HWMON_PWMENABLE_PATH} 写入风扇是否控制:{fanIsManual}")
                        return True
                except Exception as e:
                    logging.error(f"使用hwmon写入风扇状态异常:{e}")
                
                try:
                    if FAN_ECRAM_ADAPTED:
                        fanIsManual = int(not value)
                        EC.RamWrite(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_MANUAL_OFFSET,fanIsManual)
                        logging.debug(f"写入ECRAM数据 当前机型:{PRODUCT_NAME} 写入EC地址:{hex(FAN_RAM_MANUAL_OFFSET)} 写入风扇是否控制:{fanIsManual}")
                        return True
                except Exception as e:
                    logging.error(f"使用ECRAM写入风扇状态异常:{e}")
                
                try:
                    if FAN_ECRAM_ADAPTED:
                        fanIsManual = int(not value)
                        EC.Write(FAN_MANUAL_OFFSET,fanIsManual)
                        logging.debug(f"写入ECIO数据 当前机型:{PRODUCT_NAME} 写入EC地址:{hex(FAN_MANUAL_OFFSET)} 写入风扇是否控制:{fanIsManual}")
                        return True
                except Exception as e:
                    logging.error(f"使用ECIO写入风扇状态异常:{e}")
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return False       
        except Exception as e:
            logging.error(f"写入风扇状态异常:{e}")
            return False

    def set_fanPercent(self, value:int):
        try:
            if FAN_IS_ADAPTED:
                try:
                    if FAN_ISFIND_HWMON:
                        fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                        open(FAN_HWMON_PWM_PATH,'w').write(str(fanWriteValue))
                        logging.debug(f"写入hwmon数据 写入hwmon地址:{FAN_HWMON_PWM_PATH} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                        return True
                except Exception as e:
                    logging.error(f"使用hwmon写入风扇转速异常:{e}")
                
                try:
                    if FAN_ECRAM_ADAPTED:
                        fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                        EC.RamWrite(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_RPMWRITE_OFFSET,fanWriteValue)  
                        logging.debug(f"写入ECRAM数据 写入EC地址:{hex(FAN_RAM_RPMWRITE_OFFSET)} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                        return True
                except Exception as e:
                    logging.error(f"使用ECRAM写入风扇转速异常:{e}")
            
                try:
                    if FAN_ECIO_ADAPTED:
                        fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                        EC.Write(FAN_RPMWRITE_OFFSET,fanWriteValue)  
                        logging.debug(f"写入ECIO数据 写入EC地址:{hex(FAN_RPMWRITE_OFFSET)} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                        return True
                except Exception as e:
                    logging.error(f"使用ECIO写入风扇转速异常:{e}")   
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return False       
        except Exception as e:
            logging.error(f"写入风扇转速异常:{e}")
            return False
    
    def get_fanMAXRPM(self):
        try:
            if FAN_IS_ADAPTED:
                logging.debug(f"机型已适配fan 最大风扇转速:{FAN_RPMVALUE_MAX}")
                return FAN_RPMVALUE_MAX
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return 0    
        except Exception as e:
            logging.error(f"获取风扇最大转速异常:{e}")
            return 0
    
    def get_fanIsAdapted(self):
        try:
            if FAN_IS_ADAPTED:
                logging.debug(f"机型已适配fan 当前机型:{PRODUCT_NAME}")
                return True
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return False    
        except Exception as e:
            logging.error(f"获取机型适配异常:{e}")
            return 0

fanManager = FAN_Manager()
