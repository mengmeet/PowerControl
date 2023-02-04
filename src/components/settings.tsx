import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC} from "react";
import { localizationManager, Settings, PluginManager, RunningApps, DEFAULT_APP,ComponentName, UpdateType} from "../util";

const SettingsEnableComponent:VFC = () =>{
  const [enable, setEnable] = useState<boolean>(Settings.ensureEnable());
  const refresh = () => {
    setEnable(Settings.ensureEnable());
  };
  //listen Settings
  useEffect(() => {
    if(!enable){
      PluginManager.updateAllComponent(UpdateType.HIDE);
    }else{
      PluginManager.updateAllComponent(UpdateType.SHOW);
    }
    PluginManager.listenUpdateComponent(ComponentName.SET_ENABLE,[ComponentName.SET_ENABLE],(_ComponentName,updateType)=>{
      switch(updateType){
        case(UpdateType.UPDATE):{
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
          label={localizationManager.getString(22, "启用插件设置")}
          checked={enable}
          onChange={(enabled) => {
            Settings.setEnable(enabled);
          }}
        />
      </PanelSectionRow>
    </div>
);
}

const SettingsPerAppComponent:VFC = () =>{
  const [override, setOverWrite] = useState<boolean>(Settings.appOverWrite());
  const [overrideable,setOverWriteable] = useState<boolean>(RunningApps.active()!=DEFAULT_APP);
  const [show,setShow] = useState<boolean>(Settings.ensureEnable());
  const hide = (ishide:boolean) => {
    setShow(!ishide);
  };
  const refresh = () => {
    setOverWrite(Settings.appOverWrite());
    setOverWriteable(RunningApps.active()!=DEFAULT_APP);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.SET_PERAPP,[ComponentName.SET_PERAPP],(_ComponentName,updateType:string)=>{
      switch(updateType){
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
        {show&&<PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(2, "使用按游戏设置的配置文件")}
            description={
              <div style={{ display: "flex", justifyContent: "left" }}>
                <img src={RunningApps.active_appInfo()?.icon_data ? "data:image/" + RunningApps.active_appInfo()?.icon_data_format + ";base64," + RunningApps.active_appInfo()?.icon_data : "/assets/" + RunningApps.active_appInfo()?.appid + "_icon.jpg?v=" + RunningApps.active_appInfo()?.icon_hash} width={18} height={18}
                  style={{ display: override && overrideable ? "block" : "none" }}
                />
                {localizationManager.getString(3, "正在使用") + (override && overrideable ? `『${RunningApps.active_appInfo()?.display_name}』` : `${localizationManager.getString(4, "默认")}`) + localizationManager.getString(5, "配置文件")}
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

export const SettingsComponent: VFC = () => {
  return (
        <div>
          <PanelSection title={localizationManager.getString(1, "设置")}>
            <SettingsEnableComponent/>
            <SettingsPerAppComponent/>
          </PanelSection>
        </div>
    );
};

