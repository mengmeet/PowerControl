import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC} from "react";
import { Settings,Backend, PluginManager,ComponentName, UpdateType, GPUMODE, Patch} from "../util";
import { localizeStrEnum,localizationManager } from "../i18n";
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
          label={localizationManager.getString(localizeStrEnum.CPU_BOOST)}
          description={localizationManager.getString(localizeStrEnum.CPU_BOOST_DESC)}
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
          description={localizationManager.getString(localizeStrEnum.SMT_DESC)}
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
            label={localizationManager.getString(localizeStrEnum.CPU_NUM)}
            description={localizationManager.getString(localizeStrEnum.CPU_NUM_DESC)}
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
  const [disabled,setDisable] = useState<boolean>(Settings.appGPUMode()==GPUMODE.AUTO);
  const refresh = () => {
    setTDPEnable(Settings.appTDPEnable());
    setTDP(Settings.appTDP());
    setDisable(Settings.appGPUMode()==GPUMODE.AUTO);
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
              label={localizationManager.getString(localizeStrEnum.TDP)}
              description={localizationManager.getString(localizeStrEnum.TDP_DESC)}
              checked={tdpEnable}
              disabled={disabled}
              onChange={(value) => {
                Settings.setTDPEnable(value);
              }}
            />
          </PanelSectionRow>
          {tdpEnable&&<PanelSectionRow>
            <SlowSliderField
              label={localizationManager.getString(localizeStrEnum.WATTS)}
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
  const isSpportSMT = Settings.appIsSupportSMT();
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
          {isSpportSMT && <CPUSmtComponent/>}
          <CPUNumComponent/>
          {!PluginManager.isPatchSuccess(Patch.TDPPatch)&& <CPUTDPComponent/>}
        </PanelSection>}
        </div>
    );
};

