import os
import subprocess

from config import logger
from ec import EC
from utils import (
    get_charge_behaviour,
    get_charge_type,
    get_env,
    set_charge_behaviour,
    set_charge_control_end_threshold,
    set_charge_type,
    support_charge_behaviour,
    support_charge_control_end_threshold,
    support_charge_type,
)

from .idevice import IDevice


class PowerDevice(IDevice):
    # 常见的 sched_ext 调度器列表
    COMMON_SCHEDULERS = [
        "scx_simple",
        "scx_central",
        "scx_flatcg",
        "scx_nest",
        "scx_pair",
        "scx_qmap",
        "scx_prev",
        "scx_userland",
        "scx_layered",
        "scx_rusty",
        "scx_rustland",
        "scx_rlfifo",
        "scx_lavd",
        "scx_bpfland",
        "scx_flash",
    ]

    def __init__(self):
        super().__init__()
        self._cpuManager = None

        try:
            from cpu import cpuManager

            self._cpuManager = cpuManager
        except ImportError:
            logger.warning("Failed to import cpu module")

    def load(self) -> None:
        pass

    def unload(self) -> None:
        pass

    def _ec_read(self, address: int) -> int:
        return EC.Read(address)

    def _ec_read_longer(self, address: int, length: int) -> int:
        return EC.ReadLonger(address, length)

    def _ec_write(self, address: int, data: int) -> None:
        logger.info(f"_ec_write address={hex(address)} data={hex(data)}")
        EC.Write(address, data)

    # ------ Charge ------ #

    def supports_bypass_charge(self) -> bool:
        return support_charge_behaviour() or support_charge_type()

    def supports_charge_limit(self) -> bool:
        return support_charge_control_end_threshold()

    def software_charge_limit(self) -> bool:
        return False

    def get_bypass_charge(self) -> bool:
        if support_charge_behaviour():
            return get_charge_behaviour() == "inhibit-charge"
        if support_charge_type():
            return get_charge_type() == "Bypass"
        return False

    def set_bypass_charge(self, value: bool) -> None:
        if support_charge_behaviour():
            set_charge_behaviour("inhibit-charge" if value else "auto")
        if support_charge_type():
            set_charge_type("Bypass" if value else "Standard")

    def set_charge_limit(self, value: int) -> None:
        # check value
        if not 0 <= value <= 100:
            logger.error(f"Charge limit must be between 0-100, current value: {value}")
            return
        if not support_charge_control_end_threshold():
            return
        set_charge_control_end_threshold(value)

    def supports_reset_charge_limit(self) -> bool:
        return (
            support_charge_control_end_threshold()
            or support_charge_behaviour()
            or support_charge_type()
        )

    def reset_charge_limit(self) -> None:
        if support_charge_control_end_threshold():
            set_charge_control_end_threshold(100)
        self.set_bypass_charge(False)

    # ------ TDP ------ #

    def set_tdp(self, tdp: int) -> None:
        if self._cpuManager is None:
            logger.error("Failed to set TDP: cpuManager is None")
            return
        self._cpuManager.set_cpuTDP(tdp)

    def set_tdp_unlimited(self) -> None:
        if self._cpuManager is None:
            logger.error("Failed to set TDP: cpuManager is None")
            return
        self._cpuManager.set_cpuTDP_unlimited()

    # ------ sched_ext ------ #

    def supports_sched_ext(self) -> bool:
        """
        检查当前系统是否支持 sched-ext

        Returns:
            bool: 如果支持返回 True，否则返回 False
        """
        try:
            # 检查 /sys/kernel/sched_ext 目录是否存在
            if os.path.exists("/sys/kernel/sched_ext"):
                logger.info("System supports sched-ext")
                return True

            logger.info("System does not support sched-ext")
            return False
        except Exception as e:
            logger.error(f"Error checking sched-ext support: {e}")
            return False

    def get_sched_ext_list(self) -> list[str]:
        """
        获取可用的 sched_ext 调度器列表

        Returns:
            list[str]: 可用的调度器列表
        """
        try:
            import shutil
            import subprocess

            schedulers = []

            # 方法1: 检查 PATH 中的 scx_* 可执行文件
            paths = os.environ.get("PATH", "").split(":")
            for path in paths:
                if os.path.exists(path):
                    for file in os.listdir(path):
                        if file.startswith("scx_") and os.access(
                            os.path.join(path, file), os.X_OK
                        ):
                            schedulers.append(file)

            # 方法2: 使用 which 命令查找常见的调度器
            for sched in self.COMMON_SCHEDULERS:
                if shutil.which(sched) is not None and sched not in schedulers:
                    schedulers.append(sched)

            # 如果上述方法都没找到调度器，尝试使用 find 命令在常见位置查找
            if not schedulers:
                try:
                    # 在常见的二进制目录中查找 scx_ 开头的可执行文件
                    cmd = [
                        "find",
                        "/usr/bin",
                        "/usr/local/bin",
                        "/opt/bin",
                        "-name",
                        "scx_*",
                        "-type",
                        "f",
                        "-executable",
                    ]
                    result = subprocess.run(
                        cmd, capture_output=True, text=True, env=get_env()
                    )
                    if result.returncode == 0:
                        for line in result.stdout.splitlines():
                            if line:
                                sched_name = os.path.basename(line)
                                if sched_name not in schedulers:
                                    schedulers.append(sched_name)
                except Exception:
                    pass

            # 去重并排序
            schedulers = sorted(list(set(schedulers)))

            if not schedulers:
                # 如果所有方法都失败，返回常见调度器列表作为备选
                logger.warning(
                    "Could not find any sched_ext schedulers, returning common list"
                )
                return self.COMMON_SCHEDULERS

            return schedulers

        except Exception as e:
            logger.error(f"Error getting sched_ext list: {e}")
            # 出错时返回常见调度器列表
            return self.COMMON_SCHEDULERS

    def set_sched_ext(
        self, value: str, param: str = "", use_service: bool = False
    ) -> None:
        """
        设置 sched_ext 调度器

        Args:
            value (str): 调度器名称，如 "none", "scx_userspace", "scx_cfs", "scx_simple"
            param (str, optional): 调度器参数，默认为空字符串
            use_service (bool, optional): 是否使用 scx_loader 服务设置，默认为 False
        """
        if not self.supports_sched_ext():
            logger.error("sched_ext is not supported")
            return

        # 检查 scx_loader 服务是否自启或正在运行
        try:
            # 检查服务是否启用（自启）
            cmd = ["systemctl", "is-enabled", "scx_loader.service"]
            is_enabled = (
                subprocess.run(
                    cmd, capture_output=True, text=True, env=get_env()
                ).returncode
                == 0
            )

            # 检查服务是否正在运行
            cmd = ["systemctl", "is-active", "scx_loader.service"]
            is_active = (
                subprocess.run(
                    cmd, capture_output=True, text=True, env=get_env()
                ).returncode
                == 0
            )

            # 如果服务已启用或正在运行，强制使用服务方式
            if is_enabled or is_active:
                logger.info(
                    "scx_loader service is enabled or active, using service method"
                )
                use_service = True
        except Exception as e:
            logger.warning(f"Failed to check scx_loader service status: {e}")
            # 出错时不强制使用服务方式，继续使用传入的 use_service 参数

        # 如果使用服务方式，调用 _set_by_scx_loader_service 方法
        if use_service:
            # 清除之前记录的 PID，因为现在使用服务方式
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            self._set_by_scx_loader_service(value, param)
            return

        # 以下是直接设置方式的代码（不使用服务）
        if value == "none":
            # 禁用 sched_ext
            cmd = ["sudo", "sched_ext", "-d"]
            subprocess.run(cmd, check=True, env=get_env())
            logger.info("Disabled sched_ext scheduler")
            # 清除之前记录的 PID
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            return

        # 检查调度器是否在可用列表中
        if value not in self.get_sched_ext_list():
            logger.error(f"Scheduler {value} is not available")
            return

        # 构建命令
        cmd = [value]
        if param:
            cmd.append(param)

        # 在启动新调度器之前，确保停止之前的调度器
        if self._current_scheduler_pid is not None:
            self._stop_direct_scheduler()

        # 启动调度器进程并记录 PID
        try:
            # 使用 nohup 和重定向确保进程在后台运行，即使父进程退出
            cmd_str = f"nohup {value}"
            if param:
                cmd_str += f" {param}"
            cmd_str += " > /dev/null 2>&1 & echo $!"

            # 使用 shell=True 执行命令并获取后台进程的 PID
            process = subprocess.run(
                cmd_str,
                shell=True,
                capture_output=True,
                text=True,
                env=get_env(),
            )

            # 从输出中获取 PID
            pid = process.stdout.strip()
            if pid and pid.isdigit():
                self._current_scheduler_pid = int(pid)
                self._current_scheduler_name = value
                logger.info(
                    f"Set sched_ext scheduler to {value} with param {param}, PID: {pid} (background)"
                )
            else:
                logger.error(f"Failed to get PID for scheduler {value}")
                self._current_scheduler_pid = None
                self._current_scheduler_name = None
        except Exception as e:
            logger.error(f"Error starting scheduler {value}: {e}")
            self._current_scheduler_pid = None
            self._current_scheduler_name = None

    # 添加一个类变量来存储当前运行的调度器 PID
    _current_scheduler_pid = None
    _current_scheduler_name = None

    def _stop_direct_scheduler(self) -> bool:
        """
        停止直接启动的调度器进程

        Returns:
            bool: 是否成功停止进程
        """
        if self._current_scheduler_pid is None:
            logger.warning("No directly started scheduler PID recorded")
            return False

        try:
            # 尝试使用记录的 PID 终止进程
            logger.info(
                f"Stopping scheduler process with PID: {self._current_scheduler_pid}"
            )
            cmd = ["sudo", "kill", str(self._current_scheduler_pid)]
            subprocess.run(cmd, check=True, env=get_env())
            logger.info(
                f"Successfully stopped scheduler process with PID: {self._current_scheduler_pid}"
            )
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            return True
        except subprocess.SubprocessError as e:
            logger.warning(
                f"Failed to stop scheduler process with PID {self._current_scheduler_pid}: {e}"
            )
            # PID 可能已经不存在，清除记录
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            return False

    def _stop_sched_ext(self) -> None:
        """
        停止 sched_ext 调度器，适用于直接模式和服务模式

        此方法会根据调度器的启动方式采取不同的停止策略：
        - 对于通过 scx_loader 服务启动的调度器，直接通过 systemctl 停止服务
        - 对于直接启动的调度器，首先尝试使用记录的 PID 停止，然后尝试通过 kill 命令终止进程
        """
        try:
            # 检查 scx_loader 服务是否正在运行
            cmd = ["systemctl", "is-active", "scx_loader.service"]
            is_active = (
                subprocess.run(
                    cmd, capture_output=True, text=True, env=get_env()
                ).returncode
                == 0
            )

            # 如果 scx_loader 服务正在运行，直接通过 systemctl 停止服务
            if is_active:
                try:
                    logger.info(
                        "检测到 scx_loader 服务正在运行，通过 systemctl 停止服务"
                    )
                    cmd = ["sudo", "systemctl", "stop", "scx_loader.service"]
                    subprocess.run(cmd, check=True, env=get_env())
                    logger.info("成功停止 scx_loader 服务")
                    return
                except subprocess.SubprocessError as e:
                    logger.warning(f"停止 scx_loader 服务失败: {e}")
                    # 继续尝试使用 PID 或 kill 命令

            # 首先尝试使用记录的 PID 停止直接启动的调度器
            if self._current_scheduler_pid is not None:
                if self._stop_direct_scheduler():
                    return

            # 如果没有记录的 PID 或停止失败，尝试使用 kill 命令终止进程
            logger.info("尝试通过 kill 命令终止调度器进程")
            killed_any = False

            # 获取当前可能的调度器列表
            schedulers = self.get_sched_ext_list()

            # 如果有记录的调度器名称，优先尝试终止它
            if (
                self._current_scheduler_name is not None
                and self._current_scheduler_name in schedulers
            ):
                try:
                    cmd = ["sudo", "pkill", "-f", self._current_scheduler_name]
                    result = subprocess.run(
                        cmd, check=False, capture_output=True, env=get_env()
                    )
                    if result.returncode == 0:
                        logger.info(f"成功终止进程: {self._current_scheduler_name}")
                        killed_any = True
                        self._current_scheduler_name = None
                        self._current_scheduler_pid = None
                except subprocess.SubprocessError as e:
                    logger.warning(f"终止进程 {self._current_scheduler_name} 失败: {e}")

            # 尝试终止其他可能的调度器进程
            for scheduler in schedulers:
                if scheduler == self._current_scheduler_name:
                    continue  # 已经尝试过了
                try:
                    # 使用 pkill 终止进程
                    cmd = ["sudo", "pkill", "-f", scheduler]
                    result = subprocess.run(
                        cmd, check=False, capture_output=True, env=get_env()
                    )

                    # 检查是否成功终止了进程（返回码为0表示找到并终止了进程）
                    if result.returncode == 0:
                        logger.info(f"成功终止进程: {scheduler}")
                        killed_any = True
                except subprocess.SubprocessError as e:
                    logger.warning(f"终止进程 {scheduler} 失败: {e}")

            if killed_any:
                logger.info("成功终止了一个或多个调度器进程")
            else:
                logger.warning("未找到任何运行中的调度器进程")

        except Exception as e:
            logger.error(f"停止 sched_ext 调度器时发生错误: {e}")

    def _set_by_scx_loader_service(self, value: str, param: str = "") -> None:
        """
        使用 scx_loader 服务来设置 sched_ext 调度器

        Args:
            value (str): 调度器名称，如 "none", "scx_userspace", "scx_cfs", "scx_simple"
            param (str, optional): 调度器参数，默认为空字符串
        """
        try:
            import re
            import tempfile

            # 尝试导入 toml 库，如果不存在则使用简单的文本替换
            try:
                import tomli
                import tomli_w

                has_toml = True
            except ImportError:
                has_toml = False
                logger.warning(
                    "tomli/tomli_w library not found, using simple text replacement"
                )

            # 常见的 scx_loader 配置文件路径
            config_paths = [
                "/etc/scx_loader/config.toml",
                "/etc/scx_loader.toml",
            ]

            # 查找存在的配置文件
            config_file = None
            for path in config_paths:
                if os.path.exists(path):
                    config_file = path
                    break

            if not config_file:
                logger.error("Could not find scx_loader configuration file")
                # 如果配置文件不存在，尝试创建一个基本的配置文件
                config_file = "/etc/scx_loader.toml"

            # 读取原始配置或创建新配置
            if os.path.exists(config_file):
                if has_toml:
                    with open(config_file, "rb") as f:
                        try:
                            config = tomli.load(f)
                        except Exception as e:
                            logger.error(f"Error parsing TOML file: {e}")
                            return
                else:
                    with open(config_file, "r") as f:
                        config_content = f.read()
            else:
                if has_toml:
                    config = {}
                else:
                    config_content = ""

            # 创建临时文件
            with tempfile.NamedTemporaryFile(
                mode="w" if not has_toml else "wb", delete=False
            ) as temp_file:
                temp_path = temp_file.name

                if has_toml:
                    # 使用 tomli 库修改配置
                    if value:
                        config["default_sched"] = value

                        # 如果有参数，需要将其拆分为参数列表
                        if param:
                            # 确保 scheds 部分存在
                            if "scheds" not in config:
                                config["scheds"] = {}

                            # 确保调度器部分存在
                            if value not in config["scheds"]:
                                config["scheds"][value] = {}

                            # 将参数字符串拆分为列表
                            param_list = []
                            # 使用正则表达式处理引号内的空格
                            pattern = r'([^\s"]+)|"([^"]*)"'
                            for match in re.finditer(pattern, param):
                                if match.group(1):  # 没有引号的参数
                                    param_list.append(match.group(1))
                                else:  # 带引号的参数
                                    param_list.append(match.group(2))

                            # 设置 auto_mode 参数（默认模式）
                            config["scheds"][value]["auto_mode"] = param_list
                    else:
                        # 如果 value 为空，则删除 default_sched 字段
                        if "default_sched" in config:
                            del config["default_sched"]

                    # 写入修改后的配置
                    tomli_w.dump(config, temp_file)
                else:
                    # 使用简单的文本替换
                    if value:
                        # 检查是否已存在 default_sched 行
                        default_sched_pattern = re.compile(
                            r'^default_sched\s*=\s*"[^"]*"', re.MULTILINE
                        )
                        if re.search(default_sched_pattern, config_content):
                            # 替换现有的 default_sched 行
                            config_content = re.sub(
                                default_sched_pattern,
                                f'default_sched = "{value}"',
                                config_content,
                            )
                        else:
                            # 添加新的 default_sched 行
                            config_content = (
                                f'default_sched = "{value}"\n' + config_content
                            )

                        # 如果有参数，需要添加或修改 scheds 部分
                        if param:
                            # 将参数字符串拆分为列表形式的字符串
                            param_items = []
                            pattern = r'([^\s"]+)|"([^"]*)"'
                            for match in re.finditer(pattern, param):
                                if match.group(1):  # 没有引号的参数
                                    param_items.append(f'"{match.group(1)}"')
                                else:  # 带引号的参数
                                    param_items.append(f'"{match.group(2)}"')

                            param_list_str = ", ".join(param_items)

                            # 检查是否已存在该调度器的配置部分
                            sched_section_pattern = re.compile(
                                rf"\[scheds\.{value}\]", re.MULTILINE
                            )
                            auto_mode_pattern = re.compile(
                                r"auto_mode\s*=\s*\[[^\]]*\]", re.MULTILINE
                            )

                            if re.search(sched_section_pattern, config_content):
                                # 调度器部分已存在
                                sched_section_match = re.search(
                                    sched_section_pattern, config_content
                                )
                                section_start = sched_section_match.start()

                                # 查找 auto_mode 行
                                section_content = config_content[section_start:]
                                if re.search(auto_mode_pattern, section_content):
                                    # 替换 auto_mode 行
                                    config_content = re.sub(
                                        auto_mode_pattern,
                                        f"auto_mode = [{param_list_str}]",
                                        config_content,
                                    )
                                else:
                                    # 在调度器部分添加 auto_mode 行
                                    config_content = re.sub(
                                        rf"\[scheds\.{value}\]",
                                        f"[scheds.{value}]\nauto_mode = [{param_list_str}]",
                                        config_content,
                                    )
                            else:
                                # 添加新的调度器部分
                                sched_section = f"\n[scheds.{value}]\nauto_mode = [{param_list_str}]\n"
                                config_content += sched_section
                    else:
                        # 如果 value 为空，则删除或注释掉 default_sched 行
                        default_sched_pattern = re.compile(
                            r'^default_sched\s*=\s*"[^"]*"', re.MULTILINE
                        )
                        if re.search(default_sched_pattern, config_content):
                            config_content = re.sub(
                                default_sched_pattern,
                                '# default_sched = ""  # disabled',
                                config_content,
                            )

                    # 写入修改后的配置
                    temp_file.write(config_content)

            # 使用 sudo 复制临时文件到配置文件
            cmd = ["sudo", "mkdir", "-p", os.path.dirname(config_file)]
            subprocess.run(cmd, check=True, env=get_env())

            cmd = ["sudo", "cp", temp_path, config_file]
            subprocess.run(cmd, check=True, env=get_env())

            # 删除临时文件
            os.unlink(temp_path)

            # 重启 scx_loader 服务，只使用 systemctl
            service_name = "scx_loader"
            try:
                cmd = ["sudo", "systemctl", "restart", f"{service_name}.service"]
                subprocess.run(cmd, check=True, env=get_env())
                logger.info(f"Restarted {service_name} service with systemd")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to restart {service_name} service: {e}")
                logger.warning(
                    "Could not restart scx_loader service, scheduler may not be applied"
                )

        except Exception as e:
            logger.error(f"Error setting sched_ext scheduler via service: {e}")
