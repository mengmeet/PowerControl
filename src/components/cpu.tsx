import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  DropdownItem,
  ButtonItem,
} from "@decky/ui";
import { useEffect, useState, FC, useMemo } from "react";
import {
  Settings,
  Backend,
  PluginManager,
  ComponentName,
  UpdateType,
  GPUMODE,
} from "../util";
import { localizeStrEnum, localizationManager } from "../i18n";
import { SlowSliderField } from "./SlowSliderField";
import { CustomTDPComponent } from ".";
import { RiArrowDownSFill, RiArrowUpSFill } from "react-icons/ri";

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
  const [cpuVendor, setCpuVendor] = useState<string>(
    Backend.data.getCpuVendor()
  );
  const refresh = () => {
    setCPUSmt(Settings.appSmt());
    setCpuVendor(Backend.data.getCpuVendor());
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
          label={cpuVendor == "GenuineIntel" ? "Hyper-Threading" : "SMT"}
          description={
            cpuVendor == "GenuineIntel"
              ? localizationManager.getString(localizeStrEnum.HT_DESC)
              : localizationManager.getString(localizeStrEnum.SMT_DESC)
          }
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
  const [autoPerf, setAutoPerf] = useState<boolean>(
    Settings.appAutoCPUMaxPct()
  );
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
              label={localizationManager.getString(
                localizeStrEnum.CPU_MAX_PERF_AUTO
              )}
              checked={autoPerf}
              onChange={(val) => {
                Settings.setAutoCPUMaxPct(val);
              }}
            />
          </PanelSectionRow>
          {!autoPerf && (
            <PanelSectionRow>
              <SlowSliderField
                label={localizationManager.getString(
                  localizeStrEnum.CPU_MAX_PERF
                )}
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
            </PanelSectionRow>
          )}
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
  // const [forceShow, setForceShow] = useState<boolean>(
  //   Settings.appForceShowTDP()
  // );
  const [enableCustomTDPRange, setEnableCustomTDPRange] = useState<boolean>(
    Settings.appEnableCustomTDPRange()
  );
  const [customTDPRangeMax, setCustomTDPRangeMax] = useState<number>(
    Settings.appCustomTDPRangeMax()
  );
  const [customTDPRangeMin, setCustomTDPRangeMin] = useState<number>(
    Settings.appCustomTDPRangeMin()
  );
  const [enableNativeTDPSlider, setEnableNativeTDPSlider] = useState<boolean>(
    Settings.appEnableNativeTDPSlider()
  );

  // const [cpuVendor, _] = useState<string>(Backend.data.getCpuVendor());
  // const cpuVendor = useMemo(() => {
  //   return Backend.data.getCpuVendor();
  // }, []);

  const supportsSteamosManager = useMemo(() => {
    return Backend.data.getSupportsSteamosManager();
  }, []);

  const refresh = () => {
    setTDPEnable(Settings.appTDPEnable());
    setDisable(Settings.appGPUMode() == GPUMODE.AUTO);
    setEnableCustomTDPRange(Settings.appEnableCustomTDPRange());
    setCustomTDPRangeMax(Settings.appCustomTDPRangeMax());
    setCustomTDPRangeMin(Settings.appCustomTDPRangeMin());
    // setForceShow(Settings.appForceShowTDP());
    setEnableNativeTDPSlider(Settings.appEnableNativeTDPSlider());

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

  // const _showTdp =
  //   !PluginManager.isPatchSuccess(Patch.TDPPatch) ||
  //   forceShow
  // console.log(
  //   `>>>>>>>> Show TDP: ${_showTdp}`
  // );

  return (
    <>
      {(!enableNativeTDPSlider || !supportsSteamosManager) && (
        <>
          {(tdpEnable || enableNativeTDPSlider) && (
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
        </>
      )}
      {/* {cpuVendor == "AuthenticAMD" && !supportsSteamosManager && (
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(
              localizeStrEnum.NATIVE_TDP_SLIDER
            )}
            description={localizationManager.getString(
              localizeStrEnum.NATIVE_TDP_SLIDER_DESC
            )}
            checked={enableNativeTDPSlider}
            onChange={(value) => {
              Settings.setEnableNativeTDPSlider(value);
            }}
          />
        </PanelSectionRow>
      )} */}
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
      {governor != "performance" && <CPUEPPComponent />}
      {/* <CPUEPPComponent /> */}
    </div>
  );
};

export const CPUEPPComponent: FC = () => {
  const [epp, setEPP] = useState<string>(Settings.appEPPMode());
  const [eppModes, setEPPModes] = useState<string[]>(Backend.data.getEPPModes());

  const refresh = () => {
    setEPP(Settings.appEPPMode());
    const updateEPPModes = async () => {
      await Backend.data.refreshEPPModes();
      if (Backend.data.hasEPPModes()) {
        setEPPModes(Backend.data.getEPPModes());
      }
    };
    updateEPPModes();
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

  // if (!Backend.data.hasEPPModes() || eppModes.length === 0) {
  //   return null;
  // }

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

const CPUFreqControlComponent: FC = () => {
  const [freqControlEnable, setFreqControlEnable] = useState<boolean>(
    Settings.appCpuFreqControlEnable()
  );
  const coreInfo = Backend.data.getCpuCoreInfo();

  const refresh = () => {
    setFreqControlEnable(Settings.appCpuFreqControlEnable());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_FREQ_CONTROL,
      [ComponentName.CPU_FREQ_CONTROL],
      (_ComponentName, updateType) => {
        if (updateType === UpdateType.UPDATE) {
          refresh();
        }
      }
    );
  }, []);

  // 处理频率变化，使用SlowSliderField的内置延迟
  const handleFreqChange = (coreType: string, freq: number) => {
    Settings.setCpuCoreFreq(coreType, freq * 1000); // 转换为kHz
  };

  // 验证频率范围有效性
  const validateFreqRange = (typeInfo: any) => {
    return typeInfo && 
           typeInfo.min_freq_khz > 0 && 
           typeInfo.max_freq_khz > typeInfo.min_freq_khz;
  };

  // 验证CPU信息有效性
  if (!Backend.data.hasCpuCoreInfo() || !coreInfo.core_types || Object.keys(coreInfo.core_types).length === 0) {
    return null;
  }

  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.CPU_FREQ_CONTROL)}
          checked={freqControlEnable}
          onChange={(value) => {
            Settings.setCpuFreqControlEnable(value);
          }}
        />
      </PanelSectionRow>
      
      {freqControlEnable && (
        <>
          {coreInfo.is_heterogeneous ? (
            // 异构CPU：显示各核心类型的控制
            Object.entries(coreInfo.core_types)
              .filter(([_, typeInfo]) => validateFreqRange(typeInfo))
              .map(([coreType, typeInfo]) => (
                <div key={coreType}>
                  <PanelSectionRow>
                    <SlowSliderField
                      label={`${coreType} (${typeInfo.count} cores)`}
                      value={Settings.getCpuCoreFreq(coreType) / 1000 || typeInfo.max_freq_khz / 1000}
                      valueSuffix=" MHz"
                      max={typeInfo.max_freq_khz / 1000}
                      min={typeInfo.min_freq_khz / 1000}
                      step={100}
                      showValue={true}
                      onChangeEnd={(value: number) => handleFreqChange(coreType, value)}
                    />
                  </PanelSectionRow>
                </div>
              ))
          ) : (
            // 传统CPU：显示单一控制
            (() => {
              const allCoreInfo = coreInfo.core_types["All"];
              if (!allCoreInfo || !validateFreqRange(allCoreInfo)) return null;
              
              return (
                <PanelSectionRow>
                  <SlowSliderField
                    label={localizationManager.getString(localizeStrEnum.ALL_CORES)}
                    value={Settings.getCpuCoreFreq("All") / 1000 || allCoreInfo.max_freq_khz / 1000}
                    valueSuffix=" MHz"
                    max={allCoreInfo.max_freq_khz / 1000}
                    min={allCoreInfo.min_freq_khz / 1000}
                    step={100}
                    showValue={true}
                    onChangeEnd={(value: number) => handleFreqChange("All", value)}
                  />
                </PanelSectionRow>
              );
            })()
          )}
        </>
      )}
    </div>
  );
};

