import glob
import json
import logging
import os

import decky
import yaml
from logging_handler import SystemdHandler

# 日志配置
LOG_LOCATION = "/tmp/PowerControl_py.log"
LOG_LEVEL = logging.DEBUG


def setup_logger():
    # 定义日志格式
    file_format = "[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s"
    systemd_format = "[%(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s"

    # 创建并配置 handlers
    systemd_handler = SystemdHandler()
    systemd_handler.setFormatter(logging.Formatter(systemd_format))

    file_handler = logging.FileHandler(filename=LOG_LOCATION, mode="w")
    file_handler.setFormatter(logging.Formatter(file_format))

    # 获取 logger
    try:
        logger = decky.logger
    except Exception:
        logger = logging.getLogger(__name__)

    logger.setLevel(LOG_LEVEL)
    logger.addHandler(systemd_handler)
    logger.addHandler(file_handler)

    return logger


# 初始化 logger
logger = setup_logger()


DECKY_PLUGIN_DIR = decky.DECKY_PLUGIN_DIR
DECKY_PLUGIN_PY_DIR = f"{DECKY_PLUGIN_DIR}/py_modules"
SH_PATH = "{}/backend/sh_tools.sh".format(DECKY_PLUGIN_DIR)
RYZENADJ_PATH = "{}/bin/ryzenadj".format(DECKY_PLUGIN_DIR)
# AMD_GPU_DEVICE_PATH = glob.glob("/sys/class/drm/card?/device")[0]
# AMD_GPUFREQ_PATH = "{}/pp_od_clk_voltage".format(AMD_GPU_DEVICE_PATH)
# AMD_GPULEVEL_PATH = "{}/power_dpm_force_performance_level".format(AMD_GPU_DEVICE_PATH)
PLATFORM_PROFILE_PATH = "/sys/firmware/acpi/platform_profile"
PLATFORM_PROFILE_CHOICES_PATH = "/sys/firmware/acpi/platform_profile_choices"

FAN_CONFIG_DIR = f"{DECKY_PLUGIN_PY_DIR}/fan_config"
FAN_HWMON_CONFIG_DIR = f"{FAN_CONFIG_DIR}/hwmon"
FAN_EC_CONFIG_DIR = f"{FAN_CONFIG_DIR}/ec"

HWMON_CONFS = glob.glob(f"{FAN_HWMON_CONFIG_DIR}/*.yml")
EC_CONFS = glob.glob(f"{FAN_EC_CONFIG_DIR}/*.yml")

HWMON_SCHEMA = f"{FAN_CONFIG_DIR}/schema/hwmon.json"
EC_SCHEMA = f"{FAN_CONFIG_DIR}/schema/ec.json"

API_URL = "https://api.github.com/repos/mengmeet/PowerControl/releases/latest"

CONFIG_KEY = "PowerControl"

# 路径配置
try:
    for p in glob.glob("/sys/class/drm/card?"):
        if os.path.exists(f"{p}/device/enable"):
            with open(f"{p}/device/enable", "r") as f:
                if f.read().strip() == "1":
                    AMD_GPU_DEVICE_PATH = f"{p}/device"
                    AMD_GPUFREQ_PATH = f"{AMD_GPU_DEVICE_PATH}/pp_od_clk_voltage"
                    AMD_GPULEVEL_PATH = (
                        f"{AMD_GPU_DEVICE_PATH}/power_dpm_force_performance_level"
                    )

                    # check if xe driver
                    if os.path.exists(f"{p}/device/tile0/gt0/freq0/min_freq"):
                        # xe driver paths for gt0 (graphics engine)
                        INTEL_GPU_MIN_FREQ = f"{p}/device/tile0/gt0/freq0/min_freq"
                        INTEL_GPU_MAX_FREQ = f"{p}/device/tile0/gt0/freq0/max_freq"
                        INTEL_GPU_CUR_FREQ = f"{p}/device/tile0/gt0/freq0/cur_freq"
                        INTEL_GPU_MAX_LIMIT = f"{p}/device/tile0/gt0/freq0/rp0_freq"
                        INTEL_GPU_NORMAL_LIMIT = f"{p}/device/tile0/gt0/freq0/rpe_freq"
                        INTEL_GPU_MIN_LIMIT = f"{p}/device/tile0/gt0/freq0/rpn_freq"

                    else:
                        # i915 driver paths
                        INTEL_GPU_MIN_FREQ = f"{p}/gt_min_freq_mhz"
                        INTEL_GPU_MAX_FREQ = f"{p}/gt_max_freq_mhz"
                        INTEL_GPU_BOOST_FREQ = f"{p}/gt_boost_freq_mhz"

                        # read only
                        INTEL_GPU_MAX_LIMIT = f"{p}/gt_RP0_freq_mhz"
                        INTEL_GPU_NORMAL_LIMIT = f"{p}/gt_RP1_freq_mhz"
                        INTEL_GPU_MIN_LIMIT = f"{p}/gt_RPn_freq_mhz"
                        INTEL_GPU_CUR_FREQ = f"{p}/gt_cur_freq_mhz"
                    break
