import logging
import subprocess

LOG = "/tmp/PowerControl_systemd.log"


class SystemdHandler(logging.Handler):
    def emit(self, record):
        msg = self.format(record)
        try:
            subprocess.run(["systemd-cat", "-t", "powercontrol"], input=msg, text=True)
        except Exception as e:
            self.write_log(f"systemd-cat error: {e}")

    def write_log(self, msg):
        try:
            with open(LOG, "a") as f:
                f.write(msg)
                f.write("\n")
        except Exception as e:
            print(e)
