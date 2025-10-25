import {
  ButtonItem,
  Field,
  PanelSection,
  PanelSectionRow,
  ToggleField,
} from "@decky/ui";
import { FC, useEffect, useState } from "react";
import { localizationManager, localizeStrEnum } from "../i18n";
import { Backend, Settings, compareVersions } from "../util";
import { getVersion, getLatestVersion, updateLatest } from "../util/backend";
import { getVersionCache, setVersionCache, getStaleCache } from "../util/versionCache";
import { ActionButtonItem } from ".";

const getLastCheckText = (lastCheckTime: number): string => {
  const now = Date.now();
  const diff = now - lastCheckTime;

  if (diff < 60 * 1000) {
    return localizationManager.getString(localizeStrEnum.JUST_NOW) || "just now";
  }

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / 60000);
    return localizationManager.getString(localizeStrEnum.MINUTES_AGO)?.replace('{{minutes}}', minutes.toString())
      || `${minutes} minutes ago`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / 3600000);
    return localizationManager.getString(localizeStrEnum.HOURS_AGO)?.replace('{{hours}}', hours.toString())
      || `${hours} hours ago`;
  }

  const days = Math.floor(diff / 86400000);
  return localizationManager.getString(localizeStrEnum.DAYS_AGO)?.replace('{{days}}', days.toString())
    || `${days} days ago`;
};

export const MoreComponent: FC<{ isTab?: boolean }> = ({ isTab = false }) => {
  const [currentVersion, setCurrentVersion] = useState<string>(
    Backend.data?.getCurrentVersion() || ""
  );
  const [latestVersion, setLatestVersion] = useState<string>(
    Backend.data?.getLatestVersion() || ""
  );

  const [useOldUI, setUseOldUI] = useState<boolean>(
    Settings.useOldUI
  );
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<number | null>(null);

  const updateUseOldUI = (value: boolean) => {
    Settings.useOldUI = value;
    setUseOldUI(value);
  };

  const performVersionCheck = async (): Promise<void> => {
    try {
      const [current, latest] = await Promise.all([
        getVersion(),
        getLatestVersion()
      ]);

      setCurrentVersion(current);
      setLatestVersion(latest);
      setVersionCache(current, latest);
      setLastCheckTime(Date.now());
    } catch (error) {
      console.error('版本检查失败:', error);
      // 失败时尝试显示过期缓存
      // Try to display stale cache on failure
      const staleCache = getStaleCache();
      if (staleCache) {
        setCurrentVersion(staleCache.currentVersion);
        setLatestVersion(staleCache.latestVersion);
        setLastCheckTime(staleCache.lastCheckTime);
      }
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await performVersionCheck();
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const initVersions = async () => {
      const cache = getVersionCache();
      if (cache) {
        setCurrentVersion(cache.currentVersion);
        setLatestVersion(cache.latestVersion);
        setLastCheckTime(cache.lastCheckTime);
        return;
      }

      // 缓存失效，进行检查
      await performVersionCheck();
    };

    initVersions();
  }, []); // 空依赖数组，仅首次执行

  let uptButtonText =
    localizationManager.getString(localizeStrEnum.REINSTALL_PLUGIN) ||
    "Reinstall Plugin";

  if (currentVersion !== latestVersion && Boolean(latestVersion)) {
    const versionCompare = compareVersions(latestVersion, currentVersion);
    if (versionCompare > 0) {
      uptButtonText = `${localizationManager.getString(localizeStrEnum.UPDATE_PLUGIN) || "Update"
        } ${latestVersion}`;
    } else if (versionCompare < 0) {
      uptButtonText = `${localizationManager.getString(localizeStrEnum.ROLLBACK_PLUGIN) ||
        "Rollback"
        } ${latestVersion}`;
    }
  }

  return (
    <div style={!isTab ? {} : { marginLeft: "-10px", marginRight: "-10px" }}>
      <PanelSection
        title={localizationManager.getString(localizeStrEnum.MORE) || "More"}
      >
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(localizeStrEnum.USE_OLD_UI)}
            description={localizationManager.getString(
              localizeStrEnum.USE_OLD_UI_DESC
            )}
            checked={useOldUI}
            onChange={(value) => {
              updateUseOldUI(value);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ActionButtonItem
            layout="below"
            onClick={async () => {
              await updateLatest();
            }}
          >
            {uptButtonText}
          </ActionButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={handleManualCheck}
            disabled={isChecking}
            description={
              lastCheckTime
                ? `${localizationManager.getString(localizeStrEnum.LAST_CHECK_TIME) || "Last check"}: ${getLastCheckText(lastCheckTime)}`
                : localizationManager.getString(localizeStrEnum.CLICK_TO_CHECK) || "Click to check for updates"
            }
          >
            {isChecking
              ? (localizationManager.getString(localizeStrEnum.CHECKING_VERSION) || "Checking...")
              : (localizationManager.getString(localizeStrEnum.CHECK_VERSION) || "Check Version")
            }
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Settings.resetSettings();
            }}
          >
            {localizationManager.getString(localizeStrEnum.RESET_ALL) ||
              "Reset All"}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field
            focusable
            disabled
            label={
              localizationManager.getString(
                localizeStrEnum.INSTALLED_VERSION
              ) || "Installed Version"
            }
          >
            {currentVersion}
          </Field>
        </PanelSectionRow>
        {Boolean(latestVersion) && (
          <PanelSectionRow>
            <Field
              focusable
              disabled
              label={
                localizationManager.getString(localizeStrEnum.LATEST_VERSION) ||
                "Latest Version"
              }
            >
              {latestVersion}
            </Field>
          </PanelSectionRow>
        )}
      </PanelSection>
    </div>
  );
};
