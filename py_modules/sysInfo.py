import collections
import os
import subprocess
import threading
import time

from config import logger
from helpers import get_user
from utils import get_env

cpu_busyPercent = 0
cpu_DataErrCnt = 0
has_cpuData = True

gpu_busyPercent = 0
gpu_DataErrCnt = 0
has_gpuData = True

statPath = "/proc/stat"
hwmon_path = "/sys/class/hwmon"


class SysInfoManager(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)

    def get_language(self):
        try:
            lang_path = f"/home/{get_user()}/.steam/registry.vdf"
            if os.path.exists(lang_path):
                with open(lang_path, "r") as f:
                    for line in f.readlines():
                        if "language" in line:
                            self._language = line.split('"')[3]
                            break
            else:
                logger.error(f"語言檢測路徑{lang_path}不存在該文件")
            logger.info(f"get_language {self._language} path={lang_path}")
            return self._language
        except Exception as e:
            logger.error(e)
            return self._language


sysInfoManager = SysInfoManager()
sysInfoManager.start()
