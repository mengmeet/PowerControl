import decky
from config import CONFIG_KEY
from settings import SettingsManager


class ConfManager:
    def __init__(self):
        self.sysSettings = SettingsManager(
            name="config", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR
        )
        self.fansSettings = SettingsManager(
            name="fans_config",
            settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR,
        )

    def getSettings(self):
        return self.sysSettings.getSetting(CONFIG_KEY)

    def setSettings(self, settings):
        self.sysSettings.setSetting(CONFIG_KEY, settings)
        return True

    def getFanSettings(self):
        return self.fansSettings.getSetting(CONFIG_KEY)

    def setFanSettingsByKey(self, key, value):
        self.fansSettings.setSetting(key, value)
        return True


confManager = ConfManager()
