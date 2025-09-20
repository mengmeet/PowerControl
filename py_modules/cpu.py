import os
import subprocess

from config import CPU_VENDOR, SH_PATH, logger
from utils import get_env, get_ryzenadj_path

class CPUManager:

    def __init__(self) -> None:
        self.__init_cpu_info()

    def __init_cpu_info(self) -> None:
        self._init_hardware_detection()

    def _init_hardware_detection(self):
        logger.info('init_hardware_detection')

    def get_hasRyzenadj(self) -> bool:
        """检查系统是否安装了ryzenadj工具。

        Returns:
            bool: True如果ryzenadj可用，否则False
        """
        try:
            # 查看ryzenadj路径是否有该文件
            if os.path.exists(RYZENADJ_PATH) or os.path.exists("/usr/bin/ryzenadj"):
                logger.info("get_hasRyzenadj {}".format(True))
                return True
            else:
                logger.info("get_hasRyzenadj {}".format(False))
                return False
        except Exception:
            logger.error("Failed to check ryzenadj tool", exc_info=True)
            return False

    def is_intel(self):
        return CPU_VENDOR == "GenuineIntel"

    def is_amd(self):
        return CPU_VENDOR == "AuthenticAMD"

    def _read_sysfs_int(self, path: str) -> int:
        """读取sysfs整数值，失败时返回-1"""
        try:
            if os.path.exists(path):
                with open(path, "r") as f:
                    return int(f.read().strip())
        except:
            pass
        return -1

    def get_ryzenadj_info(self) -> str:
        """获取Ryzenadj信息。

        Returns:
            str: Ryzenadj信息
        """
        try:
            sys_ryzenadj_path = get_ryzenadj_path()
            command = f"{sys_ryzenadj_path} -i"
            process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=get_env(),
            )
            stdout, stderr = process.stdout, process.stderr
            if stderr and stdout == "":
                logger.error(f"get_ryzenadj_info error:\n{stderr}")
                return f"get_ryzenadj_info error:\n{stderr}"
            else:
                return stdout
        except Exception as e:
            logger.error(e)
            return f"get_ryzenadj_info error:\n{e}"

    def get_rapl_info(self) -> str:
        """获取RAPL信息。

        Returns:
            str: RAPL信息
        """
        rapl_base_path = "/sys/class/powercap/intel-rapl:0"
        # if os.path.exists("/sys/class/powercap/intel-rapl/intel-rapl-mmio:0"):
        #     rapl_base_path = "/sys/class/powercap/intel-rapl-mmio/intel-rapl-mmio:0"

        rapl_info = {}

        for file in os.listdir(rapl_base_path):
            # 是文件并且可读
            if os.path.isfile(os.path.join(rapl_base_path, file)) and os.access(
                os.path.join(rapl_base_path, file), os.R_OK
            ):
                try:
                    with open(os.path.join(rapl_base_path, file), "r") as file:
                        rapl_info[file.name] = file.read().strip()
                except Exception as e:
                    logger.debug(f"get_rapl_info error: {e}")

        # sort by key
        rapl_info = dict(sorted(rapl_info.items(), key=lambda x: x[0]))

        logger.info(f"rapl_info: {rapl_info}")

        rapl_info_str = ""
        for key, value in rapl_info.items():
            rapl_info_str += f"{key}: {value}\n"

        logger.info(f"rapl_info_str: {rapl_info_str}")
        return rapl_info_str

cpuManager = CPUManager()
