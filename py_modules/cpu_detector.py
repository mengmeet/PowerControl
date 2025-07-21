#!/usr/bin/env python3
"""
CPU Detection Module for PowerControl

This module provides comprehensive CPU topology detection and core type identification
for heterogeneous CPU architectures, including Intel's P/E/LPE-Core and AMD's Zen/Zen-c-Core.

Features:
- Hardware-based core type detection (Intel CPUID.1Ah, AMD PState)
- Intelligent cluster grouping with frequency-based fallback
- Support for SMT (Simultaneous Multi-Threading)
- Cross-platform compatibility (Intel/AMD)

Author: PowerControl Development Team
License: Same as PowerControl project
"""

import os
import re
import subprocess
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

from utils import get_env


@dataclass
class CPUCoreInfo:
    """Information about a single logical CPU core"""

    logical_id: int
    core_id: int
    package_id: int
    cluster_id: int
    die_id: int
    max_freq_hw: int
    min_freq_hw: int
    sibling_threads: List[int] = field(default_factory=list)
    cluster_cpus: List[int] = field(default_factory=list)
    package_cpus: List[int] = field(default_factory=list)

    # Hardware detection fields
    core_type_cpuid: int = -1  # CPUID.1Ah EAX[31-24] value
    l3_cache_access: bool = True  # L3 cache access capability
    vendor: str = "unknown"
    family: int = -1
    model: int = -1


class CPUTopology:
    """CPU topology manager with hardware-based core type detection"""

    def __init__(self):
        self.cores: Dict[int, CPUCoreInfo] = {}
        self.vendor: str = "unknown"
        self.family: int = -1
        self.model: int = -1

    def add_core(self, logical_id: int) -> CPUCoreInfo:
        """Add a logical CPU core to the topology"""
        if logical_id not in self.cores:
            core_info = CPUCoreInfo(
                logical_id=logical_id,
                core_id=self._read_topology_info(logical_id, "core_id"),
                package_id=self._read_topology_info(logical_id, "physical_package_id"),
                cluster_id=self._read_topology_info(logical_id, "cluster_id"),
                die_id=self._read_topology_info(logical_id, "die_id"),
                max_freq_hw=self._read_freq_info(logical_id, "cpuinfo_max_freq"),
                min_freq_hw=self._read_freq_info(logical_id, "cpuinfo_min_freq"),
            )
            self.cores[logical_id] = core_info
        return self.cores[logical_id]

    def _read_topology_info(self, logical_id: int, info_type: str) -> int:
        """Read CPU topology information from sysfs"""
        try:
            path = f"/sys/devices/system/cpu/cpu{logical_id}/topology/{info_type}"
            with open(path) as f:
                return int(f.read().strip())
        except (FileNotFoundError, PermissionError, ValueError, OSError):
            return 65535  # Invalid value for missing information

    def _read_freq_info(self, logical_id: int, info_type: str) -> int:
        """Read CPU frequency information from sysfs"""
        try:
            path = f"/sys/devices/system/cpu/cpu{logical_id}/cpufreq/{info_type}"
            with open(path) as f:
                return int(f.read().strip())
        except (FileNotFoundError, PermissionError, ValueError, OSError):
            return 0


