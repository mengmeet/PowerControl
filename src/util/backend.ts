import { APPLYTYPE, FAN_PWM_MODE, FANMODE, GPUMODE, Patch } from "./enum";
import { FanControl, PluginManager } from "./pluginMain";
import { FanSetting, Settings, SettingsData } from "./settings";
import {
  DEFAULT_TDP_MAX,
  DEFAULT_TDP_MIN,
  FanPosition,
  QAMPatch,
  SteamUtils,
  SystemInfo,
} from ".";
import { JsonSerializer } from "typescript-json-serializer";
import { callable } from "@decky/api";
import { Logger } from "./logger";
import { CPUCoreInfo } from "../types/cpu";
const serializer = new JsonSerializer();

// Backend API callable functions
export const getCpuMaxNum = callable<[], number>("get_cpuMaxNum");
export const getTdpMax = callable<[], number>("get_tdpMax");
export const getGpuFreqRange = callable<[], number[]>("get_gpuFreqRange");
export const getFanConfigList = callable<[], []>("get_fanConfigList");
export const getIsSupportSMT = callable<[], boolean>("get_isSupportSMT");
export const getVersion = callable<[], string>("get_version");
export const getAvailableGovernors = callable<[], string[]>("get_available_governors");
export const isEppSupported = callable<[], boolean>("is_epp_supported");
export const getEppModes = callable<[], string[]>("get_epp_modes");
export const getCurrentEpp = callable<[], string | null>("get_current_epp");
export const getCpuVendor = callable<[], string>("get_cpu_vendor");
export const supportsBypassCharge = callable<[], boolean>("supports_bypass_charge");
export const supportsChargeLimit = callable<[], boolean>("supports_charge_limit");
export const supportsResetChargeLimit = callable<[], boolean>("supports_reset_charge_limit");
export const softwareChargeLimit = callable<[], boolean>("software_charge_limit");
export const supportsSchedExt = callable<[], boolean>("supports_sched_ext");
export const getSchedExtList = callable<[], string[]>("get_sched_ext_list");
export const getCurrentSchedExtScheduler = callable<[], string>("get_current_sched_ext_scheduler");
export const getCpuCoreInfo = callable<[], CPUCoreInfo>("get_cpu_core_info");
export const getCpuGovernor = callable<[], string>("get_cpu_governor");
export const getFanRPM = callable<[number], number>("get_fanRPM");
export const getFanTemp = callable<[number], number>("get_fanTemp");
export const getFanIsAuto = callable<[number], boolean>("get_fanIsAuto");
export const setSmt = callable<[boolean], void>("set_smt");
export const setCpuOnline = callable<[number], void>("set_cpuOnline");
export const setCpuBoost = callable<[boolean], void>("set_cpuBoost");
export const setCpuTDP = callable<[number], void>("set_cpuTDP");
export const setCpuTDPUnlimited = callable<[], void>("set_cpuTDP_unlimited");
export const setGpuFreq = callable<[number], void>("set_gpuFreq");
export const setGpuFreqRange = callable<[number, number], void>("set_gpuFreqRange");
export const setGpuAuto = callable<[boolean], void>("set_gpuAuto");
export const setGpuAutoFreqRange = callable<[number, number], void>("set_gpuAutoFreqRange");
export const setFanAuto = callable<[number, boolean], void>("set_fanAuto");
export const setFanPercent = callable<[number, number], void>("set_fanPercent");
export const setFanCurve = callable<[number, number[], number[]], void>("set_fanCurve");
export const receiveSuspendEvent = callable<[], void>("receive_suspendEvent");
export const getLatestVersion = callable<[], string>("get_latest_version");
export const updateLatest = callable<[], any>("update_latest");
export const fixGpuFreqSlider = callable<[], any>("fix_gpuFreqSlider");
export const getRyzenadjInfo = callable<[], string>("get_ryzenadj_info");
export const getRaplInfo = callable<[], string>("get_rapl_info");
export const getPowerInfo = callable<[], string>("get_power_info");
export const setSettings = callable<[any], void>("set_settings");
export const getSettings = callable<[], string>("get_settings");
export const getMaxPerfPct = callable<[], number>("get_max_perf_pct");
export const setMaxPerfPct = callable<[number], any>("set_max_perf_pct");
export const setAutoCpumaxPct = callable<[boolean], any>("set_auto_cpumax_pct");
export const setBypassCharge = callable<[boolean], any>("set_bypass_charge");
export const getBypassCharge = callable<[], boolean>("get_bypass_charge");
export const setChargeLimit = callable<[number], any>("set_charge_limit");
export const resetChargeLimit = callable<[], any>("reset_charge_limit");
export const setSchedExtScheduler = callable<[string, string], boolean>("set_sched_ext_scheduler");
export const setCpuGovernorCallable = callable<[string], boolean>("set_cpu_governor");
export const setEpp = callable<[string], boolean>("set_epp");
export const logInfo = callable<[string], any>("log_info");
export const logError = callable<[string], any>("log_error");
export const logWarn = callable<[string], any>("log_warn");
export const logDebug = callable<[string], any>("log_debug");
export const setCpuFreqByCoreType = callable<[Record<string, number>], boolean>("set_cpu_freq_by_core_type");
export const startGpuNotify = callable<[], any>("start_gpu_notify");
export const stopGpuNotify = callable<[], any>("stop_gpu_notify");
export const checkFileExist = callable<[string], boolean>("check_file_exist");

