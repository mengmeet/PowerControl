/*!
 * Copyright (C) 2022 Sefa Eyeoglu <contact@scrumplex.net> (https://scrumplex.net)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ServerAPI,
  ToggleField,
  staticClasses,
  SteamSpinner,
} from "decky-frontend-lib";
import { VFC, useState, useEffect } from "react";
import { FaSuperpowers } from "react-icons/fa";
import { APPLYTYPE, GPUMODE, UpdateType } from "./components";
import { localizationManager, PluginManager, PluginState } from "./util";
import { Settings} from "./util";
import { RunningApps, Backend, DEFAULT_APP } from "./util";
import { GPUModeComponent } from "./components";
var suspendEndHook: any = null;

// Appease TypeScript
declare var SteamClient: any;

const Content: VFC<{ applyFn: (applyTarget: string) => void, resetFn: () => void}> = ({ applyFn, resetFn}) => {
  const [initialized, setInitialized] = useState<boolean>(false);

  const [currentEnabled, setCurrentEnabled] = useState<boolean>(true);
  const [currentAppOverride, setCurrentAppOverride] = useState<boolean>(false);
  const [currentAppOverridable, setCurrentAppOverridable] = useState<boolean>(false);
  const [currentTargetSmt, setCurrentTargetSmt] = useState<boolean>(true);
  const [currentTargetCpuBoost, setCurrentTargetCpuBoost] = useState<boolean>(true);
  const [currentTargetCpuNum, setCurrentTargetCpuNum] = useState<number>(Backend.data.getCpuMaxNum());
  const [currentTargetTDPEnable, setCurrentTargetTDPEnable] = useState<boolean>(false);
  const [currentTargetTDP, setCurrentTargetTDP] = useState<number>(Backend.data.getTDPMax());
  const [currentTargetGPUMode, setCurrentTargetGPUMode] = useState<number>(0);
  const [currentTargetGPUFreq, setCurrentTargetGPUFreq] = useState<number>(Backend.data.getGPUFreqMax());
  const [currentTargetGPUAutoMaxFreq, setCurrentTargetGPUAutoMaxFreq] = useState<number>(Backend.data.getGPUFreqMax());
  const [currentTargetGPUAutoMinFreq, setCurrentTargetGPUAutoMinFreq] = useState<number>(200);
  const [currentTargetGPURangeMaxFreq, setCurrentTargetGPURangeMaxFreq] = useState<number>(Backend.data.getGPUFreqMax());
  const [currentTargetGPURangeMinFreq, setCurrentTargetGPURangeMinFreq] = useState<number>(200);

  const refresh = () => {
    // prevent updates while we are reloading
    setInitialized(false);
    console.log(`currentEnable = ${currentEnabled} Settings.enable = ${Settings.ensureEnable}`);
    setCurrentEnabled(Settings.ensureEnable());


    console.log(`Refresh 设置${Settings.currentSettingAppID()}配置状态`);
    setCurrentAppOverridable(RunningApps.active() != DEFAULT_APP);

    setCurrentAppOverride(Settings.appOverWrite());
    setCurrentTargetSmt(Settings.appSmt());
    setCurrentTargetCpuNum(Settings.appCpuNum());
    setCurrentTargetCpuBoost(Settings.appCpuboost());
    setCurrentTargetTDP(Settings.appTDP());
    setCurrentTargetTDPEnable(Settings.appTDPEnable());
    setCurrentTargetGPUMode(Settings.appGPUMode());
    setCurrentTargetGPUFreq(Settings.appGPUFreq());
    setCurrentTargetGPUAutoMaxFreq(Settings.appGPUAutoMaxFreq())
    setCurrentTargetGPUAutoMinFreq(Settings.appGPUAutoMinFreq())
    setCurrentTargetGPURangeMaxFreq(Settings.appGPURangeMaxFreq())
    setCurrentTargetGPURangeMinFreq(Settings.appGPURangeMinFreq())

    setInitialized(true);
  }

  //SMT以及cpu核心数设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;
    
    Settings.ensureApp().smt = currentTargetSmt;
    Settings.ensureApp().cpuNum = currentTargetCpuNum;
    applyFn(APPLYTYPE.SET_CPUCORE);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetSmt, currentTargetCpuNum]);

  //睿频设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    Settings.ensureApp().cpuboost = currentTargetCpuBoost;
    applyFn(APPLYTYPE.SET_CPUBOOST);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetCpuBoost]);

  //tdp设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;
    
    Settings.ensureApp().tdp = currentTargetTDP;
    Settings.ensureApp().tdpEnable = currentTargetTDPEnable;
    applyFn(APPLYTYPE.SET_TDP);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetTDP, currentTargetTDPEnable]);

  //GPU模式设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;
    
    Settings.ensureApp().gpuMode = currentTargetGPUMode;
    Settings.ensureApp().gpuFreq = currentTargetGPUFreq;
    Settings.ensureApp().gpuAutoMaxFreq = currentTargetGPUAutoMaxFreq;
    Settings.ensureApp().gpuAutoMinFreq = currentTargetGPUAutoMinFreq;
    Settings.ensureApp().gpuRangeMaxFreq = currentTargetGPURangeMaxFreq;
    Settings.ensureApp().gpuRangeMinFreq = currentTargetGPURangeMinFreq;
    applyFn(APPLYTYPE.SET_GPUMODE);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetGPUMode, currentTargetGPUFreq, currentTargetGPUAutoMaxFreq, currentTargetGPUAutoMinFreq, currentTargetGPURangeMaxFreq, currentTargetGPURangeMinFreq]);

  //使用游戏配置文件设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    const activeApp = RunningApps.active();
    if (activeApp == DEFAULT_APP)
      return;
    Settings.setOverWrite(currentAppOverride);
    refresh();
    PluginManager.updateAllComponent(UpdateType.UPDATE);
  }, [currentAppOverride]);

  //是否启用设置
  useEffect(() => {
    if (!initialized)
      return;
    if (!currentEnabled)
      resetFn();
    else {
      applyFn(APPLYTYPE.SET_ALL);
    }

    Settings.setEnable(currentEnabled);
    Settings.saveSettingsToLocalStorage();
  }, [currentEnabled, initialized]);

  //设置刷新
  useEffect(() => {
    refresh();
    PluginManager.state
  }, []);

  return (
        <div>
        {PluginManager.state==PluginState.INIT&&<PanelSectionRow>
          <SteamSpinner style={{marginTop: "80px",}}/>
        </PanelSectionRow>}
      <PanelSection title={localizationManager.getString(1, "设置")}>
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(22, "启用插件设置")}
            checked={currentEnabled}
            onChange={(enabled) => {
              setCurrentEnabled(enabled);
            }}
          />
        </PanelSectionRow>
        {currentEnabled &&
          <PanelSectionRow>
            <ToggleField
              label={localizationManager.getString(2, "使用按游戏设置的配置文件")}
              description={
                <div style={{ display: "flex", justifyContent: "left" }}>
                  <img src={RunningApps.active_appInfo()?.icon_data ? "data:image/" + RunningApps.active_appInfo()?.icon_data_format + ";base64," + RunningApps.active_appInfo()?.icon_data : "/assets/" + RunningApps.active_appInfo()?.appid + "_icon.jpg?v=" + RunningApps.active_appInfo()?.icon_hash} width={18} height={18}
                    style={{ display: currentAppOverride && currentAppOverridable ? "block" : "none" }}
                  />
                  {localizationManager.getString(3, "正在使用") + (currentAppOverride && currentAppOverridable ? `『${RunningApps.active_appInfo()?.display_name}』` : `${localizationManager.getString(4, "默认")}`) + localizationManager.getString(5, "配置文件")}
                </div>
              }
              checked={currentAppOverride && currentAppOverridable}
              disabled={!currentAppOverridable}
              onChange={(override) => {
                setCurrentAppOverride(override);
              }}
            />
          </PanelSectionRow>}

      </PanelSection>
      {currentEnabled &&
        <PanelSection title="CPU">
          <PanelSectionRow>
            <ToggleField
              label={localizationManager.getString(6, "睿 频")}
              description={localizationManager.getString(7, "提升最大cpu频率")}
              disabled={currentTargetGPUMode == GPUMODE.AUTO}
              checked={currentTargetCpuBoost}
              onChange={(value) => {
                setCurrentTargetCpuBoost(value);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ToggleField
              label="SMT"
              description={localizationManager.getString(8, "启用奇数编号的cpu")}
              checked={currentTargetSmt}
              onChange={(smt) => {
                setCurrentTargetSmt(smt);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <SliderField
              label={localizationManager.getString(9, "核 心 数")}
              description={localizationManager.getString(10, "设置启用的物理核心数量")}
              value={currentTargetCpuNum}
              step={1}
              max={Backend.data.getCpuMaxNum()}
              min={1}
              disabled={!Backend.data.HasCpuMaxNum()}
              showValue={true}
              onChange={(value: number) => {
                setCurrentTargetCpuNum(value);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ToggleField
              label={localizationManager.getString(11, "热设计功耗（TDP）限制")}
              description={Backend.data.HasRyzenadj() ? localizationManager.getString(12, "限制处理器功耗以降低总功耗") : localizationManager.getString(13, "未检测到ryzenAdj")}
              checked={currentTargetTDPEnable}
              disabled={!Backend.data.HasRyzenadj() || currentTargetGPUMode == GPUMODE.AUTO}
              onChange={(value) => {
                setCurrentTargetTDPEnable(value);
              }}
            />
          </PanelSectionRow>
          {currentTargetTDPEnable && <PanelSectionRow>
            <SliderField
              label={localizationManager.getString(14, "瓦特")}
              value={currentTargetTDP}
              step={1}
              max={Backend.data.getTDPMax()}
              min={3}
              disabled={!Backend.data.HasTDPMax() || currentTargetGPUMode == GPUMODE.AUTO}
              showValue={true}
              onChange={(value: number) => {
                setCurrentTargetTDP(value);
              }}
            />
          </PanelSectionRow>}
        </PanelSection>
      }
      <GPUModeComponent/>
    </div>
    );
};

export default definePlugin((serverAPI: ServerAPI) => {
  PluginManager.init(serverAPI);
  suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
    console.log("休眠结束，重新应用设置")
    if (Settings.ensureEnable()) {
      Backend.throwSuspendEvt()
      Backend.applySettings(APPLYTYPE.SET_ALL);
    } else {
      Backend.resetSettings();
    }
  });

  return {
    title: <div className={staticClasses.Title}>PowerControl</div>,
    content: <Content applyFn={Backend.applySettings} resetFn={Backend.resetSettings} />,
    icon: <FaSuperpowers />,
    onDismount() {
      suspendEndHook!.unregister();
      RunningApps.unregister();
      Backend.resetSettings();
    }
  };
});
