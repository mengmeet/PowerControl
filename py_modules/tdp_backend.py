"""TDP write-backend preference and dispatch helpers."""

from __future__ import annotations

from typing import Any, Optional

from conf_manager import confManager
from config import logger

AUTO = "auto"
FIRMWARE_ATTRIBUTES = "firmware_attributes"
ASUS_WMI = "asus_wmi"
POWER_STATION = "power_station"
CPU = "cpu"

VALID_BACKENDS = frozenset(
    {AUTO, FIRMWARE_ATTRIBUTES, ASUS_WMI, POWER_STATION, CPU}
)

SETTINGS_KEY = "tdpBackend"


def get_preference() -> str:
    settings = confManager.getSettings() or {}
    pref = settings.get(SETTINGS_KEY, AUTO)
    if pref not in VALID_BACKENDS:
        return AUTO
    return pref


def set_preference(backend_id: str) -> bool:
    if backend_id not in VALID_BACKENDS:
        logger.error(f"Invalid TDP backend preference: {backend_id}")
        return False
    settings = confManager.getSettings() or {}
    settings[SETTINGS_KEY] = backend_id
    confManager.setSettings(settings)
    logger.info(f"TDP backend preference set to {backend_id}")
    return True


def _vendor_hint(device: Any) -> str:
    cpu = getattr(device, "_cpuManager", None)
    if cpu is None:
        return "unknown"
    try:
        if cpu.is_amd():
            return "amd"
        if cpu.is_intel():
            return "intel"
    except Exception:
        pass
    return "unknown"


def _supports_fa(device: Any) -> bool:
    fn = getattr(device, "supports_attribute_tdp", None)
    return bool(fn and fn())


def _supports_asus_wmi(device: Any) -> bool:
    fn = getattr(device, "supports_wmi_tdp", None)
    return bool(fn and fn())


def _supports_power_station(device: Any) -> bool:
    supports = getattr(device, "supports_power_station", None)
    valid = getattr(device, "_has_valid_power_station_tdp_range", None)
    if not supports or not supports():
        return False
    if valid and not valid():
        return False
    return True


def preference_is_usable(device: Any, pref: str) -> bool:
    """Cheap hot-path check; avoids PowerStation range D-Bus on every set_tdp."""
    if pref == AUTO or pref == CPU:
        return True
    if pref == FIRMWARE_ATTRIBUTES:
        return _supports_fa(device)
    if pref == ASUS_WMI:
        return _supports_asus_wmi(device)
    if pref == POWER_STATION:
        supports = getattr(device, "supports_power_station", None)
        return bool(supports and supports())
    return False


def list_backends(device: Any) -> dict:
    vendor_hint = _vendor_hint(device)
    available = [{"id": AUTO, "available": True}]

    if _supports_fa(device):
        available.append({"id": FIRMWARE_ATTRIBUTES, "available": True})
    if _supports_asus_wmi(device):
        available.append({"id": ASUS_WMI, "available": True})
    if _supports_power_station(device):
        available.append({"id": POWER_STATION, "available": True})

    available.append({"id": CPU, "available": True, "vendorHint": vendor_hint})

    current = get_preference()
    available_ids = {item["id"] for item in available}
    effective = current if current in available_ids else AUTO

    return {
        "available": available,
        "current": current,
        "effective": effective,
        "active": resolve_active_backend(device, effective),
        "vendorHint": vendor_hint,
    }


def resolve_active_backend(device: Any, preference: Optional[str] = None) -> str:
    """Best-effort id of the backend auto would try first, or the forced backend."""
    pref = preference if preference is not None else get_preference()
    if pref != AUTO:
        return pref
    if _supports_fa(device):
        return FIRMWARE_ATTRIBUTES
    if _supports_asus_wmi(device):
        return ASUS_WMI
    if _supports_power_station(device):
        return POWER_STATION
    return CPU


