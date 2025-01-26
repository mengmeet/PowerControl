import re
from typing import Callable

from config import logger


def _get_intel_gpu_base_script() -> str:
    """获取 Intel GPU 基础脚本。

    生成用于获取 Intel GPU 设备路径和频率限制的基础脚本。

    Returns:
        str: 基础脚本内容
    """
    return """    GPU=$(grep -H 0x8086 /sys/class/drm/card?/device/vendor 2>/dev/null | head -n1 | sed 's/\/device\/vendor:.*//')
    
    # 检查是否为 xe 驱动
    if [[ -d "$GPU/device/tile0/gt0" ]]; then
        # xe driver - 使用 gt0 的路径
        GPU_MIN_FREQ="$GPU/device/tile0/gt0/freq0/min_freq"
        GPU_MAX_FREQ="$GPU/device/tile0/gt0/freq0/max_freq"
        GPU_MIN_LIMIT_VAL="$(cat $GPU/device/tile0/gt0/freq0/rpn_freq)"
        GPU_MAX_LIMIT_VAL="$(cat $GPU/device/tile0/gt0/freq0/rp0_freq)"
    else
        # i915 driver - 使用原有路径
        GPU_MIN_FREQ="$GPU/gt_min_freq_mhz"
        GPU_MAX_FREQ="$GPU/gt_max_freq_mhz"
        GPU_MIN_LIMIT_VAL="$(cat $GPU/gt_RPn_freq_mhz)"
        GPU_MAX_LIMIT_VAL="$(cat $GPU/gt_RP0_freq_mhz)"
    fi"""


def _get_intel_gpu_auto_script() -> str:
    """获取 Intel GPU 自动模式脚本。

    生成用于处理 auto 模式的脚本，设置 GPU 频率为默认范围。

    Returns:
        str: auto 模式脚本内容
    """
    return """    echo "setting intel gpu $GPU to [$WRITE_VALUE]" | systemd-cat -t p-steamos-priv-write -p warning
    if [[ "$WRITE_VALUE" == "auto" ]]; then
        echo "$GPU_MIN_LIMIT_VAL" >"$GPU_MIN_FREQ"
        echo "$GPU_MAX_LIMIT_VAL" >"$GPU_MAX_FREQ"
        echo "commit: $GPU_MIN_LIMIT_VAL -> $GPU_MIN_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
        echo "commit: $GPU_MAX_LIMIT_VAL -> $GPU_MAX_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
    fi
    exit 0"""


def _get_intel_gpu_manual_script() -> str:
    """获取 Intel GPU 手动模式脚本。

    生成用于处理手动模式的脚本，允许用户设置自定义的 GPU 频率范围。

    Returns:
        str: 手动模式脚本内容
    """
    return """    echo "commit: GPU -> $WRITE_VALUE" | systemd-cat -t p-steamos-priv-write -p warning
    if [[ "$WRITE_VALUE" =~ "s 0" ]]; then
        min_freq=$(echo "$WRITE_VALUE" | sed 's/.*s 0 //')
        if [[ "$(cat $GPU_MAX_FREQ)" -lt "$min_freq" ]]; then
            echo "commit: $GPU_MAX_FREQ -> $min_freq" | systemd-cat -t p-steamos-priv-write -p warning
            echo "$min_freq" >"$GPU_MAX_FREQ"
        fi
        if [[ "$min_freq" -lt "$GPU_MIN_LIMIT_VAL" ]]; then
            min_freq="$GPU_MIN_LIMIT_VAL"
        fi
        if [[ "$min_freq" -gt "$GPU_MAX_LIMIT_VAL" ]]; then
            min_freq="$GPU_MAX_LIMIT_VAL"
        fi
        echo "commit: $min_freq -> $GPU_MIN_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
        echo "$min_freq" >"$GPU_MIN_FREQ"
    fi
    if [[ "$WRITE_VALUE" =~ "s 1" ]]; then
        max_freq=$(echo "$WRITE_VALUE" | sed 's/.*s 1 //')
        if [[ "$max_freq" -gt "$GPU_MAX_LIMIT_VAL" ]]; then
            max_freq="$GPU_MAX_LIMIT"
        fi
        echo "commit: $max_freq -> $GPU_MAX_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
        echo "$max_freq" >"$GPU_MAX_FREQ"
    fi
    exit 0"""


def _get_intel_gpu_script(path: str) -> str:
    """生成完整的 Intel GPU 控制脚本。

    根据路径类型生成相应的 GPU 控制脚本。

    Args:
        path: GPU 控制文件路径

    Returns:
        str: 完整的脚本内容
    """
    base_script = _get_intel_gpu_base_script()
    if path == "power_dpm_force_performance_level":
        script_block = base_script + "\n" + _get_intel_gpu_auto_script()
    else:
        script_block = base_script + "\n" + _get_intel_gpu_manual_script()

    return f"""
if [[ "$WRITE_PATH" == /sys/class/drm/card*/device/{path} ]]; then
{script_block}
fi
"""


