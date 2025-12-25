import os
import shutil
from typing import List
import signal
from contextlib import contextmanager
import subprocess

import decky
from config import RYZENADJ_PATH

from .battery import (
    get_battery_info,
    get_battery_percentage,
    get_charge_behaviour,
    get_charge_control_end_threshold,
    get_charge_type,
    is_battery_charging,
    set_charge_behaviour,
    set_charge_control_end_threshold,
    set_charge_type,
    support_charge_behaviour,
    support_charge_control_end_threshold,
    support_charge_type,
)
from .gpu_fix import fix_gpuFreqSlider_AMD, fix_gpuFreqSlider_INTEL
from .tdp import getMaxTDP

__all__ = [
    "fix_gpuFreqSlider_AMD",
    "fix_gpuFreqSlider_INTEL",
    "getMaxTDP",
    "get_env",
    "get_battery_info",
    "get_battery_percentage",
    "is_battery_charging",
    "support_charge_control_end_threshold",
    "set_charge_control_end_threshold",
    "support_charge_behaviour",
    "set_charge_behaviour",
    "get_charge_behaviour",
    "get_charge_control_end_threshold",
    "support_charge_type",
    "set_charge_type",
    "get_charge_type",
    "version_compare",
    "get_ryzenadj_path",
    "check_native_gpu_slider_support",
    "check_native_tdp_limit_support",
]


def get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env


def get_ryzenadj_path(prefer_plugin=True):
    """
    Get the path to ryzenadj executable.

    Args:
        prefer_plugin (bool): If True, prefer plugin's ryzenadj over system version.
                             If False (default), prefer system version over plugin.

    Returns:
        str: Path to ryzenadj executable
    """
    plugin_path = (
        RYZENADJ_PATH
        if os.path.exists(RYZENADJ_PATH) and os.access(RYZENADJ_PATH, os.X_OK)
        else None
    )
    system_path = shutil.which("ryzenadj")

    if prefer_plugin:
        return plugin_path or system_path or RYZENADJ_PATH
    else:
        return system_path or plugin_path or RYZENADJ_PATH


# 版本号对比 数组参数
def version_compare(version1: List[int], version2: List[int]) -> int:
    """
    比较两个版本号数组的大小

    Args:
        version1 (list): 第一个版本号数组，如 [1, 2, 3]
        version2 (list): 第二个版本号数组，如 [1, 2, 4]

    Returns:
        int: 如果 version1 > version2 返回 1，如果 version1 < version2 返回 -1，如果相等返回 0
    """
    # 获取两个版本号数组的长度
    len1, len2 = len(version1), len(version2)

    # 取较短的长度进行比较
    for i in range(min(len1, len2)):
        if version1[i] > version2[i]:
            return 1
        elif version1[i] < version2[i]:
            return -1

    # 如果前面的版本号都相同，比较长度
    if len1 > len2:
        return 1
    elif len1 < len2:
        return -1
    else:
        return 0


class TimeoutException(Exception):
    pass


@contextmanager
def time_limit(seconds):
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")

    signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)


def get_bios_settings():
    import json
    from config import logger

    try:
        cmd = "fwupdmgr get-bios-setting --json"
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=2,
            env=get_env(),
        )

        data = json.loads(result.stdout)
        return data
    except subprocess.TimeoutExpired:
        logger.error("Timeout when getting BIOS settings")
        return {"BiosSettings": []}
    except Exception as e:
        logger.error(f"Error get_bios_setting {e}")
        return {"BiosSettings": []}


def check_native_gpu_slider_support():
    """
    Check if steamosctl supports manual GPU clock control by running commands as decky user.
    
    Returns:
        bool: True if both get-manual-gpu-clock-max and get-manual-gpu-clock-min commands succeed
    """
    from config import logger
    
    try:
        logger.debug("Checking native GPU slider support via steamosctl...")
        
        # Define commands to run as decky user
        cmd_max = ["sudo", "-u", decky.DECKY_USER, "steamosctl", "get-manual-gpu-clock-max"]
        cmd_min = ["sudo", "-u", decky.DECKY_USER, "steamosctl", "get-manual-gpu-clock-min"]
        
        # Start both processes in parallel
        process_max = subprocess.Popen(
            cmd_max,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=get_env()
        )
        process_min = subprocess.Popen(
            cmd_min,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=get_env()
        )
        
        # Wait for both processes to complete with timeout
        returncode_max = process_max.wait(timeout=2)
        returncode_min = process_min.wait(timeout=2)
        
        logger.debug(f"steamosctl get-manual-gpu-clock-max returncode: {returncode_max}")
        logger.debug(f"steamosctl get-manual-gpu-clock-min returncode: {returncode_min}")
        
        # Check if both commands succeeded
        result = returncode_max == 0 and returncode_min == 0
        logger.info(f"Native GPU slider support detected: {result}")
        
        return result
        
    except subprocess.TimeoutExpired:
        logger.error("Timeout when checking steamosctl GPU clock support")
        return False
    except Exception as e:
        logger.error(f"Error checking native GPU slider support: {e}")
        return False


def check_native_tdp_limit_support():
    """
    Check if steamosctl supports TDP limit control by running commands as decky user.
    
    Returns:
        bool: True if both get-tdp-limit-max and get-tdp-limit-min commands succeed
    """
    from config import logger
    
    try:
        logger.info("Checking native TDP limit support via steamosctl...")
        
        # Define commands to run as decky user
        cmd_max = ["sudo", "-u", decky.DECKY_USER, "steamosctl", "get-tdp-limit-max"]
        cmd_min = ["sudo", "-u", decky.DECKY_USER, "steamosctl", "get-tdp-limit-min"]
        
        # Start both processes in parallel
        process_max = subprocess.Popen(
            cmd_max,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=get_env()
        )
        process_min = subprocess.Popen(
            cmd_min,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=get_env()
        )
        
        # Wait for both processes to complete with timeout
        returncode_max = process_max.wait(timeout=2)
        returncode_min = process_min.wait(timeout=2)
        
        logger.debug(f"steamosctl get-tdp-limit-max returncode: {returncode_max}")
        logger.debug(f"steamosctl get-tdp-limit-min returncode: {returncode_min}")
        
        # Check if both commands succeeded
        result = returncode_max == 0 and returncode_min == 0
        logger.info(f"Native TDP limit support detected: {result}")
        
        return result
        
    except subprocess.TimeoutExpired:
        logger.error("Timeout when checking steamosctl TDP limit support")
        return False
    except Exception as e:
        logger.error(f"Error checking native TDP limit support: {e}")
        return False