const minSteamVersion = 1714854927;

export class BackendData {
  private cpuMaxNum = 0;
  private has_cpuMaxNum = false;
  private isSupportSMT = false;
  private has_isSupportSMT = false;
  private tdpMax = 0;
  private has_tdpMax = false;
  private gpuMax = 0;
  private has_gpuMax = false;
  private gpuMin = 0;
  private has_gpuMin = false;
  private fanConfigs: any[] = [];
  private has_fanConfigs = false;
  private current_version = "";
  private latest_version = "";
  private supportCPUMaxPct = false;
  private systemInfo: SystemInfo | undefined;
  private availableGovernors: string[] = [];
  private has_availableGovernors = false;
  private currentGovernor: string = "";
  private has_currentGovernor = false;
  private isEppSupported = false;
  private has_isEppSupported = false;
  private eppModes: string[] = [];
  private has_eppModes = false;
  private currentEpp: string | null = null;
  private has_currentEpp = false;
  private cpuVendor: string = "";
  private has_cpuVendor = false;
  private cpuCoreInfo: CPUCoreInfo = {
    is_heterogeneous: false,
    vendor: "Unknown",
    architecture_summary: "Traditional Architecture",
    core_types: {}
  };
  private has_cpuCoreInfo = false;
  private supportsBypassCharge = false;
  private has_supportsBypassCharge = false;
  private supportsChargeLimit = false;
  private has_supportsChargeLimit = false;
  private supportsResetChargeLimit = false;
  private has_supportsResetChargeLimit = false;
  private supportsSoftwareChargeLimit = false;
  private has_supportsSoftwareChargeLimit = false;
  private supportsSteamosManager = false;
  private has_supportsSteamosManager = false;
  private schedExtSupport = false;
  private has_schedExtSupport = false;
  private availableSchedExtSchedulers: string[] = [];
  private has_availableSchedExtSchedulers = false;
  private currentSchedExtScheduler: string = "";
  private has_currentSchedExtScheduler = false;

