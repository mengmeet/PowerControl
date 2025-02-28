import os
from typing import List

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
]


def get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env


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
