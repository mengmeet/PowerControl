import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  DropdownItem,
} from "@decky/ui";
import { useEffect, useState, FC } from "react";
import {
  Settings,
  Backend,
  PluginManager,
  ComponentName,
  UpdateType,
  GPUMODE,
  Patch,
} from "../util";
import { localizeStrEnum, localizationManager } from "../i18n";
import { SlowSliderField } from "./SlowSliderField";
import { CustomTDPComponent } from ".";

const CPUBoostComponent: FC = () => {
  const [cpuboost, setCPUBoost] = useState<boolean>(Settings.appCpuboost());
  const [disabled, setDisable] = useState<boolean>(
    Settings.appGPUMode() == GPUMODE.AUTO
  );
  const refresh = () => {
    setCPUBoost(Settings.appCpuboost());
    setDisable(Settings.appGPUMode() == GPUMODE.AUTO);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_BOOST,
      [ComponentName.CPU_BOOST, ComponentName.GPU_FREQMODE],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
  }, []);
  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.CPU_BOOST)}
          description={localizationManager.getString(
            localizeStrEnum.CPU_BOOST_DESC
          )}
          disabled={disabled}
          checked={cpuboost}
          onChange={(value) => {
            Settings.setCpuboost(value);
          }}
        />
      </PanelSectionRow>
    </div>
  );
};

const CPUSmtComponent: FC = () => {
  const [cpusmt, setCPUSmt] = useState<boolean>(Settings.appSmt());
  const refresh = () => {
    setCPUSmt(Settings.appSmt());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_SMT,
      [ComponentName.CPU_SMT],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
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
};

const CPUNumComponent: FC = () => {
  const [cpunum, setCPUNum] = useState<number>(Settings.appCpuNum());
  const refresh = () => {
    setCPUNum(Settings.appCpuNum());
  };
  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_NUM,
      [ComponentName.CPU_NUM],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
  }, []);
  return (
    <div>
      <PanelSectionRow>
        <SlowSliderField
          label={localizationManager.getString(localizeStrEnum.CPU_NUM)}
          description={localizationManager.getString(
            localizeStrEnum.CPU_NUM_DESC
          )}
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
};

const CPUPerformancePerfComponent: FC = () => {
  const [supportPerf, _] = useState<boolean>(
    Backend.data.getSupportCPUMaxPct()
  );
  const [autoPerf, setAutoPerf] = useState<boolean>(Settings.appAutoCPUMaxPct());
  const [maxPerf, setMaxPerf] = useState<number>(Settings.appCpuMaxPerfPct());

  const refresh = () => {
    setMaxPerf(Settings.appCpuMaxPerfPct());
    setAutoPerf(Settings.appAutoCPUMaxPct());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_PERFORMANCE,
      [ComponentName.CPU_PERFORMANCE],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
  }, []);

  return (
    <>
      {supportPerf && (
        <>
          <PanelSectionRow>
            <ToggleField
              label={localizationManager.getString(localizeStrEnum.CPU_MAX_PERF_AUTO)}
              checked={autoPerf}
              onChange={(val) => {
                Settings.setAutoCPUMaxPct(val);
              }}
            />
          </PanelSectionRow>
          {!autoPerf && <PanelSectionRow>
            <SlowSliderField
              label={localizationManager.getString(localizeStrEnum.CPU_MAX_PERF)}
              value={maxPerf}
              valueSuffix=" %"
              step={1}
              max={100}
              min={10}
              showValue={true}
              onChangeEnd={(value: number) => {
                Settings.setCpuMaxPerfPct(value);
              }}
            />
          </PanelSectionRow>}
        </>
      )}
    </>
  );
};

