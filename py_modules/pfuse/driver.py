# This code is based on the example code from fuse-python
# Technically, the original file is LGPL. My additions are GPL.
#
# Original copyrights:
#    Copyright (C) 2001  Jeff Epler  <jepler@unpythonic.dhs.org>
#    Copyright (C) 2006  Csaba Henk  <csaba.henk@creo.hu>

# Protocol:
# The server sends commands to the client.
# It may not send multiple commands without waiting for a reply.
# The reply is always to the last command.
# All commands are 1024 bytes long.
#
# Commands have the following format:
# "cmd:<command_name>:<arg1>:<arg2>\n"
# "ack:<response>\n"
#
# The following commands are supported:
# "cmd:get:<name>\n"
# "cmd:set:<name>:<val>\n"
#
# The get command will return the current value of the attribute ("ack:<value>\n").
# The set command will set the value of the attribute and just ack ("ack\n").
from __future__ import print_function

import fcntl
import io
import logging
import os
import socket
import sys
import time
from errno import *  # type: ignore
from stat import *  # type: ignore
from threading import Lock

import fuse
from fuse import Fuse

logger = logging.getLogger(__name__)

FUSE_MOUNT_DIR = "/run/powercontrol/"
FUSE_MOUNT_SOCKET = "/run/powercontrol/socket"
TIMEOUT = 1
PACK_SIZE = 1024
SOCKET_ACCEPT_TIMEOUT = 0.5  # 增加到 500ms
SOCKET_OPERATION_TIMEOUT = 1.0  # socket 操作超时时间
fuse.fuse_python_api = (0, 2)


class VirtualStat(fuse.Stat):
    def __init__(self):
        self.st_mode = 33206
        self.st_ino = 0
        self.st_dev = 80
        self.st_nlink = 1
        self.st_uid = 0
        self.st_gid = 0
        self.st_size = 4096
        self.st_atime = 0
        self.st_mtime = 0
        self.st_ctime = 0


VIRTUAL_FILES = [
    "power1_cap_default",
    "power1_cap_min",
    "power1_cap_max",
    "power1_cap",
    "power2_cap_default",
    "power2_cap_min",
    "power2_cap_max",
    "power2_cap",
]


def is_virtual_file(path):
    return path.split("/")[-1] in VIRTUAL_FILES


def flag2mode(flags):
    md = {os.O_RDONLY: "rb", os.O_WRONLY: "wb", os.O_RDWR: "wb+"}
    m = md[flags & (os.O_RDONLY | os.O_WRONLY | os.O_RDWR)]

    if flags | os.O_APPEND:
        m = m.replace("w", "a", 1)

    return m


