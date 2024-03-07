import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  Marquee,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { Settings, PluginManager, RunningApps, DEFAULT_APP, ComponentName, UpdateType, ACStateManager, ACState } from "../util";
import { localizeStrEnum, localizationManager } from "../i18n";

const SettingsEnableComponent: VFC = () => {
  const [enable, setEnable] = useState<boolean>(Settings.ensureEnable());
  const refresh = () => {
    setEnable(Settings.ensureEnable());
  };
  //listen Settings
  useEffect(() => {
    if (!enable) {
      PluginManager.updateAllComponent(UpdateType.HIDE);
    } else {
      PluginManager.updateAllComponent(UpdateType.SHOW);
    }
    PluginManager.listenUpdateComponent(ComponentName.SET_ENABLE, [ComponentName.SET_ENABLE], (_ComponentName, updateType) => {
      switch (updateType) {
        case (UpdateType.UPDATE): {
          refresh();
          break;
        }
      }
    })
  }, []);
  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.ENABLE_SETTINGS)}
          checked={enable}
          onChange={(enabled) => {
            Settings.setEnable(enabled);
          }}
        />
      </PanelSectionRow>
    </div>
  );
}

const SettingsPerAppComponent: VFC = () => {
  const [override, setOverWrite] = useState<boolean>(Settings.appOverWrite());
  const [overrideable, setOverWriteable] = useState<boolean>(RunningApps.active() != DEFAULT_APP);
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());
  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };
  const refresh = () => {
    setOverWrite(Settings.appOverWrite());
    setOverWriteable(RunningApps.active() != DEFAULT_APP);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.SET_PERAPP, [ComponentName.SET_PERAPP], (_ComponentName, updateType: string) => {
      switch (updateType) {
        case UpdateType.UPDATE:
          refresh();
          //console.log(`fn:invoke refresh:${updateType} ${UpdateType.UPDATE}`)
          break;
        case UpdateType.SHOW:
          hide(false);
          //console.log(`fn:invoke show:${updateType} ${UpdateType.SHOW}`)
          break;
        case UpdateType.HIDE:
          hide(true);
          //console.log(`fn:invoke hide:${updateType} ${UpdateType.HIDE}`)
          break;
      }
    })
  }, []);
  return (
    <div>
      {show && <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.USE_PERGAME_PROFILE)}
          description={
            <div style={{ display: "flex", justifyContent: "left" }}>
              <img src={RunningApps.active_appInfo()?.icon_data ? "data:image/" + RunningApps.active_appInfo()?.icon_data_format + ";base64," + RunningApps.active_appInfo()?.icon_data : "/assets/" + RunningApps.active_appInfo()?.appid + "_icon.jpg?v=" + RunningApps.active_appInfo()?.icon_hash} width={20} height={20}
                style={{ paddingRight: "5px", display: override && overrideable ? "block" : "none" }}
              />
              <div style={{ lineHeight: "20px", whiteSpace: "pre" }}>{localizationManager.getString(localizeStrEnum.USING) + (override && overrideable ? "『" : "")}</div>
              <Marquee play={true} fadeLength={10} delay={1} style={{
                maxWidth: "100px",
                lineHeight: "20px",
                whiteSpace: "pre",
              }}>
                {(override && overrideable ? `${RunningApps.active_appInfo()?.display_name}` : `${localizationManager.getString(localizeStrEnum.DEFAULT)}`)}
              </Marquee>
              <div style={{ lineHeight: "20px", whiteSpace: "pre", }}>{(override && overrideable ? "』" : "") + localizationManager.getString(localizeStrEnum.PROFILE)}</div>

            </div>
          }
          checked={override && overrideable}
          disabled={!overrideable}
          onChange={(override) => {
            Settings.setOverWrite(override);
          }}
        />
      </PanelSectionRow>}
    </div>
  );
}

const SettingsPerAcStateComponent: VFC = () => {

  const [appACStateOverWrite, setAppACStateOverWrite] = useState<boolean>(Settings.appACStateOverWrite());
  const [acstate, setACState] = useState<ACState>(ACStateManager.getACState());

  const refresh = () => {
    setAppACStateOverWrite(Settings.appACStateOverWrite());
    setACState(ACStateManager.getACState());
  }

  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.SET_PERACMODE, [ComponentName.SET_PERACMODE], (_ComponentName, updateType: string) => {
      switch (updateType) {
        case UpdateType.UPDATE:
          refresh();
          break;
      }
    });
  });

  return (
    <PanelSectionRow>
      <ToggleField
        label = {"Use AC state profile"}
        description = {`Current AC state ${acstate}`}
        checked = {appACStateOverWrite}
        onChange = {(override) => {
          Settings.setACStateOverWrite(override);
        }}
      />
    </PanelSectionRow>
  )
}

export const SettingsComponent: VFC = () => {
  return (
    <div>
      <PanelSection title={localizationManager.getString(localizeStrEnum.TITEL_SETTINGS)}>
        <SettingsEnableComponent />
        <SettingsPerAppComponent />
        <SettingsPerAcStateComponent />
      </PanelSection>
    </div>
  );
};

