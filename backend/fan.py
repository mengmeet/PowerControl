import subprocess
import os
from ec import EC
from config import logging,SH_PATH,RYZENADJ_PATH,PRODUCT_NAME
from config import FAN_MANUAL_OFFSET,FAN_IS_ADAPTED,FAN_RPMREAD_OFFSET,FAN_RPMWRITE_MAX,FAN_RPMWRITE_OFFSET,FAN_RPMVALUE_MAX
from config import FAN_ISFIND_HWMON,FAN_HWMON_NAME,FAN_HWMON_PWMENABLE_PATH,FAN_HWMON_PWM_PATH,FAN_HWMON_INPUT_PATH

class FAN_Manager ():
    def get_fanRPM(self):
        try:
            if FAN_IS_ADAPTED:
                if FAN_ISFIND_HWMON:
                    fanRPM=int(open(FAN_HWMON_INPUT_PATH).read().strip())
                    logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} 读取hwmon地址:{FAN_HWMON_INPUT_PATH} 风扇转速:{fanRPM}")
                else:
                    fanRPM=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)
                    logging.debug(f"使用ec数据 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_RPMREAD_OFFSET)} 风扇转速:{fanRPM}")
                return fanRPM
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return 0
        except Exception as e:
            logging.error(f"获取风扇转速异常:{e}")
            return 0
    
    def get_fanRPMPercent(self):
        try:
            if FAN_IS_ADAPTED:
                if FAN_ISFIND_HWMON:
                    fanRPMPercent=int(open(FAN_HWMON_INPUT_PATH).read().strip())/FAN_RPMVALUE_MAX
                    logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} 读取hwmon地址:{FAN_HWMON_INPUT_PATH} 风扇转速百分比:{fanRPMPercent}")
                else:
                    fanRPMPercent=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)/FAN_RPMVALUE_MAX
                    logging.debug(f"使用ec数据 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_RPMWRITE_OFFSET)} 风扇转速百分比:{fanRPMPercent}")
                return fanRPMPercent
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return 0
        except Exception as e:
            logging.error(f"获取风扇转速百分比异常:{e}")
            return 0
    
    def get_fanIsAuto(self):
        try:
            if FAN_IS_ADAPTED:
                if FAN_ISFIND_HWMON:
                    fanIsManual=int(open(FAN_HWMON_PWMENABLE_PATH).read().strip())
                    logging.debug(f"使用hwmon数据 当前机型:{PRODUCT_NAME} 读取hwmon地址:{FAN_HWMON_INPUT_PATH} 风扇是否控制:{fanIsManual}")
                else:
                    fanIsManual=EC.Read(FAN_MANUAL_OFFSET)
                    logging.debug(f"使用ec数据 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_MANUAL_OFFSET)} 风扇是否控制:{fanIsManual}")
                return not fanIsManual
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return False
        except Exception as e:
            logging.error(f"获取风扇状态异常:{e}")
            return False
    
    def set_fanAuto(self, value:bool):
        try:
            if FAN_IS_ADAPTED:
                if FAN_ISFIND_HWMON:
                    fanIsManual = int(not value)
                    open(FAN_HWMON_PWMENABLE_PATH,'w').write(str(fanIsManual))
                    logging.debug(f"写入hwmon数据 当前机型:{PRODUCT_NAME} 写入hwmon地址:{FAN_HWMON_PWMENABLE_PATH} 写入风扇是否控制:{fanIsManual}")
                else:
                    fanIsManual = int(not value)
                    EC.Write(FAN_MANUAL_OFFSET,fanIsManual)
                    logging.debug(f"写入ec数据 当前机型:{PRODUCT_NAME} 写入EC地址:{hex(FAN_MANUAL_OFFSET)} 写入风扇是否控制:{fanIsManual}")
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return True       
        except Exception as e:
            logging.error(f"写入风扇状态异常:{e}")
            return False

    def set_fanPercent(self, value:int):
        try:
            if FAN_IS_ADAPTED:
                if FAN_ISFIND_HWMON:
                    fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                    open(FAN_HWMON_PWM_PATH,'w').write(str(fanWriteValue))
                    logging.debug(f"写入hwmon数据 写入hwmon地址:{FAN_HWMON_PWM_PATH} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
                else:
                    fanWriteValue = max(min(int(value/100*FAN_RPMWRITE_MAX),FAN_RPMWRITE_MAX),0)
                    EC.Write(FAN_RPMWRITE_OFFSET,fanWriteValue)  
                    logging.debug(f"写入ec数据 写入EC地址:{hex(FAN_RPMWRITE_OFFSET)} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return True       
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
