import os

from .gpu_fix import fix_gpuFreqSlider_AMD, fix_gpuFreqSlider_INTEL
from .tdp import getMaxTDP
from .battery import (
    get_battery_info,
    get_battery_percentage,
    is_battery_charging,
)

__all__ = [
    "fix_gpuFreqSlider_AMD",
    "fix_gpuFreqSlider_INTEL",
    "getMaxTDP",
    "get_env",
    "get_battery_info",
    "get_battery_percentage",
    "is_battery_charging",
]


def get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env
