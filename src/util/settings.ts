import {
  JsonObject,
  JsonProperty,
  JsonSerializer,
} from "typescript-json-serializer";
import { APPLYTYPE, ComponentName, FANMODE, GPUMODE, UpdateType } from "./enum";
import { Backend } from "./backend";
import { FanPosition } from "./position";
import {
  ACStateManager,
  DEFAULT_APP,
  PluginManager,
  RunningApps,
} from "./pluginMain";
import { ACState } from "./steamClient";

export const DEFAULT_TDP_MAX = 25;
export const DEFAULT_TDP_MIN = 3;

const SETTINGS_KEY = "PowerControl";
const serializer = new JsonSerializer();

@JsonObject()
export class AppSetting {
  @JsonProperty()
  smt?: boolean;
  @JsonProperty()
  cpuNum?: number;
  @JsonProperty()
  cpuboost?: boolean;
  @JsonProperty()
  tdp?: number;
  @JsonProperty()
  tdpEnable?: boolean;
  @JsonProperty()
  gpuMode?: string;
  @JsonProperty()
  gpuFreq?: number;
  @JsonProperty()
  gpuAutoMaxFreq?: number;
  @JsonProperty()
  gpuAutoMinFreq?: number;
  @JsonProperty()
  gpuRangeMaxFreq?: number;
  @JsonProperty()
  gpuRangeMinFreq?: number;
  @JsonProperty()
  fanProfileNameList?: string[] | undefined[];
  @JsonProperty()
  gpuSliderFix?: boolean;
  @JsonProperty()
  cpuMaxPerfPct?: number;
  @JsonProperty()
  autoCPUMaxPct?: boolean;
  @JsonProperty()
  cpuGovernor?: string;
  @JsonProperty()
  epp?: string;

  constructor() {
    this.smt = true;
    this.cpuNum = Backend.data?.HasCpuMaxNum()
      ? Backend.data?.getCpuMaxNum()
      : 4;
    this.cpuboost = false;
    this.tdpEnable = true;
    this.tdp = Backend.data?.HasTDPMax()
      ? Math.trunc(Backend.data?.getTDPMax() / 2)
      : 15;
    this.gpuMode = GPUMODE.NATIVE;
    this.gpuSliderFix = false;
    //this.gpuFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuAutoMaxFreq = Backend.data?.HasGPUFreqMax()
      ? Backend.data.getGPUFreqMax()
      : 1600;
    this.gpuAutoMinFreq = Backend.data?.HasGPUFreqMin()
      ? Backend.data.getGPUFreqMin()
      : 200;
    this.gpuRangeMaxFreq = Backend.data?.HasGPUFreqMax()
      ? Backend.data.getGPUFreqMax()
      : 1600;
    this.gpuRangeMinFreq = Backend.data?.HasGPUFreqMin()
      ? Backend.data.getGPUFreqMin()
      : 200;
    this.fanProfileNameList = [];
    this.cpuMaxPerfPct = 100;
    this.autoCPUMaxPct = false; // 默认关闭自动CPU最大性能百分比
    this.cpuGovernor = "performance"; // 默认使用性能模式
    this.epp = "performance"; // 默认使用性能模式
  }
  deepCopy(copyTarget: AppSetting) {
    // this.overwrite=copyTarget.overwrite;
    this.smt = copyTarget.smt;
    this.cpuNum = copyTarget.cpuNum;
    this.cpuboost = copyTarget.cpuboost;
    this.tdpEnable = copyTarget.tdpEnable;
    this.tdp = copyTarget.tdp;
    this.gpuMode = copyTarget.gpuMode;
    this.gpuFreq = copyTarget.gpuFreq;
    this.gpuSliderFix = copyTarget.gpuSliderFix;
    this.gpuAutoMaxFreq = copyTarget.gpuAutoMaxFreq;
    this.gpuAutoMinFreq = copyTarget.gpuAutoMinFreq;
    this.gpuRangeMaxFreq = copyTarget.gpuRangeMaxFreq;
    this.gpuRangeMinFreq = copyTarget.gpuAutoMinFreq;
    this.fanProfileNameList = copyTarget.fanProfileNameList?.slice();
    this.cpuMaxPerfPct = copyTarget.cpuMaxPerfPct;
    this.autoCPUMaxPct = copyTarget.autoCPUMaxPct;
    this.cpuGovernor = copyTarget.cpuGovernor;
    this.epp = copyTarget.epp;
  }
}