def fix_gpuFreqSlider_INTEL() -> bool:
    return fix_gpuFreqSlider(_get_intel_gpu_script)


def fix_gpuFreqSlider_AMD() -> bool:
    return fix_gpuFreqSlider(_create_amd_gpu_script_block)


def fix_gpuFreqSlider(create_gpu_script_block: Callable[[str], str]) -> bool:
    """修复 GPU 频率滑块功能。

    修改 steamos-priv-write 脚本，确保其能正确处理  GPU 的频率控制。
    主要处理两个控制文件：
    1. power_dpm_force_performance_level：性能级别控制
    2. pp_od_clk_voltage：频率和电压控制

    Args:
        create_gpu_script_block (Callable[[str], str]): 生成 GPU 脚本的函数

    Returns:
        bool: 操作是否成功
    """
    steamos_priv_path = "/usr/bin/steamos-polkit-helpers/steamos-priv-write"
    gpu_control_paths = [
        "power_dpm_force_performance_level",  # 性能级别控制
        "pp_od_clk_voltage",  # 频率和电压控制
    ]

    try:
        # 读取原始脚本
        with open(steamos_priv_path, "r") as file:
            script_content = file.read()
    except IOError as e:
        logger.error(f"无法读取 steamos-priv-write 脚本: {e}")
        return False

    # 跟踪是否有修改
    script_modified = False

    # 处理每个控制路径
    for path in gpu_control_paths:
        # 生成新的代码块
        new_code_block = create_gpu_script_block(path)

        # 在脚本中查找对应的部分
        found, existing_block, position = _find_script_section(script_content, path)

        if found:
            # 如果找到现有代码块且内容不同，则更新
            if existing_block.strip() != new_code_block.strip():
                logger.info(f"更新 GPU 控制代码块: {path}")
                script_content = script_content.replace(existing_block, new_code_block)
                script_modified = True
        else:
            # 如果没找到，在 DeclineWrite 之前添加新代码块
            logger.info(f"添加新的 GPU 控制代码块: {path}")
            script_content = (
                script_content[:position] + new_code_block + script_content[position:]
            )
            script_modified = True

    # 如果有修改，写回文件
    if script_modified:
        try:
            with open(steamos_priv_path, "w") as file:
                file.write(script_content)
            logger.info("成功更新 steamos-priv-write 脚本")
            return True
        except IOError as e:
            logger.error(f"写入 steamos-priv-write 脚本失败: {e}")
            return False

    return True


def _create_amd_gpu_script_block(path: str) -> str:
    """创建 AMD GPU 控制脚本块。

    为指定的路径创建完整的 if 条件块，包括路径匹配和执行命令。

    Args:
        path: GPU 控制文件路径（如 power_dpm_force_performance_level）

    Returns:
        完整的脚本代码块
    """
    return f"""
if [[ "$WRITE_PATH" == /sys/class/drm/card*/device/{path} ]]; then
   WRITE_PATH=$(ls /sys/class/drm/*/device/{path} | head -n 1)
   CommitWrite
fi
"""


def _find_script_section(script: str, path: str) -> tuple[bool, str, int]:
    """在脚本中查找特定路径的代码段。

    Args:
        script: 完整的脚本内容
        path: 要查找的 GPU 控制文件路径

    Returns:
        tuple[bool, str, int]:
        - 是否找到匹配的代码段
        - 找到的代码段内容（如果有）
        - 代码段的起始位置（如果有）或建议插入的位置
    """
    # 匹配目标 if 语句
    pattern = (
        r'\nif \[\[ "\$WRITE_PATH" == /sys/class/drm/card\*/device/{0} \]\];'.format(
            re.escape(path)
        )
    )

    # 先找到所有匹配的起始位置
    matches = list(re.finditer(pattern, script))

    if matches:
        # 对于每个匹配，找到对应的完整代码块
        for match in matches:
            # 注意：start_pos 现在包含了换行符，所以不需要调整
            start_pos = match.start()
            # 从匹配位置开始查找下一个 fi
            remaining_text = script[start_pos:]
            fi_match = re.search(r"\nfi\b", remaining_text)
            if fi_match:
                end_pos = start_pos + fi_match.end()
                block = script[start_pos:end_pos]
                return True, block, start_pos

    # 如果没找到，查找 DeclineWrite 的位置
    decline_pos = script.find("\nDeclineWrite")
    if decline_pos != -1:
        return False, "", decline_pos

    # 如果找不到 DeclineWrite，就放在文件末尾
    return False, "", len(script)