class Xmp(Fuse):

    def __init__(self, *args, **kw):
        Fuse.__init__(self, *args, **kw)
        self.root = "/"

    def getattr(self, path):
        if "power1_cap" in path or "power2_cap" in path:
            # Stub attributes for power1_cap and power2_cap
            return VirtualStat()
        return os.lstat("." + path)

    def readlink(self, path):
        return os.readlink("." + path)

    def readdir(self, path, offset):
        for e in os.listdir("." + path):
            yield fuse.Direntry(e)

        if path == "/" or (
            path.startswith("/hwmon/hwmon") and len(path.split("/")) <= 4
        ):
            for e in VIRTUAL_FILES:
                yield fuse.Direntry(e)

    def unlink(self, path):
        os.unlink("." + path)

    def rmdir(self, path):
        os.rmdir("." + path)

    def symlink(self, path, path1):
        os.symlink(path, "." + path1)

    def rename(self, path, path1):
        os.rename("." + path, "." + path1)

    def link(self, path, path1):
        os.link("." + path, "." + path1)

    def chmod(self, path, mode):
        os.chmod("." + path, mode)

    def chown(self, path, user, group):
        os.chown("." + path, user, group)

    def truncate(self, path, len):
        if is_virtual_file(path):
            return
        f = open("." + path, "a")
        f.truncate(len)
        f.close()

    def mknod(self, path, mode, dev):
        os.mknod("." + path, mode, dev)

    def mkdir(self, path, mode):
        os.mkdir("." + path, mode)

    def utime(self, path, times):
        os.utime("." + path, times)

    def access(self, path, mode):
        if is_virtual_file(path):
            return 0
        if not os.access("." + path, mode):
            return -EACCES

    def statfs(self):
        return os.statvfs(".")

    def fsinit(self):
        os.chdir(self.root)

    def main(self, *a, passthrough=False, **kw):
        logger.info("Starting FUSE mount process")
        try:
            os.makedirs(FUSE_MOUNT_DIR, exist_ok=True)
            logger.info(f"Created or verified FUSE mount directory: {FUSE_MOUNT_DIR}")

            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            logger.info("Created Unix domain socket")

            # Remove old socket file if exists
            if os.path.exists(FUSE_MOUNT_SOCKET):
                os.remove(FUSE_MOUNT_SOCKET)
                logger.info(f"Removed existing socket file: {FUSE_MOUNT_SOCKET}")

            sock.bind(FUSE_MOUNT_SOCKET)
            logger.info(f"Bound socket to: {FUSE_MOUNT_SOCKET}")

            # Set socket file permissions
            os.chmod(FUSE_MOUNT_SOCKET, 0o666)
            logger.info("Set socket file permissions to 0666")

            sock.listen(10)
            logger.info("Socket now listening for connections")

            self.file_class = XmpFile
            XmpFile.h = Handler(sock)
            XmpFile.cache = {}
            XmpFile.passthrough = passthrough
            logger.info(f"Initialized XmpFile with passthrough={passthrough}")

            logger.info("Starting FUSE main loop")
            code = Fuse.main(self, *a, **kw)
            logger.info("FUSE main loop ended")

            sock.close()
            logger.info("Closed socket")
            return code
        except Exception as e:
            logger.error(f"Error in FUSE main process: {str(e)}", exc_info=True)
            raise


class Handler:
    def __init__(self, sock: socket.socket):
        logger.info("Initializing Handler")
        self.sock = sock
        self.conn = None

    def get_conn(self, retry: bool = False):
        if not retry and self.conn:
            logger.debug("Using existing connection")
            return self.conn

        for attempt in range(3):  # 最多尝试3次
            try:
                logger.debug(f"Connection attempt {attempt + 1} (retry={retry})")
                self.sock.settimeout(SOCKET_ACCEPT_TIMEOUT)
                conn, addr = self.sock.accept()
                logger.info(f"New connection accepted from {addr}")

                if self.conn:
                    logger.info("Closing existing connection")
                    self.conn.close()

                self.conn = conn
                return self.conn

            except socket.timeout as e:
                logger.debug(f"Connection attempt {attempt + 1} timed out: {e}")
                if attempt == 2:  # 最后一次尝试
                    logger.warning("All connection attempts timed out")

            except Exception as e:
                logger.error(f"Error accepting connection: {e}", exc_info=True)
                break

        logger.debug("Returning existing connection (might be None)")
        return self.conn


