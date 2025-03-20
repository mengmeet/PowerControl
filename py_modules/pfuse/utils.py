import logging
import os
import subprocess
import time
from threading import Event, Thread

import decky
from config import logger

TDP_MOUNT = "/run/powercontrol/hwmon"
FUSE_MOUNT_SOCKET = "/run/powercontrol/socket"

def _get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env

def find_igpu():
    for hw in os.listdir("/sys/class/hwmon"):
        if not hw.startswith("hwmon"):
            continue
        if not os.path.exists(f"/sys/class/hwmon/{hw}/name"):
            continue
        with open(f"/sys/class/hwmon/{hw}/name", "r") as f:
            if "amdgpu" not in f.read():
                continue

        if not os.path.exists(f"/sys/class/hwmon/{hw}/device"):
            logger.error(f'No device symlink found for "{hw}"')
            continue

        if not os.path.exists(f"/sys/class/hwmon/{hw}/device/local_cpulist"):
            logger.warning(
                f'No local_cpulist found for "{hw}". Assuming it is a dedicated unit.'
            )
            continue

        pth = os.path.realpath(os.path.join("/sys/class/hwmon", hw))
        return pth

    logger.error("No iGPU found. Binding TDP attributes will not be possible.")
    return None


def umount_fuse_igpu():
    """
    Unmount all FUSE mount points of type fuse.driver.py that end with hwmonX
    where X is a number
    """
    try:
        logger.info("Starting to find and unmount FUSE mount points")
        with open("/proc/mounts", "r") as f:
            mounts = f.readlines()

        import re

        hwmon_pattern = re.compile(r"hwmon\d+$")

        for mount in mounts:
            try:
                device, mount_point, fs_type, *_ = mount.split()

                # Check filesystem type and mount point
                if fs_type == "fuse.driver.py" and hwmon_pattern.search(mount_point):
                    logger.info(f"Found FUSE mount point: {mount_point}")

                    # Try to unmount
                    cmd = f"umount -f '{mount_point}'"
                    logger.info(f"Executing unmount command: {cmd}")
                    r = os.system(cmd)

                    if r == 0:
                        logger.info(f"Successfully unmounted: {mount_point}")
                    else:
                        logger.error(
                            f"Failed to unmount: {mount_point}, error code: {r}"
                        )

            except Exception as e:
                logger.error(f"Error processing mount point: {str(e)}", exc_info=True)
                continue

    except Exception as e:
        logger.error(f"Error unmounting FUSE mount points: {str(e)}", exc_info=True)
        return False

    return True


def prepare_tdp_mount(debug: bool = False, passhtrough: bool = False):
    try:
        gpu = find_igpu()
        logger.info(f"Found GPU at:\n'{gpu}'")
        if not gpu:
            return False

        if os.path.ismount(gpu):
            logger.warning(f"GPU FUSE mount is already mounted at:\n'{gpu}'")
            return True

        if not os.path.exists(TDP_MOUNT):
            os.makedirs(TDP_MOUNT)

        if not os.path.ismount(TDP_MOUNT):
            logger.info(f"Creating bind mount for:\n'{gpu}'\nto:\n'{TDP_MOUNT}'")
            cmd = f"mount --bind '{gpu}' '{TDP_MOUNT}'"
            try:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    check=True,
                    env=_get_env(),
                )
            except subprocess.CalledProcessError as e:
                error_msg = f"Failed to create bind mount:\nCommand: {cmd}\nReturn code: {e.returncode}\nError: {e.stderr}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)

            logger.info("Making bind mount private.")
            cmd = f"mount --make-private '{TDP_MOUNT}'"
            try:
                result = subprocess.run(
                    cmd, shell=True, capture_output=True, text=True, check=True, env=_get_env(),
                )
            except subprocess.CalledProcessError as e:
                error_msg = f"Failed to make mount private:\nCommand: {cmd}\nReturn code: {e.returncode}\nError: {e.stderr}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
        else:
            logger.info(f"Bind mount already exists at:\n'{TDP_MOUNT}'")

        logger.info(f"Launching FUSE mount over: '{gpu}'")
        # Remove socket file to avoid linux weirdness
        if os.path.exists(FUSE_MOUNT_SOCKET):
            os.remove(FUSE_MOUNT_SOCKET)
        # exe_python = sys.executable
        exe_python = "/usr/bin/python"
        logger.info(f"Using Python: '{exe_python}'")
        # get this file's directory
        thisdir = os.path.dirname(os.path.abspath(__file__))

        # add py_modules/site-packages to PYTHONPATH
        custom_python_path = os.environ.get("PYTHONPATH", "")
        custom_python_path += f":{decky.DECKY_PLUGIN_DIR}/py_modules/site-packages"
        os.environ["PYTHONPATH"] = custom_python_path
        cmd = (
            f"{exe_python} {thisdir}/driver.py '{gpu}'"
            + f" -o root={TDP_MOUNT} -o nonempty -o allow_other"
        )
        if passhtrough:
            cmd += " -o passthrough"
        if debug:
            cmd += " -f"
        logger.info(f"Executing:\n'{cmd}'")
        try:
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, check=True, env=_get_env(),
            )
            logger.debug(f"Command output:\n{result.stdout}")
        except subprocess.CalledProcessError as e:
            error_msg = f"Failed to launch FUSE mount:\nCommand: {cmd}\nReturn code: {e.returncode}\nError: {e.stderr}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    except Exception:
        logger.error("Error preparing fuse mount.", exc_info=True)
        return False

    return True


