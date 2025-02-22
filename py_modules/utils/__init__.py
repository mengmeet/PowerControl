import os

from .gpu_fix import fix_gpuFreqSlider_AMD, fix_gpuFreqSlider_INTEL
from .tdp import getMaxTDP
from .battery import (
    get_battery_info,
    get_battery_percentage,
    is_battery_charging,
    support_charge_control_end_threshold,
    set_charge_control_end_threshold,
    get_charge_control_end_threshold,
    support_charge_behaviour,
    set_charge_behaviour,
    get_charge_behaviour,
)

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
]


def get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env
