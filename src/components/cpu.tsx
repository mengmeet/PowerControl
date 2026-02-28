import {
  PanelSection,
  PanelSectionRow,
  ToggleField,
  DropdownItem,
  ButtonItem,
  Focusable,
  Field,
} from "@decky/ui";
import { useEffect, useState, FC, useMemo, useCallback } from "react";
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
import { RiArrowDownSFill, RiArrowUpSFill, RiLockFill } from "react-icons/ri";
import { CPULogicalCoreUI, CPUTopologyForUI } from "../types";

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
          disabled={!Backend.data.hasCpuMaxNum()}
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
                    : Backend.data.getTdpMax()
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
    if (Backend.data.hasAvailableGovernors()) {
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
    !Backend.data.hasAvailableGovernors() ||
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
  const [eppModes, setEPPModes] = useState<string[]>(
    Backend.data.getEppModes()
  );

  const refresh = () => {
    setEPP(Settings.appEPPMode());
    const updateEPPModes = async () => {
      await Backend.data.refreshEPPModes();
      if (Backend.data.hasEppModes()) {
        setEPPModes(Backend.data.getEppModes());
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

  // if (!Backend.data.hasEppModes() || eppModes.length === 0) {
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

const CPUSchedExtComponent: FC = () => {
  const [currentScheduler, setCurrentScheduler] = useState<string>(
    Settings.appSchedExtScheduler()
  );
  const [availableSchedulers, setAvailableSchedulers] = useState<string[]>(
    Backend.data.getAvailableSchedExtSchedulers()
  );

  const refresh = () => {
    setCurrentScheduler(Settings.appSchedExtScheduler());
    if (Backend.data.hasSchedExtSupport()) {
      setAvailableSchedulers(Backend.data.getAvailableSchedExtSchedulers());
    }
  };

  // 初始化和监听设置变化
  useEffect(() => {
    refresh();
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_SCHED_EXT,
      [
        ComponentName.CPU_SCHED_EXT,
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

  // 条件渲染：只有在支持且有可用调度器时才显示
  if (!Backend.data.hasSchedExtSupport() || availableSchedulers.length === 0) {
    return null;
  }

  return (
    <div>
      <PanelSectionRow>
        <DropdownItem
          label={localizationManager.getString(localizeStrEnum.CPU_SCHED_EXT)}
          description={localizationManager.getString(
            localizeStrEnum.CPU_SCHED_EXT_DESC
          )}
          menuLabel={localizationManager.getString(
            localizeStrEnum.CPU_SCHED_EXT
          )}
          rgOptions={availableSchedulers.map((sched) => ({
            data: sched,
            label: sched,
          }))}
          selectedOption={currentScheduler}
          onChange={(value) => {
            if (value.data != currentScheduler) {
              Settings.setSchedExtScheduler(value.data);
            }
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

  // 频率格式化：向下取整到100MHz倍数
  const roundTo100MHz = (freqKhz: number): number => {
    return Math.floor(freqKhz / 100000) * 100;
  };

  // 验证频率范围有效性
  const validateFreqRange = (typeInfo: any) => {
    return (
      typeInfo &&
      typeInfo.min_freq_khz > 0 &&
      typeInfo.max_freq_khz > typeInfo.min_freq_khz
    );
  };

  // 生成架构信息描述
  const getArchitectureInfo = (): string => {
    return Object.entries(coreInfo.core_types)
      .map(([type, info]) => `${info.count}×${type}`)
      .join(" + ");
  };

  // 验证CPU信息有效性
  if (
    !Backend.data.hasCpuCoreInfo() ||
    !coreInfo.core_types ||
    Object.keys(coreInfo.core_types).length === 0
  ) {
    return null;
  }

  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(
            localizeStrEnum.CPU_FREQ_CONTROL
          )}
          description={localizationManager.getString(
            localizeStrEnum.CPU_FREQ_CONTROL_DESC,
            {
              architecture: getArchitectureInfo(),
            }
          )}
          checked={freqControlEnable}
          onChange={(value) => {
            Settings.setCpuFreqControlEnable(value);
          }}
        />
      </PanelSectionRow>

      {freqControlEnable && (
        <>
          {/* 统一处理所有核心类型 */}
          {Object.entries(coreInfo.core_types)
            .filter(([_, typeInfo]) => validateFreqRange(typeInfo))
            .map(([coreType, typeInfo]) => (
              <div key={coreType}>
                <PanelSectionRow>
                  <SlowSliderField
                    label={coreType}
                    value={
                      Settings.getCpuCoreFreq(coreType) / 1000 ||
                      roundTo100MHz(typeInfo.max_freq_khz)
                    }
                    valueSuffix=" MHz"
                    max={roundTo100MHz(typeInfo.max_freq_khz)}
                    min={roundTo100MHz(typeInfo.min_freq_khz)}
                    step={100}
                    showValue={true}
                    onChangeEnd={(value: number) =>
                      handleFreqChange(coreType, value)
                    }
                  />
                </PanelSectionRow>
              </div>
            ))}
        </>
      )}
    </div>
  );
};

const CPURyzenadjUndervoltComponent: FC = () => {
  const [enabled, setEnabled] = useState<boolean>(
    Settings.appEnableRyzenadjUndervolt()
  );
  const [value, setValue] = useState<number>(
    Settings.appRyzenadjUndervoltValue()
  );
  const [isAMD] = useState<boolean>(
    Backend.data.getCpuVendor() === "AuthenticAMD"
  );
  const [supported, setSupported] = useState<boolean>(
    Backend.data.getSupportsRyzenadjCoall()
  );

  const refresh = () => {
    setEnabled(Settings.appEnableRyzenadjUndervolt());
    setValue(Settings.appRyzenadjUndervoltValue());
  };

  useEffect(() => {
    // Update supported state based on Backend.data
    setSupported(Backend.data.getSupportsRyzenadjCoall());

    PluginManager.listenUpdateComponent(
      ComponentName.CPU_RYZENADJ_UNDERVOLT,
      [ComponentName.CPU_RYZENADJ_UNDERVOLT],
      (_ComponentName, updateType) => {
        if (updateType === UpdateType.UPDATE) {
          refresh();
        }
      }
    );
  }, [isAMD]);

  // Don't show component if not AMD or not supported
  if (!isAMD || !supported) {
    return null;
  }

  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(
            localizeStrEnum.RYZENADJ_UNDERVOLT_ENABLE
          )}
          description={localizationManager.getString(
            localizeStrEnum.RYZENADJ_UNDERVOLT_ENABLE_DESC
          )}
          checked={enabled}
          onChange={(val) => {
            Settings.setEnableRyzenadjUndervolt(val);
          }}
        />
      </PanelSectionRow>

      {enabled && (
        <PanelSectionRow>
          <SlowSliderField
            label={localizationManager.getString(
              localizeStrEnum.RYZENADJ_UNDERVOLT_VALUE
            )}
            description={localizationManager.getString(
              localizeStrEnum.RYZENADJ_UNDERVOLT_VALUE_DESC
            )}
            value={value}
            step={1}
            max={30}
            min={0}
            showValue={true}
            onChangeEnd={(val: number) => {
              Settings.setRyzenadjUndervoltValue(val);
            }}
          />
        </PanelSectionRow>
      )}
    </div>
  );
};

const CELL_SIZE = 32;
const CELL_GAP = 8;
const CELL_ROW_GAP = 4;

const CoreCell: FC<{
  key?: React.Key;
  core: CPULogicalCoreUI;
  isOnline: boolean;
  onToggle: (logicalId: number) => void;
}> = ({ core, isOnline, onToggle }) => {
  const locked = !core.can_offline && isOnline;

  return (
    // @ts-ignore
    <Focusable
      onActivate={() => {
        if (!locked) onToggle(core.logical_id);
      }}
      noFocusRing={true}
      focusClassName="core-cell-focused"
      style={{
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
        minWidth: `${CELL_SIZE}px`,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "bold",
        cursor: locked ? "not-allowed" : "pointer",
        border: core.is_smt_thread ? "2px dashed" : "2px solid",
        borderColor: locked
          ? "rgba(180, 160, 60, 0.8)"
          : isOnline
            ? "rgba(59, 130, 246, 0.8)"
            : "rgba(100, 100, 100, 0.5)",
        backgroundColor: locked
          ? "rgba(180, 160, 60, 0.25)"
          : isOnline
            ? "rgba(59, 130, 246, 0.35)"
            : "rgba(60, 60, 60, 0.3)",
        color: locked ? "#c8b840" : isOnline ? "#e0e0e0" : "#666",
        opacity: core.is_smt_thread ? 0.8 : 1,
        transition: "all 0.15s ease",
        position: "relative",
      }}
      onClick={() => {
        if (!locked) onToggle(core.logical_id);
      }}
    >
      {locked ? <RiLockFill size={14} /> : core.logical_id}
    </Focusable>
  );
};

const CPUCoreSelectionComponent: FC = () => {
  const [enabled, setEnabled] = useState<boolean>(
    Settings.appCoreSelectionEnabled()
  );
  const topology: CPUTopologyForUI = Backend.data.getCpuTopologyForUI();
  const [selection, setSelection] = useState<Set<number>>(() => {
    const saved = Settings.appCpuCoreSelection();
    if (saved.length > 0) return new Set(saved);
    return new Set(topology.cores.map((c) => c.logical_id));
  });

  const refresh = useCallback(() => {
    setEnabled(Settings.appCoreSelectionEnabled());
    const saved = Settings.appCpuCoreSelection();
    if (saved.length > 0) {
      setSelection(new Set(saved));
    }
  }, []);

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_CORE_SELECTION,
      [ComponentName.CPU_CORE_SELECTION],
      (_ComponentName, updateType) => {
        if (updateType === UpdateType.UPDATE) {
          refresh();
        }
      }
    );
  }, []);

  const coresByType = useMemo(() => {
    const grouped: Record<string, {
      primary: CPULogicalCoreUI[];
      smt: CPULogicalCoreUI[];
    }> = {};

    for (const coreType of topology.core_types) {
      grouped[coreType] = { primary: [], smt: [] };
    }
    if (!grouped["Unknown"]) {
      grouped["Unknown"] = { primary: [], smt: [] };
    }

    for (const core of topology.cores) {
      const type = core.core_type in grouped ? core.core_type : "Unknown";
      if (core.is_smt_thread) {
        grouped[type].smt.push(core);
      } else {
        grouped[type].primary.push(core);
      }
    }

    return Object.entries(grouped).filter(
      ([_, group]) => group.primary.length > 0 || group.smt.length > 0
    );
  }, [topology]);

  const handleToggle = useCallback(
    (logicalId: number) => {
      setSelection((prev) => {
        const next = new Set(prev);
        if (next.has(logicalId)) {
          next.delete(logicalId);
          next.add(0);
        } else {
          next.add(logicalId);
        }
        if (next.size === 0) next.add(0);
        const arr = Array.from(next).sort((a, b) => a - b);
        Settings.setCpuCoreSelection(arr);
        return next;
      });
    },
    []
  );

  if (!topology.cores.length) return null;

  const gridStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    columnGap: `${CELL_GAP}px`,
    rowGap: `${CELL_ROW_GAP}px`,
    padding: `${CELL_GAP}px 0`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#888",
    marginTop: "8px",
    marginBottom: "2px",
  };

  return (
    <div>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.CORE_SELECTION)}
          description={localizationManager.getString(
            localizeStrEnum.CORE_SELECTION_DESC
          )}
          checked={enabled}
          onChange={(val) => {
            Settings.setCoreSelectionEnabled(val);
          }}
        />
      </PanelSectionRow>

      {enabled && (
        <>
          <style>{`
            .core-cell-focused {
              transform: scale(1.15);
              outline: 2px solid #fff !important;
              outline-offset: 1px;
              box-shadow: 0 0 8px rgba(255, 255, 255, 0.7) !important;
              z-index: 1;
            }
          `}</style>
          <Field childrenLayout="below" highlightOnFocus={false}>
            {coresByType.map(([coreType, group]) => (
              <div key={coreType}>
                {topology.core_types.length > 1 && (
                  <div style={labelStyle}>{coreType}</div>
                )}
                {/* @ts-ignore */}
                <Focusable style={gridStyle}>
                  {group.primary.map((core) => (
                    <CoreCell
                      key={core.logical_id}
                      core={core}
                      isOnline={selection.has(core.logical_id)}
                      onToggle={handleToggle}
                    />
                  ))}
                </Focusable>
                {group.smt.length > 0 && (
                  <>
                    {/* @ts-ignore */}
                    <Focusable style={gridStyle}>
                      {group.smt.map((core) => (
                        <CoreCell
                          key={core.logical_id}
                          core={core}
                          isOnline={selection.has(core.logical_id)}
                          onToggle={handleToggle}
                        />
                      ))}
                    </Focusable>
                  </>
                )}
              </div>
            ))}
          </Field>
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
  const [coreSelectionEnabled, setCoreSelectionEnabled] = useState<boolean>(
    Settings.appCoreSelectionEnabled()
  );
  useEffect(() => {
    setIsSpportSMT(Settings.appIsSupportSMT());
    setCpuVendor(Backend.data.getCpuVendor());
  }, []);

  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };

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
    PluginManager.listenUpdateComponent(
      ComponentName.CPU_NUM,
      [ComponentName.CPU_CORE_SELECTION],
      (_ComponentName, updateType) => {
        if (updateType === UpdateType.UPDATE) {
          setCoreSelectionEnabled(Settings.appCoreSelectionEnabled());
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
              {cpuVendor != "GenuineIntel" && !Backend.data.getSupportsNativeTdpLimit() && <CustomTDPComponent />}
              <CPUBoostComponent />
              {!coreSelectionEnabled && isSpportSMT && <CPUSmtComponent />}
              <CPUGovernorComponent />
              <CPUSchedExtComponent />
              {!coreSelectionEnabled && <CPUNumComponent />}
              <CPUCoreSelectionComponent />
              <CPUPerformancePerfComponent />
              <CPUFreqControlComponent />
              <CPURyzenadjUndervoltComponent />
            </>
          )}
        </PanelSection>
      )}
    </div>
  );
};
