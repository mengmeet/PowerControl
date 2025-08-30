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

// Fan config type
interface FanConfig {
  fan_max_rpm?: number;
  fan_name?: string;
  [key: string]: unknown;
}

// Proxy methods type definition
type ProxyMethods<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
} & {
  [K in keyof T as `has${Capitalize<K & string>}`]: () => boolean;
} & {
  [K in keyof T as T[K] extends boolean ? `is${Capitalize<K & string>}` : never]: () => T[K];
};

// Backend API callable functions
export const getCpuMaxNum = callable<[], number>("get_cpuMaxNum");
export const getTdpMax = callable<[], number>("get_tdpMax");
export const getGpuFreqRange = callable<[], number[]>("get_gpuFreqRange");
export const getFanConfigList = callable<[], FanConfig[]>("get_fanConfigList");
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
export const setSchedExtScheduler = callable<[string, string?], boolean>("set_sched_ext_scheduler");
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



export class BackendData {
  // 使用 Map 存储数据和状态
  private data = new Map<string, any>();
  private loadedFlags = new Set<string>();
  private errors = new Map<string, Error>();

  // 通用的获取方法
  private get<T>(key: string, defaultValue?: T): T {
    return this.data.get(key) ?? defaultValue;
  }

  // 通用的检查方法
  private has(key: string): boolean {
    return this.loadedFlags.has(key);
  }

  // 通用的设置方法
  private set<T>(key: string, value: T, error?: Error) {
    if (error) {
      this.errors.set(key, error);
      this.loadedFlags.delete(key);
      this.data.set(key, this.getDefaultValue(key));
    } else {
      this.data.set(key, value);
      this.loadedFlags.add(key);
      this.errors.delete(key);
    }
  }

  // 获取默认值
  public static readonly DEFAULTS = {
    cpuMaxNum: 0,
    tdpMax: 0,
    gpuMin: 0,
    gpuMax: 0,
    fanConfigs: [] as FanConfig[],
    currentVersion: "",
    latestVersion: "",
    supportCPUMaxPct: false,
    systemInfo: undefined as SystemInfo | undefined,
    availableGovernors: [] as string[],
    currentGovernor: "",
    isEppSupported: false,
    eppModes: [] as string[],
    currentEpp: null as string | null,
    cpuVendor: "",
    cpuCoreInfo: {
      is_heterogeneous: false,
      vendor: "Unknown",
      architecture_summary: "Traditional Architecture",
      core_types: {}
    } as CPUCoreInfo,
    supportsBypassCharge: false,
    supportsChargeLimit: false,
    supportsResetChargeLimit: false,
    supportsSoftwareChargeLimit: false,
    supportsSteamosManager: false,
    schedExtSupport: false,
    availableSchedExtSchedulers: [] as string[],
    currentSchedExtScheduler: "",
    isSupportSMT: false
  } as const;

  private getDefaultValue(key: string) {
    return BackendData.DEFAULTS[key as keyof typeof BackendData.DEFAULTS];
  }

  // 极简的初始化配置
  private initConfig = {
    cpuMaxNum: { callable: getCpuMaxNum },
    tdpMax: { callable: getTdpMax },
    gpuFreqRange: {
      callable: getGpuFreqRange,
      transform: (value: number[]) => ({ min: value[0], max: value[1] })
    },
    fanConfigs: { callable: getFanConfigList },
    isSupportSMT: { callable: getIsSupportSMT },
    supportCPUMaxPct: { callable: () => getMaxPerfPct().then(v => v > 0) },
    currentVersion: { callable: getVersion },
    systemInfo: { callable: () => SteamUtils.getSystemInfo() },
    availableGovernors: { callable: getAvailableGovernors },
    isEppSupported: { callable: isEppSupported },
    eppModes: { callable: getEppModes },
    currentEpp: { callable: getCurrentEpp },
    cpuVendor: { callable: getCpuVendor },
    supportsBypassCharge: { callable: supportsBypassCharge },
    supportsChargeLimit: { callable: supportsChargeLimit },
    supportsResetChargeLimit: { callable: supportsResetChargeLimit },
    supportsSoftwareChargeLimit: { callable: softwareChargeLimit },
    supportsSteamosManager: { callable: () => checkFileExist("/usr/bin/steamosctl") },
    cpuCoreInfo: { callable: getCpuCoreInfo },
    currentGovernor: { callable: getCpuGovernor }
  };

  // 主初始化方法
  public async init() {
    // 并行执行所有基础初始化
    const tasks = Object.entries(this.initConfig).map(([key, config]) =>
      this.initField(key, config)
    );

    await Promise.allSettled(tasks);

    // 单独处理有依赖关系的 sched_ext
    await this.initSchedExt();
  }

