import {
  PanelSection,
  PanelSectionRow,
  SliderField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC} from "react";
import { localizationManager, Settings,Backend, PluginManager,GPUMODE,ComponentName, UpdateType} from "../util";
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
        label={localizationManager.getString(19, "GPU 频率")}
        value={gpuFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={200}
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
        label={localizationManager.getString(20, "GPU 最大频率限制")}
        value={gpuRangeMaxFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={200}
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
        label={localizationManager.getString(21, "GPU 最小频率限制")}
        value={gpuRangeMinFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={200}
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
        label={localizationManager.getString(20, "GPU 最大频率限制")}
        value={gpuAutoMaxFreq}
        step={50}
        max={Backend.data.getGPUFreqMax()}
        min={200}
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
      label={localizationManager.getString(21, "GPU 最小频率限制")}
      value={gpuAutoMinFreq}
      step={50}
      max={Backend.data.getGPUFreqMax()}
      min={200}
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
            label={localizationManager.getString(15, "GPU 频率模式")}
            value={gpuMode}
            step={1}
            max={3}
            min={0}
            notchCount={4}
            notchLabels={
              [{
                notchIndex: GPUMODE.NOLIMIT,
                label: `${localizationManager.getString(16, "不限制")}`,
                value: GPUMODE.NOLIMIT,
              }, {
                notchIndex: GPUMODE.FIX,
                label: `${localizationManager.getString(17, "固定频率")}`,
                value: GPUMODE.FIX,
              }, {
                notchIndex: GPUMODE.RANGE,
                label: `${localizationManager.getString(23, "范围频率")}`,
                value: GPUMODE.RANGE,
              }, {
                notchIndex: GPUMODE.AUTO,
                label: `${localizationManager.getString(18, "自动频率")}`,
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

export const GPUComponent: VFC = () =>{
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