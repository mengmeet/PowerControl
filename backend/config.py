import logging
import glob
import yaml
import decky_plugin
from helpers import get_homebrew_path

#日志配置
LOG_LOCATION = "/tmp/PowerControl_py.log"
logging.basicConfig(
    level = logging.INFO,
    filename = LOG_LOCATION,
    format="[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s",
    filemode = 'w',
    force = True)

#路径配置
try:
    HOMEBREW_PATH = get_homebrew_path()
    DECKY_PLUGIN_DIR = decky_plugin.DECKY_PLUGIN_DIR
    SH_PATH="{}/backend/sh_tools.sh".format(DECKY_PLUGIN_DIR)
    RYZENADJ_PATH="{}/bin/ryzenadj".format(DECKY_PLUGIN_DIR)
    GPU_DEVICE_PATH = glob.glob("/sys/class/drm/card?/device")[0]
    GPUFREQ_PATH = "{}/pp_od_clk_voltage".format(GPU_DEVICE_PATH)
    GPULEVEL_PATH = "{}/power_dpm_force_performance_level".format(GPU_DEVICE_PATH)
    PLATFORM_PROFILE_PATH  = '/sys/firmware/acpi/platform_profile'
    PLATFORM_PROFILE_CHOICES_PATH = '/sys/firmware/acpi/platform_profile_choices'

    FAN_HWMON_CONFIG_DIR = f"{DECKY_PLUGIN_DIR}/backend/fan_config/hwmon"
    FAN_EC_CONFIG_DIR = f"{DECKY_PLUGIN_DIR}/backend/fan_config/ec"
except Exception as e:
    logging.error(f"路径配置异常|{e}")

#设备信息获取配置
try:
    cpuinfo_path = "/proc/cpuinfo"
    cpuinfo = open(cpuinfo_path, "r").read()
    CPU_ID = cpuinfo.split("model name")[1].split(":")[1].split("\n")[0].strip()
    PRODUCT_NAME = open("/sys/devices/virtual/dmi/id/product_name", "r").read().strip()
    logging.info(f"CPU_ID: {CPU_ID}, PRODUCT_NAME: {PRODUCT_NAME}")
except Exception as e:
    logging.error(f"设备信息配置异常|{e}")

API_URL = "https://api.github.com/repos/mengmeet/PowerControl/releases/latest"

CONFIG_KEY = "PowerControl"

#TDP上限配置
try:
    TDP_LIMIT_CONFIG_PRODUCT={
        "AIR":18,
        "AIR 1S":25,
        "AIR 1S Limited":20,
        "AIR Pro":20,
        "AIR Plus":30,
        "AYANEO 2":30,
        "GEEK":30,
        "GEEK 1S":30,
        "AYANEO 2S":30,
        "ONEXPLAYER Mini":30,
        "NEXT":35,
        "ONEXPLAYER Mini Pro":40,
        "AOKZOE A1 AR07":40,
        "ONEXPLAYER 2 ARP23":45,
        "ONEXPLAYER F1":35,
        "ONEXPLAYER F1 EVA-01":35,
        "G1619-04":45,     #GPD WINMAX2
        "G1618-04":45,     #GPD WIN4
        "G1617-01":30,    #GPD WIN mini
        "ROG Ally RC71L_RC71L":30,
        "ROG Ally RC71L":30,
        "Jupiter":20,
    }
    TDP_LIMIT_CONFIG_CPU={
        "7735HS":65,
        "7735U":40,
        "7735":45,
        "5560U":18,
        "5700U":28,
        "5800U":30,
        "5825U":30,
        "6800U":40,
        "4800U":25,
        "4500U":25,
        "3050e":12,
        "Z1 Extreme":40,
        "7840HS": 65,
        "7840U": 40,
        "7640U": 30,
        "7840": 45,
        "8840U": 40,
        "8840": 45,
        "8850U": 40,
        "8850": 45,
    }
except Exception as e:
    logging.error(f"TDP配置异常|{e}")

#风扇配置
try:

    hwmon_configs = glob.glob(f"{FAN_HWMON_CONFIG_DIR}/*.yml")
    ec_configs = glob.glob(f"{FAN_EC_CONFIG_DIR}/*.yml")

    FAN_HWMON_LIST = {}
    for config in hwmon_configs:
        with open(config, "r") as f:
            data = yaml.safe_load(f)
            name = data['hwmon_name']
            if not name is None:
                FAN_HWMON_LIST[name] = data['fans']
    # logging.info(f"FAN_HWMON_LIST: {FAN_HWMON_LIST}")

    FAN_EC_CONFIG_MAP = {}
    for config in ec_configs:
        with open(config, "r") as f:
            data = yaml.safe_load(f)
            names = data['product_name']
            if not name is None:
                for name in names:
                    FAN_EC_CONFIG_MAP[name] = data['fans']

    FAN_EC_CONFIG = FAN_EC_CONFIG_MAP.get(PRODUCT_NAME, [])
    logging.info(f"FAN_EC_CONFIG: {FAN_EC_CONFIG}")
    # FAN_EC_CONFIG = [{
    #         "ram_reg_addr":0x4E,
    #         "ram_reg_data":0x4F,
    #         "ram_manual_offset":0x47A,
    #         "ram_rpmwrite_offset":0x47A,
    #         "ram_rpmread_offset":0x478,
    #         "ram_rpmread_length":2,

    #         "rpm_write_max":244,
    #         "rpm_value_max":6700
    #     }]
    # logging.info(f"FAN_EC_CONFIG: {FAN_EC_CONFIG}")
    
except Exception as e:
    logging.error(f"风扇配置异常|{e}")
