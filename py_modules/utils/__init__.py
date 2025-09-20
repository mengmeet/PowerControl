import decky
import os
import shutil
from typing import List
import signal
from contextlib import contextmanager

RYZENADJ_PATH = "{}/bin/ryzenadj".format(decky.DECKY_PLUGIN_DIR)

__all__ = [
    "get_env",
    "version_compare",
    "get_ryzenadj_path",
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