@JsonObject()
export class FanSetting {
  @JsonProperty()
  snapToGrid?: boolean = false;
  @JsonProperty()
  fanMode?: number = FANMODE.NOCONTROL;
  @JsonProperty()
  fixSpeed?: number = 50;
  @JsonProperty({ type: FanPosition, dataStructure: "array" })
  curvePoints?: FanPosition[] = [];
  constructor(
    snapToGrid: boolean,
    fanMode: number,
    fixSpeed: number,
    curvePoints: FanPosition[]
  ) {
    this.snapToGrid = snapToGrid;
    this.fanMode = fanMode;
    this.fixSpeed = fixSpeed;
    this.curvePoints = curvePoints;
  }
}

@JsonObject()
export class AppSettingData {
  // 按 app 配置
  @JsonProperty()
  overwrite?: boolean;
  // 电源模式覆盖， app配置
  @JsonProperty()
  acStateOverwrite?: boolean;
  // 默认配置
  @JsonProperty()
  public defaultSettig: AppSetting = new AppSetting();
  // 电源模式配置
  @JsonProperty()
  public acStting: AppSetting = new AppSetting();
  // 电池模式配置
  @JsonProperty()
  public batSetting: AppSetting = new AppSetting();

  constructor() {
    this.overwrite = false;
    this.acStateOverwrite = false;
    this.defaultSettig = new AppSetting();
    this.acStting = new AppSetting();
    this.batSetting = new AppSetting();
  }

  public deepCopy(copyTarget: AppSettingData) {
    this.overwrite = copyTarget.overwrite;
    this.acStateOverwrite = copyTarget.acStateOverwrite;
    this.defaultSettig.deepCopy(copyTarget.defaultSettig);
    this.acStting.deepCopy(copyTarget.acStting);
    this.batSetting.deepCopy(copyTarget.batSetting);
  }
}

@JsonObject()
export class SettingsData {
  @JsonProperty()
  public enabled: boolean = true;

  @JsonProperty()
  public enableCustomTDPRange: boolean = false;

  @JsonProperty()
  public customTDPRangeMax: number;

  @JsonProperty()
  public bypassCharge?: boolean;

  @JsonProperty()
  public chargeLimit?: number;

  @JsonProperty()
  public enableChargeLimit?: boolean;

  // @JsonProperty()
  // public customTDPRangeMin: number;

  @JsonProperty()
  public forceShowTDP: boolean = false;

  @JsonProperty()
  public enableNativeTDPSlider: boolean = false;

  @JsonProperty()
  public showSettingMenu: boolean = true;

  @JsonProperty()
  public showFanMenu: boolean = true;

  @JsonProperty()
  public showCpuMenu: boolean = true;

  @JsonProperty()
  public showGpuMenu: boolean = true;

  @JsonProperty()
  public showPowerMenu: boolean = true;

  @JsonProperty()
  public currentTabRoute: string = "cpu";

  @JsonProperty()
  public useOldUI: boolean = false; // 是否使用旧的 UI

  @JsonProperty({ type: AppSettingData, dataStructure: "dictionary" })
  public perApp: { [appId: string]: AppSettingData } = {};

  @JsonProperty({ type: FanSetting, dataStructure: "dictionary" })
  public fanSettings: { [fanProfile: string]: FanSetting } = {};

  constructor() {
    this.customTDPRangeMax = DEFAULT_TDP_MAX;
    // this.customTDPRangeMin = DEFAULT_TDP_MIN;
  }

  public deepCopy(copyTarget: SettingsData) {
    this.enabled = copyTarget.enabled;
    this.enableCustomTDPRange = copyTarget.enableCustomTDPRange;
    this.customTDPRangeMax = copyTarget.customTDPRangeMax;
    this.forceShowTDP = copyTarget.forceShowTDP;
    this.enableNativeTDPSlider = copyTarget.enableNativeTDPSlider;
    this.bypassCharge = copyTarget.bypassCharge;
    this.chargeLimit = copyTarget.chargeLimit;
    this.enableChargeLimit = copyTarget.enableChargeLimit;
    // this.customTDPRangeMin = copyTarget.customTDPRangeMin;
    this.perApp = {};
    // formart copyTarget.perApp to json string
    console.log(
      `!!!!!!!!!!!!!!! deepCopy copyTarget.fanSettings: ${JSON.stringify(
        copyTarget.fanSettings,
        (_, value) => {
          if (typeof value === "object" && value !== null) {
            return Object.assign({}, value);
          }
          return value;
        },
        2
      )}`
    );

    Object.entries(copyTarget.perApp).forEach(([key, value]) => {
      this.perApp[key] = new AppSettingData();
      this.perApp[key].deepCopy(value);
    });
    this.fanSettings = {};
    Object.entries(copyTarget.fanSettings).forEach(([key, value]) => {
      this.fanSettings[key] = value;
    });

    this.showSettingMenu = copyTarget.showSettingMenu;
    this.showFanMenu = copyTarget.showFanMenu;
    this.showCpuMenu = copyTarget.showCpuMenu;
    this.showGpuMenu = copyTarget.showGpuMenu;
    this.showPowerMenu = copyTarget.showPowerMenu;
    this.currentTabRoute = copyTarget.currentTabRoute;
    this.useOldUI = copyTarget.useOldUI;
  }
}

