import asyncio
import os
import threading
from threading import Event

import decky
from conf_manager import confManager
from config import logger
from power_manager import PowerManager


class FuseManager:
    """
    FUSE 管理器单例类
    确保整个应用程序中只有一个 FUSE 管理器实例，避免资源冲突
    """

    _instance = None
    _lock = threading.Lock()  # 确保线程安全的锁

    @classmethod
    def get_instance(cls, max_tdp=30, power_manager=None):
        """
        获取 FuseManager 单例实例
        如果实例不存在，则创建一个新实例

        Args:
            max_tdp: 最大 TDP 值
            power_manager: 电源管理器实例

        Returns:
            FuseManager 单例实例
        """
        with cls._lock:
            if cls._instance is None:
                logger.info("Creating new FuseManager instance")
                cls._instance = cls(max_tdp, power_manager)
            else:
                # 更新现有实例的属性
                if power_manager and not cls._instance.power_manager:
                    logger.info("Updating FuseManager power_manager")
                    cls._instance.power_manager = power_manager

                if max_tdp != cls._instance.max_tdp:
                    logger.info(
                        f"Updating FuseManager max_tdp from {cls._instance.max_tdp} to {max_tdp}"
                    )
                    cls._instance.max_tdp = max_tdp

            return cls._instance

    def __init__(
        self,
        max_tdp=30,
        power_manager: PowerManager = None,
    ):
        """
        初始化 FuseManager
        注意：不应直接调用此构造函数，而是使用 get_instance 方法
        """
        # 如果已经有实例，则直接返回
        if FuseManager._instance is not None:
            logger.warning(
                "FuseManager singleton already exists - use get_instance() instead"
            )
            return

        self.t = None
        self.t_sys = None
        self.should_exit = None
        self.emit = None
        self.min_tdp = 3
        self.default_tdp = 500
        self.max_tdp = max_tdp
        self.power_manager = power_manager
        self.igpu_path = None
        self._initialized = False
        logger.info(f"FuseManager initialized with max_tdp={max_tdp}")

    def __del__(self):
        """
        在对象被销毁时执行清理操作
        """
        self.unload()

    def unload(self):
        """
        清理 FUSE 相关资源
        1. 设置退出标志
        2. 等待线程结束
        3. 卸载 FUSE 挂载点
        4. 清理 socket 文件
        """
        # 如果没有初始化，则无需执行清理
        if not self._initialized:
            return

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
            self._initialized = False

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
        # 如果已经初始化，则返回
        if self._initialized:
            logger.info("FuseManager already initialized")
            return True

        from pfuse import find_igpu, prepare_tdp_mount, start_tdp_client
        from utils.tdp import getMaxTDP

        # find igpu
        self.igpu_path = find_igpu()
        if not self.igpu_path:
            logger.error("No iGPU found, cannot initialize FUSE")
            return False

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
            return False

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
                self._initialized = True
                logger.info("FuseManager successfully initialized")
                return True
            else:
                logger.error("Failed to prepare TDP mount")
                return False
        except Exception as e:
            logger.error(f"Failed to start FUSE: {str(e)}", exc_info=True)
            return False