const CPUTDPComponent: FC = () => {
  const [tdpEnable, setTDPEnable] = useState<boolean>(Settings.appTDPEnable());
  const [tdp, setTDP] = useState<number>(Settings.appTDP());
  const [disabled, setDisable] = useState<boolean>(
    Settings.appGPUMode() == GPUMODE.AUTO
  );
  const [forceShow, setForceShow] = useState<boolean>(
    Settings.appForceShowTDP()
  );
  const [enableCustomTDPRange, setEnableCustomTDPRange] = useState<boolean>(
    Settings.appEnableCustomTDPRange()
  );
  const [customTDPRangeMax, setCustomTDPRangeMax] = useState<number>(
    Settings.appCustomTDPRangeMax()
  );
  const [customTDPRangeMin, setCustomTDPRangeMin] = useState<number>(
    Settings.appCustomTDPRangeMin()
  );

  // 隐藏强制显示TDP开关, 并默认显示 TDP 控制组件。新版 Steam 客户端临时方案
  const [hideForceShowSwitch, _] = useState<boolean>(
    Backend.data.getForceShowTDP()
  );

  // const minSteamVersion = 1714854927;

  const refresh = () => {
    setTDPEnable(Settings.appTDPEnable());
    setDisable(Settings.appGPUMode() == GPUMODE.AUTO);
    setEnableCustomTDPRange(Settings.appEnableCustomTDPRange());
    setCustomTDPRangeMax(Settings.appCustomTDPRangeMax());
    setCustomTDPRangeMin(Settings.appCustomTDPRangeMin());
    setForceShow(Settings.appForceShowTDP());

    if (enableCustomTDPRange) {
      setTDP(Math.min(Settings.appTDP(), customTDPRangeMax));
    } else {
      setTDP(Settings.appTDP());
    }
  };
  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_TDP,
      [
        ComponentName.CPU_TDP,
        ComponentName.GPU_FREQMODE,
        ComponentName.CUSTOM_TDP,
      ],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
  }, []);

  const _showTdp =
    !PluginManager.isPatchSuccess(Patch.TDPPatch) ||
    forceShow ||
    hideForceShowSwitch;
  console.log(
    `>>>>>>>> Hide Force Show Switch: ${hideForceShowSwitch}, Show TDP: ${_showTdp}`
  );

  return (
    <>
      {!hideForceShowSwitch && (
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(
              localizeStrEnum.FORCE_SHOW_TDP
            )}
            description={localizationManager.getString(
              localizeStrEnum.FORCE_SHOW_TDP_DESC
            )}
            checked={forceShow || !PluginManager.isPatchSuccess(Patch.TDPPatch)}
            onChange={(value) => {
              Settings.setForceShowTDP(value);
            }}
          />
        </PanelSectionRow>
      )}
      {_showTdp && (
        <>
          <PanelSectionRow>
            <ToggleField
              label={localizationManager.getString(localizeStrEnum.TDP)}
              description={localizationManager.getString(
                localizeStrEnum.TDP_DESC
              )}
              checked={tdpEnable}
              disabled={disabled}
              onChange={(value) => {
                Settings.setTDPEnable(value);
              }}
            />
          </PanelSectionRow>
          {tdpEnable && (
            <PanelSectionRow>
              <SlowSliderField
                label="TDP"
                value={tdp}
                valueSuffix=" W"
                step={1}
                max={
                  enableCustomTDPRange
                    ? customTDPRangeMax
                    : Backend.data.getTDPMax()
                }
                min={enableCustomTDPRange ? customTDPRangeMin : 3}
                disabled={disabled}
                showValue={true}
                onChangeEnd={(value: number) => {
                  Settings.setTDP(value);
                }}
              />
            </PanelSectionRow>
          )}
        </>
      )}
    </>
  );
};