  public async init() {
    await getCpuMaxNum().then((res) => {
      // console.info("cpuMaxNum = " + res.result);
      this.cpuMaxNum = res;
      this.has_cpuMaxNum = true;
    }).catch((err) => {
      console.error("获取 CPU 最大核心数失败:", err);
      logError(`获取 CPU 最大核心数失败: ${err}`);
      this.cpuMaxNum = 0;
      this.has_cpuMaxNum = false;
    });
    await getTdpMax().then((res) => {
      this.tdpMax = res;
      this.has_tdpMax = true;
    }).catch((err) => {
      console.error("获取 TDP 最大值失败:", err);
      logError(`获取 TDP 最大值失败: ${err}`);
    });
    await getGpuFreqRange().then((res) => {
      this.gpuMin = res[0];
      this.gpuMax = res[1];
      this.has_gpuMin = true;
      this.has_gpuMax = true;
    }).catch((err) => {
      console.error("获取 GPU 频率范围失败:", err);
      logError(`获取 GPU 频率范围失败: ${err}`);
    });
    await getFanConfigList().then((res) => {
      this.fanConfigs = res;
      this.has_fanConfigs = res.length > 0;
    }).catch((err) => {
      console.error("获取风扇配置列表失败:", err);
    });

    await getIsSupportSMT().then((res) => {
      this.isSupportSMT = res;
      this.has_isSupportSMT = true;
    }).catch((err) => {
      console.error("获取 SMT 支持失败:", err);
      logError(`获取 SMT 支持失败: ${err}`);
    });

    getMaxPerfPct().then((value) => {
      this.supportCPUMaxPct = value > 0;
    }).catch((err) => {
      console.error("获取 CPU 最大性能百分比支持失败:", err);
      logError(`获取 CPU 最大性能百分比支持失败: ${err}`);
    });

    await getVersion().then((res) => {
      this.current_version = res;
    }).catch((err) => {
      console.error("获取当前版本失败:", err);
      logError(`获取当前版本失败: ${err}`);
    });

    SteamUtils.getSystemInfo().then((systemInfo) => {
      this.systemInfo = systemInfo;
    }).catch((err) => {
      console.error("获取系统信息失败:", err);
      logError(`获取系统信息失败: ${err}`);
    });

    await getAvailableGovernors()
      .then((res) => {
        this.availableGovernors = res;
        this.has_availableGovernors = true;
      })
      .catch((err) => {
        console.error("获取可用 CPU 调度器失败:", err);
        logError(`获取可用 CPU 调度器失败: ${err}`);
        this.availableGovernors = [];
        this.has_availableGovernors = false;
      });

    await isEppSupported()
      .then((res) => {
        this.isEppSupported = res;
        this.has_isEppSupported = true;
      })
      .catch((err) => {
        console.error("检查 EPP 支持失败:", err);
        logError(`检查 EPP 支持失败: ${err}`);
        this.isEppSupported = false;
        this.has_isEppSupported = false;
      });

    await getEppModes()
      .then((res) => {
        this.eppModes = res;
        this.has_eppModes = true;
      })
      .catch((err) => {
        console.error("获取可用 EPP 模式失败:", err);
        logError(`获取可用 EPP 模式失败: ${err}`);
        this.eppModes = [];
        this.has_eppModes = false;
      });

    await getCurrentEpp()
      .then((res) => {
        this.currentEpp = res;
        this.has_currentEpp = true;
      })
      .catch((err) => {
        console.error("获取当前 EPP 模式失败:", err);
        logError(`获取当前 EPP 模式失败: ${err}`);
        this.currentEpp = null;
        this.has_currentEpp = false;
      });

    await getCpuVendor()
      .then((res) => {
        this.cpuVendor = res;
        this.has_cpuVendor = true;
      })
      .catch((err) => {
        console.error("获取 CPU 厂商失败:", err);
        logError(`获取 CPU 厂商失败: ${err}`);
        this.cpuVendor = "";
        this.has_cpuVendor = false;
      });

    await supportsBypassCharge()
      .then((res) => {
        this.supportsBypassCharge = res;
        this.has_supportsBypassCharge = true;
      })
      .catch((err) => {
        console.error("检查 BYPASS_CHARGE 支持失败:", err);
        logError(`检查 BYPASS_CHARGE 支持失败: ${err}`);
        this.supportsBypassCharge = false;
        this.has_supportsBypassCharge = false;
      });

    await supportsChargeLimit()
      .then((res) => {
        this.supportsChargeLimit = res;
        this.has_supportsChargeLimit = true;
      })
      .catch((err) => {
        console.error("检查 CHARGE_LIMIT 支持失败:", err);
        logError(`检查 CHARGE_LIMIT 支持失败: ${err}`);
        this.supportsChargeLimit = false;
        this.has_supportsChargeLimit = false;
      });

    await supportsResetChargeLimit()
      .then((res) => {
        this.supportsResetChargeLimit = res;
        this.has_supportsResetChargeLimit = true;
      })
      .catch((err) => {
        console.error("检查 RESET_CHARGE_LIMIT 支持失败:", err);
        logError(`检查 RESET_CHARGE_LIMIT 支持失败: ${err}`);
        this.supportsResetChargeLimit = false;
        this.has_supportsResetChargeLimit = false;
      });

    await softwareChargeLimit()
      .then((res) => {
        this.supportsSoftwareChargeLimit = res;
        this.has_supportsSoftwareChargeLimit = true;
      })
      .catch((err) => {
        console.error("检查 SOFTWARE_CHARGE_LIMIT 支持失败:", err);
        logError(`检查 SOFTWARE_CHARGE_LIMIT 支持失败: ${err}`);
        this.supportsSoftwareChargeLimit = false;
        this.has_supportsSoftwareChargeLimit = false;
      });

    await checkFileExist("/usr/bin/steamosctl").then((res) => {
      this.supportsSteamosManager = res;
      this.has_supportsSteamosManager = true;
    }).catch((err) => {
      console.error("检查 steamos-manager 支持失败:", err);
      logError(`检查 steamos-manager 支持失败: ${err}`);
      this.supportsSteamosManager = false;
      this.has_supportsSteamosManager = false;
    });

    // 初始化 SCX 调度器相关
    await supportsSchedExt()
      .then((res) => {
        this.schedExtSupport = res;
        this.has_schedExtSupport = true;
      })
      .catch((err) => {
        console.error("检查 sched_ext 支持失败:", err);
        logError(`检查 sched_ext 支持失败: ${err}`);
        this.schedExtSupport = false;
        this.has_schedExtSupport = false;
      });

    if (this.schedExtSupport) {
      await getSchedExtList()
        .then((res) => {
          this.availableSchedExtSchedulers = res;
          this.has_availableSchedExtSchedulers = true;
        })
        .catch((err) => {
          console.error("获取可用 SCX 调度器列表失败:", err);
          logError(`获取可用 SCX 调度器列表失败: ${err}`);
          this.availableSchedExtSchedulers = [];
          this.has_availableSchedExtSchedulers = false;
        });

      await getCurrentSchedExtScheduler()
        .then((res) => {
          logInfo(`初始化数据, 获取当前 SCX 调度器: ${res}`);
          this.currentSchedExtScheduler = res;
          this.has_currentSchedExtScheduler = true;
        })
        .catch((err) => {
          console.error("获取当前 SCX 调度器失败:", err);
          logError(`获取当前 SCX 调度器失败: ${err}`);
          this.currentSchedExtScheduler = "";
          this.has_currentSchedExtScheduler = false;
        });
    }

    await getCpuCoreInfo()
      .then((res) => {
        this.cpuCoreInfo = res;
        this.has_cpuCoreInfo = true;
      })
      .catch((err) => {
        console.error("获取 CPU 核心信息失败:", err);
        logError(`获取 CPU 核心信息失败: ${err}`);
        this.cpuCoreInfo = {
          is_heterogeneous: false,
          vendor: "Unknown",
          architecture_summary: "Traditional Architecture",
          core_types: {}
        };
        this.has_cpuCoreInfo = false;
      });

    await getCpuGovernor()
      .then((res) => {
        this.currentGovernor = res;
        this.has_currentGovernor = true;
      })
      .catch((err) => {
        console.error("获取当前 CPU 调度器失败:", err);
        logError(`获取当前 CPU 调度器失败: ${err}`);
      });
  }

  // 简单刷新 EPP 模式列表
  public async refreshEPPModes(): Promise<void> {
    await getEppModes()
      .then((res) => {
        this.eppModes = res;
        this.has_eppModes = true;
      })
      .catch((err) => {
        console.error("刷新 EPP 模式失败:", err);
        this.eppModes = [];
        this.has_eppModes = false;
      });
  }

  public getForceShowTDP() {
    // 检查 Steam 客户端版本，如果版本大于等于 minSteamVersion。不显示强制 TDP 开关。并默认显示 TDP 控制组件
    return this.systemInfo!.nSteamVersion >= minSteamVersion;
  }