class XmpFile:
    h: Handler
    cache: dict[str, bytes]
    passthrough: bool

    def __init__(self, path, flags, *mode):
        logger.debug(
            f"Initializing XmpFile for path: {path}, flags: {flags}, mode: {mode}"
        )
        self.path = path
        power_attr = "power1_cap" in path or "power2_cap" in path
        passthrough = XmpFile.passthrough and path.endswith("_cap")

        if power_attr and not passthrough:
            logger.info(f"GPU Attribute access: {path} {flags} {mode}")

            endpoint = path.split("/")[-1]
            cmd = f"cmd:get:{endpoint}\n".encode()
            contents = None

            for i in range(2):
                logger.debug(f"Attempt {i+1} to get GPU attributes")
                try:
                    conn = self.h.get_conn(bool(i))
                    if not conn:
                        logger.error("Failed to get connection")
                        if i == 1:  # 只在第二次尝试失败时抛出异常
                            raise RuntimeError(
                                "No active connection. Can not access GPU attributes."
                            )
                        continue  # 第一次失败时继续尝试

                    conn.settimeout(SOCKET_OPERATION_TIMEOUT)
                    logger.debug(f"Sending command: {cmd}")
                    conn.send(cmd + bytes(PACK_SIZE - len(cmd)))

                    resp = b"/"
                    start_time = time.time()
                    while resp and not resp.startswith(b"ack:"):
                        if time.time() - start_time > SOCKET_OPERATION_TIMEOUT:
                            logger.error("Response timeout")
                            break
                        conn.settimeout(SOCKET_OPERATION_TIMEOUT)
                        resp = conn.recv(PACK_SIZE)
                        logger.debug(f"Received response: {resp}")

                    if not resp.startswith(b"ack:"):
                        logger.error("Invalid response format")
                        continue

                    contents = resp[4:]
                    XmpFile.cache[endpoint] = contents
                    logger.info(
                        f"Successfully received and cached contents for {endpoint}"
                    )
                    break

                except Exception as e:
                    logger.error(f"Error in attempt {i+1}: {str(e)}", exc_info=True)
                    if i:
                        if endpoint in XmpFile.cache:
                            logger.warning(f"Using cached value for {endpoint}")
                            contents = XmpFile.cache[endpoint]
                        else:
                            logger.error("No cached value available and socket failed")
                            raise

            if not contents:
                raise RuntimeError("Failed to get contents after all attempts")

            self.file = io.BytesIO(contents)
            self.fd = -1
            self.virtual = True
            logger.debug("Successfully initialized virtual file")
        else:
            logger.debug("Initializing as regular file")
            self.file = os.fdopen(os.open("." + path, flags, *mode), flag2mode(flags))
            self.fd = self.file.fileno()
            self.virtual = False

        self.wrote = False
        if hasattr(os, "pread") and not self.virtual:
            self.iolock = None
        else:
            self.iolock = Lock()
        logger.debug("XmpFile initialization completed")

    def read(self, length, offset):
        if self.iolock:
            self.iolock.acquire()
            try:
                self.file.seek(offset)
                return self.file.read(length)
            finally:
                self.iolock.release()
        else:
            return os.pread(self.fd, length, offset)

    def write(self, buf, offset):
        self.wrote = True
        if self.iolock:
            self.iolock.acquire()
            try:
                self.file.seek(offset)
                self.file.write(buf)
                return len(buf)
            finally:
                self.iolock.release()
        else:
            return os.pwrite(self.fd, buf, offset)

    def release(self, flags):
        try:
            if self.virtual and self.wrote:
                # Send file contents to hhd
                endpoint = self.path.split("/")[-1]
                conn = self.h.get_conn()
                if not conn:
                    raise RuntimeError(
                        "No active connection. Can not access GPU attributes."
                    )

                cmd = f"cmd:set:{endpoint}:".encode()
                self.file.seek(0)
                contents = self.file.read()
                if b"\0" in contents:
                    contents = contents[: contents.index(b"\0")]
                if len(contents) + len(cmd) + 1 > PACK_SIZE:
                    raise ValueError(f"Contents too large to send:\n{contents}")
                stcmd = (
                    cmd
                    + contents
                    + b"\n"
                    + bytes(PACK_SIZE - len(cmd) - len(contents) - 1)
                )
                conn.settimeout(SOCKET_OPERATION_TIMEOUT)
                conn.send(stcmd)
                resp = b""
                while resp and not resp.startswith(b"ack\n"):
                    conn.settimeout(SOCKET_OPERATION_TIMEOUT)
                    resp = conn.recv(1024).strip()
        except Exception as e:
            logger.error(f"Error sending file contents to hhd: {str(e)}", exc_info=True)
        finally:
            self.file.close()

    def _fflush(self):
        if "w" in self.file.mode or "a" in self.file.mode:
            self.file.flush()

    def fsync(self, isfsyncfile):
        if self.virtual:
            return
        self._fflush()
        if isfsyncfile and hasattr(os, "fdatasync"):
            os.fdatasync(self.fd)
        else:
            os.fsync(self.fd)

    def flush(self):
        if self.virtual:
            return
        self._fflush()
        # cf. xmp_flush() in fusexmp_fh.c
        os.close(os.dup(self.fd))

    def fgetattr(self):
        if self.virtual:
            return VirtualStat()
        return os.fstat(self.fd)

    def ftruncate(self, len):
        self.file.truncate(len)

    def lock(self, cmd, owner, **kw):
        if self.virtual:
            return -EINVAL
        op = {
            fcntl.F_UNLCK: fcntl.LOCK_UN,
            fcntl.F_RDLCK: fcntl.LOCK_SH,
            fcntl.F_WRLCK: fcntl.LOCK_EX,
        }[kw["l_type"]]
        if cmd == fcntl.F_GETLK:
            return -EOPNOTSUPP
        elif cmd == fcntl.F_SETLK:
            if op != fcntl.LOCK_UN:
                op |= fcntl.LOCK_NB
        elif cmd == fcntl.F_SETLKW:
            pass
        else:
            return -EINVAL

        fcntl.lockf(self.fd, op, kw["l_start"], kw["l_len"])