const CPUGovernorComponent: FC = () => {
  const [governor, setGovernor] = useState<string>(Settings.appCPUGovernor());
  const [availableGovernors, setAvailableGovernors] = useState<string[]>([]);

  const refresh = () => {
    setGovernor(Settings.appCPUGovernor());
    if (Backend.data.HasAvailableGovernors()) {
      setAvailableGovernors(Backend.data.getAvailableGovernors());
    }
  };

  // 初始化和监听设置变化
  useEffect(() => {
    refresh();
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_GOVERNOR,
      [
        ComponentName.CPU_GOVERNOR,
        ComponentName.CPU_TDP,
        ComponentName.CPU_BOOST,
      ],
      (_ComponentName, updateType) => {
        if (updateType === UpdateType.UPDATE) {
          refresh();
        }
      }
    );
  }, []);

  if (
    !Backend.data.HasAvailableGovernors() ||
    availableGovernors.length === 0
  ) {
    return null;
  }

  return (
    <div>
      <PanelSectionRow>
        <DropdownItem
          label={localizationManager.getString(localizeStrEnum.CPU_GOVERNOR)}
          description={localizationManager.getString(
            localizeStrEnum.CPU_GOVERNOR_DESC
          )}
          menuLabel={localizationManager.getString(
            localizeStrEnum.CPU_GOVERNOR
          )}
          rgOptions={availableGovernors.map((gov) => ({
            data: gov,
            label: gov.charAt(0).toUpperCase() + gov.slice(1),
          }))}
          selectedOption={governor}
          onChange={(value) => {
            Settings.setCPUGovernor(value.data);
          }}
        />
      </PanelSectionRow>
    </div>
  );
};

export const CPUEPPComponent: FC = () => {
  const [epp, setEPP] = useState<string>(Settings.appEPPMode());
  const [eppModes, setEPPModes] = useState<string[]>([]);

  const refresh = () => {
    setEPP(Settings.appEPPMode());
    if (Backend.data.hasEPPModes()) {
      setEPPModes(Backend.data.getEPPModes());
    }
  };

  // 初始化和监听设置变化
  useEffect(() => {
    refresh();
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_EPP,
      [
        ComponentName.CPU_EPP,
        ComponentName.CPU_GOVERNOR,
        ComponentName.CPU_TDP,
        ComponentName.CPU_BOOST,
      ],
      (_ComponentName, updateType) => {
        if (updateType === UpdateType.UPDATE) {
          refresh();
        }
      }
    );
  }, []);

  if (!Backend.data.hasEPPModes() || eppModes.length === 0) {
    return null;
  }

  return (
    <div>
      <PanelSectionRow>
        <DropdownItem
          label={localizationManager.getString(localizeStrEnum.CPU_EPP)}
          description={localizationManager.getString(
            localizeStrEnum.CPU_EPP_DESC
          )}
          menuLabel={localizationManager.getString(localizeStrEnum.CPU_EPP)}
          rgOptions={eppModes.map((mode) => ({
            data: mode,
            label: mode.charAt(0).toUpperCase() + mode.slice(1),
          }))}
          selectedOption={epp}
          onChange={(value) => {
            Settings.setEPP(value.data);
          }}
        />
      </PanelSectionRow>
    </div>
  );
};

export const CPUComponent: FC = () => {
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());

  const [isSpportSMT, setIsSpportSMT] = useState<boolean>(
    Settings.appIsSupportSMT()
  );
  useEffect(() => {
    setIsSpportSMT(Settings.appIsSupportSMT());
  }, []);

  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_ALL,
      [ComponentName.CPU_ALL],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.HIDE: {
            hide(true);
            break;
          }
          case UpdateType.SHOW: {
            hide(false);
            break;
          }
        }
      }
    );
  }, []);
  return (
    <div>
      {show && (
        <PanelSection title="CPU">
          <CPUBoostComponent />
          {isSpportSMT && <CPUSmtComponent />}
          <CPUGovernorComponent />
          {/* {Backend.data.hasEPPModes() && <CPUEPPComponent />} */}
          <CPUNumComponent />
          <CPUTDPComponent />
          <CustomTDPComponent />
          <CPUPerformancePerfComponent />
        </PanelSection>
      )}
    </div>
  );
};