  // 极简的字段初始化方法
  private async initField(key: string, config: any) {
    try {
      const result = await config.callable();
      if (config.transform) {
        const transformed = config.transform(result);
        if (key === 'gpuFreqRange') {
          this.set('gpuMin', transformed.min);
          this.set('gpuMax', transformed.max);
          return;
        }
      }
      this.set(key, result);
    } catch (error) {
      console.error(`初始化 ${key} 失败:`, error);
      logError(`初始化 ${key} 失败: ${error}`);
      this.set(key, this.getDefaultValue(key), error as Error);
    }
  }

  // 处理有依赖关系的 sched_ext 初始化
  private async initSchedExt() {
    // 先检查 sched_ext 支持
    try {
      const supported = await supportsSchedExt();
      this.set('schedExtSupport', supported);

      // 如果支持，再获取详细信息
      if (supported) {
        const schedExtTasks = [
          this.initField('availableSchedExtSchedulers', {
            callable: getSchedExtList
          }),
          // 特殊处理当前调度器（需要额外的日志）
          (async () => {
            try {
              const result = await getCurrentSchedExtScheduler();
              logInfo(`初始化数据, 获取当前 SCX 调度器: ${result}`);
              this.set('currentSchedExtScheduler', result);
            } catch (error) {
              console.error(`初始化 currentSchedExtScheduler 失败:`, error);
              logError(`初始化 currentSchedExtScheduler 失败: ${error}`);
              this.set('currentSchedExtScheduler', '', error as Error);
            }
          })()
        ];

        await Promise.allSettled(schedExtTasks);
      }
    } catch (error) {
      console.error(`初始化 schedExtSupport 失败:`, error);
      logError(`初始化 schedExtSupport 失败: ${error}`);
      this.set('schedExtSupport', false, error as Error);
    }
  }

  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        const propStr = prop.toString();

        if (propStr.startsWith('get') && propStr.length > 3) {
          const fieldName = propStr.slice(3);
          const actualFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          if (actualFieldName in BackendData.DEFAULTS) {
            return () => target.data.get(actualFieldName) ?? BackendData.DEFAULTS[actualFieldName as keyof typeof BackendData.DEFAULTS];
          }
        }

        if (propStr.startsWith('is') && propStr.length > 2) {
          const fieldName = propStr.slice(2);
          const actualFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          if (actualFieldName in BackendData.DEFAULTS) {
            return () => target.data.get(actualFieldName) ?? BackendData.DEFAULTS[actualFieldName as keyof typeof BackendData.DEFAULTS];
          }
        }

        if (propStr.startsWith('has') && propStr.length > 3) {
          const fieldName = propStr.slice(3);
          const actualFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
          if (actualFieldName in BackendData.DEFAULTS) {
            return () => target.loadedFlags.has(actualFieldName);
          }
        }

