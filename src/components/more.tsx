import { ButtonItem, Field, PanelSection, PanelSectionRow } from "@decky/ui";
import { FC, useEffect, useState } from "react";
import { localizationManager, localizeStrEnum } from "../i18n";
import { Backend, Settings } from "../util";
import { ActionButtonItem } from ".";

export const MoreComponent: FC = () => {
    const [currentVersion, _] = useState<string>(Backend.data.getCurrentVersion());
    const [latestVersion, setLatestVersion] = useState<string>(Backend.data.getLatestVersion());

    useEffect(() => {
        const getData = async () => {
            // const latestVersion = await Backend.getLatestVersion();
            // setLatestVersion(latestVersion);
            setTimeout(() => {
                setLatestVersion(latestVersion);
                Backend.getLatestVersion().then((latestVersion) => {
                    setLatestVersion(latestVersion);
                })
            }, 3000);
        };
        getData();
    });

    let uptButtonText = localizationManager.getString(localizeStrEnum.REINSTALL_PLUGIN);

    if (currentVersion !== latestVersion && Boolean(latestVersion)) {
        uptButtonText = `${localizationManager.getString(localizeStrEnum.UPDATE_PLUGIN)} ${latestVersion}`;
    }

    return (
        <PanelSection title={localizationManager.getString(localizeStrEnum.MORE)}>
            <PanelSectionRow>
                <ActionButtonItem
                    layout="below"
                    onClick={async () => {
                        await Backend.updateLatest();
                    }}
                >{uptButtonText}</ActionButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
                <ButtonItem
                    layout="below"
                    onClick={() => {
                        Settings.resetToLocalStorage();
                    }}
                >{localizationManager.getString(localizeStrEnum.RESET_ALL)}</ButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
                <Field disabled label={localizationManager.getString(localizeStrEnum.INSTALLED_VERSION)}>
                    {currentVersion}
                </Field>
            </PanelSectionRow>
            {Boolean(latestVersion) && (
                <PanelSectionRow>
                    <Field disabled label={localizationManager.getString(localizeStrEnum.LATEST_VERSION)}>
                        {latestVersion}
                    </Field>
                </PanelSectionRow>
            )}
        </PanelSection>
    )
}