import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  Marquee,
  DialogButton,
  Focusable,
  quickAccessMenuClasses,
  ModalRoot,
  showModal,
  ScrollPanelGroup,
} from "decky-frontend-lib";
import MarkDownIt from "markdown-it";
import { useEffect, useState, VFC } from "react";
import { Settings, PluginManager, RunningApps, DEFAULT_APP, ComponentName, UpdateType, ACStateManager, ACState, Backend } from "../util";
import { localizeStrEnum, localizationManager } from "../i18n";
import { FaExclamationCircle } from "react-icons/fa";

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
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());

  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };

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
        case UpdateType.SHOW:
          hide(false);
          break;
        case UpdateType.HIDE:
          hide(true);
          break;
      }
    });
  });

  const getAcSteteName = (acstate: ACState) => {
    if (acstate === ACState.Connected) {
      return localizationManager.getString(localizeStrEnum.AC_MODE);
    } else if (acstate === ACState.Disconnected) {
      return localizationManager.getString(localizeStrEnum.BAT_MODE);
    }
    return acstate;
  }

  const getDescription = (acstate: ACState) => {
    return localizationManager.getString(localizeStrEnum.USING) +
      (appACStateOverWrite ? "『" : "") +
      (appACStateOverWrite ? getAcSteteName(acstate) : localizationManager.getString(localizeStrEnum.DEFAULT)) +
      (appACStateOverWrite ? "』" : "") +
      localizationManager.getString(localizeStrEnum.PROFILE);
  }

  return (
    <div>
      {show && <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.USE_PERACMODE_PROFILE)}
          description={getDescription(acstate)}
          checked={appACStateOverWrite}
          onChange={(override) => {
            Settings.setACStateOverWrite(override);
          }}
        />
      </PanelSectionRow>}
    </div>
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


const buttonStyle = { height: '28px', width: '40px', minWidth: 0, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' };

export const QuickAccessTitleView: VFC<{ title: string }> = ({ title }) => {

  return (
    <Focusable
      style={{
        display: 'flex',
        padding: '0',
        flex: 'auto',
        boxShadow: 'none',
      }}
      className={quickAccessMenuClasses.Title}
    >
      <div style={{ marginRight: "auto" }}>{title}</div>
      <DialogButton
        onOKActionDescription="RyzenAdj Info"
        style={buttonStyle}
        onClick={() => {
          showModal(<RyzenadjInfoModel />);
        }}
      >
        <FaExclamationCircle size='0.9em' />
      </DialogButton>
    </Focusable>
  );
};

export const RyzenadjInfoModel: VFC = ({ closeModal }: { closeModal?: () => void }) => {
  const fontStyle: React.CSSProperties = {
    fontFamily: "Courier New",
    fontSize: "12px",
    lineHeight: '0.2', // 调整行距
    maxHeight: '300px', // 设置最大高度
    overflow: 'auto', // 添加滚动条
    whiteSpace: 'pre',
    margin: '10px 0',
  };

  // @ts-ignore
  const mdIt = new MarkDownIt({
    html: true
  });

  const [info, setInfo] = useState<string>("");
  console.log(`fn:invoke RyzenadjInfoModel: ${info}`);

  useEffect(() => {
    Backend.getRyzenadjInfo().then((info) => {
      setInfo(info);
    });

    // 每5秒刷新一次
    const interval = setInterval(() => {
      Backend.getRyzenadjInfo().then((info) => {
        setInfo(info);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ModalRoot closeModal={closeModal}>
      <div>
        <PanelSection title={"Ryzenadj Info"}>
          <PanelSectionRow>
            <DialogButton onClick={() => {
              Backend.getRyzenadjInfo().then((info) => {
                setInfo(info);
              });
            }}>
              Reload
            </DialogButton>
          </PanelSectionRow>
          <ScrollPanelGroup
            //@ts-ignore
            focusable={false}
          >
            <Focusable>
              <div style={fontStyle} >
                {info.split('\n').map((line, index) => <p  key={index}>{line}</p>)}
              </div>
              {/* <div dangerouslySetInnerHTML={{ __html: mdIt.render(info) }} /> */}
            </Focusable>
          </ScrollPanelGroup>

        </PanelSection>
      </div>
    </ModalRoot>
  );
}