export class Settings {
  private static _instance: Settings = new Settings();

  public data: SettingsData;

  constructor() {
    this.data = new SettingsData();
  }

  private settingChangeEvent = new EventTarget();

  // ui 菜单展开控制
  public static set showSettingMenu(show: boolean) {
    this._instance.data.showSettingMenu = show;
    Settings.saveSettingsToLocalStorage();
  }

  public static get showSettingMenu(): boolean {
    return this._instance.data.showSettingMenu;
  }

  public static set showFanMenu(show: boolean) {
    this._instance.data.showFanMenu = show;
    Settings.saveSettingsToLocalStorage();
  }

  public static get showFanMenu(): boolean {
    return this._instance.data.showFanMenu;
  }

  public static set showCpuMenu(show: boolean) {
    this._instance.data.showCpuMenu = show;
    Settings.saveSettingsToLocalStorage();
  }

  public static get showCpuMenu(): boolean {
    return this._instance.data.showCpuMenu;
  }

  public static set showGpuMenu(show: boolean) {
    this._instance.data.showGpuMenu = show;
    Settings.saveSettingsToLocalStorage();
  }

  public static get showGpuMenu(): boolean {
    return this._instance.data.showGpuMenu;
  }

  public static set showPowerMenu(show: boolean) {
    this._instance.data.showPowerMenu = show;
    Settings.saveSettingsToLocalStorage();
  }

  public static get showPowerMenu(): boolean {
    return this._instance.data.showPowerMenu;
  }
  // ui 菜单展开控制 end

  public static set currentTabRoute(route: string) {
    this._instance.data.currentTabRoute = route;
    Settings.saveSettingsToLocalStorage();
  }

  public static get currentTabRoute(): string {
    return this._instance.data.currentTabRoute;
  }

  public static set useOldUI(useOldUI: boolean) {
    this._instance.data.useOldUI = useOldUI;
    Settings.saveSettingsToLocalStorage();
    PluginManager.updateAllComponent(UpdateType.UPDATE);
  }

  public static get useOldUI(): boolean {
    return this._instance.data.useOldUI;
  }

  //插件是否开启
  public static ensureEnable(): boolean {
    return this._instance.data.enabled;
  }

