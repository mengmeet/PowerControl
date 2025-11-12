from config import (
    CPU_ID,
    PRODUCT_NAME,
    TDP_LIMIT_CONFIG_CPU,
    TDP_LIMIT_CONFIG_PRODUCT,
    logger,
)


def getMaxTDP(default: int = 15) -> int:
    """获取最大TDP值。

    Returns:
        int: 最大TDP值（瓦特）
    """
    logger.info("getMaxTDP by config, default: {}".format(default))
    try:
        # 根据机器型号或者CPU型号返回tdp最大值
        if PRODUCT_NAME in TDP_LIMIT_CONFIG_PRODUCT:
            cpu_tdpMax = TDP_LIMIT_CONFIG_PRODUCT[PRODUCT_NAME]
        else:
            for model in TDP_LIMIT_CONFIG_CPU:
                if model in CPU_ID:
                    cpu_tdpMax = TDP_LIMIT_CONFIG_CPU[model]
                    break
                else:
                    cpu_tdpMax = default
        logger.info("getMaxTDP by config: {}".format(cpu_tdpMax))
        return cpu_tdpMax
    except Exception:
        logger.error("Failed to get max TDP value", exc_info=True)
        return default