        return target[prop as keyof BackendData];
      }
    }) as this & ProxyMethods<typeof BackendData.DEFAULTS>;
  }

  // 刷新 EPP 模式（保持现有方法）
  public async refreshEPPModes(): Promise<void> {
    await this.initField('eppModes', this.initConfig.eppModes);
    await this.initField('currentEpp', this.initConfig.currentEpp);
  }












  public getFanMAXPRM(index: number) {
    const fanConfigs = this.get<any[]>('fanConfigs', []);
    if (this.has('fanConfigs')) {
      return fanConfigs?.[index]?.fan_max_rpm ?? 0;
    }
    return 0;
  }

  public getFanCount() {
    const fanConfigs = this.get<any[]>('fanConfigs', []);
    if (this.has('fanConfigs')) {
      return fanConfigs?.length ?? 0;
    }
    return 0;
  }

  public getFanName(index: number) {
    const fanConfigs = this.get<any[]>('fanConfigs', []);
    if (this.has('fanConfigs')) {
      return fanConfigs?.[index]?.fan_name ?? "Fan";
    }
    return "Fan";
  }

  public getFanConfigs() {
    if (this.has('fanConfigs')) {
      return this.get<any[]>('fanConfigs', []);
    }
    return [];
  }

  public getFanPwmMode(index: number) {
    const fanConfigs = this.get<any[]>('fanConfigs', []);
    if (this.has('fanConfigs')) {
      return fanConfigs?.[index]?.fan_hwmon_mode ?? 0;
    }
    return 0;
  }

  public getFanHwmonDefaultCurve(
    index: number
  ): { speedValue: number; tempValue: number }[] {
    const result: { speedValue: number; tempValue: number }[] = [];
    const fanConfigs = this.get<any[]>('fanConfigs', []);
    if (this.has('fanConfigs')) {
      const defaultCurve = fanConfigs?.[index]?.fan_default_curve ?? [];
      const pwmWriteMax: number =
        fanConfigs?.[index]?.fan_pwm_write_max ?? 255;
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

  public isHeterogeneousCpu() {
    return this.get<CPUCoreInfo>('cpuCoreInfo', {
      is_heterogeneous: false,
      vendor: "Unknown",
      architecture_summary: "Traditional Architecture",
      core_types: {}
    }).is_heterogeneous;
  }
}

export class Backend {
  public static data: BackendData & ProxyMethods<typeof BackendData.DEFAULTS>;
  private static lastEnable: boolean = false;
  private static lastTDPEnable: boolean = false;
  private static lastGPUMode: GPUMODE = GPUMODE.NOLIMIT;

  public static async init() {
    this.data = new BackendData() as BackendData & ProxyMethods<typeof BackendData.DEFAULTS>;
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
      await setSmt(smt);
      await setCpuOnline(cpuNum);
    }
  }

  private static async handleCPUBoost(): Promise<void> {
    const cpuBoost = Settings.appCpuboost();
    if (cpuBoost !== undefined) {
      await setCpuBoost(cpuBoost);
    }
  }

  private static async handleCPUGovernor(): Promise<void> {
    await Backend.handleGovernorAndEPP();
  }

  private static async handleSchedExtScheduler(): Promise<void> {
    const schedExtScheduler = Settings.appSchedExtScheduler();
    if (schedExtScheduler) {
      await setSchedExtScheduler(schedExtScheduler);
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
      await setCpuGovernorCallable(cpuGovernor);
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
        await setGpuAuto(false);
        await setGpuFreq(0);
        break;
      case GPUMODE.FIX:
        await setGpuAuto(false);
        await setGpuFreq(gpuFreq);
        break;
      case GPUMODE.NATIVE:
        if (gpuSliderFix) {
          console.log(`原生设置无需处理`);
        }
        break;
      case GPUMODE.AUTO:
        Settings.setTDPEnable(false);
        Settings.setCpuboost(false);
        await setGpuAutoFreqRange(gpuAutoMinFreq, gpuAutoMaxFreq);
        await setGpuAuto(true);
        break;
      case GPUMODE.RANGE:
        await setGpuAuto(false);
        await setGpuFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
        break;
      default:
        console.log(`出现意外的GPUmode = ${gpuMode}`);
        await setGpuFreq(0);
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
          Backend.data.getTdpMax() !== 0
            ? Backend.data.getTdpMax()
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
        await setCpuTDPUnlimited();
      }
      Backend.lastTDPEnable = tdpEnable;
      return;
    }

    Logger.info(`applyTDP: ${_tdp}`);
    await setCpuTDP(_tdp);
    Backend.lastTDPEnable = tdpEnable;

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
        await setFanAuto(index, true);
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
          await setFanAuto(index, true);
          break;
        case FANMODE.FIX:
        case FANMODE.CURVE:
          // console.log(`${fanMode == FANMODE.FIX ? '直线' : '曲线'} index= ${index}`);
          if (fanWriteMode != FAN_PWM_MODE.MULTI_DIFF) {
            if (!fanRPMPercent) {
              console.error(`风扇转速百分比未设置: index=${index}`);
              continue;
            }
            await setFanPercent(index, fanRPMPercent);
            await setFanAuto(index, false);
          } else {
            console.log(`直接写入曲线数据`);
            await setFanCurve(
              index,
              fanSetting?.curvePoints?.map((point) => point?.temperature ?? 0) ?? [],
              fanSetting?.curvePoints?.map((point) => point?.fanRPMpercent ?? 0) ?? []
            );
          }
          break;
        default:
          console.error(`出现意外的FanMode = ${fanMode}`);
          await setFanAuto(index, true);
      }
    }
  }

  private static async handleChargeLimit() {
    const chargeLimit = Settings.appChargeLimit();
    const bypassCharge = Settings.appBypassCharge();
    const supportsChargeLimit = Backend.data.isSupportsChargeLimit();
    const supportsBypassCharge = Backend.data.isSupportsBypassCharge();
    const enableChargeLimit = Settings.appEnableChargeLimit();
    const supportsResetChargeLimit = Backend.data.isSupportsResetChargeLimit();
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
      setFanAuto(index, true);
    });
  };

  public static resetSettings = () => {
    console.log("重置所有设置");
    setSmt(true);
    setCpuOnline(Backend.data.getCpuMaxNum());
    setCpuBoost(true);
    // setCpuTDP(Backend.data.getTdpMax());
    Logger.info("resetSettings: applyTDPUnlimited");
    setCpuTDPUnlimited();
    setGpuFreq(0);
    FanControl.fanInfo.forEach((_value, index) => {
      setFanAuto(index, true);
    });
  };

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
}