import os
from typing import Optional, Tuple

POWER_SUPPLY_PATH = "/sys/class/power_supply"
CHARGE_CONTROL_END_THRESHOLD = "charge_control_end_threshold"
CHARGE_BEHAVIOUR = "charge_behaviour"
CHARGE_TYPE = "charge_type"


def _find_battery_device() -> Optional[str]:
    """
    查找系统中的电池设备

    Returns:
        Optional[str]: 电池设备名称，如果未找到则返回 None
    """
    try:
        for device in os.listdir(POWER_SUPPLY_PATH):
            device_type_path = os.path.join(POWER_SUPPLY_PATH, device, "type")
            if os.path.exists(device_type_path):
                with open(device_type_path, "r") as f:
                    if f.read().strip() == "Battery":
                        return device
        return None
    except (FileNotFoundError, IOError):
        return None


def get_battery_info() -> Tuple[int, bool]:
    """
    获取电池信息

    Returns:
        Tuple[int, bool]: (电量百分比, 是否正在充电)
        电量百分比: 0-100，如果无法获取则返回 -1
        是否充电: True 表示正在充电，False 表示未充电或无法获取
    """
    battery_device = _find_battery_device()
    if not battery_device:
        return -1, False

    battery_path = os.path.join(POWER_SUPPLY_PATH, battery_device)

    # 获取电量
    try:
        with open(os.path.join(battery_path, "capacity"), "r") as f:
            percentage = int(f.read().strip())
            if not 0 <= percentage <= 100:
                percentage = -1
    except (FileNotFoundError, ValueError, IOError):
        percentage = -1

    # 获取充电状态
    try:
        with open(os.path.join(battery_path, "status"), "r") as f:
            status = f.read().strip()
            is_charging = status == "Charging"
    except (FileNotFoundError, IOError):
        is_charging = False

    return percentage, is_charging


def get_battery_percentage() -> int:
    """
    获取设备当前电量百分比

    Returns:
        int: 电量百分比（0-100），如果无法获取则返回 -1
    """
    percentage, _ = get_battery_info()
    return percentage


def is_battery_charging() -> bool:
    """
    检查设备是否正在充电

    Returns:
        bool: 如果正在充电返回 True，否则返回 False
    """
    _, is_charging = get_battery_info()
    return is_charging


def support_charge_control_end_threshold() -> bool:
    """
    检查设备是否支持电量限制

    Returns:
        bool: 如果支持返回 True，否则返回 False
    """
    battery_device = _find_battery_device()
    if not battery_device:
        return False
    threshold_path = os.path.join(
        POWER_SUPPLY_PATH, battery_device, CHARGE_CONTROL_END_THRESHOLD
    )
    # exists and writable
    if not os.path.exists(threshold_path):
        return False
    if not os.access(threshold_path, os.W_OK):
        return False
    try:
        with open(threshold_path, "r") as f:
            _ = int(f.read().strip())
            return True
    except (FileNotFoundError, ValueError, IOError):
        return False


def get_charge_control_end_threshold() -> int:
    """
    获取设备当前电量限制阈值

    Returns:
        int: 电量百分比（0-100），如果无法获取则返回 -1
    """
    battery_device = _find_battery_device()
    if not battery_device:
        return -1
    threshold_path = os.path.join(
        POWER_SUPPLY_PATH, battery_device, CHARGE_CONTROL_END_THRESHOLD
    )
    try:
        with open(threshold_path, "r") as f:
            threshold = int(f.read().strip())
            return threshold
    except (FileNotFoundError, ValueError, IOError):
        return -1


def set_charge_control_end_threshold(threshold: int) -> bool:
    """
    设置设备电量限制阈值

    Args:
        threshold (int): 电量百分比（0-100）

    Returns:
        bool: 如果成功返回 True，否则返回 False
    """
    battery_device = _find_battery_device()
    if not battery_device:
        return False
    charge_control_end_threshold_path = os.path.join(
        POWER_SUPPLY_PATH, battery_device, CHARGE_CONTROL_END_THRESHOLD
    )
    try:
        with open(charge_control_end_threshold_path, "w") as f:
            f.write(str(threshold))
            return True
    except (FileNotFoundError, ValueError, IOError):
        return False


def support_charge_behaviour() -> bool:
    """
    检查设备是否支持充电控制

    Returns:
        bool: 如果支持返回 True，否则返回 False
    """
    battery_device = _find_battery_device()
    if not battery_device:
        return False
    charge_behaviour_path = os.path.join(
        POWER_SUPPLY_PATH, battery_device, CHARGE_BEHAVIOUR
    )
    # exists and writable
    if not os.path.exists(charge_behaviour_path):
        return False
    if not os.access(charge_behaviour_path, os.W_OK):
        return False
    return True


def get_charge_behaviour() -> str:
    battery_device = _find_battery_device()
    if not battery_device:
        return ""
    charge_behaviour_path = os.path.join(
        POWER_SUPPLY_PATH, battery_device, CHARGE_BEHAVIOUR
    )
    try:
        with open(charge_behaviour_path, "r") as f:
            return f.read().strip()
    except (FileNotFoundError, ValueError, IOError):
        return ""


def set_charge_behaviour(behavior: str) -> bool:
    battery_device = _find_battery_device()
    if not battery_device:
        return False
    charge_behaviour_path = os.path.join(
        POWER_SUPPLY_PATH, battery_device, CHARGE_BEHAVIOUR
    )
    # exists and writable
    if not os.path.exists(charge_behaviour_path):
        return False
    if not os.access(charge_behaviour_path, os.W_OK):
        return False
    try:
        with open(charge_behaviour_path, "w") as f:
            f.write(str(behavior))
            return True
    except (FileNotFoundError, ValueError, IOError):
        return False


def support_charge_type() -> bool:
    battery_device = _find_battery_device()
    if not battery_device:
        return False
    charge_type_path = os.path.join(POWER_SUPPLY_PATH, battery_device, CHARGE_TYPE)
    # exists and writable
    if not os.path.exists(charge_type_path):
        return False
    if not os.access(charge_type_path, os.W_OK):
        return False
    return True


def get_charge_type() -> str | None:
    battery_device = _find_battery_device()
    if not battery_device:
        return None
    charge_type_path = os.path.join(POWER_SUPPLY_PATH, battery_device, CHARGE_TYPE)
    try:
        with open(charge_type_path, "r") as f:
            return f.read().strip()
    except (FileNotFoundError, ValueError, IOError):
        return None


def set_charge_type(charge_type: str) -> bool:
    battery_device = _find_battery_device()
    if not battery_device:
        return False
    charge_type_path = os.path.join(POWER_SUPPLY_PATH, battery_device, CHARGE_TYPE)
    # exists and writable
    if not os.path.exists(charge_type_path):
        return False
    if not os.access(charge_type_path, os.W_OK):
        return False
    try:
        with open(charge_type_path, "w") as f:
            f.write(str(charge_type))
            return True
    except (FileNotFoundError, ValueError, IOError):
        return False