except Exception as e:
    logger.error(f"路径配置异常|{e}", exc_info=True)

# 设备信息获取配置
try:
    cpuinfo_path = "/proc/cpuinfo"
    cpuinfo = open(cpuinfo_path, "r").read()
    CPU_ID = cpuinfo.split("model name")[1].split(":")[1].split("\n")[0].strip()
    CPU_VENDOR = cpuinfo.split("vendor_id")[1].split(":")[1].split("\n")[0].strip()
    VENDOR_NAME = open("/sys/devices/virtual/dmi/id/sys_vendor", "r").read().strip()
    PRODUCT_NAME = open("/sys/devices/virtual/dmi/id/product_name", "r").read().strip()
    BOARD_NAME = open("/sys/devices/virtual/dmi/id/board_name", "r").read().strip()
    BOARD_VENDOR = open("/sys/devices/virtual/dmi/id/board_vendor", "r").read().strip()
    PRODUCT_VERSION = (
        open("/sys/devices/virtual/dmi/id/product_version", "r").read().strip()
    )
    logger.info(
        f"CPU_ID: {CPU_ID}, PRODUCT_NAME: {PRODUCT_NAME}, PRODUCT_VERSION: {PRODUCT_VERSION}"
    )
except Exception as e:
    logger.error(f"设备信息配置异常|{e}", exc_info=True)


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
        "G1618-03": 28,  # GPD WIN3
        "G1618-04": 45,  # GPD WIN4
        "G1617-01": 30,  # GPD WIN mini
        "ROG Ally RC71L_RC71L": 30,
        "ROG Ally RC71L": 30,
        "Jupiter": 20,
        "V3": 45,
        "Claw 8 AI+ A2VM": 30,
    }
    TDP_LIMIT_CONFIG_CPU = {
        "7735HS": 65,
        "7735U": 40,
        "7735": 45,
        "5560U": 18,
        "5700U": 28,
        "5800U": 30,
        "5825U": 30,
        "6800U": 30,
        "4800U": 25,
        "4500U": 25,
        "3050e": 12,
        "Z1 Extreme": 30,
        "7840HS": 65,
        "7840U": 30,
        "7640U": 30,
        "7840": 45,
        "7320U": 18,
        "7520U": 18,
        "8840U": 30,
        "8840": 45,
        "8850U": 30,
        "8850": 45,
        "238V": 37,
        "256V": 37,
        "228V": 37,
        "266V": 37,
        "258V": 37,
        "268V": 37,
        "236V": 37,
        "226V": 37,
        "288V": 37,
    }
except Exception as e:
    logger.error(f"TDP配置异常|{e}")


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
                logger.error(f"配置文件 {file_path} 验证失败 | {e}")
                return {}
        except Exception as e:
            logger.error(f"验证模块导入失败, 跳过检查 | {e}")
    return data


def get_all_howmon_fans():
    with open(HWMON_SCHEMA, "r") as f:
        hwmon_schema = json.load(f)

    fans_confs = {}
    for config_path in HWMON_CONFS:
        data = load_yaml(config_path, hwmon_schema)
        if data == {}:
            continue
        name = data["hwmon_name"]
        if name is not None:
            fans_confs[name] = data["fans"]
    return fans_confs


def get_device_ec_fans(p_name, p_version):
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
                and data["product_name"] is not None
                and isinstance(data["product_name"], list)
            )
            else []
        )
        versions = (
            data["product_version"]
            if (
                "product_version" in data
                and data["product_version"] is not None
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
    for conf in FAN_EC_CONFIG_MAP.get(p_name, []):
        logger.info(f"conf of {p_name}: {conf}")
        if (
            p_version in conf["product_version"]
            and conf["product_version"] is not None
            and isinstance(conf["product_version"], list)
            and len(conf["product_version"]) > 0
        ):
            confs_with_name_version.append(conf)
        else:
            confs_with_name.append(conf)

    # 优先匹配带版本号的配置
    for conf in confs_with_name_version:
        if p_version in conf["product_version"]:
            return conf["fans"]
    # 其次匹配不带版本号的配置 (如果有)
    for conf in confs_with_name:
        return conf["fans"]
    return []


# 风扇配置
try:
    FAN_HWMON_LIST = get_all_howmon_fans()

    FAN_EC_CONFIG = get_device_ec_fans(PRODUCT_NAME, PRODUCT_VERSION)

    logger.info(f"FAN_EC_CONFIG: {FAN_EC_CONFIG}")

except Exception as e:
    logger.error(f"风扇配置异常|{e}", exc_info=True)
