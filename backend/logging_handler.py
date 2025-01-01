import logging
import subprocess
import os

LOG = "/tmp/PowerControl_systemd.log"
LOG_TAG = "powercontrol"


class SystemdHandler(logging.Handler):
    PRIORITY_MAP = {
        logging.DEBUG: "7",  # debug
        logging.INFO: "6",  # info
        logging.WARNING: "4",  # warning
        logging.ERROR: "3",  # err
        logging.CRITICAL: "2",  # crit
    }

    def emit(self, record):
        msg = self.format(record)
        priority = self.PRIORITY_MAP.get(record.levelno, "6")
        try:
            # 使用系统的 systemd-cat
            env = os.environ.copy()
            env["LD_LIBRARY_PATH"] = ""  # 清除 LD_LIBRARY_PATH
            subprocess.run(
                ["systemd-cat", "-t", LOG_TAG, "-p", priority],
                input=msg,
                text=True,
                env=env,
            )
        except Exception as e:
            self.write_log(f"systemd-cat error: {e}")

    def write_log(self, msg):
        try:
            with open(LOG, "a") as f:
                f.write(msg)
                f.write("\n")
        except Exception as e:
            print(e)