class CPUDetector:
    """Main CPU detection and analysis class"""

    def __init__(self):
        self.topology = CPUTopology()
        self._populate_basic_topology()

    def _populate_basic_topology(self):
        """Populate basic CPU topology from sysfs"""
        # Find all online CPUs
        online_cpus = []
        try:
            with open("/sys/devices/system/cpu/online") as f:
                online_range = f.read().strip()

            # Parse ranges like "0-15" or "0,2-7,12-15"
            for part in online_range.split(","):
                if "-" in part:
                    start, end = map(int, part.split("-"))
                    online_cpus.extend(range(start, end + 1))
                else:
                    online_cpus.append(int(part))
        except (ValueError, IndexError, AttributeError, OSError):
            # Fallback: detect by checking /sys/devices/system/cpu/cpu*/
            cpu_dirs = [
                d
                for d in os.listdir("/sys/devices/system/cpu/")
                if d.startswith("cpu") and d[3:].isdigit()
            ]
            online_cpus = [int(d[3:]) for d in cpu_dirs]

        # Add all online CPUs to topology
        for logical_id in sorted(online_cpus):
            self.topology.add_core(logical_id)

        # Get vendor information
        self.topology.vendor, self.topology.family, self.topology.model = (
            self._get_cpu_vendor_info()
        )

    def _get_cpu_vendor_info(self) -> Tuple[str, int, int]:
        """Get CPU vendor, family, and model information"""
        try:
            with open("/proc/cpuinfo") as f:
                content = f.read()

            vendor = "unknown"
            family = -1
            model = -1

            for line in content.split("\n"):
                if "vendor_id" in line and vendor == "unknown":
                    vendor = line.split(":")[1].strip()
                elif "cpu family" in line and family == -1:
                    family = int(line.split(":")[1].strip())
                elif "model" in line and model == -1 and "name" not in line:
                    model = int(line.split(":")[1].strip())

            return vendor, family, model
        except (FileNotFoundError, PermissionError, ValueError, IndexError):
            return "unknown", -1, -1

    def detect_core_types(self):
        """Detect core types using hardware-specific methods"""
        # Set vendor info for all cores
        for core in self.topology.cores.values():
            core.vendor = self.topology.vendor
            core.family = self.topology.family
            core.model = self.topology.model
            core.core_type_cpuid = self._get_cpuid_core_type(core.logical_id)
            core.l3_cache_access = self._check_l3_cache_access(core.logical_id)

    def _get_cpuid_core_type(self, logical_id: int) -> int:
        """Get core type from CPUID.1Ah for Intel CPUs"""
        try:
            # Method 1: Use cpuid tool if available
            cmd = [
                "taskset",
                "-c",
                str(logical_id),
                "cpuid",
                "-r",
                "-1",
                "-l",
                "0x1a",
                "-s",
                "0",
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, env=get_env())

            if result.returncode == 0:
                lines = result.stdout.split("\n")
                target_cpu_found = False

                for line in lines:
                    if line.strip().startswith(f"CPU {logical_id}:"):
                        target_cpu_found = True
                        continue

                    if target_cpu_found and "eax=" in line.lower():
                        eax_match = re.search(r"eax=0x([0-9a-fA-F]+)", line)
                        if eax_match:
                            eax_value = int(eax_match.group(1), 16)
                            return (eax_value >> 24) & 0xFF
                        break
        except (
            subprocess.SubprocessError,
            FileNotFoundError,
            PermissionError,
            ValueError,
        ):
            pass

        # Method 2: Try /dev/cpu/X/cpuid (needs root)
        try:
            cpuid_path = f"/dev/cpu/{logical_id}/cpuid"
            if os.path.exists(cpuid_path):
                with open(cpuid_path, "rb") as f:
                    f.seek(0x1A * 16)  # CPUID leaf 0x1a
                    data = f.read(16)
                    if len(data) == 16:
                        eax = int.from_bytes(data[0:4], "little")
                        return (eax >> 24) & 0xFF
        except (FileNotFoundError, PermissionError, OSError, ValueError):
            pass

        # Method 3: Fallback for known CPU models
        if self.topology.vendor == "GenuineIntel":
            if self.topology.family == 6 and self.topology.model == 0xAA:  # Meteor Lake
                # Use frequency-based heuristic
                try:
                    with open(
                        f"/sys/devices/system/cpu/cpu{logical_id}/cpufreq/cpuinfo_max_freq"
                    ) as f:
                        max_freq = int(f.read().strip())

                    if max_freq > 4000000:  # > 4GHz
                        return 0x40  # P-Core
                    elif max_freq > 3000000:  # 3-4GHz
                        return 0x20  # E-Core
                    else:  # < 3GHz
                        return 0x20  # LPE-Core (will be distinguished by L3 cache)
                except (FileNotFoundError, PermissionError, ValueError, OSError):
                    pass

        return -1  # Unable to determine

    def _check_l3_cache_access(self, logical_id: int) -> bool:
        """Check if a logical CPU has L3 cache access"""
        try:
            cache_path = f"/sys/devices/system/cpu/cpu{logical_id}/cache"
            if not os.path.exists(cache_path):
                return True  # Assume yes if unable to check

            # Look for L3 cache (index3 is typically L3)
            for index_dir in os.listdir(cache_path):
                if not index_dir.startswith("index"):
                    continue

                level_path = os.path.join(cache_path, index_dir, "level")
                type_path = os.path.join(cache_path, index_dir, "type")

                try:
                    with open(level_path) as f:
                        level = int(f.read().strip())
                    with open(type_path) as f:
                        cache_type = f.read().strip()

                    # Found L3 cache
                    if level == 3 and cache_type in ["Unified", "Data"]:
                        return True
                except (FileNotFoundError, PermissionError, ValueError, OSError):
                    continue

            return False  # No L3 cache found
        except Exception:
            return True  # Assume yes if error

    def determine_core_type_intel(self, core_info: CPUCoreInfo) -> str:
        """Determine Intel core type using CPUID.1Ah + L3 cache detection"""
        if core_info.core_type_cpuid == 0x40:
            return "P-Core"
        elif core_info.core_type_cpuid == 0x20:
            # Distinguish E-Core vs LPE-Core using L3 cache access
            if core_info.l3_cache_access:
                return "E-Core"
            else:
                return "LPE-Core"
        else:
            # Fallback to frequency-based detection for Meteor Lake
            if core_info.family == 6 and core_info.model == 0xAA:
                if core_info.max_freq_hw > 4000000:
                    return "P-Core"
                elif core_info.max_freq_hw > 2800000:
                    return "E-Core"
                else:
                    return "LPE-Core"
            else:
                # Other Intel CPUs: assume P-Core for high freq, E-Core for lower
                if core_info.max_freq_hw > 3500000:
                    return "P-Core"
                else:
                    return "E-Core"

    def determine_core_type_amd(self, core_info: CPUCoreInfo) -> str:
        """AMD core type detection - based on limited sample inference

        ⚠️  Warning: These thresholds are based on very few device observations!

        Known samples:
        - Ryzen Z2 Extreme: highest_perf 196(Zen-Core) vs 128(Zen-c-Core)
        - Ryzen 7800X3D: highest_perf 166(all Zen-Core)

        More data needed to verify threshold generalizability!
        """

        # Method 1: Use AMD PState highest_perf value (experimental)
        try:
            logical_id = core_info.logical_id
            with open(
                f"/sys/devices/system/cpu/cpu{logical_id}/cpufreq/amd_pstate_highest_perf"
            ) as f:
                highest_perf = int(f.read().strip())

            # ⚠️ Experimental thresholds based on limited samples
            if core_info.family == 26 and core_info.model == 0x24:  # Ryzen Z2 Extreme
                # Based on 1 Z2 Extreme observation: perf=196, compact=128
                if highest_perf >= 190:
                    return "Zen-Core"
                else:
                    return "Zen-c-Core"
            else:  # Other AMD CPUs
                # Based on 1 7800X3D observation: all cores=166
                # Conservative strategy: assume high-performance for unknown CPUs
                if highest_perf >= 150:  # Lower threshold, more conservative
                    return "Zen-Core"
                else:
                    return "Zen-c-Core"  # Possible compact cores

        except Exception:
            # Method 2: Frequency inference fallback (also inference)
            if core_info.family == 26 and core_info.model == 0x24:
                # Z2 Extreme frequency observation: 5090.9MHz vs 3324.7MHz
                if core_info.max_freq_hw > 4500000:
                    return "Zen-Core"
                else:
                    return "Zen-c-Core"
            else:
                # Other AMD CPUs: conservative assumption of high-performance cores
                return (
                    "Zen-Core"  # Default to high-performance, avoid misclassification
                )

    def get_detailed_analysis(self) -> Dict:
        """Get comprehensive CPU topology analysis"""
        analysis = {
            "vendor": self.topology.vendor,
            "family": self.topology.family,
            "model": self.topology.model,
            "total_logical_cpus": len(self.topology.cores),
            "core_types": {},
            "frequency_groups": {},
            "cluster_groups": {},
            "smt_groups": {},
        }

        # Analyze core types
        core_type_counts = defaultdict(int)
        core_type_cpus = defaultdict(list)

        for logical_id, core in self.topology.cores.items():
            if "Intel" in self.topology.vendor:
                core_type = self.determine_core_type_intel(core)
            elif "AMD" in self.topology.vendor:
                core_type = self.determine_core_type_amd(core)
            else:
                core_type = "Unknown-Core"

            core_type_counts[core_type] += 1
            core_type_cpus[core_type].append(logical_id)

        analysis["core_types"] = dict(core_type_counts)
        analysis["core_type_mapping"] = dict(core_type_cpus)

        # Analyze frequency groups
        freq_groups = defaultdict(list)
        for logical_id, core in self.topology.cores.items():
            freq_mhz = round(core.max_freq_hw / 1000, 1)
            freq_groups[freq_mhz].append(logical_id)

        analysis["frequency_groups"] = dict(freq_groups)

        return analysis


def create_cpu_detector() -> CPUDetector:
    """Factory function to create a configured CPU detector"""
    detector = CPUDetector()
    detector.detect_core_types()
    return detector


if __name__ == "__main__":
    # Simple test
    detector = create_cpu_detector()
    analysis = detector.get_detailed_analysis()

    print("=== CPU Detection Test ===")
    print(f"Vendor: {analysis['vendor']}")
    print(f"Family: {analysis['family']}, Model: 0x{analysis['model']:X}")
    print(f"Total logical CPUs: {analysis['total_logical_cpus']}")
    print(f"Core types: {analysis['core_types']}")
    print(f"Frequency groups: {analysis['frequency_groups']}")
