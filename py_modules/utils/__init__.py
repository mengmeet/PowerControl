import os

from .gpu_fix import fix_gpuFreqSlider_AMD, fix_gpuFreqSlider_INTEL
from .tdp import getMaxTDP

__all__ = [
    "fix_gpuFreqSlider_AMD",
    "fix_gpuFreqSlider_INTEL",
    "getMaxTDP",
    "get_env",
]


def get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env