  public getCpuMaxNum() {
    return this.cpuMaxNum;
  }

  public HasCpuMaxNum() {
    return this.has_cpuMaxNum;
  }

  public getSupportSMT() {
    return this.isSupportSMT;
  }

  public HasSupportSMT() {
    return this.has_isSupportSMT;
  }

  public getTDPMax() {
    return this.tdpMax;
  }

  public getGPUFreqMax() {
    return this.gpuMax;
  }

  public HasGPUFreqMax() {
    return this.has_gpuMax;
  }

  public getGPUFreqMin() {
    return this.gpuMin;
  }

  public HasGPUFreqMin() {
    return this.has_gpuMin;
  }

  public HasTDPMax() {
    return this.has_tdpMax;
  }

  public getFanMAXPRM(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_max_rpm ?? 0;
    }
    return 0;
  }

  public getFanCount() {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.length ?? 0;
    }
    return 0;
  }

  public getFanName(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_name ?? "Fan";
    }
    return "Fan";
  }

  public getFanConfigs() {
    if (this.has_fanConfigs) {
      return this.fanConfigs;
    }
    return [];
  }

  public getFanPwmMode(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_hwmon_mode ?? 0;
    }
    return 0;
  }

  public getFanHwmonDefaultCurve(
    index: number
  ): { speedValue: number; tempValue: number }[] {
    const result: { speedValue: number; tempValue: number }[] = [];
    if (this.has_fanConfigs) {
      const defaultCurve = this.fanConfigs?.[index]?.fan_default_curve ?? [];
      const pwmWriteMax: number =
        this.fanConfigs?.[index]?.fan_pwm_write_max ?? 255;
      // console.log(">>>>>>>>>>> getHwmonDefaultCurve", defaultCurve);
      if (defaultCurve instanceof Array && defaultCurve.length > 0) {
        for (let i = 0; i < defaultCurve.length; i++) {
          const pwmValue = defaultCurve[i]?.pwm_value;
          const tempValue = defaultCurve[i]?.temp_value;
          if (pwmValue !== undefined && tempValue !== undefined) {
            result.push({
              speedValue: Math.round((pwmValue / pwmWriteMax) * 100), // pwmValue 转为百分比整数
              tempValue,
            });
          }
        }
      }
    }
    return result;
  }

  public getDefaultFanSetting(index: number): FanSetting | undefined {
    const defaultFanPoints = this.getFanHwmonDefaultCurve(index);
    if (defaultFanPoints.length > 0) {
      const curvePoints: FanPosition[] = defaultFanPoints.map(
        (point) => new FanPosition(point.tempValue, point.speedValue)
      );
      // console.log(">>>>>>>>>> getHwmonAutoFanSetting", curvePoints);
      return new FanSetting(false, FANMODE.CURVE, 50, curvePoints);
    }
    return undefined;
  }

  public getCurrentVersion() {
    return this.current_version;
  }

  public getLatestVersion() {
    return this.latest_version;
  }

  public getSupportCPUMaxPct() {
    return this.supportCPUMaxPct;
  }

  public HasAvailableGovernors() {
    return this.has_availableGovernors;
  }

  public getAvailableGovernors(): string[] {
    return this.availableGovernors;
  }

  public getCurrentGovernor() {
    return this.currentGovernor;
  }

  public hasCurrentGovernor() {
    return this.has_currentGovernor;
  }

  public hasSchedExtSupport() {
    return this.has_schedExtSupport;
  }

  public getSchedExtSupport() {
    return this.schedExtSupport;
  }

  public hasAvailableSchedExtSchedulers() {
    return this.has_availableSchedExtSchedulers;
  }

  public getAvailableSchedExtSchedulers(): string[] {
    return this.availableSchedExtSchedulers;
  }

  public hasCurrentSchedExtScheduler() {
    return this.has_currentSchedExtScheduler;
  }

  public getCurrentSchedExtScheduler(): string {
    return this.currentSchedExtScheduler;
  }

  public async getFanRPM(index: number) {
    var fanPRM: number = 0;
    await getFanRPM(index)
      .then((res) => {
        fanPRM = res;
      })
      .catch((error) => {
        console.error("get_fanRPM error", error);
      });
    return fanPRM;
  }

  public async getFanTemp(index: number) {
    var fanTemp: number = -1;
    await getFanTemp(index)
      .then((res) => {
        fanTemp = res / 1000;
      })
      .catch((error) => {
        console.error("get_fanTemp error", error);
      });
    return fanTemp;
  }

  public async getFanIsAuto(index: number) {
    var fanIsAuto: boolean = false;
    await getFanIsAuto(index)
      .then((res) => {
        fanIsAuto = res;
      })
      .catch((error) => {
        console.error("get_fanIsAuto error", error);
      });
    return fanIsAuto;
  }

  public isEPPSupported() {
    return this.isEppSupported;
  }

  public hasEPPSupported() {
    return this.has_isEppSupported;
  }

  public getEPPModes() {
    return this.eppModes;
  }

  public hasEPPModes() {
    return this.has_eppModes;
  }

  public getCurrentEPP() {
    return this.currentEpp;
  }

  public hasCurrentEPP() {
    return this.has_currentEpp;
  }

  public getCpuVendor() {
    return this.cpuVendor;
  }

  public hasCpuVendor() {
    return this.has_cpuVendor;
  }

  public getCpuCoreInfo() {
    return this.cpuCoreInfo;
  }

  public hasCpuCoreInfo() {
    return this.has_cpuCoreInfo;
  }

  public isHeterogeneousCpu() {
    return this.cpuCoreInfo.is_heterogeneous;
  }

  public getCpuArchitectureSummary() {
    return this.cpuCoreInfo.architecture_summary;
  }

  public getIsSupportBypassCharge() {
    return this.supportsBypassCharge;
  }

  public hasIsSupportBypassCharge() {
    return this.has_supportsBypassCharge;
  }

  public getIsSupportChargeLimit() {
    return this.supportsChargeLimit;
  }

  public hasIsSupportChargeLimit() {
    return this.has_supportsChargeLimit;
  }

  public isSupportResetChargeLimit() {
    return this.supportsResetChargeLimit;
  }

  public hasIsSupportResetChargeLimit() {
    return this.has_supportsResetChargeLimit;
  }

  // isSupportSoftwareChargeLimit
  public isSupportSoftwareChargeLimit() {
    return this.supportsSoftwareChargeLimit;
  }

  public hasIsSupportSoftwareChargeLimit() {
    return this.has_supportsSoftwareChargeLimit;
  }

  public getSupportsSteamosManager() {
    return this.supportsSteamosManager;
  }

  public hasSupportsSteamosManager() {
    return this.has_supportsSteamosManager;
  }
}

