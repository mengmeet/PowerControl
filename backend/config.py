import logging
import subprocess
import os
from helpers import get_homebrew_path,get_home_path,get_user

#日志配置
try:
    LOG_LOCATION = "/tmp/PowerControl_py.log"
    logging.basicConfig(
        level = logging.DEBUG,
        filename = LOG_LOCATION,
        format="[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s",
        filemode = 'w',
        force = True)
except Exception as e:
    logging.error(f"日志配置异常|{e}")

#路径配置
try:
    HOMEBREW_PATH = get_homebrew_path(get_home_path(get_user()))   
    SH_PATH="{}/plugins/PowerControl/backend/sh_tools.sh".format(HOMEBREW_PATH)
    RYZENADJ_PATH="{}/plugins/PowerControl/bin/ryzenadj".format(HOMEBREW_PATH)
    GPUFREQ_PATH = "/sys/class/drm/card0/device/pp_od_clk_voltage"
except Exception as e:
    logging.error(f"路径配置异常|{e}")

#设备信息获取配置
try:
    command="sudo sh {} get_cpuID ".format(SH_PATH)
    CPU_ID=subprocess.getoutput(command)
    PRODUCT_NAME = open("/sys/devices/virtual/dmi/id/product_name", "r").read().strip()
except Exception as e:
    logging.error(f"设备信息配置异常|{e}")

#TDP上限配置
try:
    TDP_LIMIT_CONFIG_PRODUCT={
        "AIR":18,
        "AIR Pro":20,
        "AYANEO 2":30,
        "ONEXPLAYER Mini":30,
        "NEXT":35,
        "ONEXPLAYER Mini Pro":40,
        "AOKZOE A1 AR07":40,
        "ONEXPLAYER 2 ARP23":45,
        "G1619-04":45,     #GPD WINMAX2
        "G1618-04":45,     #GPD WIN4
    }
    TDP_LIMIT_CONFIG_CPU={
        "AMD Ryzen 7 7735HS with Radeon Graphics":45,
        "AMD Ryzen 7 7735U with Radeon Graphics":40,
        "AMD Ryzen 5 5560U with Radeon Graphics":18,
        "AMD Ryzen 7 5700U with Radeon Graphics":28,
        "AMD Ryzen 7 5800U with Radeon Graphics":30,
        "AMD Ryzen 7 5825U with Radeon Graphics":30,
        "AMD Ryzen 7 6800U with Radeon Graphics":40,
        "AMD Ryzen 7 4800U with Radeon Graphics":25,
        "AMD Ryzen 5 4500U with Radeon Graphics":25,
        "AMD Athlon Silver 3050e with Radeon Graphics":12,
    }
except Exception as e:
    logging.error(f"TDP配置异常|{e}")

#风扇配置
try:
    FAN_MANUAL_OFFSET=0     #风扇自动控制ec地址
    FAN_RPMWRITE_OFFSET=0   #风扇写入转速ec地址
    FAN_RPMREAD_OFFSET=0    #风扇读取转速ec地址
    #FAN_MAXTEMP=0    #风扇图表最大温度
    #FAN_MINTEMP=0     #风扇图表最小温度
    #FAN_MAXRPM_PERCENT=0    #风扇图表最大转速百分比
    #FAN_MINRPM_PERCENT=0    #风扇图表最小转速百分比
    FAN_RPMWRITE_MAX=0      #风扇最大转速ec写入值
    FAN_RPMVALUE_MAX=0       #风扇最大转速数值
    FAN_CPUTEMP_PATH=""     #CPU温度路径
    FAN_GPUTEMP_PATH=""     #GPU温度路径
    FAN_IS_ADAPTED=False
    if PRODUCT_NAME in (
        "ONEXPLAYER 2 ARP23",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x58
        FAN_RPMWRITE_MAX=184
        FAN_RPMVALUE_MAX=5000
        FAN_IS_ADAPTED=True    
    elif PRODUCT_NAME in (
        "AIR",
        "AIR Pro",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_RPMWRITE_MAX=64
        FAN_RPMVALUE_MAX=5811
        FAN_IS_ADAPTED=True
    elif PRODUCT_NAME in (
        "AYANEO 2",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_RPMWRITE_MAX=100
        FAN_RPMVALUE_MAX=5811
        FAN_IS_ADAPTED=True
    elif PRODUCT_NAME in (
        "ONEXPLAYER Mini Pro",
        "AOKZOE A1 AR07",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_RPMWRITE_MAX=255
        FAN_RPMVALUE_MAX=4968
        FAN_IS_ADAPTED=True
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
        except Exception as e:
            logging.error(f"温度路径获取异常|{e}")
except Exception as e:
    logging.error(f"风扇配置异常|{e}")
