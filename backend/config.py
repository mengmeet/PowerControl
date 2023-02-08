import logging
from helpers import get_homebrew_path,get_home_path,get_user

try:
    #日志配置
    LOG_LOCATION = "/tmp/PowerControl_py.log"
    logging.basicConfig(
        level = logging.DEBUG,
        filename = LOG_LOCATION,
        format="[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s",
        filemode = 'w',
        force = True)
    #路径配置
    HOMEBREW_PATH = get_homebrew_path(get_home_path(get_user()))   
    SH_PATH="{}/plugins/PowerControl/backend/sh_tools.sh".format(HOMEBREW_PATH)
    RYZENADJ_PATH="{}/plugins/PowerControl/bin/ryzenadj".format(HOMEBREW_PATH)
    GPUFREQ_PATH = "/sys/class/drm/card0/device/pp_od_clk_voltage"
    #TDP上限配置
    TDP_LIMIT_CONFIG={
        "AMD Ryzen 5 5560U with Radeon Graphics":18,
        "AMD Ryzen 7 5700U with Radeon Graphics":28,
        "AMD Ryzen 7 5800U with Radeon Graphics":30,
        "AMD Ryzen 7 5825U with Radeon Graphics":30,
        "AMD Ryzen 7 6800U with Radeon Graphics":40,
        "AMD Ryzen 7 4800U with Radeon Graphics":25,
        "AMD Ryzen 5 4500U with Radeon Graphics":25,
        "AMD Athlon Silver 3050e with Radeon Graphics":12,
    }
    #风扇ec偏移配置
    system_id = open("/sys/devices/virtual/dmi/id/product_name", "r").read().strip()
    FAN_MANUAL_OFFSET=0
    FAN_RPMWRITE_OFFSET=0
    FAN_RPMREAD_OFFSET=0
    FAN_IS_ADAPTED=False
    if system_id in (
        "AIR",
        "AIR Pro",
        "AYANEO 2",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_IS_ADAPTED=True
    elif system_id in (
        "ONEXPLAYER Mini Pro",
        "AOKZOE A1 AR07"
        "ONEXPLAYER 2 ARP23",
        ):
        FAN_MANUAL_OFFSET=0x4a
        FAN_RPMWRITE_OFFSET=0x4b
        FAN_RPMREAD_OFFSET=0x76
        FAN_IS_ADAPTED=True
    
except Exception as e:
    logging.error(e)