export class Backend {
  public static data: BackendData;
  private static lastEnable: boolean = false;
  private static lastTDPEnable: boolean = false;
  private static lastGPUMode: GPUMODE = GPUMODE.NOLIMIT;

  public static async init() {
    this.data = new BackendData();
    await this.data.init();
    Backend.lastEnable = Settings.ensureEnable();
    Backend.lastTDPEnable = Settings.appTDPEnable();
    Backend.lastGPUMode = Settings.appGPUMode() as GPUMODE;
  }

  static {
    this.lastEnable = Settings.ensureEnable();
    this.lastTDPEnable = Settings.appTDPEnable();
    this.lastGPUMode = Settings.appGPUMode() as GPUMODE;
  }

  public static async applySettings(applyTarget: APPLYTYPE) {
    try {
      const currentEnable = Settings.ensureEnable();
      Logger.info(`applySettings: currentEnable = ${currentEnable}, lastEnable = ${Backend.lastEnable}`);
      if (!currentEnable) {
        if (currentEnable !== Backend.lastEnable) {
          Backend.resetSettings();
          Backend.lastEnable = currentEnable;
        }
        Logger.info(`Settings is disabled, skip applySettings`);
        return;
      }
      Backend.lastEnable = currentEnable;
      Logger.info(`>>>>>>>>>>>> applySettings ${applyTarget}`);

      if (applyTarget === APPLYTYPE.SET_ALL) {
        // 同步 OverWrite 到 QAM
        QAMPatch.togglePreferAppProfile(Settings.appOverWrite());
      }

      // CPU 相关设置处理
      if (applyTarget === APPLYTYPE.SET_ALL) {
        const cpuHandlers = [
          Backend.handleCPUNum,
          Backend.handleCPUBoost,
          Backend.handleCPUGovernor,
          Backend.handleEPP,
          Backend.handleCpuMaxPerfPct,
          Backend.handleSchedExtScheduler,
        ];
        await Promise.all(cpuHandlers.map((handler) => handler()));

        // GPU 相关设置处理
        const gpuHandlers = [Backend.handleGPUMode, Backend.handleGPUSliderFix];
        await Promise.all(gpuHandlers.map((handler) => handler()));

        // TDP 相关设置处理
        await Backend.handleTDPRange();
        await Backend.handleTDP();

        // 风扇控制设置处理
        await Backend.handleFanControl();

        // 电池限制设置处理
        await Backend.handleChargeLimit();
      } else {
        const handler = Backend.settingsHandlers.get(applyTarget);
        if (handler) {
          await handler();
        }
      }
    } catch (error) {
      console.error(`应用设置失败: ${applyTarget}`, error);
    }
  }

  private static async handleCPUNum(): Promise<void> {
    const cpuNum = Settings.appCpuNum();
    const smt = Settings.appSmt();
    if (cpuNum) {
      await Backend.applySmt(smt);
      await Backend.applyCpuNum(cpuNum);
    }
  }

  private static async handleCPUBoost(): Promise<void> {
    const cpuBoost = Settings.appCpuboost();
    if (cpuBoost !== undefined) {
      await Backend.applyCpuBoost(cpuBoost);
    }
  }

  private static async handleCPUGovernor(): Promise<void> {
    await Backend.handleGovernorAndEPP();
  }

  private static async handleSchedExtScheduler(): Promise<void> {
    const schedExtScheduler = Settings.appSchedExtScheduler();
    if (schedExtScheduler) {
      await Backend.setSchedExtScheduler(schedExtScheduler);
    }
  }

  private static async handleCpuMaxPerfPct(): Promise<void> {
    const cpuMaxPerfPct = Settings.appCpuMaxPerfPct();
    const autoCPUMaxPct = Settings.appAutoCPUMaxPct();
    await setAutoCpumaxPct(autoCPUMaxPct);
    if (!autoCPUMaxPct) {
      await setMaxPerfPct(cpuMaxPerfPct);
    }
  }

  private static async handleEPP(): Promise<void> {
    await Backend.handleGovernorAndEPP();
  }