def apply_set_tdp(device: Any, backend_id: str, tdp: int) -> bool:
    """Apply TDP via a single backend. No silent fallback."""
    try:
        if backend_id == CPU:
            return device._set_tdp_via_cpu(tdp)
        if backend_id == FIRMWARE_ATTRIBUTES:
            if not _supports_fa(device):
                logger.error("Forced firmware_attributes but not available")
                return False
            return device._set_tdp_via_fa(tdp)
        if backend_id == ASUS_WMI:
            if not _supports_asus_wmi(device):
                logger.error("Forced asus_wmi but not available")
                return False
            return device._set_tdp_via_asus_wmi(tdp)
        if backend_id == POWER_STATION:
            if not _supports_power_station(device):
                logger.error("Forced power_station but not available")
                return False
            return device._set_tdp_via_power_station(tdp)
        logger.error(f"Unknown forced TDP backend: {backend_id}")
        return False
    except Exception as e:
        logger.error(f"Forced TDP backend {backend_id} failed: {e}", exc_info=True)
        return False


def apply_set_tdp_unlimited(device: Any, backend_id: str) -> bool:
    try:
        if backend_id == CPU:
            return device._set_tdp_unlimited_via_cpu()
        if backend_id == FIRMWARE_ATTRIBUTES:
            if not _supports_fa(device):
                return False
            return device._set_tdp_unlimited_via_fa()
        if backend_id == ASUS_WMI:
            if not _supports_asus_wmi(device):
                return False
            return device._set_tdp_unlimited_via_asus_wmi()
        if backend_id == POWER_STATION:
            if not _supports_power_station(device):
                return False
            return device._set_tdp_unlimited_via_power_station()
        return False
    except Exception as e:
        logger.error(
            f"Forced TDP unlimited backend {backend_id} failed: {e}", exc_info=True
        )
        return False


def resolve_power_info(device: Any) -> str:
    """Return power info for the selected backend (auto keeps the device chain)."""
    pref = get_preference()
    available_ids = {item["id"] for item in list_backends(device)["available"]}
    effective = pref if pref in available_ids else AUTO
    active = resolve_active_backend(device, effective)
    header = f"TDP_BACKEND_PREFERENCE: {pref}\nTDP_BACKEND_ACTIVE: {active}\n"

    if effective == AUTO:
        return header + (device.get_power_info() or "")

    body = ""
    if effective == FIRMWARE_ATTRIBUTES:
        body = device._get_power_info_via_fa() or "firmware_attributes unavailable\n"
    elif effective == ASUS_WMI:
        fn = getattr(device, "_get_power_info_via_asus_wmi", None)
        body = (fn() if fn else None) or "asus_wmi unavailable\n"
    elif effective == POWER_STATION:
        body = (
            device._get_power_info_via_power_station()
            or "power_station unavailable\n"
        )
    elif effective == CPU:
        from devices.power_device import PowerDevice

        body = PowerDevice._get_power_info_via_cpu(device) or ""
    else:
        body = device.get_power_info() or ""

    return header + body


def resolve_tdp_max(device: Any) -> int:
    pref = get_preference()
    if pref == AUTO:
        return device.get_tdpMax()

    available_ids = {item["id"] for item in list_backends(device)["available"]}
    if pref not in available_ids:
        return device.get_tdpMax()

    if pref == FIRMWARE_ATTRIBUTES:
        max_tdp = device._get_max_tdp()
        if max_tdp is not None:
            return max_tdp
        logger.error("Forced FA max TDP unavailable")
        return 15
    if pref == POWER_STATION:
        try:
            return int(device._get_tdp_property("MaxTdp"))
        except Exception as e:
            logger.error(f"Forced PowerStation max TDP failed: {e}")
            return 15
    from devices.power_device import PowerDevice

    return PowerDevice.get_tdpMax(device)


def resolve_tdp_min(device: Any) -> int:
    pref = get_preference()
    if pref == AUTO:
        return device.get_tdpMin()

    available_ids = {item["id"] for item in list_backends(device)["available"]}
    if pref not in available_ids:
        return device.get_tdpMin()

    if pref == FIRMWARE_ATTRIBUTES:
        min_tdp = device._get_min_tdp()
        if min_tdp is not None:
            return min_tdp
        return 3
    if pref == POWER_STATION:
        try:
            return int(device._get_tdp_property("MinTdp"))
        except Exception as e:
            logger.error(f"Forced PowerStation min TDP failed: {e}")
            return 3
    from devices.power_device import PowerDevice

    return PowerDevice.get_tdpMin(device)
