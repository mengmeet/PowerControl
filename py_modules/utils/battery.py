import os
from typing import Optional, Tuple


def _find_battery_device() -> Optional[str]:
    """
    查找系统中的电池设备
    
    Returns:
        Optional[str]: 电池设备名称，如果未找到则返回 None
    """
    power_supply_path = "/sys/class/power_supply"
    try:
        for device in os.listdir(power_supply_path):
            device_type_path = os.path.join(power_supply_path, device, "type")
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

    power_supply_path = "/sys/class/power_supply"
    battery_path = os.path.join(power_supply_path, battery_device)
    
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