  private static async handleGovernorAndEPP(): Promise<void> {
    const eppMode = Settings.appEPPMode();
    const cpuGovernor = Settings.appCPUGovernor();
    if (cpuGovernor) {
      await Backend.setCpuGovernor(cpuGovernor);
      if (cpuGovernor !== "performance") {
        await Backend.data.refreshEPPModes();
      }
    }
    if (eppMode && cpuGovernor !== "performance") {
      console.log(`设置 EPP 模式为: ${eppMode}`);
      await setEpp(eppMode);
    }
  }

  private static async handleGPUMode(): Promise<void> {
    Logger.info(`handleGPUMode: lastGPUMode = ${Backend.lastGPUMode}`);
    const gpuMode = Settings.appGPUMode();
    const gpuFreq = Settings.appGPUFreq();
    const gpuSliderFix = Settings.appGPUSliderFix();
    const gpuAutoMaxFreq = Settings.appGPUAutoMaxFreq();
    const gpuAutoMinFreq = Settings.appGPUAutoMinFreq();
    const gpuRangeMaxFreq = Settings.appGPURangeMaxFreq();
    const gpuRangeMinFreq = Settings.appGPURangeMinFreq();

    if (gpuMode !== Backend.lastGPUMode) {
      if (Backend.lastGPUMode === GPUMODE.NOLIMIT) {
        await startGpuNotify();
      }

      if (gpuMode === GPUMODE.NOLIMIT) {
        await stopGpuNotify();
      }

      Backend.lastGPUMode = gpuMode as GPUMODE;
    } else if (Backend.lastGPUMode === GPUMODE.NOLIMIT) {
      Logger.info(`gpuMode 未变化, 且为 NOLIMIT, 跳过`);
      return;
    }

    switch (gpuMode) {
      case GPUMODE.NOLIMIT:
        await Backend.applyGPUAuto(false);
        await Backend.applyGPUFreq(0);
        break;
      case GPUMODE.FIX:
        await Backend.applyGPUAuto(false);
        await Backend.applyGPUFreq(gpuFreq);
        break;
      case GPUMODE.NATIVE:
        if (gpuSliderFix) {
          console.log(`原生设置无需处理`);
        }
        break;
      case GPUMODE.AUTO:
        Settings.setTDPEnable(false);
        Settings.setCpuboost(false);
        await Backend.applyGPUAutoRange(gpuAutoMinFreq, gpuAutoMaxFreq);
        await Backend.applyGPUAuto(true);
        break;
      case GPUMODE.RANGE:
        await Backend.applyGPUAuto(false);
        await Backend.applyGPUFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
        break;
      default:
        console.log(`出现意外的GPUmode = ${gpuMode}`);
        await Backend.applyGPUFreq(0);
    }
  }

  private static async handleGPUSliderFix(): Promise<void> {
    const gpuSliderFix = Settings.appGPUSliderFix();
    if (gpuSliderFix) {
      console.log("applyGPUSliderFix");
      await fixGpuFreqSlider();
    }
  }

  private static async handleTDPRange(): Promise<void> {
    const enableCustomTDPRange = Settings.appEnableCustomTDPRange();
    const customTDPRangeMax = Settings.appCustomTDPRangeMax();
    const customTDPRangeMin = Settings.appCustomTDPRangeMin();

    if (PluginManager.isPatchSuccess(Patch.TDPPatch)) {
      if (enableCustomTDPRange) {
        await QAMPatch.setTDPRange(customTDPRangeMin, customTDPRangeMax);
      } else {
        await QAMPatch.setTDPRange(
          DEFAULT_TDP_MIN,
          Backend.data.getTDPMax() !== 0
            ? Backend.data.getTDPMax()
            : DEFAULT_TDP_MAX
        );
      }
    }
  }

  private static async handleTDP(): Promise<void> {
    const enableCustomTDPRange = Settings.appEnableCustomTDPRange();
    const customTDPRangeMax = Settings.appCustomTDPRangeMax();
    const customTDPRangeMin = Settings.appCustomTDPRangeMin();
    const tdp = Settings.appTDP();
    const tdpEnable = Settings.appTDPEnable();
    const _tdp = enableCustomTDPRange
      ? Math.min(customTDPRangeMax, Math.max(customTDPRangeMin, tdp))
      : tdp;

    Logger.info(`handleTDP: ${Settings.appTDPEnable()}`);
    Logger.info(`tdpEnable = ${tdpEnable}, lastTDPEnable = ${Backend.lastTDPEnable}`);

    const enableNativeTDPSlider = Settings.appEnableNativeTDPSlider();
    if (enableNativeTDPSlider) {
      Logger.info(`启用原生 TDP 滑块, 跳过 TDP 设置`);
      return;
    }

    if (!tdpEnable) {
      if (tdpEnable !== Backend.lastTDPEnable) {
        Logger.info(`tdpEnable is false, applyTDPUnlimited`);
        await Backend.applyTDPUnlimited();
      }
      Backend.lastTDPEnable = tdpEnable;
      return;
    }

    Logger.info(`applyTDP: ${_tdp}`);
    await Backend.applyTDP(_tdp);
    Backend.lastTDPEnable = tdpEnable;

    // 处理非插件模式或强制显示 TDP 的情况
    // if (
    //   !PluginManager.isPatchSuccess(Patch.TDPPatch)
    // ) {
    //   if (tdpEnable) {
    //     await Backend.applyTDP(_tdp);
    //   } else {
    //     Logger.info("not isPatchSuccess: not tdpEnable, applyTDPUnlimited");
    //     await Backend.applyTDPUnlimited();
    //   }

    //   try {
    //     await QAMPatch.setTDPEanble(tdpEnable);
    //     if (tdpEnable) {
    //       await QAMPatch.setTDP(_tdp);
    //     }
    //   } catch (error) {
    //     console.error(`强制显示 TDP 时设置QAM失败`, error);
    //   }
    // }

    // 处理插件模式的情况
    // if (PluginManager.isPatchSuccess(Patch.TDPPatch)) {
    //   await QAMPatch.setTDPEanble(tdpEnable);
    //   await QAMPatch.setTDP(_tdp);
    //   if (tdpEnable) {
    //     await Backend.applyTDP(_tdp);
    //   } else {
    //     Logger.info("isPatchSuccess: not tdpEnable, applyTDPUnlimited");
    //     await Backend.applyTDPUnlimited();
    //   }
    // }
  }

