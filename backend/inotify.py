import asyncio
import os
import time
import subprocess
import ctypes
import struct
import sys
import threading
import re
from ctypes import CDLL, get_errno
from threading import Thread, Timer
from config import logger

IN_ACCESS        = 0x00000001  # 文件被访问
IN_MODIFY        = 0x00000002  # 文件被修改
IN_ATTRIB       = 0x00000004    # 元数据改变
IN_CLOSE_WRITE   = 0x00000008  # 可写文件被关闭
IN_CLOSE_NOWRITE = 0x00000010  # 不可写文件被关闭
IN_OPEN          = 0x00000020  # 文件被打开
IN_MOVED_FROM    = 0x00000040  # 文件从X移动
IN_MOVED_TO      = 0x00000080  # 文件被移动到Y
IN_CREATE       = 0x00000100  # 子文件创建
IN_DELETE       = 0x00000200  # 子文件删除
IN_DELETE_SELF   = 0x00000400  # 自身（被监视的项本身）被删除
IN_MOVE_SELF     = 0x00000800  # 自身（被监视的项本身）被移动

class Inotify:
    def __init__(self):
        try:
            self._libc = CDLL(None, use_errno=True)
            self._libc.inotify_init.argtypes = []
            self._libc.inotify_init.restype = ctypes.c_int
            self._libc.inotify_add_watch.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_uint32]
            self._libc.inotify_add_watch.restype = ctypes.c_int
            self._libc.inotify_rm_watch.argtypes = [ctypes.c_int, ctypes.c_int]
            self._libc.inotify_rm_watch.restype = ctypes.c_int

            self.fd = self._libc.inotify_init()

            self._wdMap = {}
            self._delay = 0.5
            self._delaytimer = {}
            self._runThread = None
        except Exception as e:
            logger.error(e)

    def _process(self):
        try:
            if self._runThread:
                nowThread = self._runThread.name
            while self._runThread and self._runThread.name == nowThread:
                buf = os.read(self.fd, 4096)
                pos = 0
                wdMap = self._wdMap.copy()
                while pos < len(buf):
                    (wd, mask, cookie, name_len) = struct.unpack('iIII', buf[pos:pos + 16])
                    pos += 16
                    (name,) = struct.unpack('%ds' % name_len, buf[pos:pos + name_len])
                    pos += name_len
                    item = wdMap.get(wd)
                    if item and self._runThread and self._runThread.name == nowThread:
                        self._delayCall(wd,item['callback'], item['path'], mask)
        except Exception as e:
            logger.error(e)

    def _delayCall(self,wd,callfunc, *args):
        try:
            if wd in self._delaytimer and self._delaytimer[wd] is not None and self._delaytimer[wd].is_alive():
                self._delaytimer[wd].cancel()
            self._delaytimer[wd] = Timer(self._delay, lambda: self._onCallBack(callfunc,*args))
            self._delaytimer[wd].start()
        except Exception as e:
            logger.error(e)

    def _onCallBack(self, callfunc, *args):
        logger.debug(f"callback path:{args[0]}, mask:{args[1]}")
        callfunc(*args)

    def add_watch(self, path, mask, callback):
        try:
            logger.debug(f"add_watch(self, path:{path}, mask:{mask}, callback:{callback})")
            path_buf = ctypes.create_string_buffer(path.encode(sys.getfilesystemencoding()))
            wd = self._libc.inotify_add_watch(self.fd, path_buf, mask)
            self._wdMap[wd] = {'path': path, 'callback': callback}
            if wd < 0:
                sys.stderr.write(f"can't add watch for {path_buf}: {os.strerror(get_errno())}\n")
            return wd
        except Exception as e:
            logger.error(e)

    def remove_watch(self, path):
        try:
            for wd in list(self._wdMap):
                if path == self._wdMap[wd]['path']:
                    if self._libc.inotify_rm_watch(self.fd, wd) < 0:
                        sys.stderr.write(f"can't remove watch: {os.strerror(get_errno())}\n")
                    else:
                        self._wdMap.pop(wd)
        except Exception as e:
            logger.error(e)

    def run(self):
        try:
            if self._runThread:
                pass
            else:
                self._runThread =  Thread(target=self._process)
                self._runThread.start()
        except Exception as e:
            logger.error(e)

    def stop(self):
        self._runThread = None

notify = Inotify()
notify.run()
