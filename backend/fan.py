import subprocess
import os
import time
from ec import EC
from config import logging,SH_PATH,RYZENADJ_PATH,PRODUCT_NAME,FAN_IS_ADAPTED
from config import FAN_HWMON_LIST,FAN_MANUAL_OFFSET,FAN_RPMREAD_OFFSET,FAN_RPMWRITE_MAX,FAN_RPMWRITE_OFFSET,FAN_RPMVALUE_MAX
from config import FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_MANUAL_OFFSET,FAN_RAM_RPMWRITE_OFFSET,FAN_RAM_RPMREAD_OFFSET,FAN_RAM_RPMREAD_LENGTH


class FanManager ():
    def __init__(self):
        self.FAN_ISFIND_HWMON=False  #是否找到风扇hwmon
        self.FAN_HWMON_NAME=""       #风扇hwmon名字
        self.FAN_HWMON_PWMENABLE_PATH=""     #风扇自动控制hwmon地址
        self.FAN_HWMON_PWM_PATH=""       #风扇写入转速hwmon地址
        self.FAN_HWMON_INPUT_PATH=""     #风扇读取转速hwmon地址
        self.FAN_HWMON_PWMENABLE_PATH_LIST=[]     #风扇自动控制hwmon地址列表
        self.FAN_HWMON_PWM_PATH_LIST=[]       #风扇写入转速hwmon地址列表
        self.FAN_HWMON_IS_MULTI_PWM=False    #风扇是否有多个PWM
        self.FAN_HWMON_MANUAL_VALUE=1    #风扇手动控制值
        self.FAN_HWMON_AUTO_VALUE=0    #风扇自动控制值
        self.FAN_HWMON_TEMP_FIRST_LIST=[]    #风扇自动控制温度初始点列表
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
                    self.FAN_HWMON_NAME=name
                    self.FAN_ISFIND_HWMON=True
                    pwm_enable_list=FAN_HWMON_LIST[name]["pwm_enable_list"]
                    pwm_list=FAN_HWMON_LIST[name]["pwm_list"]
                    temp_first_list=FAN_HWMON_LIST[name]["temp_first_list"]

                    self.FAN_HWMON_PRECENT_VALUE = FAN_HWMON_LIST[name]["percent_value"] if "percent_value" in FAN_HWMON_LIST[name] else False

                    self.FAN_HWMON_MANUAL_VALUE = FAN_HWMON_LIST[name]["manual_value"] if "manual_value" in FAN_HWMON_LIST[name] else 1
                    self.FAN_HWMON_AUTO_VALUE = FAN_HWMON_LIST[name]["auto_value"] if "auto_value" in FAN_HWMON_LIST[name] else 0

                    # for each temp_first_list item, check if it exists, if it does, add it to the list
                    for temp_first in temp_first_list:
                        temp_first_path = path+"/"+temp_first
                        if os.path.exists(temp_first_path):
                            logging.debug(f"找到风扇自动控制温度初始点 当前机型:{PRODUCT_NAME} hwmon地址:{temp_first_path}")
                            self.FAN_HWMON_TEMP_FIRST_LIST.append(temp_first_path)

                    # for each pwm_enable_list item, check if it exists, if it does, add it to the list
                    for pwm_enable in pwm_enable_list:
                        pwm_enable_path = path+"/"+pwm_enable
                        if os.path.exists(pwm_enable_path):
                            logging.debug(f"找到风扇自动控制hwmon 当前机型:{PRODUCT_NAME} hwmon地址:{pwm_enable_path}")
                            self.FAN_HWMON_PWMENABLE_PATH_LIST.append(pwm_enable_path)

                    # for each pwm_list item, check if it exists, if it does, add it to the list
                    for pwm in pwm_list:
                        pwm_path = path+"/"+pwm
                        if os.path.exists(pwm_path):
                            logging.debug(f"找到风扇写入转速hwmon 当前机型:{PRODUCT_NAME} hwmon地址:{pwm_path}")
                            self.FAN_HWMON_PWM_PATH_LIST.append(pwm_path)
                    if len(self.FAN_HWMON_PWM_PATH_LIST) > 1:
                        self.FAN_HWMON_IS_MULTI_PWM=True

                    self.FAN_HWMON_PWMENABLE_PATH=path+"/"+FAN_HWMON_LIST[name]["pwm_enable"] if "pwm_enable" in FAN_HWMON_LIST[name] else ""
                    self.FAN_HWMON_PWM_PATH=path+"/"+FAN_HWMON_LIST[name]["pwm"] if "pwm" in FAN_HWMON_LIST[name] else ""
                    self.FAN_HWMON_INPUT_PATH=path+"/"+FAN_HWMON_LIST[name]["fan_input"] if "fan_input" in FAN_HWMON_LIST[name] else ""
                    logging.debug(f"FAN_HWMON_NAME={self.FAN_HWMON_NAME}")
                    logging.debug(f"FAN_ISFIND_HWMON={self.FAN_ISFIND_HWMON}")
                    logging.debug(f"FAN_HWMON_PWMENABLE_PATH={self.FAN_HWMON_PWMENABLE_PATH}")
                    logging.debug(f"FAN_HWMON_PWM_PATH={self.FAN_HWMON_PWM_PATH}")
                    logging.debug(f"FAN_HWMON_INPUT_PATH={self.FAN_HWMON_INPUT_PATH}")

            except Exception as e:
                logging.error(e)

        if PRODUCT_NAME == "G1618-04":
            # Initialize GPD WIN4 EC
            ec_chip_id = EC.RamRead(FAN_RAM_REG_ADDR, FAN_RAM_REG_DATA, 0x2000)
            if ec_chip_id == 0x55:
                ec_chip_ver = EC.RamRead(FAN_RAM_REG_ADDR, FAN_RAM_REG_DATA, 0x1060)
                ec_chip_ver |= 0x80
                EC.RamWrite(FAN_RAM_REG_ADDR, FAN_RAM_REG_DATA, 0x1060, ec_chip_ver)


    def get_fanRPM(self):
        try:
            if FAN_IS_ADAPTED:
                try:
                    if self.FAN_ISFIND_HWMON:
                        fanRPM=int(open(self.FAN_HWMON_INPUT_PATH).read().strip())
                        logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} hwmon地址:{self.FAN_HWMON_INPUT_PATH} 风扇转速:{fanRPM}")
                        return fanRPM
                except Exception as e:
                        logging.error(f"使用hwmon获取风扇转速异常:{e}")
                
                try:
                    if FAN_RPMREAD_OFFSET:
                        fanRPM=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)
                        logging.debug(f"使用ECIO数据 当前机型:{PRODUCT_NAME} EC地址:{hex(FAN_RPMREAD_OFFSET)} 风扇转速:{fanRPM}")
                        return fanRPM
                except Exception as e:
                        logging.error(f"使用ECIO获取风扇转速异常:{e}")

                try:
                    if FAN_RAM_RPMREAD_OFFSET:
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
                    if self.FAN_ISFIND_HWMON:
                        fanIsManual=int(open(self.FAN_HWMON_PWMENABLE_PATH).read().strip())
                        logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} 读取hwmon地址:{self.FAN_HWMON_INPUT_PATH} 风扇是否控制:{fanIsManual}")
                        # return not fanIsManual
                        return fanIsManual == self.FAN_HWMON_AUTO_VALUE
                except Exception as e:
                    logging.error(f"使用hwmon获取风扇状态异常:{e}")
                
                try:
                    if FAN_RAM_MANUAL_OFFSET:
                        fanIsManual=EC.RamRead(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_MANUAL_OFFSET)
                        logging.debug(f"使用ECRAM数据 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_RAM_MANUAL_OFFSET)} 风扇是否控制:{fanIsManual}")
                        return not fanIsManual
                except Exception as e:
                    logging.error(f"使用ECRAM获取风扇状态异常:{e}")

                try:
                    if FAN_MANUAL_OFFSET:
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
                    if self.FAN_ISFIND_HWMON and not self.FAN_HWMON_IS_MULTI_PWM:
                        fanIsManual = int(not value)
                        open(self.FAN_HWMON_PWMENABLE_PATH,'w').write(str(fanIsManual))
                        logging.debug(f"写入hwmon数据 当前机型:{PRODUCT_NAME} 写入hwmon地址:{self.FAN_HWMON_PWMENABLE_PATH} 写入风扇是否控制:{fanIsManual}")
                        return True
                except Exception as e:
                    logging.error(f"使用hwmon写入风扇状态异常:{e}")

                try:
                    if self.FAN_HWMON_IS_MULTI_PWM and self.FAN_HWMON_PWMENABLE_PATH_LIST:
                        # 设置风扇自动控制温度初始点 10度, 温度写入要在风扇自动控制之前。因为写入后控制位会复位
                        if self.FAN_HWMON_TEMP_FIRST_LIST:
                            temp = 10;
                            for temp_first in self.FAN_HWMON_TEMP_FIRST_LIST:
                                open(temp_first,'w').write(str(temp))
                                logging.debug(f"写入hwmon数据 当前机型:{PRODUCT_NAME} 写入hwmon地址:{temp_first} 写入值:{temp}")

                        # fanIsManual = int(not value)
                        fanIsManual = self.FAN_HWMON_MANUAL_VALUE if not value else self.FAN_HWMON_AUTO_VALUE
                        for pwm_enable_path in self.FAN_HWMON_PWMENABLE_PATH_LIST:
                            open(pwm_enable_path,'w').write(str(fanIsManual))
                            logging.debug(f"写入hwmon数据 当前机型:{PRODUCT_NAME} 写入hwmon地址:{pwm_enable_path} 写入风扇是否控制:{fanIsManual}")
                        return True
                except Exception as e:
                    logging.error(f"使用hwmon写入风扇状态异常:{e}")
                
                try:
                    if FAN_RAM_MANUAL_OFFSET:
                        fanIsManual = int(not value)
                        EC.RamWrite(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_MANUAL_OFFSET,fanIsManual)
                        logging.debug(f"写入ECRAM数据 当前机型:{PRODUCT_NAME} 写入EC地址:{hex(FAN_RAM_MANUAL_OFFSET)} 写入风扇是否控制:{fanIsManual}")
                        return True
                except Exception as e:
                    logging.error(f"使用ECRAM写入风扇状态异常:{e}")
                
                try:
                    if FAN_MANUAL_OFFSET:
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
                    if self.FAN_ISFIND_HWMON and not self.FAN_HWMON_IS_MULTI_PWM:
                        fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                        open(self.FAN_HWMON_PWM_PATH,'w').write(str(fanWriteValue))
                        logging.debug(f"写入hwmon数据 写入hwmon地址:{self.FAN_HWMON_PWM_PATH} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                        return True
                except Exception as e:
                    logging.error(f"使用hwmon写入风扇转速异常:{e}")

                try:
                    if self.FAN_HWMON_IS_MULTI_PWM and self.FAN_HWMON_PWM_PATH_LIST:
                        time.sleep(0.9) # sleep 不能超过1秒，否则循环会堆积
                        fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                        for pwm_path in self.FAN_HWMON_PWM_PATH_LIST:
                            open(pwm_path,'w').write(str(fanWriteValue))
                            logging.debug(f"写入hwmon数据 写入hwmon地址:{pwm_path} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                        self.set_fanAuto(False)
                        return True
                except Exception as e:
                    logging.error(f"使用hwmon写入风扇转速异常:{e}")
                
                try:
                    if FAN_RAM_RPMWRITE_OFFSET:
                        fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                        EC.RamWrite(FAN_RAM_REG_ADDR,FAN_RAM_REG_DATA,FAN_RAM_RPMWRITE_OFFSET,fanWriteValue)  
                        logging.debug(f"写入ECRAM数据 写入EC地址:{hex(FAN_RAM_RPMWRITE_OFFSET)} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                        return True
                except Exception as e:
                    logging.error(f"使用ECRAM写入风扇转速异常:{e}")
            
                try:
                    if FAN_RPMWRITE_OFFSET:
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

fanManager = FanManager()