def _tdp_client(should_exit: Event, set_tdp, min_tdp, default_tdp, max_tdp):
    import socket

    CLIENT_TIMEOUT_WAIT = 0.3
    CLIENT_MAX_CMD_T = 0.05
    CONNECT_TIMEOUT = 1.0

    # Sleep until the socket is created
    sock = None
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        logger.info("TDP client socket created")

        connect_attempts = 0
        while not should_exit.is_set():
            try:
                logger.debug(
                    f"Attempting to connect to socket (attempt {connect_attempts + 1})"
                )
                sock.settimeout(CONNECT_TIMEOUT)
                sock.connect(FUSE_MOUNT_SOCKET)
                logger.info("Connected to TDP socket")
                break
            except Exception as e:
                connect_attempts += 1
                logger.warning(f"Connection attempt {connect_attempts} failed: {e}")
                if connect_attempts >= 10:
                    logger.error("Max connection attempts reached")
                    return
                time.sleep(CLIENT_TIMEOUT_WAIT)

        def send_cmd(cmd: bytes):
            try:
                sock.send(cmd + bytes(1024 - len(cmd)))
                logger.debug(f"Sent command: {cmd}")
            except Exception as e:
                logger.error(f"Failed to send command: {e}")

        tdp = default_tdp
        logger.info(f"Starting command loop with default TDP: {tdp}")

        while not should_exit.is_set():
            try:
                sock.settimeout(0.5)
                data = sock.recv(1024)
                logger.debug(f"Received data: {data}")
            except socket.timeout:
                time.sleep(CLIENT_TIMEOUT_WAIT)
                continue
            except Exception as e:
                logger.error(f"Error receiving data: {e}")
                break

            if not data:
                logger.warning("Received empty data")
                continue

            if not data.startswith(b"cmd:"):
                logger.debug("Received non-command data")
                continue

            try:
                if b"set" in data and b"power1_cap" in data:
                    try:
                        tdp = int(int(data.split(b"\0")[0].split(b":")[-1]) / 1_000_000)
                        if tdp:
                            logger.info(f"Received TDP value {tdp} from /sys")
                            set_tdp(tdp)
                        else:
                            logger.info("Received TDP value 0, ignoring")
                            set_tdp(None)
                    except Exception as e:
                        logger.error(f"Failed to process TDP value: {e}", exc_info=True)
                    send_cmd(b"ack\n")

                elif b"get" in data:
                    if b"min" in data:
                        send_cmd(b"ack:" + str(min_tdp).encode() + b"000000\n")
                    elif b"max" in data:
                        send_cmd(b"ack:" + str(max_tdp).encode() + b"000000\n")
                    elif b"default" in data:
                        send_cmd(b"ack:" + str(default_tdp).encode() + b"000000\n")
                    else:
                        send_cmd(b"ack:" + str(tdp).encode() + b"000000\n")
                else:
                    send_cmd(b"ack\n")

            except Exception as e:
                logger.error(f"Error processing command: {e}", exc_info=True)

            time.sleep(CLIENT_MAX_CMD_T)

    except Exception as e:
        logger.error(f"Fatal error in TDP client: {e}", exc_info=True)
    finally:
        if sock:
            try:
                sock.close()
                logger.info("TDP client socket closed")
            except Exception as e:
                logger.error(f"Error closing socket: {e}")


def start_tdp_client(
    should_exit: Event, emit, min_tdp: int, default_tdp: int, max_tdp: int
):
    def set_tdp(tdp):
        return emit and emit(tdp)
        # return emit and emit({"type": "tdp", "tdp": tdp})

    logger.info(f"Starting TDP client on socket:\n'{FUSE_MOUNT_SOCKET}'")
    t = Thread(
        target=_tdp_client, args=(should_exit, set_tdp, min_tdp, default_tdp, max_tdp)
    )
    t.start()
    return t


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    prepare_tdp_mount(True)
