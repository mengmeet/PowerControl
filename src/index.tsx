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
import { VFC, useState, useEffect} from "react";
import { FaSuperpowers } from "react-icons/fa";
import { loadSettingsFromLocalStorage, Settings, saveSettingsToLocalStorage } from "./settings";
import { RunningApps, Backend, DEFAULT_APP} from "./util";

var lifetimeHook: any = null;
var suspendEndHook: any = null;

// Appease TypeScript
declare var SteamClient: any;

let settings: Settings;

const SET_ALL = "ALL";
const SET_CPUBOOST = "SET_CPUBOOST"
const SET_CPUCORE = "SET_CPUCORE";
const SET_TDP = "SET_TDP"
const SET_GPU = "SET_GPU";

const Content: VFC<{runningApps: RunningApps, applyFn: (appId: string,applyTarget:string) => void, resetFn: () => void, backend:Backend}> = ({ runningApps, applyFn, resetFn, backend }) => {
  const [initialized, setInitialized] = useState<boolean>(false);

  const [currentEnabled, setCurrentEnabled] = useState<boolean>(true);
  const [currentAppOverride, setCurrentAppOverride] = useState<boolean>(false);
  const [currentAppOverridable, setCurrentAppOverridable] = useState<boolean>(false);
  const [currentTargetSmt, setCurrentTargetSmt] = useState<boolean>(true);
  const [currentTargetCpuBoost, setCurrentTargetCpuBoost] = useState<boolean>(true);
  const [currentTargetCpuNum, setCurrentTargetCpuNum] = useState<number>(backend.data.getCpuMaxNum());
  const [currentTargetTDPEnable, setCurrentTargetTDPEnable] = useState<boolean>(false);
  const [currentTargetTDP, setCurrentTargetTDP] = useState<number>(backend.data.getTDPMax());
  const [currentTargetGPUMode, setCurrentTargetGPUMode] = useState<number>(0);
  const [currentTargetGPUFreq, setCurrentTargetGPUFreq] = useState<number>(backend.data.getGPUFreqMax());
  const [currentTargetGPUAutoMaxFreq,setCurrentTargetGPUAutoMaxFreq] = useState<number>(backend.data.getGPUFreqMax());
  const [currentTargetGPUAutoMinFreq,setCurrentTargetGPUAutoMinFreq] = useState<number>(200);
  
  const refresh = () => {
    // prevent updates while we are reloading
    setInitialized(false);

    setCurrentEnabled(settings.enabled)

    const activeApp = settings.appOverWrite(RunningApps.active())?RunningApps.active():DEFAULT_APP;
    console.log(`Refresh 设置${activeApp}配置状态`);
    setCurrentAppOverridable(RunningApps.active() != DEFAULT_APP);

    setCurrentAppOverride(settings.appOverWrite(activeApp));
    setCurrentTargetSmt(settings.appSmt(activeApp));
    setCurrentTargetCpuNum(settings.appCpuNum(activeApp));
    setCurrentTargetCpuBoost(settings.appCpuboost(activeApp));
    setCurrentTargetTDP(settings.appTDP(activeApp));
    setCurrentTargetTDPEnable(settings.appTDPEnable(activeApp));
    setCurrentTargetGPUMode(settings.appGPUMode(activeApp));
    setCurrentTargetGPUFreq(settings.appGPUFreq(activeApp));
    setCurrentTargetGPUAutoMaxFreq(settings.appGPUAutoMaxFreq(activeApp))
    setCurrentTargetGPUAutoMinFreq(settings.appGPUAutoMinFreq(activeApp))

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
    settings.ensureApp(activeApp).smt = currentTargetSmt;
    settings.ensureApp(activeApp).cpuNum = currentTargetCpuNum;
    applyFn(RunningApps.active(),SET_CPUCORE);

    saveSettingsToLocalStorage(settings);
  }, [currentTargetSmt,currentTargetCpuNum]);

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
    settings.ensureApp(activeApp).cpuboost = currentTargetCpuBoost;
    applyFn(RunningApps.active(),SET_CPUBOOST);

    saveSettingsToLocalStorage(settings);
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
    settings.ensureApp(activeApp).tdp = currentTargetTDP;
    settings.ensureApp(activeApp).tdpEnable = currentTargetTDPEnable;
    applyFn(RunningApps.active(),SET_TDP);

    saveSettingsToLocalStorage(settings);
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
    settings.ensureApp(activeApp).gpuMode = currentTargetGPUMode;
    settings.ensureApp(activeApp).gpuFreq = currentTargetGPUFreq;
    settings.ensureApp(activeApp).gpuAutoMaxFreq = currentTargetGPUAutoMaxFreq;
    settings.ensureApp(activeApp).gpuAutoMinFreq = currentTargetGPUAutoMinFreq;
    applyFn(RunningApps.active(),SET_GPU);

    saveSettingsToLocalStorage(settings);
  }, [currentTargetGPUMode, currentTargetGPUFreq, currentTargetGPUAutoMaxFreq, currentTargetGPUAutoMinFreq]);

  //使用游戏配置文件设置
  useEffect(() => {
    if (!initialized || !currentEnabled)
      return;

    const activeApp = RunningApps.active();
    if (activeApp == DEFAULT_APP)
      return;
    settings.ensureApp(activeApp).overwrite = currentAppOverride;
    saveSettingsToLocalStorage(settings);
    refresh();
  }, [currentAppOverride]);

  //是否启用设置
  useEffect(() => {
    if (!initialized)
      return;

    const activeApp = RunningApps.active();
    if (!currentEnabled)
      resetFn();
    else{
      applyFn(activeApp,SET_ALL)
    }

    settings.enabled = currentEnabled;
    saveSettingsToLocalStorage(settings);
  }, [currentEnabled, initialized]);

  //设置刷新
  useEffect(() => {
    refresh();
    runningApps.listenActiveChange(() => refresh());
  }, []);

  return (
    <div>
      <PanelSection title="设置">
        <PanelSectionRow>
          <ToggleField
            label="启用插件设置"
            checked={currentEnabled}
            onChange={(enabled) => {
              setCurrentEnabled(enabled);
            }}
          />
        </PanelSectionRow>
           {currentEnabled&&
            <PanelSectionRow>
            <ToggleField
              label={"使用按游戏设置的配置文件"}
              description={
                  <div style={{ display: "flex", justifyContent: "left" }}>
                  <img src={ RunningApps.active_app()?.icon_data? "data:image/" +RunningApps.active_app()?.icon_data_format +";base64," +RunningApps.active_app()?.icon_data: "/assets/" + RunningApps.active_app()?.appid + "_icon.jpg?v=" + RunningApps.active_app()?.icon_hash} width={18} height={18}
                        style={{ display: currentAppOverride&&currentAppOverridable? "block":"none"}}
                  />
                  {" 正在使用" + (currentAppOverride && currentAppOverridable ? `『${RunningApps.active_app()?.display_name}』` : "默认") + "配置文件"}
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
      {currentEnabled&&
        <PanelSection title="CPU">
           <PanelSectionRow>
            <ToggleField
              label="睿 频"
              description={"提升最大cpu频率"}
              checked={currentTargetCpuBoost}
              onChange={(value) => {
                setCurrentTargetCpuBoost(value);
              }}
            />
          </PanelSectionRow>
          {/*!currentTargetCpuBoost&&<PanelSectionRow>
          <SliderField
            label="CPU 最大频率限制"
            value={backend.data.getCPUFreqIndexByFreq(currentTargetCPUFreq)}
            step={1}
            max={backend.data.getCPUFreqMaxIndex()}
            min={0}
            description={backend.data.HasCPUFreqList()?"":"未检测到可用的CPU频率限制列表"}
            disabled={!backend.data.HasCPUFreqList()}
            notchCount={backend.data.getCPUFreqList()?.length}
            notchLabels={backend.data.getCPUFreqList()?.map((value, index) => (
              {
                notchIndex: index,
                label: `${value/1000000}Ghz`,
                value: index,
              }))
            }
            onChange={(index: number) => {
              setCurrentTargetCPUFreq(backend.data.getCPUFreqByIndex(index))
              console.log(`CPUFreq index = ${index}  freq= ${backend.data.getCPUFreqByIndex(index)}`);
            }}
          />
          </PanelSectionRow>*/}
          <PanelSectionRow>
            <ToggleField
              label="SMT"
              description={"启用奇数编号的cpu"}
              checked={currentTargetSmt}
              onChange={(smt) => {
                setCurrentTargetSmt(smt);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <SliderField
              label="核 心 数"
              description={`设置启用的物理核心数量`}
              value={currentTargetCpuNum}
              step={1}
              max={backend.data.getCpuMaxNum()}
              min={1}
              disabled={!backend.data.HasCpuMaxNum()}
              showValue={true}
              onChange={(value: number) => {
                setCurrentTargetCpuNum(value);
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ToggleField
              label="热设计功耗（TDP）限制"
              description={backend.data.HasRyzenadj()?"限制处理器功耗以降低总功耗":"未检测到ryzenAdj"}
              checked={currentTargetTDPEnable}
              disabled={!backend.data.HasRyzenadj()}
              onChange={(value) => {
                setCurrentTargetTDPEnable(value);
              }}
            />
          </PanelSectionRow>
          {currentTargetTDPEnable&&<PanelSectionRow>
            <SliderField
              label="瓦特"
              value={currentTargetTDP}
              step={1}
              max={backend.data.getTDPMax()}
              min={3}
              disabled={!backend.data.HasTDPMax()}
              showValue={true}
              onChange={(value: number) => {
                setCurrentTargetTDP(value);
              }}
            />
          </PanelSectionRow>}
        </PanelSection>
      }
      {currentEnabled&&<PanelSection title="GPU">
      {<PanelSectionRow>
          <SliderField
            label="GPU 频率模式"
            value={currentTargetGPUMode}
            step={1}
            max={2}
            min={0}
            notchCount={3}
            notchLabels={
              [{
                notchIndex: 0,
                label: "不限制",
                value:0,
              },{
                notchIndex: 1,
                label: "固定频率",
                value:1,
              },{
                notchIndex: 2,
                label: "自动频率",
                value:2,
              }]
            }
            onChange={(value: number) => {
              setCurrentTargetGPUMode(value);
              console.log("GPUMode value = ",value);
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode==1&&<PanelSectionRow>
          <SliderField
            label="GPU 频率"
            value={currentTargetGPUFreq}
            step={50}
            max={backend.data.getGPUFreqMax()}
            min={200}
            disabled={!backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              setCurrentTargetGPUFreq(value);
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode==2&&<PanelSectionRow>
          <SliderField
            label="GPU 最大频率限制"
            value={currentTargetGPUAutoMaxFreq}
            step={50}
            max={backend.data.getGPUFreqMax()}
            min={200}
            disabled={!backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              if(value <= currentTargetGPUAutoMinFreq){
                setCurrentTargetGPUAutoMaxFreq(currentTargetGPUAutoMinFreq)
              }else{
                setCurrentTargetGPUAutoMaxFreq(value);
              }
            }}
          />
        </PanelSectionRow>}
        {currentTargetGPUMode==2&&<PanelSectionRow>
          <SliderField
            label="GPU 最小频率限制"
            value={currentTargetGPUAutoMinFreq}
            step={50}
            max={backend.data.getGPUFreqMax()}
            min={200}
            disabled={!backend.data.HasGPUFreqMax()}
            showValue={true}
            onChange={(value: number) => {
              if(value >= currentTargetGPUAutoMaxFreq){
                setCurrentTargetGPUAutoMinFreq(currentTargetGPUAutoMaxFreq)
              }else{
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
  // load settings
  settings = loadSettingsFromLocalStorage();

  const backend = new Backend(serverAPI);
  const runningApps = new RunningApps();

  const applySettings = (appId: string,applyTarget:string) => {
    if(!settings.appOverWrite(appId))
      appId = DEFAULT_APP;
    if(applyTarget == SET_ALL || applyTarget == SET_CPUCORE){
      const smt = settings.appSmt(appId);
      const cpuNum = settings.appCpuNum(appId);
      backend.applySmt(smt);
      backend.applyCpuNum(cpuNum);
    }
    if(applyTarget == SET_ALL || applyTarget == SET_CPUBOOST){
      const cpuBoost = settings.appCpuboost(appId);
      //const cpuFreq = settings.appCPUFreq(appId);
      backend.applyCpuBoost(cpuBoost);
      //backend.applyCPUFreq(cpuBoost,cpuFreq);
    }
    if(applyTarget == SET_ALL || applyTarget == SET_TDP){
      const tdp = settings.appTDP(appId);
      const tdpEnable = settings.appTDPEnable(appId);
      if (tdpEnable){
        backend.applyTDP(tdp);
      }
      else{
        backend.applyTDP(backend.data.getTDPMax());
      }
    }
    if(applyTarget == SET_ALL || applyTarget == SET_GPU){
      const gpuMode = settings.appGPUMode(appId);
      const gpuFreq = settings.appGPUFreq(appId);
      const gpuAutoMaxFreq = settings.appGPUAutoMaxFreq(appId);
      const gpuAutoMinFreq = settings.appGPUAutoMinFreq(appId);
      if(gpuMode == 0){
        backend.applyGPUFreq(0);
      }else if(gpuMode == 1){
          backend.applyGPUFreq(gpuFreq);
      }else if(gpuMode == 2){
          console.log(`开始自动优化GPU频率`)
          backend.applyGPUAutoMax(gpuAutoMaxFreq);
          backend.applyGPUAutoMin(gpuAutoMinFreq);      
          backend.applyGPUAuto(true);    
      }
      else{
          console.log(`出现意外的GPUmode = ${gpuMode}`)
          backend.applyGPUFreq(0);
      }
    }

  };

  const resetSettings = () => {
    console.log("重置所有设置");
    backend.applySmt(true);
    backend.applyCpuNum(backend.data.getCpuMaxNum());
    backend.applyCpuBoost(true);
    backend.applyTDP(backend.data.getTDPMax());
    backend.applyGPUFreq(0);
  };

  runningApps.register();
  lifetimeHook = SteamClient.GameSessions.RegisterForAppLifetimeNotifications((update: {
    unAppID: any; bRunning: any; 
}) => {
    if (update.bRunning) {
        console.log(`unAppID=${update.unAppID} 游戏状态更新`)
        if (settings.enabled){
          applySettings(RunningApps.active(),SET_ALL);
        }
        else{
          resetSettings();
        }
    } else {
        console.log("unAppID=" + update.unAppID.toString() + "结束游戏"); 
        if (settings.enabled){
          applySettings(DEFAULT_APP,SET_ALL);
        }else{
          resetSettings();
        }
    }
});
  suspendEndHook=SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
    console.log("休眠结束，重新应用设置")
    if (settings.enabled){
      backend.throwSuspendEvt()
      applySettings(RunningApps.active(),SET_ALL);
    }else{
      resetSettings();
    }
});
  

  // apply initially
  if (settings.enabled) {
    applySettings(RunningApps.active(),SET_ALL);
  }

  return {
    title: <div className={staticClasses.Title}>PowerControl</div>,
    content: <Content runningApps={runningApps} applyFn={applySettings} resetFn={resetSettings} backend={backend}/>,
    icon: <FaSuperpowers />,
    onDismount() {
      lifetimeHook!.unregister();
      suspendEndHook!.unregister();
      runningApps.unregister();
      resetSettings();
    }
  };
});
