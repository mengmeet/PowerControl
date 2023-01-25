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
    #GPU频率上限配置
    GPU_FREQ_CONFIG={
        "AMD Ryzen 5 5560U with Radeon Graphics":1600,
        "AMD Ryzen 7 5700U with Radeon Graphics":1900,
        "AMD Ryzen 7 5800U with Radeon Graphics":2000,
        "AMD Ryzen 7 5825U with Radeon Graphics":2000,
        "AMD Ryzen 7 6800U with Radeon Graphics":2200,
        "AMD Ryzen 7 4800U with Radeon Graphics":1800,
        "AMD Ryzen 5 4500U with Radeon Graphics":1500,
        "AMD Athlon Silver 3050e with Radeon Graphics":1000,
    }
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

except Exception as e:
    logging.error(e)
