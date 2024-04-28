import json
import logging
import glob
import yaml
import traceback
import decky_plugin
from helpers import get_homebrew_path
from logging_handler import SystemdHandler

# 日志配置
LOG_LOCATION = "/tmp/PowerControl_py.log"
try:
    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s",
        force=True,
        handlers=[
            SystemdHandler(),
            logging.FileHandler(filename=LOG_LOCATION, mode="w"),
        ],
    )
except Exception as e:
    stack = traceback.format_exc()
    with open(LOG_LOCATION, "a") as f:
        f.write(str(e))
        f.write(stack)

# 路径配置
try:
    HOMEBREW_PATH = get_homebrew_path()
    DECKY_PLUGIN_DIR = decky_plugin.DECKY_PLUGIN_DIR
    SH_PATH = "{}/backend/sh_tools.sh".format(DECKY_PLUGIN_DIR)
    RYZENADJ_PATH = "{}/bin/ryzenadj".format(DECKY_PLUGIN_DIR)
    GPU_DEVICE_PATH = glob.glob("/sys/class/drm/card?/device")[0]
    GPUFREQ_PATH = "{}/pp_od_clk_voltage".format(GPU_DEVICE_PATH)
    GPULEVEL_PATH = "{}/power_dpm_force_performance_level".format(GPU_DEVICE_PATH)
    PLATFORM_PROFILE_PATH = "/sys/firmware/acpi/platform_profile"
    PLATFORM_PROFILE_CHOICES_PATH = "/sys/firmware/acpi/platform_profile_choices"

    FAN_HWMON_CONFIG_DIR = f"{DECKY_PLUGIN_DIR}/backend/fan_config/hwmon"
    FAN_EC_CONFIG_DIR = f"{DECKY_PLUGIN_DIR}/backend/fan_config/ec"
except Exception as e:
    logging.error(f"路径配置异常|{e}")

# 设备信息获取配置
try:
    cpuinfo_path = "/proc/cpuinfo"
    cpuinfo = open(cpuinfo_path, "r").read()
    CPU_ID = cpuinfo.split("model name")[1].split(":")[1].split("\n")[0].strip()
    PRODUCT_NAME = open("/sys/devices/virtual/dmi/id/product_name", "r").read().strip()
    PRODUCT_VERSION = (
        open("/sys/devices/virtual/dmi/id/product_version", "r").read().strip()
    )
    logging.info(
        f"CPU_ID: {CPU_ID}, PRODUCT_NAME: {PRODUCT_NAME}, PRODUCT_VERSION: {PRODUCT_VERSION}"
    )
except Exception as e:
    logging.error(f"设备信息配置异常|{e}")

API_URL = "https://api.github.com/repos/mengmeet/PowerControl/releases/latest"

CONFIG_KEY = "PowerControl"

# 是否验证 yml 配置文件
VERIFY_YML = False

