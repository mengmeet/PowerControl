import asyncio
import os
from threading import Event

import decky
from conf_manager import confManager
from config import logger
from power_manager import PowerManager


class FuseManager:
    def __init__(
        self,
        max_tdp=30,
        power_manager: PowerManager = None,
    ):
        self.t = None
        self.t_sys = None
        self.should_exit = None
        self.emit = None
        self.min_tdp = 3
        self.default_tdp = 500
        self.max_tdp = max_tdp
        self.power_manager = power_manager
        self.igpu_path = None

    def __del__(self):
        self.unload()

    def unload(self):
        """
        清理 FUSE 相关资源
        1. 设置退出标志
        2. 等待线程结束
        3. 卸载 FUSE 挂载点
        4. 清理 socket 文件
        """
        try:
            # 1. 设置退出标志
            if self.should_exit:
                self.should_exit.set()
                logger.info("Set exit flag for TDP client")

            # 2. 等待线程结束
            if self.t_sys and self.t_sys.is_alive():
                logger.info("Waiting for TDP client thread to exit")
                self.t_sys.join(timeout=5)  # 设置超时时间，避免永久等待
                if self.t_sys.is_alive():
                    logger.warning("TDP client thread did not exit within timeout")

            # 3. 卸载 FUSE 挂载点
            if self.igpu_path:
                try:
                    from pfuse import umount_fuse_igpu

                    logger.info("Attempting to unmount FUSE mount points")
                    if not umount_fuse_igpu():
                        logger.error("Failed to unmount FUSE mount points")
                except Exception as e:
                    logger.error(f"Error during FUSE unmount: {str(e)}", exc_info=True)

            # 4. 清理 socket 文件
            socket_path = "/run/powercontrol/socket"
            if os.path.exists(socket_path):
                try:
                    os.remove(socket_path)
                    logger.info("Cleaned up socket file")
                except Exception as e:
                    logger.error(
                        f"Failed to remove socket file: {str(e)}", exc_info=True
                    )

        except Exception as e:
            logger.error(f"Error during FUSE cleanup: {str(e)}", exc_info=True)
        finally:
            # 确保所有引用都被清理
            self.t_sys = None
            self.should_exit = None
            self.igpu_path = None

    def emit_tdp_frontend(self, tdp):
        """
        发送 tdp 到前端
        不直接调用 tdp 控制函数，而是通过事件通知前端
        再由前端处理后，最终调用 tdp 控制函数
        否则无法实现UI和插件同步
        """
        logger.info(f"QAM Set TDPLimit: {tdp}")
        asyncio.run(decky.emit("QAM_setTDP", tdp))

    def apply_tdp(self, tdp):
        """
        直接应用TDP
        """
        logger.info(f"Apply TDP: {tdp}")
        if tdp == self.default_tdp:
            logger.info(f"Apply TDP: default, set to max {self.max_tdp}")
            tdp = self.max_tdp
        if self.power_manager:
            self.power_manager.set_tdp(tdp)
        else:
            logger.error("power_manager is not set")

    def fuse_init(self):
        """
        初始化 fuse, 使用 fuse 处理 hwmon, 使得 steam 可以通过侧边栏调整 tdp
        在 TDP 控制开关关闭后, steam 默认会设置 TDP 为 default_tdp

        目前问题:
        对于 tdp 控制条最大最小值的调整, 需要重启 steam 才能生效
        并且 暂时找不到办法去更新控制条UI的值。导致如果因电源策略或者应用策略导致 tdp 变化
        会不能将值应用到侧边栏的 tdp 控制条

        简而言之 就是侧边栏的调整能同步到插件中，但是插件中的调整不能同步到侧边栏
        """
        from pfuse import find_igpu, prepare_tdp_mount, start_tdp_client
        from utils.tdp import getMaxTDP

        # umount igpu
        # umount_fuse_igpu()
        # find igpu
        self.igpu_path = find_igpu()

        settings = confManager.getSettings()
        tdpMax = getMaxTDP()
        enableCustomTDPRange = settings.get("enableCustomTDPRange", False)
        realTDPMax = (
            settings.get("customTDPRangeMax", tdpMax)
            if enableCustomTDPRange
            else tdpMax
        )

        logger.info(f">>>> FuseManager tdpMax: {realTDPMax}")
        self.max_tdp = realTDPMax

        if self.should_exit:
            return
        self.should_exit = Event()
        try:
            stat = prepare_tdp_mount()
            if stat:
                self.t_sys = start_tdp_client(
                    self.should_exit,
                    self.apply_tdp,
                    self.min_tdp,
                    self.default_tdp,
                    self.max_tdp,
                )
        except Exception:
            logger.error("Failed to start", exc_info=True)
