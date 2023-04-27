import {
  PanelSection,
  PanelSectionRow,
  SliderField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC} from "react";
import { Settings,Backend, PluginManager,GPUMODE,ComponentName, UpdateType} from "../util";
import { localizeStrEnum,localizationManager } from "../i18n";
import {SlowSliderField} from "./SlowSliderField"

//GPUFreq模块
const GPUFreqComponent: VFC = () => {
  const [gpuFreq, setGPUFreq] = useState<number>(Settings.appGPUFreq());
  const refresh = () => {
    setGPUFreq(Settings.appGPUFreq());
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQFIX,[ComponentName.GPU_FREQFIX],(_ComponentName,updateType)=>{
      switch(updateType){
        case(UpdateType.UPDATE):{
          refresh();
          break;
        }
      }
    })
  }, []);
  return (
    <PanelSectionRow>
      <SlowSliderField
        label={localizationManager.getString(localizeStrEnum.FIXED_FREQ)}
        value={gpuFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={Backend.data.getGPUFreqMin()}
        disabled={!Backend.data.HasGPUFreqMax()}
        showValue={true}
        onChangeEnd={(value: number) => {
          Settings.setGPUFreq(value);
        }}
      />
    </PanelSectionRow>
  );
};

//GPURange模块
const GPURangeComponent: VFC = () => {
  const [gpuRangeMaxFreq, setGPURangeMaxFreq] = useState<number>(Settings.appGPURangeMaxFreq());
  const [gpuRangeMinFreq, setGPURangeMinFreq] = useState<number>(Settings.appGPURangeMinFreq());
  //GPURange设置
  const refresh = () => {
    setGPURangeMaxFreq(Settings.appGPURangeMaxFreq());
    setGPURangeMinFreq(Settings.appGPURangeMinFreq());
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQRANGE,[ComponentName.GPU_FREQRANGE],(_ComponentName,updateType)=>{
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
        label={localizationManager.getString(localizeStrEnum.GPU_MAX_FREQ)}
        value={gpuRangeMaxFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={Backend.data.getGPUFreqMin()}
        changeMin={gpuRangeMinFreq}
        disabled={!Backend.data.HasGPUFreqMax()}
        showValue={true}
        onChangeEnd={(value: number) => {
          Settings.setGPURangeFreq(value,gpuRangeMinFreq);
        }}
      />
    </PanelSectionRow>
    <PanelSectionRow>
    <SlowSliderField
        label={localizationManager.getString(localizeStrEnum.GPU_MIN_FREQ)}
        value={gpuRangeMinFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={Backend.data.getGPUFreqMin()}
        changeMax={gpuRangeMaxFreq}
        disabled={!Backend.data.HasGPUFreqMax()}
        showValue={true}
        onChangeEnd={(value: number) => {
          Settings.setGPURangeFreq(gpuRangeMaxFreq,value);
        }}
      />
    </PanelSectionRow>
    </div>
  );
};

//GPUAutoMax模块
const GPUAutoComponent: VFC = () => {
  const [gpuAutoMaxFreq, setGPUAutoMaxFreq] = useState<number>(Settings.appGPUAutoMaxFreq());
  const [gpuAutoMinFreq, setGPUAutoMinFreq] = useState<number>(Settings.appGPUAutoMinFreq());
  const refresh = () => {
    setGPUAutoMaxFreq(Settings.appGPUAutoMaxFreq());
    setGPUAutoMinFreq(Settings.appGPUAutoMinFreq());
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQAUTO,[ComponentName.GPU_FREQAUTO],(_ComponentName,updateType)=>{
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
        label={localizationManager.getString(localizeStrEnum.GPU_MAX_FREQ)}
        value={gpuAutoMaxFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={Backend.data.getGPUFreqMin()}
        changeMin={gpuAutoMinFreq}
        disabled={!Backend.data.HasGPUFreqMax()}
        showValue={true}
        onChangeEnd={(value: number) => {
          Settings.setGPUAutoMaxFreq(value);
        }}
      />
    </PanelSectionRow>
    <PanelSectionRow>
    <SlowSliderField
      label={localizationManager.getString(localizeStrEnum.GPU_MIN_FREQ)}
      value={gpuAutoMinFreq}
      step={50}
      max={Backend.data.getGPUFreqMax()}
      min={Backend.data.getGPUFreqMin()}
      changeMax={gpuAutoMaxFreq}
      disabled={!Backend.data.HasGPUFreqMax()}
      showValue={true}
      onChangeEnd={(value: number) => {
        Settings.setGPUAutoMinFreq(value);
      }}
    />
    </PanelSectionRow>
    </div>
  );
};

const GPUModeComponent: VFC = () => {
  const [gpuMode, setGPUMode] = useState<number>(Settings.appGPUMode());
  //GPU模式设置
  const refresh = () => {
    setGPUMode(Settings.appGPUMode());
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQMODE,[ComponentName.GPU_FREQMODE],(_ComponentName,updateType)=>{
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
          <SliderField
            label={localizationManager.getString(localizeStrEnum.FAN_MODE)}
            value={gpuMode}
            step={1}
            max={3}
            min={0}
            notchCount={4}
            notchLabels={
              [{
                notchIndex: GPUMODE.NOLIMIT,
                label: `${localizationManager.getString(localizeStrEnum.UNLIMITED)}`,
                value: GPUMODE.NOLIMIT,
              }, {
                notchIndex: GPUMODE.FIX,
                label: `${localizationManager.getString(localizeStrEnum.FIXED_FREQ)}`,
                value: GPUMODE.FIX,
              }, {
                notchIndex: GPUMODE.RANGE,
                label: `${localizationManager.getString(localizeStrEnum.RANGE_FREQ)}`,
                value: GPUMODE.RANGE,
              }, {
                notchIndex: GPUMODE.AUTO,
                label: `${localizationManager.getString(localizeStrEnum.AUTO_FREQ)}`,
                value: GPUMODE.AUTO,
              }
              ]
            }
            onChange={(value: number) => {
              Settings.setGPUMode(value);
            }}
          />
          {gpuMode==GPUMODE.FIX&&<GPUFreqComponent/>}
          {gpuMode==GPUMODE.RANGE&&<GPURangeComponent/>}
          {gpuMode==GPUMODE.AUTO&&<GPUAutoComponent/>}
          </PanelSectionRow>
        </div>
    );
};

export function GPUComponent(){
  const [show,setShow] = useState<boolean>(Settings.ensureEnable());
  const hide = (ishide:boolean) => {
    setShow(!ishide);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_ALL,[ComponentName.GPU_ALL],(_ComponentName,updateType)=>{
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
      {show&&<PanelSection title="GPU">
        <GPUModeComponent/>
      </PanelSection>}
    </div>
  );
};