import os
import re
import shutil
import subprocess
import tempfile

from config import logger
from utils import get_env


class SchedExtManager:
    # Common sched_ext schedulers list
    COMMON_SCHEDULERS = [
        "scx_simple",
        "scx_central",
        "scx_flatcg",
        "scx_nest",
        "scx_pair",
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
        self._current_scheduler_pid = None
        self._current_scheduler_name = None

    def supports_sched_ext(self) -> bool:
        """
        Check if the current system supports sched-ext

        Returns:
            bool: True if supported, False otherwise
        """
        try:
            # Check if /sys/kernel/sched_ext directory exists
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
        Get available sched_ext schedulers list

        Returns:
            list[str]: List of available schedulers
        """
        try:
            schedulers = []

            # Method 1: Check scx_* executables in PATH
            paths = os.environ.get("PATH", "").split(":")
            for path in paths:
                if os.path.exists(path):
                    for file in os.listdir(path):
                        if file.startswith("scx_") and os.access(
                            os.path.join(path, file), os.X_OK
                        ):
                            schedulers.append(file)

            # Method 2: Use which command to find common schedulers
            for sched in self.COMMON_SCHEDULERS:
                if shutil.which(sched) is not None and sched not in schedulers:
                    schedulers.append(sched)

            # If no schedulers found, try using find command in common locations
            if not schedulers:
                try:
                    # Find scx_* executables in common binary directories
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

            # Remove duplicates and sort
            schedulers = sorted(list(set(schedulers)))

            if not schedulers:
                # If all methods fail, return common scheduler list as fallback
                logger.warning(
                    "Could not find any sched_ext schedulers, returning common list"
                )
                return self.COMMON_SCHEDULERS

            return schedulers

        except Exception as e:
            logger.error(f"Error getting sched_ext list: {e}")
            # Return common scheduler list on error
            return self.COMMON_SCHEDULERS

    def set_sched_ext(
        self, value: str, param: str = "", use_service: bool = False
    ) -> None:
        """
        Set sched_ext scheduler

        Args:
            value (str): Scheduler name, such as "none", "scx_userspace", "scx_cfs", "scx_simple"
            param (str, optional): Scheduler parameters, default empty string
            use_service (bool, optional): Whether to use scx_loader service, default False
        """
        if not self.supports_sched_ext():
            logger.error("sched_ext is not supported")
            return

        # Check if scx_loader service is enabled or running
        try:
            # Check if service is enabled (auto-start)
            cmd = ["systemctl", "is-enabled", "scx_loader.service"]
            is_enabled = (
                subprocess.run(
                    cmd, capture_output=True, text=True, env=get_env()
                ).returncode
                == 0
            )

            # Check if service is running
            cmd = ["systemctl", "is-active", "scx_loader.service"]
            is_active = (
                subprocess.run(
                    cmd, capture_output=True, text=True, env=get_env()
                ).returncode
                == 0
            )

            # If service is enabled or running, force using service method
            if is_enabled or is_active:
                logger.info(
                    "scx_loader service is enabled or active, using service method"
                )
                use_service = True
        except Exception as e:
            logger.warning(f"Failed to check scx_loader service status: {e}")
            # On error, don't force service method, continue with passed use_service parameter

        # If using service method, call _set_by_scx_loader_service method
        if use_service:
            # Clear previously recorded PID since now using service method
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            self._set_by_scx_loader_service(value, param)
            return

        # Direct setting method code (without service)
        if value == "none":
            # Disable sched_ext
            cmd = ["sudo", "sched_ext", "-d"]
            subprocess.run(cmd, check=True, env=get_env())
            logger.info("Disabled sched_ext scheduler")
            # Clear previously recorded PID
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            return

        # Check if scheduler is in available list
        if value not in self.get_sched_ext_list():
            logger.error(f"Scheduler {value} is not available")
            return

        # Build command
        cmd = [value]
        if param:
            cmd.append(param)

        # Ensure previous scheduler is stopped before starting new one
        if self._current_scheduler_pid is not None:
            self._stop_direct_scheduler()

        # Start scheduler process and record PID
        try:
            # Use nohup and redirection to ensure process runs in background even if parent exits
            cmd_str = f"nohup {value}"
            if param:
                cmd_str += f" {param}"
            cmd_str += " > /dev/null 2>&1 & echo $!"

            # Use shell=True to execute command and get background process PID
            process = subprocess.run(
                cmd_str,
                shell=True,
                capture_output=True,
                text=True,
                env=get_env(),
            )

            # Get PID from output
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

    def _stop_direct_scheduler(self) -> bool:
        """
        Stop directly started scheduler process

        Returns:
            bool: Whether successfully stopped process
        """
        if self._current_scheduler_pid is None:
            logger.warning("No directly started scheduler PID recorded")
            return False

        try:
            # Try to terminate process using recorded PID
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
            # PID may no longer exist, clear record
            self._current_scheduler_pid = None
            self._current_scheduler_name = None
            return False

    def _stop_sched_ext(self) -> None:
        """
        Stop sched_ext scheduler, applicable to both direct mode and service mode

        This method will take different stopping strategies based on how the scheduler was started:
        - For schedulers started via scx_loader service, directly stop service via systemctl
        - For directly started schedulers, first try to stop using recorded PID, then try to terminate via kill command
        """
        try:
            # Check if scx_loader service is running
            cmd = ["systemctl", "is-active", "scx_loader.service"]
            is_active = (
                subprocess.run(
                    cmd, capture_output=True, text=True, env=get_env()
                ).returncode
                == 0
            )

            # If scx_loader service is running, directly stop service via systemctl
            if is_active:
                try:
                    logger.info(
                        "Detected scx_loader service running, stopping service via systemctl"
                    )
                    cmd = ["sudo", "systemctl", "stop", "scx_loader.service"]
                    subprocess.run(cmd, check=True, env=get_env())
                    logger.info("Successfully stopped scx_loader service")
                    return
                except subprocess.SubprocessError as e:
                    logger.warning(f"Failed to stop scx_loader service: {e}")
                    # Continue trying PID or kill command

            # First try to stop directly started scheduler using recorded PID
            if self._current_scheduler_pid is not None:
                if self._stop_direct_scheduler():
                    return

            # If no recorded PID or stop failed, try to terminate via kill command
            logger.info("Trying to terminate scheduler process via kill command")
            killed_any = False

            # Get current possible scheduler list
            schedulers = self.get_sched_ext_list()

            # If there's recorded scheduler name, prioritize trying to terminate it
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
                        logger.info(
                            f"Successfully terminated process: {self._current_scheduler_name}"
                        )
                        killed_any = True
                        self._current_scheduler_name = None
                        self._current_scheduler_pid = None
                except subprocess.SubprocessError as e:
                    logger.warning(
                        f"Failed to terminate process {self._current_scheduler_name}: {e}"
                    )

            # Try to terminate other possible scheduler processes
            for scheduler in schedulers:
                if scheduler == self._current_scheduler_name:
                    continue  # Already tried
                try:
                    # Use pkill to terminate process
                    cmd = ["sudo", "pkill", "-f", scheduler]
                    result = subprocess.run(
                        cmd, check=False, capture_output=True, env=get_env()
                    )

                    # Check if successfully terminated process (return code 0 means found and terminated process)
                    if result.returncode == 0:
                        logger.info(f"Successfully terminated process: {scheduler}")
                        killed_any = True
                except subprocess.SubprocessError as e:
                    logger.warning(f"Failed to terminate process {scheduler}: {e}")

            if killed_any:
                logger.info("Successfully terminated one or more scheduler processes")
            else:
                logger.warning("No running scheduler processes found")

        except Exception as e:
            logger.error(f"Error occurred while stopping sched_ext scheduler: {e}")

    def _set_by_scx_loader_service(self, value: str, param: str = "") -> None:
        """
        Use scx_loader service to set sched_ext scheduler

        Args:
            value (str): Scheduler name, such as "none", "scx_userspace", "scx_cfs", "scx_simple"
            param (str, optional): Scheduler parameters, default empty string
        """
        try:
            # Try to import toml library, if not available use simple text replacement
            try:
                import tomli
                import tomli_w

                has_toml = True
            except ImportError:
                has_toml = False
                logger.warning(
                    "tomli/tomli_w library not found, using simple text replacement"
                )

            # Common scx_loader configuration file paths
            config_paths = [
                "/etc/scx_loader/config.toml",
                "/etc/scx_loader.toml",
            ]

            # Find existing configuration file
            config_file = None
            for path in config_paths:
                if os.path.exists(path):
                    config_file = path
                    break

            if not config_file:
                logger.error("Could not find scx_loader configuration file")
                # If configuration file doesn't exist, try to create a basic configuration file
                config_file = "/etc/scx_loader.toml"

            # Read original configuration or create new configuration
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

            # Create temporary file
            with tempfile.NamedTemporaryFile(
                mode="w" if not has_toml else "wb", delete=False
            ) as temp_file:
                temp_path = temp_file.name

                if has_toml:
                    # Use tomli library to modify configuration
                    if value:
                        config["default_sched"] = value

                        # If there are parameters, need to split them into parameter list
                        if param:
                            # Ensure scheds section exists
                            if "scheds" not in config:
                                config["scheds"] = {}

                            # Ensure scheduler section exists
                            if value not in config["scheds"]:
                                config["scheds"][value] = {}

                            # Split parameter string into list
                            param_list = []
                            # Use regex to handle spaces within quotes
                            pattern = r'([^\s"]+)|"([^"]*)"'
                            for match in re.finditer(pattern, param):
                                if match.group(1):  # Parameter without quotes
                                    param_list.append(match.group(1))
                                else:  # Parameter with quotes
                                    param_list.append(match.group(2))

                            # Set auto_mode parameter (default mode)
                            config["scheds"][value]["auto_mode"] = param_list
                    else:
                        # If value is empty, delete default_sched field
                        if "default_sched" in config:
                            del config["default_sched"]

                    # Write modified configuration
                    tomli_w.dump(config, temp_file)
                else:
                    # Use simple text replacement
                    if value:
                        # Check if default_sched line already exists
                        default_sched_pattern = re.compile(
                            r'^default_sched\s*=\s*"[^"]*"', re.MULTILINE
                        )
                        if re.search(default_sched_pattern, config_content):
                            # Replace existing default_sched line
                            config_content = re.sub(
                                default_sched_pattern,
                                f'default_sched = "{value}"',
                                config_content,
                            )
                        else:
                            # Add new default_sched line
                            config_content = (
                                f'default_sched = "{value}"\n' + config_content
                            )

                        # If there are parameters, need to add or modify scheds section
                        if param:
                            # Split parameter string into list form string
                            param_items = []
                            pattern = r'([^\s"]+)|"([^"]*)"'
                            for match in re.finditer(pattern, param):
                                if match.group(1):  # Parameter without quotes
                                    param_items.append(f'"{match.group(1)}"')
                                else:  # Parameter with quotes
                                    param_items.append(f'"{match.group(2)}"')

                            param_list_str = ", ".join(param_items)

                            # Check if scheduler configuration section already exists
                            sched_section_pattern = re.compile(
                                rf"\[scheds\.{value}\]", re.MULTILINE
                            )
                            auto_mode_pattern = re.compile(
                                r"auto_mode\s*=\s*\[[^\]]*\]", re.MULTILINE
                            )

                            if re.search(sched_section_pattern, config_content):
                                # Scheduler section already exists
                                sched_section_match = re.search(
                                    sched_section_pattern, config_content
                                )
                                section_start = sched_section_match.start()

                                # Find auto_mode line
                                section_content = config_content[section_start:]
                                if re.search(auto_mode_pattern, section_content):
                                    # Replace auto_mode line
                                    config_content = re.sub(
                                        auto_mode_pattern,
                                        f"auto_mode = [{param_list_str}]",
                                        config_content,
                                    )
                                else:
                                    # Add auto_mode line in scheduler section
                                    config_content = re.sub(
                                        rf"\[scheds\.{value}\]",
                                        f"[scheds.{value}]\nauto_mode = [{param_list_str}]",
                                        config_content,
                                    )
                            else:
                                # Add new scheduler section
                                sched_section = f"\n[scheds.{value}]\nauto_mode = [{param_list_str}]\n"
                                config_content += sched_section
                    else:
                        # If value is empty, delete or comment out default_sched line
                        default_sched_pattern = re.compile(
                            r'^default_sched\s*=\s*"[^"]*"', re.MULTILINE
                        )
                        if re.search(default_sched_pattern, config_content):
                            config_content = re.sub(
                                default_sched_pattern,
                                '# default_sched = ""  # disabled',
                                config_content,
                            )

                    # Write modified configuration
                    temp_file.write(config_content)

            # Use sudo to copy temporary file to configuration file
            cmd = ["sudo", "mkdir", "-p", os.path.dirname(config_file)]
            subprocess.run(cmd, check=True, env=get_env())

            cmd = ["sudo", "cp", temp_path, config_file]
            subprocess.run(cmd, check=True, env=get_env())

            # Delete temporary file
            os.unlink(temp_path)

            # Restart scx_loader service, only use systemctl
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
