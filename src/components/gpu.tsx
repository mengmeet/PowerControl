import {
  NotchLabel,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ToggleField,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { Settings, Backend, PluginManager, GPUMODE, ComponentName, UpdateType } from "../util";
import { localizeStrEnum, localizationManager } from "../i18n";
import { SlowSliderField } from "./SlowSliderField"

//GPUFreq模块
const GPUFreqComponent: VFC = () => {
  const [gpuFreq, setGPUFreq] = useState<number>(Settings.appGPUFreq());
  const refresh = () => {
    setGPUFreq(Settings.appGPUFreq());
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQFIX, [ComponentName.GPU_FREQFIX], (_ComponentName, updateType) => {
      switch (updateType) {
        case (UpdateType.UPDATE): {
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
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQRANGE, [ComponentName.GPU_FREQRANGE], (_ComponentName, updateType) => {
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
            Settings.setGPURangeFreq(value, gpuRangeMinFreq);
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
            Settings.setGPURangeFreq(gpuRangeMaxFreq, value);
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
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQAUTO, [ComponentName.GPU_FREQAUTO], (_ComponentName, updateType) => {
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

/*
const GPUModeComponent: VFC = () => {
  const [gpuMode, setGPUMode] = useState<string>(Settings.appGPUMode());
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

  const modesWithNative : GPUMODE[] = [GPUMODE.NATIVE, GPUMODE.RANGE, GPUMODE.AUTO];
  const localizedModesWithNative = [
    localizationManager.getString(localizeStrEnum.NATIVE_FREQ),
    localizationManager.getString(localizeStrEnum.RANGE_FREQ),
    localizationManager.getString(localizeStrEnum.AUTO_FREQ)
  ]
  const notchLabelsWithNative : NotchLabel[] = modesWithNative.map((mode: GPUMODE, index) => {
    return {
      notchIndex: index,
      label: localizedModesWithNative[index],
      value: modesWithNative.indexOf(mode),
    }
  }
  );

  return (
        <div>
          <PanelSectionRow>
            <SliderField
            label={localizationManager.getString(localizeStrEnum.GPU_FREQMODE)}
            value={modesWithNative.findIndex((mode) => mode == gpuMode)}
            step={1}
            max={2}
            min={0}
            notchCount={3}
            notchLabels={notchLabelsWithNative}
            onChange={(value: number) => {
              const mode = modesWithNative[value];
              Settings.setGPUMode(mode);
            }}
          />
          {gpuMode==GPUMODE.RANGE&&<GPURangeComponent/>}
          {gpuMode==GPUMODE.AUTO&&<GPUAutoComponent/>}
          </PanelSectionRow>
        </div>
    );
};
*/



const GPUModeSliderComponent: VFC = () => {
  const modesWithNative: GPUMODE[] = [GPUMODE.NATIVE, GPUMODE.RANGE, GPUMODE.AUTO];
  const localizedModesWithNative = [
    localizationManager.getString(localizeStrEnum.NATIVE_FREQ),
    localizationManager.getString(localizeStrEnum.RANGE_FREQ),
    localizationManager.getString(localizeStrEnum.AUTO_FREQ)
  ]
  const modesLegacy: GPUMODE[] = [GPUMODE.NOLIMIT, GPUMODE.FIX, GPUMODE.RANGE, GPUMODE.AUTO];
  const localizedModes = [
    localizationManager.getString(localizeStrEnum.UNLIMITED),
    localizationManager.getString(localizeStrEnum.FIXED_FREQ),
    localizationManager.getString(localizeStrEnum.RANGE_FREQ),
    localizationManager.getString(localizeStrEnum.AUTO_FREQ)
  ]

  const notchLabelsWithNative: NotchLabel[] = modesWithNative.map(
    (mode: GPUMODE, index) => {
      return {
        notchIndex: index,
        label: localizedModesWithNative[index],
        value: modesWithNative.indexOf(mode),
      }
    }
  );

  const notchLabelsLegacy: NotchLabel[] = modesLegacy.map((mode, index) => {
    return {
      notchIndex: index,
      label: localizedModes[index],
      value: modesLegacy.indexOf(mode),
    }
  }
  );

  const [gpuSliderFix, setGPUSliderFix] = useState<boolean>(Settings.appGPUSliderFix());
  const [gpuMode, setGPUMode] = useState<string>(Settings.appGPUMode());

  //GPU模式设置
  const refresh = () => {
    setGPUMode(Settings.appGPUMode());
    setGPUSliderFix(Settings.appGPUSliderFix());
  };

  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_FREQMODE, [ComponentName.GPU_FREQMODE], (_ComponentName, updateType) => {
      switch (updateType) {
        case (UpdateType.UPDATE): {
          refresh();
          break;
        }
      }
    })
  }, []);

  const notchLabels = gpuSliderFix ? notchLabelsWithNative : notchLabelsLegacy;
  const modes = gpuSliderFix ? modesWithNative : modesLegacy;

  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.GPU_NATIVE_SLIDER)}
          description={localizationManager.getString(localizeStrEnum.GPU_NATIVE_SLIDER_DESC)}
          checked={gpuSliderFix}
          onChange={(fix) => {
            Settings.setGPUSliderFix(fix);
          }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <SliderField
          label={localizationManager.getString(localizeStrEnum.GPU_FREQMODE)}
          value={modes.findIndex((mode) => mode == gpuMode)}
          step={1}
          max={notchLabels.length - 1}
          min={0}
          notchCount={notchLabels.length}
          notchLabels={notchLabels}
          onChange={(value: number) => {
            const mode = gpuSliderFix ? modesWithNative[value] : modes[value];
            Settings.setGPUMode(mode);
          }}
        />
        {gpuMode == GPUMODE.FIX && <GPUFreqComponent />}
        {gpuMode == GPUMODE.RANGE && <GPURangeComponent />}
        {gpuMode == GPUMODE.AUTO && <GPUAutoComponent />}

      </PanelSectionRow>
    </div>
  );
};


export function GPUComponent() {
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());
  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.GPU_ALL, [ComponentName.GPU_ALL], (_ComponentName, updateType) => {
      switch (updateType) {
        case (UpdateType.HIDE): {
          hide(true);
          break;
        }
        case (UpdateType.SHOW): {
          hide(false);
          break;
        }
      }
    })
  }, []);
  return (
    <div>
      {show && <PanelSection title="GPU">
        <GPUModeSliderComponent />
      </PanelSection>}
    </div>
  );
};