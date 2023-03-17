import subprocess
import os
from ec import EC
from config import logging,SH_PATH,RYZENADJ_PATH,PRODUCT_NAME
from config import FAN_MANUAL_OFFSET,FAN_IS_ADAPTED,FAN_RPMREAD_OFFSET,FAN_RPMWRITE_MAX,FAN_RPMWRITE_OFFSET,FAN_RPMVALUE_MAX

class FAN_Manager ():
    def get_fanRPM(self):
        try:
            if FAN_IS_ADAPTED:
                fanRPM=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)
                logging.debug(f"机型已适配fan 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_RPMREAD_OFFSET)} 风扇转速:{fanRPM}")
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
                fanRPMPercent=EC.ReadLonger(FAN_RPMREAD_OFFSET,2)/FAN_RPMVALUE_MAX
                logging.debug(f"机型已适配fan 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_RPMWRITE_OFFSET)} 风扇转速百分比:{fanRPMPercent}")
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
                fanIsAuto=EC.Read(FAN_MANUAL_OFFSET)
                logging.debug(f"机型已适配fan 当前机型:{PRODUCT_NAME} 读取EC地址:{hex(FAN_MANUAL_OFFSET)} 风扇是否自动:{fanIsAuto}")
                return not fanIsAuto
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
                return False
        except Exception as e:
            logging.error(f"获取风扇状态异常:{e}")
            return False
    
    def set_fanAuto(self, value:bool):
        try:
            if FAN_IS_ADAPTED:
                fanIsManual = not value
                EC.Write(FAN_MANUAL_OFFSET,fanIsManual)
                logging.debug(f"机型已适配fan 当前机型:{PRODUCT_NAME} 写入EC地址:{hex(FAN_MANUAL_OFFSET)} 写入风扇是否自动:{fanIsManual}")
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return True       
        except Exception as e:
            logging.error(f"写入风扇状态异常:{e}")
            return False

    def set_fanPercent(self, value:int):
        try:
            if FAN_IS_ADAPTED:
                fanWriteValue = int(value/100*FAN_RPMWRITE_MAX)
                EC.Write(FAN_RPMWRITE_OFFSET,fanWriteValue) 
                logging.debug(f"机型已适配fan 写入EC地址:{hex(FAN_RPMWRITE_OFFSET)} 风扇转速百分比{value} 风扇最大值{FAN_RPMWRITE_MAX} 风扇转速写入值:{fanWriteValue}")
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return True       
        except Exception as e:
            logging.error(f"写入风扇转速异常:{e}")
            return False

fanManager = FAN_Manager()
