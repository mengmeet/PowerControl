import logging
import subprocess
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

#风扇ec偏移配置
try:
    FAN_MANUAL_OFFSET=0
    FAN_RPMWRITE_OFFSET=0
    FAN_RPMREAD_OFFSET=0
    FAN_IS_ADAPTED=False
    if PRODUCT_NAME in (
        "AIR",
        "AIR Pro",
        "AYANEO 2",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_RPMWRITE_MAX=100
        FAN_IS_ADAPTED=True
    elif PRODUCT_NAME in (
        "ONEXPLAYER Mini Pro",
        "AOKZOE A1 AR07",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_RPMWRITE_MAX=255
        FAN_IS_ADAPTED=True
    elif PRODUCT_NAME in (
        "ONEXPLAYER 2 ARP23",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x58
        FAN_RPMWRITE_MAX=184
        FAN_IS_ADAPTED=True
except Exception as e:
    logging.error(f"风扇ec配置异常|{e}")