# TDP上限配置
try:
    TDP_LIMIT_CONFIG_PRODUCT = {
        "AIR": 18,
        "AIR 1S": 25,
        "AIR 1S Limited": 20,
        "AIR Pro": 20,
        "AIR Plus": 30,
        "AYANEO 2": 30,
        "GEEK": 30,
        "GEEK 1S": 30,
        "AYANEO 2S": 30,
        "ONEXPLAYER Mini": 30,
        "NEXT": 35,
        "ONEXPLAYER Mini Pro": 40,
        "AOKZOE A1 AR07": 40,
        "ONEXPLAYER 2 ARP23": 45,
        "ONEXPLAYER F1": 35,
        "ONEXPLAYER F1 EVA-01": 35,
        "G1619-04": 45,  # GPD WINMAX2
        "G1618-04": 45,  # GPD WIN4
        "G1617-01": 30,  # GPD WIN mini
        "ROG Ally RC71L_RC71L": 30,
        "ROG Ally RC71L": 30,
        "Jupiter": 20,
        "V3": 45,
    }
    TDP_LIMIT_CONFIG_CPU = {
        "7735HS": 65,
        "7735U": 40,
        "7735": 45,
        "5560U": 18,
        "5700U": 28,
        "5800U": 30,
        "5825U": 30,
        "6800U": 40,
        "4800U": 25,
        "4500U": 25,
        "3050e": 12,
        "Z1 Extreme": 40,
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


def load_yaml(file_path: str, chk_schema=None) -> dict:
    with open(file_path, "r") as f:
        data = yaml.safe_load(f)

    # 使用 schema 验证配置文件
    if chk_schema is not None and VERIFY_YML:
        try:
            from jsonschema import validate

            try:
                validate(instance=data, schema=chk_schema)
            except Exception as e:
                logging.error(f"配置文件 {file_path} 验证失败 | {e}")
                return {}
        except Exception as e:
            logging.error(f"验证模块导入失败, 跳过检查 | {e}")
    return data


HWMON_CONFS = glob.glob(f"{FAN_HWMON_CONFIG_DIR}/*.yml")
EC_CONFS = glob.glob(f"{FAN_EC_CONFIG_DIR}/*.yml")

HWMON_SCHEMA = f"{DECKY_PLUGIN_DIR}/backend/fan_config/schema/hwmon.json"
EC_SCHEMA = f"{DECKY_PLUGIN_DIR}/backend/fan_config/schema/ec.json"


def get_all_howmon_fans():
    with open(HWMON_SCHEMA, "r") as f:
        hwmon_schema = json.load(f)

    fans_confs = {}
    for config_path in HWMON_CONFS:
        data = load_yaml(config_path, hwmon_schema)
        if data == {}:
            continue
        name = data["hwmon_name"]
        if not name is None:
            fans_confs[name] = data["fans"]
    return fans_confs


def get_device_ec_fans(product_name, product_version):
    with open(EC_SCHEMA, "r") as f:
        ec_schema = json.load(f)

    FAN_EC_CONFIG_MAP = {}
    for config_path in EC_CONFS:
        data = load_yaml(config_path, ec_schema)
        if data == {}:
            continue
        names = (
            data["product_name"]
            if (
                "product_name" in data
                and data["product_name"] != None
                and isinstance(data["product_name"], list)
            )
            else []
        )
        versions = (
            data["product_version"]
            if (
                "product_version" in data
                and data["product_version"] != None
                and isinstance(data["product_version"], list)
            )
            else []
        )
        for name in names:
            if name not in FAN_EC_CONFIG_MAP:
                FAN_EC_CONFIG_MAP[name] = []
            fanconf = {"fans": data["fans"], "product_version": versions}
            FAN_EC_CONFIG_MAP[name].append(fanconf)

    # 带版本号的配置
    confs_with_name_version = []
    # 不带版本号的配置
    confs_with_name = []

    # 通过产品名获得所有配置，然后分成带版本号和不带版本号的配置
    for conf in FAN_EC_CONFIG_MAP.get(product_name, []):
        if (
            product_version in conf["product_version"]
            and data["product_version"] != None
            and isinstance(data["product_version"], list)
            and len(data["product_version"]) > 0
        ):
            confs_with_name_version.append(conf)
        else:
            confs_with_name.append(conf)

    # 优先匹配带版本号的配置
    for conf in confs_with_name_version:
        if product_version in conf["product_version"]:
            return conf["fans"]
    # 其次匹配不带版本号的配置 (如果有)
    for conf in confs_with_name:
        return conf["fans"]


# 风扇配置
try:

    FAN_HWMON_LIST = get_all_howmon_fans()

    FAN_EC_CONFIG = get_device_ec_fans(PRODUCT_NAME, PRODUCT_VERSION)

    logging.info(f"FAN_EC_CONFIG: {FAN_EC_CONFIG}")

except Exception as e:
    import traceback

    logging.error(f"风扇配置异常|{e}")
    logging.error(traceback.format_exc())