  //设置开启关闭
  public static setEnable(enabled: boolean) {
    if (this._instance.data.enabled != enabled) {
      this._instance.data.enabled = enabled;
      Settings.saveSettingsToLocalStorage();
      if (enabled) {
        Backend.applySettings(APPLYTYPE.SET_ALL);
        PluginManager.updateAllComponent(UpdateType.SHOW);
      } else {
        Backend.resetSettings();
        PluginManager.updateAllComponent(UpdateType.HIDE);
      }
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  //获取当前配置文件
  public static ensureApp(): AppSetting {
    const appId = RunningApps.active();

    //没有配置文件的时候新生成一个
    if (!(appId in this._instance.data.perApp)) {
      this._instance.data.perApp[appId] = new AppSettingData();

      // 新生成后如果有默认配置文件，则拷贝默认配置文件
      if (DEFAULT_APP in this._instance.data.perApp) {
        this._instance.data.perApp[appId].defaultSettig.deepCopy(
          this._instance.data.perApp[DEFAULT_APP].defaultSettig
        );
        this._instance.data.perApp[appId].acStting.deepCopy(
          this._instance.data.perApp[DEFAULT_APP].acStting
        );
        this._instance.data.perApp[appId].batSetting.deepCopy(
          this._instance.data.perApp[DEFAULT_APP].batSetting
        );
      }
    }

    if (this._instance.data.perApp[this.ensureAppID()] == undefined) {
      this._instance.data.perApp[this.ensureAppID()] = new AppSettingData();
    }

    // 不开启电源模式覆盖时，返回 id 默认配置
    if (!this._instance.data.perApp[this.ensureAppID()].acStateOverwrite) {
      return this._instance.data.perApp[this.ensureAppID()].defaultSettig;
    }

    // 根据电源模式返回 id 对应的配置
    if (ACStateManager.getACState() === ACState.Connected) {
      return this._instance.data.perApp[this.ensureAppID()].acStting;
    } else {
      return this._instance.data.perApp[this.ensureAppID()].batSetting;
    }
  }

  // static ensureAppID():string{
  //   const appId = RunningApps.active();
  //   if (!(appId in this._instance.data.perApp)) {
  //     this._instance.data.perApp[appId]=new AppSetting();
  //     if(DEFAULT_APP in this._instance.data.perApp){
  //       this._instance.data.perApp[appId].deepCopy(this._instance.data.perApp[DEFAULT_APP]);
  //       return DEFAULT_APP;
  //     }
  //     return appId;
  //   }
  //   if(!this._instance.data.perApp[appId].overwrite){
  //     return DEFAULT_APP;
  //   }
  //   return appId;
  // }

  private static ensureAppID(): string {
    return this._instance.data.perApp[RunningApps.active()]?.overwrite
      ? RunningApps.active()
      : DEFAULT_APP;
  }

  static appOverWrite(): boolean {
    if (RunningApps.active() == DEFAULT_APP) {
      return false;
    }
    return this._instance.data.perApp[RunningApps.active()]?.overwrite ?? false;
  }

  static setOverWrite(overwrite: boolean) {
    if (
      RunningApps.active() != DEFAULT_APP &&
      Settings.appOverWrite() != overwrite
    ) {
      this._instance.data.perApp[RunningApps.active()].overwrite = overwrite;

      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_ALL);
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static saveOverWrite(overwrite: boolean) {
    if (RunningApps.active() != DEFAULT_APP) {
      this._instance.data.perApp[RunningApps.active()].overwrite = overwrite;
      Settings.saveSettingsToLocalStorage();
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static appForceShowTDP(): boolean {
    return this._instance.data.forceShowTDP;
  }

  static setForceShowTDP(forceShowTDP: boolean) {
    if (this._instance.data.forceShowTDP != forceShowTDP) {
      this._instance.data.forceShowTDP = forceShowTDP;
      Settings.saveSettingsToLocalStorage();
      PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
    }
  }

  static appEnableNativeTDPSlider(): boolean {
    return this._instance.data.enableNativeTDPSlider;
  }

  static setEnableNativeTDPSlider(enableNativeTDPSlider: boolean) {
    if (this._instance.data.enableNativeTDPSlider != enableNativeTDPSlider) {
      this._instance.data.enableNativeTDPSlider = enableNativeTDPSlider;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
    }
  }

  static appACStateOverWrite(): boolean {
    return (
      this._instance.data.perApp[Settings.ensureAppID()].acStateOverwrite ??
      false
    );
  }

  static setACStateOverWrite(acStateOverwrite: boolean) {
    if (
      this._instance.data.perApp[Settings.ensureAppID()].acStateOverwrite !=
      acStateOverwrite
    ) {
      this._instance.data.perApp[Settings.ensureAppID()].acStateOverwrite =
        acStateOverwrite;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_ALL);
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static appSmt(): boolean {
    return Settings.ensureApp().smt ?? true;
  }

  static setSmt(smt: boolean) {
    if (Settings.ensureApp().smt != smt) {
      Settings.ensureApp().smt = smt;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPUCORE);
      PluginManager.updateComponent(ComponentName.CPU_SMT, UpdateType.UPDATE);
    }
  }

  static appIsSupportSMT(): boolean {
    return Backend.data?.HasSupportSMT() ? Backend.data?.getSupportSMT() : true;
  }

  static appBypassCharge(): boolean {
    return Settings._instance.data.bypassCharge ?? false;
  }

  static setBypassCharge(bypassCharge: boolean) {
    if (Settings._instance.data.bypassCharge != bypassCharge) {
      Settings._instance.data.bypassCharge = bypassCharge;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_POWER_BATTERY);
      PluginManager.updateComponent(ComponentName.POWER_ALL, UpdateType.UPDATE);
    }
  }

  static appChargeLimit(): number {
    return Settings._instance.data.chargeLimit ?? 100;
  }

  static setChargeLimit(chargeLimit: number) {
    if (Settings._instance.data.chargeLimit != chargeLimit) {
      Settings._instance.data.chargeLimit = chargeLimit;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_POWER_BATTERY);
      PluginManager.updateComponent(ComponentName.POWER_ALL, UpdateType.UPDATE);
    }
  }

  // appEnableChargeLimit
  static appEnableChargeLimit(): boolean {
    return Settings._instance.data.enableChargeLimit ?? true;
  }

  static setEnableChargeLimit(enableChargeLimit: boolean) {
    if (Settings._instance.data.enableChargeLimit != enableChargeLimit) {
      Settings._instance.data.enableChargeLimit = enableChargeLimit;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_POWER_BATTERY);
      PluginManager.updateComponent(ComponentName.POWER_ALL, UpdateType.UPDATE);
    }
  }

  static appCpuNum() {
    return Settings.ensureApp().cpuNum!!;
  }

  static setCpuNum(cpuNum: number) {
    if (Settings.ensureApp().cpuNum != cpuNum) {
      Settings.ensureApp().cpuNum = cpuNum;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPUCORE);
      PluginManager.updateComponent(ComponentName.CPU_NUM, UpdateType.UPDATE);
    }
  }

  static appCpuboost(): boolean {
    return Settings.ensureApp().cpuboost ?? false;
  }

  static setCpuboost(cpuboost: boolean) {
    if (Settings.ensureApp().cpuboost != cpuboost) {
      Settings.ensureApp().cpuboost = cpuboost;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPUBOOST);
      PluginManager.updateComponent(ComponentName.CPU_BOOST, UpdateType.UPDATE);
    }
  }