  private static async handleFanControl(): Promise<void> {
    if (!FanControl.fanIsEnable) {
      return;
    }

    const fanSettings = Settings.appFanSettings();
    for (let index = 0; index < fanSettings.length; index++) {
      const fanSetting = Settings.appFanSettings()?.[index];
      //没有配置时转自动
      if (!fanSetting) {
        await Backend.applyFanAuto(index, true);
        // console.log(`没有配置 index= ${index}`);
        continue;
      }

      const fanMode = fanSetting.fanMode;
      const fanRPMPercent = FanControl.fanInfo[index].setPoint.fanRPMpercent;
      const fanWriteMode = Backend.data.getFanPwmMode(index);

      //写入转速后再写入控制位
      switch (fanMode) {
        case FANMODE.NOCONTROL:
          // console.log(`不控制 index= ${index}`);
          await Backend.applyFanAuto(index, true);
          break;
        case FANMODE.FIX:
        case FANMODE.CURVE:
          // console.log(`${fanMode == FANMODE.FIX ? '直线' : '曲线'} index= ${index}`);
          if (fanWriteMode != FAN_PWM_MODE.MULTI_DIFF) {
            if (!fanRPMPercent) {
              console.error(`风扇转速百分比未设置: index=${index}`);
              continue;
            }
            await Backend.applyFanPercent(index, fanRPMPercent);
            await Backend.applyFanAuto(index, false);
          } else {
            console.log(`直接写入曲线数据`);
            await Backend.applyFanCurve(index, fanSetting);
          }
          break;
        default:
          console.error(`出现意外的FanMode = ${fanMode}`);
          await Backend.applyFanAuto(index, true);
      }
    }
  }

  private static async handleChargeLimit() {
    const chargeLimit = Settings.appChargeLimit();
    const bypassCharge = Settings.appBypassCharge();
    const supportsChargeLimit = Backend.data.getIsSupportChargeLimit();
    const supportsBypassCharge = Backend.data.getIsSupportBypassCharge();
    const enableChargeLimit = Settings.appEnableChargeLimit();
    const supportsResetChargeLimit = Backend.data.isSupportResetChargeLimit();
    // const softwareChargeLimit = Backend.data.isSupportSoftwareChargeLimit();

    if (supportsResetChargeLimit && !enableChargeLimit) {
      console.log(`重置电池充电限制`);
      await resetChargeLimit();
      return;
    }

    console.log(`电池充电限制 = ${chargeLimit}, 旁路供电 = ${bypassCharge}`);
    if (bypassCharge) {
      if (supportsBypassCharge) {
        console.log(`手动开启旁路供电`);
        await setBypassCharge(bypassCharge);
      }
    } else if (supportsChargeLimit) {
      console.log(`关闭旁路供电, 但设置了电池充电限制 = ${chargeLimit}`);
      await setChargeLimit(chargeLimit);
    } else {
      if (supportsBypassCharge) {
        console.log(`手动关闭旁路供电`);
        await setBypassCharge(false);
      }
    }
  }

  private static async handleCPUFreqControl(): Promise<void> {
    const enable = Settings.appCpuFreqControlEnable();

    if (enable) {
      // 开关打开时，应用保存的频率配置
      const freqConfig = Settings.getCpuCoreFreqConfig();
      if (Object.keys(freqConfig).length > 0) {
        await setCpuFreqByCoreType(freqConfig);
      }
    } else {
      // 开关关闭时，恢复硬件默认频率（设置为0表示无限制）
      const coreInfo = Backend.data.getCpuCoreInfo();
      const resetConfig: Record<string, number> = {};
      Object.keys(coreInfo.core_types).forEach(coreType => {
        resetConfig[coreType] = 0; // 0表示恢复硬件默认
      });
      await setCpuFreqByCoreType(resetConfig);
    }
  }

