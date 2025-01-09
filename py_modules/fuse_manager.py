import asyncio
from threading import Event

import decky
from config import logger


class FuseManager:
    def __init__(self):
        self.t = None
        self.t_sys = None
        self.should_exit = None
        self.emit = None
        self.min_tdp = 3
        self.default_tdp = 500
        self.max_tdp = 30

        self.igpu_path = None

    def __del__(self):
        self.unload()

    def unload(self):
        if self.t_sys:
            self.t_sys.join()
        self.should_exit.set()
        if self.igpu_path:
            # umount igpu
            try:
                import subprocess

                subprocess.run(["umount", "-f", self.igpu_path])
            except Exception:
                pass

    def emit_tdp_frontend(self, tdp):
        """
        发送 tdp 到前端
        不直接调用 tdp 控制函数，而是通过事件通知前端
        再由前端处理后，最终调用 tdp 控制函数
        否则无法实现UI和插件同步
        """
        logger.info(f"QAM Set TDPLimit: {tdp}")
        asyncio.run(decky.emit("QAM_setTDP", tdp))

    def fuse_init(self):
        """
        初始化 fuse, 使用 fuse 处理 hwmon, 使得 steam 可以通过侧边栏调整 tdp
        在 TDP 控制开关关闭后, steam 默认会设置 TDP 为 default_tdp

        目前问题:
        对于 tdp 控制条最大最小值的调整, 需要重启 steam 才能生效
        并且 暂时找不到办法去直接修改控制条当前值。导致如果因电源策略或者应用策略导致 tdp 变化
        会不能将值应用到侧边栏的 tdp 控制条

        简而言之 就是侧边栏的调整能同步到插件中，但是插件中的调整不能同步到侧边栏
        """
        from pfuse import (
            find_igpu,
            prepare_tdp_mount,
            start_tdp_client,
            umount_fuse_igpu,
        )

        umount_fuse_igpu()
        self.igpu_path = find_igpu()

        if self.should_exit:
            return
        self.should_exit = Event()
        try:
            stat = prepare_tdp_mount()
            if stat:
                self.t_sys = start_tdp_client(
                    self.should_exit,
                    self.emit_tdp_frontend,
                    self.min_tdp,
                    self.default_tdp,
                    self.max_tdp,
                )
        except Exception:
            logger.error("Failed to start", exc_info=True)
