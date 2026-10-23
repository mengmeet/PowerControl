"""Hardware-free regression tests for the actual Intel RAPL write method."""

import ast
from pathlib import Path
import unittest
from unittest.mock import Mock


SOURCE = Path(__file__).resolve().parents[1] / "py_modules" / "cpu.py"
METHOD = "set_cpuTDP_Intel"
MMIO = ("mmio/long", "mmio/short", "mmio/max")
MSR = ("msr/long", "msr/short", "msr/max")
ABSENT = ("", "", "")


def load_cpu_class():
    # Importing cpu.py probes hardware and imports Decky-specific modules.
    # Compile its real method inside its original class to preserve private
    # method name mangling, without executing imports or constructors.
    tree = ast.parse(SOURCE.read_text(encoding="utf-8"), filename=str(SOURCE))
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            methods = [
                item for item in node.body
                if isinstance(item, ast.FunctionDef) and item.name == METHOD
            ]
            if methods:
                node.body = methods
                node.bases = []
                node.keywords = []
                node.decorator_list = []
                module = ast.fix_missing_locations(
                    ast.Module(body=[node], type_ignores=[])
                )
                namespace = {"logger": Mock()}
                exec(compile(module, str(SOURCE), "exec"), namespace)
                return namespace[node.name], namespace
    raise AssertionError(f"{METHOD} not found in {SOURCE}")


class FakeSysfs:
    def __init__(self, failures=None):
        # Map (path, stage) to failures at open, write, or buffered close.
        self.failures = failures or {}
        self.events = []

    def fail(self, path, stage):
        if self.failures.get((path, stage)):
            raise PermissionError(f"{path}: {stage}")

    def open(self, path, mode):
        if mode != "w":
            raise AssertionError(f"Unexpected mode: {mode}")
        self.events.append(("open", path))
        self.fail(path, "open")
        owner = self

        class File:
            def __enter__(self):
                return self

            def write(self, data):
                owner.events.append(("write", path, data))
                owner.fail(path, "write")
                if owner.failures.get((path, "short_write")):
                    return len(data) - 1
                return len(data)

            def __exit__(self, exc_type, exc, traceback):
                owner.events.append(("close", path))
                owner.fail(path, "close")
                return False

        return File()


class IntelRaplWritesTest(unittest.TestCase):
    def run_case(self, mmio=MMIO, msr=MSR, failures=None, value=45):
        cls, namespace = load_cpu_class()
        cpu = cls()
        setattr(cpu, f"_{cls.__name__}__get_intel_rapl_path", lambda: mmio)
        setattr(cpu, f"_{cls.__name__}__get_legacy_intel_rapl_path", lambda: msr)
        fs = FakeSysfs(failures)
        namespace["open"] = fs.open
        result = cpu.set_cpuTDP_Intel(value)
        return result, fs, namespace["logger"]

    def assert_bank_written(self, fs, bank):
        self.assertIn(("write", bank[0], "45000000"), fs.events)
        self.assertIn(("write", bank[1], "47000000"), fs.events)
        self.assertIn(("close", bank[0]), fs.events)
        self.assertIn(("close", bank[1]), fs.events)

    def test_both_banks_writable(self):
        result, fs, logger = self.run_case()
        self.assertIs(result, True)
        self.assert_bank_written(fs, MMIO)
        self.assert_bank_written(fs, MSR)
        self.assertEqual(len([e for e in fs.events if e[0] == "write"]), 4)
        logger.warning.assert_not_called()

    def test_each_bank_failure_does_not_block_other_bank(self):
        for failed, good in ((MMIO, MSR), (MSR, MMIO)):
            for path in failed[:2]:
                for stage in ("open", "write", "close", "short_write"):
                    with self.subTest(bank=failed[0], path=path, stage=stage):
                        result, fs, logger = self.run_case(
                            failures={(path, stage): True}
                        )
                        self.assertIs(result, True)
                        self.assert_bank_written(fs, good)
                        logger.warning.assert_called_once()
                        logger.error.assert_not_called()

    def test_both_banks_fail(self):
        result, fs, logger = self.run_case(failures={
            (MMIO[0], "write"): True,
            (MSR[0], "write"): True,
        })
        self.assertIs(result, False)
        self.assertIn(("open", MMIO[0]), fs.events)
        self.assertIn(("open", MSR[0]), fs.events)
        self.assertEqual(logger.warning.call_count, 2)
        logger.error.assert_called_once()

    def test_single_bank(self):
        for mmio, msr, good in ((MMIO, ABSENT, MMIO), (ABSENT, MSR, MSR)):
            with self.subTest(bank=good[0]):
                result, fs, logger = self.run_case(mmio=mmio, msr=msr)
                self.assertIs(result, True)
                self.assert_bank_written(fs, good)
                self.assertEqual(len([e for e in fs.events if e[0] == "open"]), 2)
                logger.warning.assert_not_called()

    def test_no_banks(self):
        result, fs, _ = self.run_case(mmio=ABSENT, msr=ABSENT)
        self.assertIs(result, False)
        self.assertEqual(fs.events, [])

    def test_incomplete_bank_is_skipped(self):
        for partial in (("", MMIO[1], ""), (MMIO[0], "", "")):
            with self.subTest(partial=partial):
                result, fs, _ = self.run_case(mmio=partial)
                self.assertIs(result, True)
                self.assert_bank_written(fs, MSR)
                self.assertFalse(any(e[1].startswith("mmio/") for e in fs.events))

    def test_no_complete_bank(self):
        result, fs, _ = self.run_case(
            mmio=(MMIO[0], "", ""), msr=("", MSR[1], "")
        )
        self.assertIs(result, False)
        self.assertEqual(fs.events, [])

    def test_partial_bank_is_not_success(self):
        for path in MMIO[:2]:
            for stage in ("open", "write", "close", "short_write"):
                with self.subTest(path=path, stage=stage):
                    result, _, logger = self.run_case(
                        msr=ABSENT, failures={(path, stage): True}
                    )
                    self.assertIs(result, False)
                    logger.warning.assert_called_once()
                    logger.error.assert_called_once()

    def test_invalid_tdp_does_not_write(self):
        for value in (0, -1):
            with self.subTest(value=value):
                result, fs, _ = self.run_case(value=value)
                self.assertIs(result, False)
                self.assertEqual(fs.events, [])


if __name__ == "__main__":
    unittest.main()
