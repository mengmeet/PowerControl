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
import { ActionButtonItem } from ".";

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

  const updateUseOldUI = (value: boolean) => {
    Settings.useOldUI = value;
    setUseOldUI(value);
  };

  useEffect(() => {
    const getData = async () => {
      setTimeout(() => {
        setLatestVersion(latestVersion);
        Backend.getLatestVersion().then((latestVersion) => {
          setLatestVersion(latestVersion);
        });
        Backend.getCurrentVersion().then((currentVersion) => {
          setCurrentVersion(currentVersion);
        });
      }, 3000);
    };
    getData();
  });

  let uptButtonText =
    localizationManager.getString(localizeStrEnum.REINSTALL_PLUGIN) ||
    "Reinstall Plugin";

  if (currentVersion !== latestVersion && Boolean(latestVersion)) {
    const versionCompare = compareVersions(latestVersion, currentVersion);
    if (versionCompare > 0) {
      uptButtonText = `${
        localizationManager.getString(localizeStrEnum.UPDATE_PLUGIN) || "Update"
      } ${latestVersion}`;
    } else if (versionCompare < 0) {
      uptButtonText = `${
        localizationManager.getString(localizeStrEnum.ROLLBACK_PLUGIN) ||
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
              await Backend.updateLatest();
            }}
          >
            {uptButtonText}
          </ActionButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Settings.resetToLocalStorage();
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