export const CPUComponent: FC<{
  isTab?: boolean;
}> = ({ isTab = false }) => {
  const [showCpuMenu, setShowCpuMenu] = useState<boolean>(Settings.showCpuMenu);
  const updateShowCpuMenu = (show: boolean) => {
    setShowCpuMenu(show);
    Settings.showCpuMenu = show;
  };

  const [show, setShow] = useState<boolean>(Settings.ensureEnable());

  const [isSpportSMT, setIsSpportSMT] = useState<boolean>(
    Settings.appIsSupportSMT()
  );
  const [cpuVendor, setCpuVendor] = useState<string>(
    Backend.data.getCpuVendor()
  );
  useEffect(() => {
    setIsSpportSMT(Settings.appIsSupportSMT());
    setCpuVendor(Backend.data.getCpuVendor());
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
    <div style={!isTab ? {} : { marginLeft: "-10px", marginRight: "-10px" }}>
      {show && (
        <PanelSection title="CPU">
          {!isTab && (
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                // @ts-ignore
                style={{
                  height: "20px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={() => updateShowCpuMenu(!showCpuMenu)}
              >
                {showCpuMenu ? <RiArrowUpSFill /> : <RiArrowDownSFill />}
              </ButtonItem>
            </PanelSectionRow>
          )}
          {(isTab || showCpuMenu) && (
            <>
              <CPUTDPComponent />
              {cpuVendor != "GenuineIntel" && <CustomTDPComponent />}
              <CPUBoostComponent />
              {isSpportSMT && <CPUSmtComponent />}
              <CPUGovernorComponent />
              <CPUNumComponent />
              <CPUPerformancePerfComponent />
              <CPUFreqControlComponent />
            </>
          )}
        </PanelSection>
      )}
    </div>
  );
};
