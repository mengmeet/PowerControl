import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC} from "react";
import { localizationManager, Settings,Backend, PluginManager,ComponentName, UpdateType, GPUMODE} from "../util";
import {SlowSliderField} from "./SlowSliderField"

const CPUBoostComponent:VFC = () =>{
  const [cpuboost, setCPUBoost] = useState<boolean>(Settings.appCpuboost());
  const [disabled,setDisable] = useState<boolean>(Settings.appGPUMode()==GPUMODE.AUTO);
  const refresh = () => {
    setCPUBoost(Settings.appCpuboost());
    setDisable(Settings.appGPUMode()==GPUMODE.AUTO);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.CPU_BOOST,[ComponentName.CPU_BOOST,ComponentName.GPU_FREQMODE],(_ComponentName,updateType)=>{
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
          label={localizationManager.getString(6, "睿 频")}
          description={localizationManager.getString(7, "提升最大cpu频率")}
          disabled={disabled}
          checked={cpuboost}
          onChange={(value) => {
            Settings.setCpuboost(value);
          }}
        />
      </PanelSectionRow>
    </div>
);
}

const CPUSmtComponent:VFC = () =>{
  const [cpusmt, setCPUSmt] = useState<boolean>(Settings.appSmt());
  const refresh = () => {
    setCPUSmt(Settings.appSmt());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.CPU_SMT,[ComponentName.CPU_SMT],(_ComponentName,updateType)=>{
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
          label="SMT"
          description={localizationManager.getString(8, "启用奇数编号的cpu")}
          checked={cpusmt}
          onChange={(smt) => {
            Settings.setSmt(smt);
          }}
        />
      </PanelSectionRow>
    </div>
);
}

const CPUNumComponent:VFC = () =>{
  const [cpunum, setCPUNum] = useState<number>(Settings.appCpuNum());
  const refresh = () => {
    setCPUNum(Settings.appCpuNum());
  };
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.CPU_NUM,[ComponentName.CPU_NUM],(_ComponentName,updateType)=>{
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
          <SlowSliderField
            label={localizationManager.getString(9, "核 心 数")}
            description={localizationManager.getString(10, "设置启用的物理核心数量")}
            value={cpunum}
            step={1}
            max={Backend.data.getCpuMaxNum()}
            min={1}
            disabled={!Backend.data.HasCpuMaxNum()}
            showValue={true}
            onChangeEnd={(value: number) => {
              Settings.setCpuNum(value);
            }}
          />
      </PanelSectionRow>
    </div>
);
}

const CPUTDPComponent:VFC = () =>{
  const [tdpEnable, setTDPEnable] = useState<boolean>(Settings.appTDPEnable());
  const [tdp,setTDP] = useState<number>(Settings.appTDP());
  const [disabled,setDisable] = useState<boolean>(!Backend.data.HasRyzenadj()||Settings.appGPUMode()==GPUMODE.AUTO);
  const refresh = () => {
    setTDPEnable(Settings.appTDPEnable());
    setTDP(Settings.appTDP());
    setDisable(!Backend.data.HasRyzenadj()||Settings.appGPUMode()==GPUMODE.AUTO);
  };
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.CPU_TDP,[ComponentName.CPU_TDP,ComponentName.GPU_FREQMODE],(_ComponentName,updateType)=>{
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
              label={localizationManager.getString(11, "热设计功耗 (TDP) 限制")}
              description={Backend.data.HasRyzenadj() ? localizationManager.getString(12, "限制处理器功耗以降低总功耗") : localizationManager.getString(13, "未检测到ryzenAdj")}
              checked={tdpEnable}
              disabled={disabled}
              onChange={(value) => {
                Settings.setTDPEnable(value);
              }}
            />
          </PanelSectionRow>
          {tdpEnable && <PanelSectionRow>
            <SlowSliderField
              label={localizationManager.getString(14, "瓦特")}
              value={tdp}
              step={1}
              max={Backend.data.getTDPMax()}
              min={3}
              disabled={disabled}
              showValue={true}
              onChangeEnd={(value: number) => {
                Settings.setTDP(value);
              }}
            />
          </PanelSectionRow>}
    </div>
);
}

export const CPUComponent: VFC = () => {
  const [show,setShow] = useState<boolean>(Settings.ensureEnable());
  const hide = (ishide:boolean) => {
    setShow(!ishide);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.CPU_ALL,[ComponentName.CPU_ALL],(_ComponentName,updateType)=>{
      switch(updateType){
        case(UpdateType.HIDE):{
          hide(true);
          break;
        }
        case(UpdateType.SHOW):{
          hide(false);
          break;
        }
      }
    })
  }, []);
  return (
        <div>
          {show&&<PanelSection title="CPU">
          <CPUBoostComponent/>
          <CPUSmtComponent/>
          <CPUNumComponent/>
          <CPUTDPComponent/>
        </PanelSection>}
        </div>
    );
};