  private static settingsHandlers: Map<APPLYTYPE, () => Promise<void>> =
    new Map([
      [APPLYTYPE.SET_CPUCORE, Backend.handleCPUNum],
      [APPLYTYPE.SET_CPUBOOST, Backend.handleCPUBoost],
      [APPLYTYPE.SET_CPU_GOVERNOR, Backend.handleCPUGovernor],
      [APPLYTYPE.SET_CPU_MAX_PERF, Backend.handleCpuMaxPerfPct],
      [APPLYTYPE.SET_EPP, Backend.handleEPP],
      [APPLYTYPE.SET_CPU_SCHED_EXT, Backend.handleSchedExtScheduler],
      [APPLYTYPE.SET_CPU_FREQ_CONTROL, Backend.handleCPUFreqControl],
      [APPLYTYPE.SET_GPUMODE, Backend.handleGPUMode],
      [APPLYTYPE.SET_GPUSLIDERFIX, Backend.handleGPUSliderFix],
      [APPLYTYPE.SET_TDP, Backend.handleTDP],
      [APPLYTYPE.SET_FANRPM, Backend.handleFanControl],
      [APPLYTYPE.SET_POWER_BATTERY, Backend.handleChargeLimit],
      [APPLYTYPE.SET_FAN_ALL, Backend.handleFanControl],
      [APPLYTYPE.SET_FANMODE, Backend.handleFanControl],
    ]);

  public static resetFanSettings = () => {
    FanControl.fanInfo.forEach((_value, index) => {
      Backend.applyFanAuto(index, true);
    });
  };

  public static resetSettings = () => {
    console.log("重置所有设置");
    Backend.applySmt(true);
    Backend.applyCpuNum(Backend.data.getCpuMaxNum());
    Backend.applyCpuBoost(true);
    // Backend.applyTDP(Backend.data.getTDPMax());
    Logger.info("resetSettings: applyTDPUnlimited");
    Backend.applyTDPUnlimited();
    Backend.applyGPUFreq(0);
    FanControl.fanInfo.forEach((_value, index) => {
      Backend.applyFanAuto(index, true);
    });
  };

  private static applySmt(smt: boolean) {
    setSmt(smt);
  }

  private static applyCpuNum(cpuNum: number) {
    setCpuOnline(cpuNum);
  }

  private static applyCpuBoost(cpuBoost: boolean) {
    setCpuBoost(cpuBoost);
  }

  public static applyTDP = (tdp: number) => {
    setCpuTDP(tdp);
  };

  public static applyTDPUnlimited = () => {
    setCpuTDPUnlimited();
  };

  public static applyGPUFreq(freq: number) {
    setGpuFreq(freq);
  }

  private static applyGPUFreqRange(freqMin: number, freqMax: number) {
    setGpuFreqRange(freqMin, freqMax);
  }

  private static applyGPUAuto(auto: boolean) {
    setGpuAuto(auto);
  }

  private static applyGPUAutoRange(minAutoFreq: number, maxAutoFreq: number) {
    setGpuAutoFreqRange(minAutoFreq, maxAutoFreq);
  }

  private static applyFanAuto(index: number, auto: boolean) {
    setFanAuto(index, auto);
  }

  private static applyFanPercent(index: number, percent: number) {
    setFanPercent(index, percent);
  }

  private static applyFanCurve(index: number, fanSetting: FanSetting) {
    setFanCurve(
      index,
      fanSetting?.curvePoints?.map((point) => point?.temperature ?? 0) ?? [],
      fanSetting?.curvePoints?.map((point) => point?.fanRPMpercent ?? 0) ?? []
    );
  }



  // set_settings
  public static async setSettings(settingsData: SettingsData) {
    const obj = serializer.serializeObject(settingsData);
    await setSettings(obj);
  }

  // get_settings
  public static async getSettings(): Promise<SettingsData> {
    try {
      const res = (await getSettings()) as string;
      return (
        serializer.deserializeObject(res, SettingsData) ?? new SettingsData()
      );
    } catch (error) {
      console.error("getSettings error", error);
      return new SettingsData();
    }
  }



  // 获取当前 CPU 调度器
  public static async getCpuGovernor(): Promise<string> {
    try {
      return await getCpuGovernor();
    } catch (error) {
      console.error("获取 CPU 调度器失败:", error);
      return "";
    }
  }

  // 获取所有可用的 CPU 调度器
  public static async getAvailableGovernors(): Promise<string[]> {
    try {
      return await getAvailableGovernors();
    } catch (error) {
      console.error("获取可用 CPU 调度器列表失败:", error);
      return [];
    }
  }

  // 检查是否支持 sched_ext
  public static async hasSchedExtSupport(): Promise<boolean> {
    try {
      return await supportsSchedExt();
    } catch (error) {
      console.error("检查 sched_ext 支持失败:", error);
      return false;
    }
  }

  // 获取可用的 SCX 调度器列表
  public static async getAvailableSchedExtSchedulers(): Promise<string[]> {
    try {
      return await getSchedExtList();
    } catch (error) {
      console.error("获取可用 SCX 调度器列表失败:", error);
      return [];
    }
  }

  // 获取当前 SCX 调度器
  public static async getCurrentSchedExtScheduler(): Promise<string> {
    try {
      return await getCurrentSchedExtScheduler();
    } catch (error) {
      console.error("获取当前 SCX 调度器失败:", error);
      return "";
    }
  }

  // 设置 SCX 调度器
  public static async setSchedExtScheduler(scheduler: string, param?: string): Promise<boolean> {
    try {
      const paramValue = param || "";
      console.log(`设置 SCX 调度器为: ${scheduler}, 参数: ${paramValue}`);
      return await setSchedExtScheduler(scheduler, paramValue);
    } catch (error) {
      console.error("设置 SCX 调度器失败:", error);
      return false;
    }
  }

  // 设置 CPU 调度器
  public static async setCpuGovernor(governor: string): Promise<boolean> {
    try {
      return await setCpuGovernorCallable(governor);
    } catch (error) {
      console.error("设置 CPU 调度器失败:", error);
      return false;
    }
  }



}