  static appTDP() {
    return Settings.ensureApp().tdp ?? 15;
  }

  static setTDP(tdp: number) {
    if (Settings.ensureApp().tdp != tdp) {
      Settings.ensureApp().tdp = tdp;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
    }
  }

  static appCpuMaxPerfPct() {
    return Settings.ensureApp().cpuMaxPerfPct ?? 100;
  }

  static appAutoCPUMaxPct() {
    return Settings.ensureApp().autoCPUMaxPct ?? false;
  }

  static setAutoCPUMaxPct(autoPerf: boolean) {
    if (Settings.ensureApp().autoCPUMaxPct != autoPerf) {
      Settings.ensureApp().autoCPUMaxPct = autoPerf;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPU_MAX_PERF);
      PluginManager.updateComponent(
        ComponentName.CPU_PERFORMANCE,
        UpdateType.UPDATE
      );
    }
  }

  static setCpuMaxPerfPct(cpuMaxPerfPct: number) {
    if (Settings.ensureApp().cpuMaxPerfPct != cpuMaxPerfPct) {
      Settings.ensureApp().cpuMaxPerfPct = cpuMaxPerfPct;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPU_MAX_PERF);
      PluginManager.updateComponent(
        ComponentName.CPU_PERFORMANCE,
        UpdateType.UPDATE
      );
    }
  }

  static appEnableCustomTDPRange() {
    return this._instance.data.enableCustomTDPRange;
  }

  static setEnableCustomTDPRange(enableCustomTDPRange: boolean) {
    if (this._instance.data.enableCustomTDPRange != enableCustomTDPRange) {
      this._instance.data.enableCustomTDPRange = enableCustomTDPRange;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(
        ComponentName.CUSTOM_TDP,
        UpdateType.UPDATE
      );
    }
  }

  static appCustomTDPRangeMax() {
    return this._instance.data.customTDPRangeMax;
  }

  static setCustomTDPRangeMax(customTDPRangeMax: number) {
    if (this._instance.data.customTDPRangeMax != customTDPRangeMax) {
      this._instance.data.customTDPRangeMax = customTDPRangeMax;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(
        ComponentName.CUSTOM_TDP,
        UpdateType.UPDATE
      );
    }
  }

  static appCustomTDPRangeMin() {
    // return this._instance.data.customTDPRangeMin;
    return DEFAULT_TDP_MIN;
  }

  // static setCustomTDPRangeMin(customTDPRangeMin: number) {
  //   if (this._instance.data.customTDPRangeMin != customTDPRangeMin) {
  //     this._instance.data.customTDPRangeMin = customTDPRangeMin;
  //     Settings.saveSettingsToLocalStorage();
  //     Backend.applySettings(APPLYTYPE.SET_TDP);
  //     PluginManager.updateComponent(
  //       ComponentName.CUSTOM_TDP,
  //       UpdateType.UPDATE
  //     );
  //   }
  // }

  static appTDPEnable() {
    return Settings.ensureApp().tdpEnable ?? true;
  }

  static setTDPEnable(tdpEnable: boolean) {
    if (Settings.ensureApp().tdpEnable != tdpEnable) {
      Settings.ensureApp().tdpEnable = tdpEnable;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
    }
  }

  static getTDPMax() {
    if (this._instance.data.enableCustomTDPRange) {
      return this._instance.data.customTDPRangeMax;
    } else {
      return Backend.data.getTDPMax();
    }
  }

  static getTDPMin() {
    // if (this._instance.data.enableCustomTDPRange) {
    //   return this._instance.data.customTDPRangeMin;
    // } else {
    //   return 3;
    // }
    return DEFAULT_TDP_MIN;
  }

  static saveTDPFromQAM(tdp: number, tdpEnable: boolean) {
    // 仅保存，不应用。避免和qam监听中的应用逻辑冲突，或者重复应用
    if (
      Settings.ensureApp().tdp != tdp ||
      Settings.ensureApp().tdpEnable != tdpEnable
    ) {
      // console.log("saveTDP", tdp, tdpEnable);
      Settings.ensureApp().tdp = tdp;
      Settings.ensureApp().tdpEnable = tdpEnable;
      Settings.saveSettingsToLocalStorage();
    }
  }

  static appGPUMode() {
    return Settings.ensureApp().gpuMode!!;
  }

  //写入gpu模式配置并应用
  static setGPUMode(gpuMode: GPUMODE) {
    if (Settings.ensureApp().gpuMode != gpuMode) {
      Settings.ensureApp().gpuMode = gpuMode;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(
        ComponentName.GPU_FREQMODE,
        UpdateType.UPDATE
      );
      this._instance.settingChangeEvent.dispatchEvent(
        new Event("GPU_FREQ_Change")
      );
    }
  }

  //监听gpu模式变化
  static addGpuModeEventListener(callback: () => void) {
    this._instance.settingChangeEvent.addEventListener(
      "GPU_FREQ_Change",
      callback
    );
  }

  static removeGpuModeEventListener(callback: () => void) {
    this._instance.settingChangeEvent.removeEventListener(
      "GPU_FREQ_Change",
      callback
    );
  }

  static appGPUFreq() {
    return Settings.ensureApp().gpuFreq!!;
  }

  //写入gpu固定频率并配置
  static setGPUFreq(gpuFreq: number) {
    if (Settings.ensureApp().gpuFreq != gpuFreq) {
      Settings.ensureApp().gpuFreq = gpuFreq;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(
        ComponentName.GPU_FREQFIX,
        UpdateType.UPDATE
      );
    }
  }

  static appGPUAutoMaxFreq() {
    return Settings.ensureApp().gpuAutoMaxFreq!!;
  }

  //写入自动gpu最大频率
  static setGPUAutoMaxFreq(gpuAutoMaxFreq: number) {
    if (Settings.ensureApp().gpuAutoMaxFreq != gpuAutoMaxFreq) {
      Settings.ensureApp().gpuAutoMaxFreq = gpuAutoMaxFreq;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(
        ComponentName.GPU_FREQRANGE,
        UpdateType.UPDATE
      );
    }
  }

  static appGPUAutoMinFreq() {
    return Settings.ensureApp().gpuAutoMinFreq!!;
  }

  //写入自动gpu最小频率
  static setGPUAutoMinFreq(gpuAutoMinFreq: number) {
    if (Settings.ensureApp().gpuAutoMinFreq != gpuAutoMinFreq) {
      Settings.ensureApp().gpuAutoMinFreq = gpuAutoMinFreq;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(
        ComponentName.GPU_FREQRANGE,
        UpdateType.UPDATE
      );
    }
  }

  static appGPURangeMaxFreq() {
    return Settings.ensureApp().gpuRangeMaxFreq!!;
  }

  static appGPURangeMinFreq() {
    return Settings.ensureApp().gpuRangeMinFreq!!;
  }

  //写入gpu范围频率
  static setGPURangeFreq(gpuRangeMaxFreq: number, gpuRangeMinFreq: number) {
    if (
      Settings.ensureApp().gpuRangeMaxFreq != gpuRangeMaxFreq ||
      Settings.ensureApp().gpuRangeMinFreq != gpuRangeMinFreq
    ) {
      Settings.ensureApp().gpuRangeMaxFreq = gpuRangeMaxFreq;
      Settings.ensureApp().gpuRangeMinFreq = gpuRangeMinFreq;
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      Settings.saveSettingsToLocalStorage();
      PluginManager.updateComponent(
        ComponentName.GPU_FREQRANGE,
        UpdateType.UPDATE
      );
    }
  }

  static appGPUSliderFix(): boolean {
    return Settings.ensureApp().gpuSliderFix!!;
  }

  static setGPUSliderFix(gpuSliderFix: boolean) {
    if (Settings.ensureApp().gpuSliderFix != gpuSliderFix) {
      Settings.ensureApp().gpuSliderFix = gpuSliderFix;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUSLIDERFIX);
      PluginManager.updateComponent(
        ComponentName.GPU_SLIDERFIX,
        UpdateType.UPDATE
      );
      PluginManager.updateComponent(
        ComponentName.GPU_FREQMODE,
        UpdateType.UPDATE
      );
      this._instance.settingChangeEvent.dispatchEvent(
        new Event("GPU_FREQ_Change")
      );
    }
  }

  //风扇配置文件名称
  static appFanSettingNameList() {
    //长度不一致时补齐或截断
    if (
      (Settings.ensureApp().fanProfileNameList?.length ?? 0) !=
      Backend.data.getFanCount()
    ) {
      var newArray = new Array(Backend.data.getFanCount());
      Settings.ensureApp().fanProfileNameList?.forEach((value, index) => {
        if (index >= newArray.length) return;
        newArray[index] = value;
      });
      Settings.ensureApp().fanProfileNameList = newArray;
    }
    //console.log("appFanSettingNameList=",Settings.ensureApp().fanProfileNameList,"(Settings.ensureApp().fanProfileNameList?.length??0)=",(Settings.ensureApp().fanProfileNameList?.length??0),"Backend.data.getFanCount()=",Backend.data.getFanCount())
    return Settings.ensureApp().fanProfileNameList ?? [];
  }

  //风扇配置文件内容
  static appFanSettings() {
    var fanProfileName = Settings.appFanSettingNameList();
    var fanSettings: FanSetting[] = new Array(Backend.data.getFanCount());
    fanProfileName?.forEach((fanProfileName, index) => {
      if (fanProfileName) {
        fanSettings[index] = this._instance.data.fanSettings[fanProfileName];
      }
    });
    return fanSettings;
  }

  //设置使用的风扇配置文件名称
  static setAppFanSettingName(
    fanProfileName: string | undefined,
    index: number,
    force: boolean = false
  ) {
    if (force || Settings.appFanSettingNameList()[index] != fanProfileName) {
      Settings.appFanSettingNameList()[index] = fanProfileName;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_FAN_ALL);
      PluginManager.updateComponent(ComponentName.FAN_ALL, UpdateType.UPDATE);
    }
  }

  //添加一个风扇配置
  static addFanSetting(fanProfileName: string, fanSetting: FanSetting) {
    if (fanProfileName != undefined) {
      this._instance.data.fanSettings[fanProfileName] = fanSetting;
      Settings.saveSettingsToLocalStorage();
      return true;
    } else {
      return false;
    }
  }

  //修改一个风扇配置
  static editFanSetting(
    fanProfileName: string,
    newfanProfileName: string,
    fanSetting: FanSetting
  ) {
    if (
      newfanProfileName &&
      fanProfileName in this._instance.data.fanSettings
    ) {
      if (fanProfileName == newfanProfileName) {
        this._instance.data.fanSettings[fanProfileName] = fanSetting;
      } else {
        this._instance.data.fanSettings[newfanProfileName] = fanSetting;
        Object.entries(this._instance.data.perApp)?.forEach(
          ([_appID, appSettings]) => {
            appSettings.defaultSettig.fanProfileNameList?.forEach(
              (value, index) => {
                if (fanProfileName == value) {
                  appSettings.defaultSettig.fanProfileNameList!![index] =
                    newfanProfileName;
                }
              }
            );

            appSettings.acStting.fanProfileNameList?.forEach((value, index) => {
              if (fanProfileName == value) {
                appSettings.acStting.fanProfileNameList!![index] =
                  newfanProfileName;
              }
            });

            appSettings.batSetting.fanProfileNameList?.forEach(
              (value, index) => {
                if (fanProfileName == value) {
                  appSettings.batSetting.fanProfileNameList!![index] =
                    newfanProfileName;
                }
              }
            );
          }
        );
        delete this._instance.data.fanSettings[fanProfileName];
      }
      return true;
    } else {
      return false;
    }
  }

  //删除一个风扇配置
  static removeFanSetting(fanProfileName: string) {
    if (fanProfileName in this._instance.data.fanSettings) {
      delete this._instance.data.fanSettings[fanProfileName];
      Object.entries(this._instance.data.perApp)?.forEach(
        ([_appID, appSettings]) => {
          appSettings.defaultSettig.fanProfileNameList?.forEach(
            (value, index) => {
              if (fanProfileName == value) {
                appSettings.defaultSettig.fanProfileNameList!![index] =
                  this._instance.data.perApp[
                    DEFAULT_APP
                  ].defaultSettig.fanProfileNameList?.[index];
              }
            }
          );

          appSettings.acStting.fanProfileNameList?.forEach((value, index) => {
            if (fanProfileName == value) {
              appSettings.acStting.fanProfileNameList!![index] =
                this._instance.data.perApp[
                  DEFAULT_APP
                ].acStting.fanProfileNameList?.[index];
            }
          });

          appSettings.batSetting.fanProfileNameList?.forEach((value, index) => {
            if (fanProfileName == value) {
              appSettings.batSetting.fanProfileNameList!![index] =
                this._instance.data.perApp[
                  DEFAULT_APP
                ].batSetting.fanProfileNameList?.[index];
            }
          });
        }
      );
      Settings.saveSettingsToLocalStorage();
    }
  }

  //获取风扇配置列表
  static getFanSettings(): { [fanProfile: string]: FanSetting } {
    return this._instance.data.fanSettings;
  }

  //获取风扇配置
  static getFanSetting(fanProfileName: string): FanSetting {
    return this._instance.data.fanSettings?.[fanProfileName];
  }

  // @ts-ignore
  private static loadSettingsFromLocalStorage() {
    const settingsString = localStorage.getItem(SETTINGS_KEY) || "{}";
    const settingsJson = JSON.parse(settingsString);
    const loadSetting = serializer.deserializeObject(
      settingsJson,
      SettingsData
    );
    this._instance.data.deepCopy(loadSetting ?? new SettingsData());
  }

  public static async loadSettings() {
    // 从后端获取配置
    const settingsData = await Backend.getSettings();
    if (settingsData) {
      this._instance.data.deepCopy(settingsData);
    }
    // else {
    //   // 从本地存储获取配置 （兼容旧版本数据）
    //   this.loadSettingsFromLocalStorage();
    // }
  }

  static saveSettingsToLocalStorage() {
    // const settingsJsonObj = serializer.serializeObject(this._instance.data);
    // const settingsString = JSON.stringify(settingsJsonObj);
    // console.log(`>>>>> saveSettingsToLocalStorage: \n${settingsString}`);
    // localStorage.setItem(SETTINGS_KEY, settingsString);
    Backend.setSettings(this._instance.data);
  }

  static resetToLocalStorage(apply = true) {
    console.log(">>>>>  resetToLocalStorage");
    localStorage.removeItem(SETTINGS_KEY);
    const _data = new SettingsData();
    Backend.setSettings(_data);
    Settings._instance.data.deepCopy(_data);
    // Settings.loadSettingsFromLocalStorage();
    if (apply) {
      Backend.applySettings(APPLYTYPE.SET_ALL);
    }
  }

  static appCPUGovernor(): string {
    return Settings.ensureApp().cpuGovernor || "performance";
  }

  static setCPUGovernor(governor: string) {
    const app = Settings.ensureApp();
    app.cpuGovernor = governor;
    Backend.applySettings(APPLYTYPE.SET_CPU_GOVERNOR);
    PluginManager.updateComponent(
      ComponentName.CPU_GOVERNOR,
      UpdateType.UPDATE
    );
    this.saveSettingsToLocalStorage();
    this._instance.settingChangeEvent.dispatchEvent(
      new Event("CPU_GOVERNOR_Change")
    );
  }

  // 监听 CPU 调度器变化
  static addCpuGovernorEventListener(callback: () => void) {
    this._instance.settingChangeEvent.addEventListener(
      "CPU_GOVERNOR_Change",
      callback
    );
  }

  static removeCpuGovernorEventListener(callback: () => void) {
    this._instance.settingChangeEvent.removeEventListener(
      "CPU_GOVERNOR_Change",
      callback
    );
  }

  // 获取当前 EPP 模式
  public static appEPPMode(): string {
    return this.ensureApp().epp || "performance";
  }

  // 设置 EPP 模式
  public static setEPP(epp: string) {
    const app = this.ensureApp();
    app.epp = epp;
    this.saveSettingsToLocalStorage();
    Backend.applySettings(APPLYTYPE.SET_EPP);
    PluginManager.updateComponent(ComponentName.CPU_EPP, UpdateType.UPDATE);
    this._instance.settingChangeEvent.dispatchEvent(
      new CustomEvent(APPLYTYPE.SET_EPP, { detail: epp })
    );
  }

  // 监听 EPP 模式变化
  public static addEppEventListener(callback: () => void) {
    this._instance.settingChangeEvent.addEventListener(
      APPLYTYPE.SET_EPP,
      callback
    );
  }

  // 移除 EPP 模式变化监听
  public static removeEppEventListener(callback: () => void) {
    this._instance.settingChangeEvent.removeEventListener(
      APPLYTYPE.SET_EPP,
      callback
    );
  }
}