def main():
    try:
        # 配置详细的日志
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s [%(filename)s:%(lineno)d:%(funcName)s] %(levelname)s: %(message)s",
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler("/tmp/fuse_driver_debug.log"),
            ],
        )
        logger.info("FUSE driver starting with detailed logging")

        # 确保挂载目录存在
        if not os.path.exists(FUSE_MOUNT_DIR):
            os.makedirs(FUSE_MOUNT_DIR, exist_ok=True)
            logger.info(f"Created FUSE mount directory: {FUSE_MOUNT_DIR}")

        # 提前删除可能存在的旧socket文件
        if os.path.exists(FUSE_MOUNT_SOCKET):
            try:
                os.unlink(FUSE_MOUNT_SOCKET)
                logger.info(f"Removed existing socket file: {FUSE_MOUNT_SOCKET}")
            except Exception as e:
                logger.error(f"Failed to remove existing socket file: {e}")

        server = Xmp(
            version="%prog " + fuse.__version__, usage="", dash_s_do="setsingle"
        )
        server.parser.add_option(
            mountopt="root",
            metavar="PATH",
            default="/",
            help="GPU device private bind mount point",
        )
        server.parser.add_option(
            mountopt="passthrough",
            metavar="PASSTHROUGH",
            action="store_true",
            default=False,
            help="Allow tdp write passthrough, e.g., for the Steam Deck.",
        )

        logger.info("Parsing command line arguments")
        server.parse(values=server, errex=1)
        logger.info(
            f"Command line parsing complete. Root: {server.root}, Passthrough: {getattr(server, 'passthrough', False)}"
        )

        try:
            if server.fuse_args.mount_expected():
                logger.info(f"Changing working directory to: {server.root}")
                os.chdir(server.root)
        except OSError as e:
            logger.error(f"Can't enter root of underlying filesystem: {e}")
            print("can't enter root of underlying filesystem ", file=sys.stderr)
            sys.exit(1)

        logger.info("Starting FUSE main loop")
        server.main(passthrough=getattr(server, "passthrough", False))

    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt. Shutting down.")
    except Exception as e:
        logger.error(f"Unhandled exception in main: {e}", exc_info=True)
    finally:
        logger.info("FUSE driver shutting down")
        # 清理socket文件
        if os.path.exists(FUSE_MOUNT_SOCKET):
            try:
                os.unlink(FUSE_MOUNT_SOCKET)
                logger.info("Cleaned up socket file")
            except Exception as e:
                logger.error(f"Failed to clean up socket file: {e}")


if __name__ == "__main__":
    main()
