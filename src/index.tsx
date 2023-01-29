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
} from "decky-frontend-lib";
import { VFC, useState, useEffect } from "react";
import { FaSuperpowers } from "react-icons/fa";
import { localizationManager } from "./util";
import { Settings} from "./util";
import { RunningApps, Backend, DEFAULT_APP } from "./util";
var suspendEndHook: any = null;

// Appease TypeScript
declare var SteamClient: any;

const GPUMODE_NOLIMIT = 0 //不限制
const GPUMODE_FIX = 1 //固定频率
const GPUMode_RANGE = 2  //系统调度
const GPUMODE_AUTO = 3  //自动频率

const SET_ALL = "ALL";
const SET_CPUBOOST = "SET_CPUBOOST"
const SET_CPUCORE = "SET_CPUCORE";
const SET_TDP = "SET_TDP"
const SET_GPU = "SET_GPU";

const Content: VFC<{ applyFn: (appId: string, applyTarget: string) => void, resetFn: () => void, getString: (index: number, defaultString: string) => string | undefined}> = ({ applyFn, resetFn, getString}) => {
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
    console.log(`currentEnable = ${currentEnabled} Settings.enable = ${Settings.enabled}`);
    setCurrentEnabled(Settings.enabled);

    const activeApp = Settings.appOverWrite(RunningApps.active()) ? RunningApps.active() : DEFAULT_APP;
    console.log(`Refresh 设置${activeApp}配置状态`);
    setCurrentAppOverridable(RunningApps.active() != DEFAULT_APP);

    setCurrentAppOverride(Settings.appOverWrite(activeApp));
    setCurrentTargetSmt(Settings.appSmt(activeApp));
    setCurrentTargetCpuNum(Settings.appCpuNum(activeApp));
    setCurrentTargetCpuBoost(Settings.appCpuboost(activeApp));
    setCurrentTargetTDP(Settings.appTDP(activeApp));
    setCurrentTargetTDPEnable(Settings.appTDPEnable(activeApp));
    setCurrentTargetGPUMode(Settings.appGPUMode(activeApp));
    setCurrentTargetGPUFreq(Settings.appGPUFreq(activeApp));
    setCurrentTargetGPUAutoMaxFreq(Settings.appGPUAutoMaxFreq(activeApp))
    setCurrentTargetGPUAutoMinFreq(Settings.appGPUAutoMinFreq(activeApp))
    setCurrentTargetGPURangeMaxFreq(Settings.appGPURangeMaxFreq(activeApp))
    setCurrentTargetGPURangeMinFreq(Settings.appGPURangeMinFreq(activeApp))

    setInitialized(true);
  }

  //SMT以及cpu核心数设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    let activeApp = RunningApps.active();
    if (currentAppOverride && currentAppOverridable) {
      console.log(`SET_CPUCORE 设置app(${activeApp})配置状态`);
    } else {
      console.log(`SET_CPUCORE 设置默认配置状态`);
      activeApp = DEFAULT_APP;
    }
    Settings.ensureApp(activeApp).smt = currentTargetSmt;
    Settings.ensureApp(activeApp).cpuNum = currentTargetCpuNum;
    applyFn(RunningApps.active(), SET_CPUCORE);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetSmt, currentTargetCpuNum]);

  //睿频设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    let activeApp = RunningApps.active();
    if (currentAppOverride && currentAppOverridable) {
      console.log(`SET_CPUFREQ 设置app(${activeApp})配置状态`);
    } else {
      console.log(`SET_CPUFREQ 设置默认配置状态`);
      activeApp = DEFAULT_APP;
    }
    Settings.ensureApp(activeApp).cpuboost = currentTargetCpuBoost;
    applyFn(RunningApps.active(), SET_CPUBOOST);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetCpuBoost]);

  //tdp设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    let activeApp = RunningApps.active();
    if (currentAppOverride && currentAppOverridable) {
      console.log(`SET_TDP 设置app(${activeApp})配置状态`);
    } else {
      console.log(`SET_TDP 设置默认配置状态`);
      activeApp = DEFAULT_APP;
    }
    Settings.ensureApp(activeApp).tdp = currentTargetTDP;
    Settings.ensureApp(activeApp).tdpEnable = currentTargetTDPEnable;
    applyFn(RunningApps.active(), SET_TDP);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetTDP, currentTargetTDPEnable]);

  //GPU模式设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    let activeApp = RunningApps.active();
    if (currentAppOverride && currentAppOverridable) {
      console.log(`设置app(${activeApp})配置状态`);
    } else {
      console.log(`设置默认配置状态`);
      activeApp = DEFAULT_APP;
    }
    Settings.ensureApp(activeApp).gpuMode = currentTargetGPUMode;
    Settings.ensureApp(activeApp).gpuFreq = currentTargetGPUFreq;
    Settings.ensureApp(activeApp).gpuAutoMaxFreq = currentTargetGPUAutoMaxFreq;
    Settings.ensureApp(activeApp).gpuAutoMinFreq = currentTargetGPUAutoMinFreq;
    Settings.ensureApp(activeApp).gpuRangeMaxFreq = currentTargetGPURangeMaxFreq;
    Settings.ensureApp(activeApp).gpuRangeMinFreq = currentTargetGPURangeMinFreq;
    applyFn(RunningApps.active(), SET_GPU);

    Settings.saveSettingsToLocalStorage();
  }, [currentTargetGPUMode, currentTargetGPUFreq, currentTargetGPUAutoMaxFreq, currentTargetGPUAutoMinFreq, currentTargetGPURangeMaxFreq, currentTargetGPURangeMinFreq]);

  //使用游戏配置文件设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    const activeApp = RunningApps.active();
    if (activeApp == DEFAULT_APP)
      return;
    Settings.ensureApp(activeApp).overwrite = currentAppOverride;
    Settings.saveSettingsToLocalStorage();
    refresh();
  }, [currentAppOverride]);

  //是否启用设置
  useEffect(() => {
    if (!initialized)
      return;
    console.log()
    const activeApp = RunningApps.active();
    if (!currentEnabled)
      resetFn();
    else {
      applyFn(activeApp, SET_ALL);
    }

    Settings.enabled = currentEnabled;
    Settings.saveSettingsToLocalStorage();
  }, [currentEnabled, initialized]);

  //设置刷新
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <PanelSection title={getString(1, "设置")}>
        <PanelSectionRow>
          <ToggleField
            label={getString(22, "启用插件设置")}
            checked={currentEnabled}
            onChange={(enabled) => {
              setCurrentEnabled(enabled);
            }}
          />
        </PanelSectionRow>
        {currentEnabled &&
          <PanelSectionRow>
            <ToggleField
              label={getString(2, "使用按游戏设置的配置文件")}
              description={
                <div style={{ display: "flex", justifyContent: "left" }}>
                  <img src={RunningApps.active_appInfo()?.icon_data ? "data:image/" + RunningApps.active_appInfo()?.icon_data_format + ";base64," + RunningApps.active_appInfo()?.icon_data : "/assets/" + RunningApps.active_appInfo()?.appid + "_icon.jpg?v=" + RunningApps.active_appInfo()?.icon_hash} width={18} height={18}
                    style={{ display: currentAppOverride && currentAppOverridable ? "block" : "none" }}
                  />
                  {getString(3, "正在使用") + (currentAppOverride && currentAppOverridable ? `『${RunningApps.active_appInfo()?.display_name}』` : `${getString(4, "默认")}`) + getString(5, "配置文件")}
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
              label={getString(6, "睿 频")}
              description={getString(7, "提升最大cpu频率")}
              disabled={currentTargetGPUMode == GPUMODE_AUTO}
              checked={currentTargetCpuBoost}
              onChange={(value) => {
                setCurrentTargetCpuBoost(value);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ToggleField
              label="SMT"
              description={getString(8, "启用奇数编号的cpu")}
              checked={currentTargetSmt}
              onChange={(smt) => {
                setCurrentTargetSmt(smt);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <SliderField
              label={getString(9, "核 心 数")}
              description={getString(10, "设置启用的物理核心数量")}
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
              label={getString(11, "热设计功耗（TDP）限制")}
              description={Backend.data.HasRyzenadj() ? getString(12, "限制处理器功耗以降低总功耗") : getString(13, "未检测到ryzenAdj")}
              checked={currentTargetTDPEnable}
              disabled={!Backend.data.HasRyzenadj() || currentTargetGPUMode == GPUMODE_AUTO}
              onChange={(value) => {
                setCurrentTargetTDPEnable(value);
              }}
            />
          </PanelSectionRow>
          {currentTargetTDPEnable && <PanelSectionRow>
            <SliderField
              label={getString(14, "瓦特")}
              value={currentTargetTDP}
              step={1}
              max={Backend.data.getTDPMax()}
              min={3}
              disabled={!Backend.data.HasTDPMax() || currentTargetGPUMode == GPUMODE_AUTO}
              showValue={true}
              onChange={(value: number) => {
                setCurrentTargetTDP(value);
              }}
            />
          </PanelSectionRow>}
        </PanelSection>
      }
      {currentEnabled && <PanelSection title="GPU">
        {<PanelSectionRow>
          <SliderField
            label={getString(15, "GPU 频率模式")}
            value={currentTargetGPUMode}
            step={1}
            max={3}
            min={0}
            notchCount={4}
            notchLabels={
              [{
                notchIndex: GPUMODE_NOLIMIT,
                label: `${getString(16, "不限制")}`,
                value: GPUMODE_NOLIMIT,
              }, {
                notchIndex: GPUMODE_FIX,
                label: `${getString(17, "固定频率")}`,
                value: GPUMODE_FIX,
              }, {
                notchIndex: GPUMode_RANGE,
                label: `${getString(23, "范围频率")}`,
                value: GPUMode_RANGE,
              }, {
                notchIndex: GPUMODE_AUTO,
                label: `${getString(18, "自动频率")}`,
                value: GPUMODE_AUTO,
              }
              ]
            }
            onChange={(value: number) => {
              setCurrentTargetGPUMode(value);
              if (value == GPUMODE_AUTO) {
                setCurrentTargetCpuBoost(false);
                setCurrentTargetTDPEnable(false);
              }
              console.log("GPUMode value = ", value, "     ", GPUMODE_AUTO);
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode == GPUMODE_FIX && <PanelSectionRow>
          <SliderField
            label={getString(19, "GPU 频率")}
            value={currentTargetGPUFreq}
            step={50}
            max={Backend.data.getGPUFreqMax()}
            min={200}
            disabled={!Backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              setCurrentTargetGPUFreq(value);
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode == GPUMode_RANGE && <PanelSectionRow>
          <SliderField
            label={getString(20, "GPU 最大频率限制")}
            value={currentTargetGPURangeMaxFreq}
            step={50}
            max={Backend.data.getGPUFreqMax()}
            min={200}
            disabled={!Backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              if (value <= currentTargetGPURangeMinFreq) {
                setCurrentTargetGPURangeMaxFreq(currentTargetGPURangeMinFreq)
              } else {
                setCurrentTargetGPURangeMaxFreq(value);
              }
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode == GPUMode_RANGE && <PanelSectionRow>
          <SliderField
            label={getString(21, "GPU 最小频率限制")}
            value={currentTargetGPURangeMinFreq}
            step={50}
            max={Backend.data.getGPUFreqMax()}
            min={200}
            disabled={!Backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              if (value >= currentTargetGPURangeMaxFreq) {
                setCurrentTargetGPURangeMinFreq(currentTargetGPURangeMaxFreq)
              } else {
                setCurrentTargetGPURangeMinFreq(value);
              }

            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode == GPUMODE_AUTO && <PanelSectionRow>
          <SliderField
            label={getString(20, "GPU 最大频率限制")}
            value={currentTargetGPUAutoMaxFreq}
            step={50}
            max={Backend.data.getGPUFreqMax()}
            min={200}
            disabled={!Backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              if (value <= currentTargetGPUAutoMinFreq) {
                setCurrentTargetGPUAutoMaxFreq(currentTargetGPUAutoMinFreq)
              } else {
                setCurrentTargetGPUAutoMaxFreq(value);
              }
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode == GPUMODE_AUTO && <PanelSectionRow>
          <SliderField
            label={getString(21, "GPU 最小频率限制")}
            value={currentTargetGPUAutoMinFreq}
            step={50}
            max={Backend.data.getGPUFreqMax()}
            min={200}
            disabled={!Backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              if (value >= currentTargetGPUAutoMaxFreq) {
                setCurrentTargetGPUAutoMinFreq(currentTargetGPUAutoMaxFreq)
              } else {
                setCurrentTargetGPUAutoMinFreq(value);
              }

            }}
          />
        </PanelSectionRow>}
      </PanelSection>
      }
    </div>
  );
};

export default definePlugin((serverAPI: ServerAPI) => {
  // load Settings
  Settings.loadSettingsFromLocalStorage();
  const init= async()=>{
    await Backend.init(serverAPI);
    console.log("Backend Init End");
    await localizationManager.init(serverAPI);
    console.log("localization Init End");
    RunningApps.register();
    RunningApps.listenActiveChange((newAppId, oldAppId) => {
      console.log(`newAppId=${newAppId} oldAppId=${oldAppId}`)
      applySettings(RunningApps.active(), SET_ALL)
    });
    console.log("RunningApp Init End");

  }

  const applySettings = (appId: string, applyTarget: string) => {
    if (!Settings.appOverWrite(appId))
      appId = DEFAULT_APP;
    if (applyTarget == SET_ALL || applyTarget == SET_CPUCORE) {
      const smt = Settings.appSmt(appId);
      const cpuNum = Settings.appCpuNum(appId);
      Backend.applySmt(smt);
      Backend.applyCpuNum(cpuNum);
    }
    if (applyTarget == SET_ALL || applyTarget == SET_CPUBOOST) {
      const cpuBoost = Settings.appCpuboost(appId);
      Backend.applyCpuBoost(cpuBoost);
    }
    if (applyTarget == SET_ALL || applyTarget == SET_TDP) {
      const tdp = Settings.appTDP(appId);
      const tdpEnable = Settings.appTDPEnable(appId);
      if (tdpEnable) {
        Backend.applyTDP(tdp);
      }
      else {
        Backend.applyTDP(Backend.data.getTDPMax());
      }
    }
    if (applyTarget == SET_ALL || applyTarget == SET_GPU) {
      const gpuMode = Settings.appGPUMode(appId);
      const gpuFreq = Settings.appGPUFreq(appId);
      const gpuAutoMaxFreq = Settings.appGPUAutoMaxFreq(appId);
      const gpuAutoMinFreq = Settings.appGPUAutoMinFreq(appId);
      const gpuRangeMaxFreq = Settings.appGPURangeMaxFreq(appId);
      const gpuRangeMinFreq = Settings.appGPURangeMinFreq(appId);
      if (gpuMode == GPUMODE_NOLIMIT) {
        Backend.applyGPUFreq(0);
      } else if (gpuMode == GPUMODE_FIX) {
        Backend.applyGPUFreq(gpuFreq);
      } else if (gpuMode == GPUMODE_AUTO) {
        console.log(`开始自动优化GPU频率`)
        Backend.applyGPUAutoMax(gpuAutoMaxFreq);
        Backend.applyGPUAutoMin(gpuAutoMinFreq);
        Backend.applyGPUAuto(true);
      } else if (gpuMode == GPUMode_RANGE) {
        Backend.applyGPUFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
      }
      else {
        console.log(`出现意外的GPUmode = ${gpuMode}`)
        Backend.applyGPUFreq(0);
      }
    }

  };

  const resetSettings = () => {
    console.log("重置所有设置");
    Backend.applySmt(true);
    Backend.applyCpuNum(Backend.data.getCpuMaxNum());
    Backend.applyCpuBoost(true);
    Backend.applyTDP(Backend.data.getTDPMax());
    Backend.applyGPUFreq(0);
  };

  init().then(()=>{
    
  })

  suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
    console.log("休眠结束，重新应用设置")
    if (Settings.enabled) {
      Backend.throwSuspendEvt()
      applySettings(RunningApps.active(), SET_ALL);
    } else {
      resetSettings();
    }
  });

  if (Settings.enabled) {
    applySettings(RunningApps.active(), SET_ALL);
  }


  return {
    title: <div className={staticClasses.Title}>PowerControl</div>,
    content: <Content applyFn={applySettings} resetFn={resetSettings} getString={localizationManager.getString}/>,
    icon: <FaSuperpowers />,
    onDismount() {
      suspendEndHook!.unregister();
      RunningApps.unregister();
      resetSettings();
    }
  };
});
