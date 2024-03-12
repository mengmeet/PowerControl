import {
  JsonObject,
  JsonProperty,
  JsonSerializer,
} from "typescript-json-serializer";
import { APPLYTYPE, ComponentName, FANMODE, GPUMODE, UpdateType } from "./enum";
import { Backend } from "./backend";
import { fanPosition } from "./position";
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
  // @JsonProperty()
  // overwrite?: boolean;
  @JsonProperty()
  smt?: boolean;
  @JsonProperty()
  isSupportSMT?: boolean;
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
  constructor() {
    // this.overwrite=false;
    this.smt = true;
    this.isSupportSMT = Backend.data?.HasSupportSMT()
      ? Backend.data?.getSupportSMT()
      : true;
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
  }
  deepCopy(copyTarget: AppSetting) {
    // this.overwrite=copyTarget.overwrite;
    this.smt = copyTarget.smt;
    this.isSupportSMT = copyTarget.isSupportSMT;
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
  @JsonProperty({ type: fanPosition })
  curvePoints?: fanPosition[] = [];
  constructor(
    snapToGrid: boolean,
    fanMode: number,
    fixSpeed: number,
    curvePoints: fanPosition[]
  ) {
    this.snapToGrid = snapToGrid;
    this.fanMode = fanMode;
    this.fixSpeed = fixSpeed;
    this.curvePoints = curvePoints;
  }
}

@JsonObject()
export class AppSettingData {
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
    this.acStateOverwrite = false;
    this.defaultSettig = new AppSetting();
    this.acStting = new AppSetting();
    this.batSetting = new AppSetting();
  }
}

@JsonObject()
export class Settings {
  private static _instance: Settings = new Settings();

  @JsonProperty()
  public enabled: boolean = true;

  // 依据 appID 覆盖配置，作为全局开关而不是单个配置中的开关
  @JsonProperty()
  overwrite?: boolean;

  @JsonProperty({ isDictionary: true, type: AppSettingData })
  public perApp: { [appId: string]: AppSettingData } = {};

  @JsonProperty({ isDictionary: true, type: FanSetting })
  public fanSettings: { [fanProfile: string]: FanSetting } = {};

  @JsonProperty()
  public enableCustomTDPRange: boolean = false;

  @JsonProperty()
  public customTDPRangeMax: number;

  @JsonProperty()
  public customTDPRangeMin: number;

  constructor() {
    this.customTDPRangeMax = DEFAULT_TDP_MAX;
    this.customTDPRangeMin = DEFAULT_TDP_MIN;
  }

  public settingChangeEvent = new EventTarget();
  //插件是否开启
  public static ensureEnable(): boolean {
    return this._instance.enabled;
  }

  //设置开启关闭
  public static setEnable(enabled: boolean) {
    if (this._instance.enabled != enabled) {
      this._instance.enabled = enabled;
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
    if (!(appId in this._instance.perApp)) {
      this._instance.perApp[appId] = new AppSettingData();

      // 新生成后如果有默认配置文件，则拷贝默认配置文件
      if (DEFAULT_APP in this._instance.perApp) {
        this._instance.perApp[appId].defaultSettig.deepCopy(
          this._instance.perApp[DEFAULT_APP].defaultSettig
        );
        this._instance.perApp[appId].acStting.deepCopy(
          this._instance.perApp[DEFAULT_APP].acStting
        );
        this._instance.perApp[appId].batSetting.deepCopy(
          this._instance.perApp[DEFAULT_APP].batSetting
        );
      }
    }

    // 根据是否覆盖确定配置 id
    const _appId = this._instance.overwrite ? appId : DEFAULT_APP;

    // 不开启电源模式覆盖时，返回 id 默认配置
    if (!this._instance.perApp[_appId].acStateOverwrite) {
      return this._instance.perApp[_appId].defaultSettig;
    }

    // 根据电源模式返回 id 对应的配置
    if (ACStateManager.getACState() === ACState.Connected) {
      return this._instance.perApp[_appId].acStting;
    } else {
      return this._instance.perApp[_appId].batSetting;
    }
  }

  // static ensureAppID():string{
  //   const appId = RunningApps.active();
  //   if (!(appId in this._instance.perApp)) {
  //     this._instance.perApp[appId]=new AppSetting();
  //     if(DEFAULT_APP in this._instance.perApp){
  //       this._instance.perApp[appId].deepCopy(this._instance.perApp[DEFAULT_APP]);
  //       return DEFAULT_APP;
  //     }
  //     return appId;
  //   }
  //   if(!this._instance.perApp[appId].overwrite){
  //     return DEFAULT_APP;
  //   }
  //   return appId;
  // }

  static ensureAppID(): string {
    return this._instance.overwrite ? RunningApps.active() : DEFAULT_APP;
  }

  static appOverWrite(): boolean {
    if (RunningApps.active() == DEFAULT_APP) {
      return false;
    }
    // return Settings.ensureApp().overwrite!!;
    return this._instance.overwrite ?? false;
  }
  static setOverWrite(overwrite: boolean) {
    if (
      RunningApps.active() != DEFAULT_APP &&
      Settings.appOverWrite() != overwrite
    ) {
      // Settings._instance.perApp[RunningApps.active()].overwrite=overwrite;
      this._instance.overwrite = overwrite;

      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_ALL);
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static saveOverWrite(overwrite: boolean) {
    if (RunningApps.active() != DEFAULT_APP) {
      this._instance.overwrite = overwrite;
      Settings.saveSettingsToLocalStorage();
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static appACStateOverWrite(): boolean {
    return (
      this._instance.perApp[Settings.ensureAppID()].acStateOverwrite ?? false
    );
  }

  static setACStateOverWrite(acStateOverwrite: boolean) {
    if (
      this._instance.perApp[Settings.ensureAppID()].acStateOverwrite !=
      acStateOverwrite
    ) {
      this._instance.perApp[Settings.ensureAppID()].acStateOverwrite =
        acStateOverwrite;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_ALL);
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static appSmt(): boolean {
    return Settings.ensureApp().smt!!;
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
    return Settings.ensureApp().isSupportSMT!!;
  }

  static setIsSupportSMT(isSupportSMT: boolean) {
    if (Settings.ensureApp().isSupportSMT != isSupportSMT) {
      Settings.ensureApp().isSupportSMT = isSupportSMT;
      Settings.saveSettingsToLocalStorage();
      PluginManager.updateComponent(ComponentName.CPU_SMT, UpdateType.UPDATE);
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
    return Settings.ensureApp().cpuboost!!;
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
    return Settings.ensureApp().tdp!!;
  }

  static setTDP(tdp: number) {
    if (Settings.ensureApp().tdp != tdp) {
      Settings.ensureApp().tdp = tdp;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(ComponentName.CPU_TDP, UpdateType.UPDATE);
    }
  }

  static appEnableCustomTDPRange() {
    return this._instance.enableCustomTDPRange;
  }

  static setEnableCustomTDPRange(enableCustomTDPRange: boolean) {
    if (this._instance.enableCustomTDPRange != enableCustomTDPRange) {
      this._instance.enableCustomTDPRange = enableCustomTDPRange;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(
        ComponentName.CUSTOM_TDP,
        UpdateType.UPDATE
      );
    }
  }

  static appCustomTDPRangeMax() {
    return this._instance.customTDPRangeMax;
  }

  static setCustomTDPRangeMax(customTDPRangeMax: number) {
    if (this._instance.customTDPRangeMax != customTDPRangeMax) {
      this._instance.customTDPRangeMax = customTDPRangeMax;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(
        ComponentName.CUSTOM_TDP,
        UpdateType.UPDATE
      );
    }
  }

  static appCustomTDPRangeMin() {
    return this._instance.customTDPRangeMin;
  }

  static setCustomTDPRangeMin(customTDPRangeMin: number) {
    if (this._instance.customTDPRangeMin != customTDPRangeMin) {
      this._instance.customTDPRangeMin = customTDPRangeMin;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(
        ComponentName.CUSTOM_TDP,
        UpdateType.UPDATE
      );
    }
  }

  static appTDPEnable() {
    return Settings.ensureApp().tdpEnable!!;
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
    if (this._instance.enableCustomTDPRange) {
      return this._instance.customTDPRangeMax;
    } else {
      return Backend.data.getTDPMax();
    }
  }

  static getTDPMin() {
    if (this._instance.enableCustomTDPRange) {
      return this._instance.customTDPRangeMin;
    } else {
      return 3;
    }
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
    return Settings.ensureApp().fanProfileNameList!!;
  }

  //风扇配置文件内容
  static appFanSettings() {
    var fanProfileName = Settings.appFanSettingNameList();
    var fanSettings: FanSetting[] = new Array(Backend.data.getFanCount());
    fanProfileName?.forEach((fanProfileName, index) => {
      if (fanProfileName) {
        fanSettings[index] = this._instance.fanSettings[fanProfileName];
      }
    });
    return fanSettings;
  }

  //设置使用的风扇配置文件名称
  static setAppFanSettingName(
    fanProfileName: string | undefined,
    index: number
  ) {
    if (Settings.appFanSettingNameList()[index] != fanProfileName) {
      Settings.appFanSettingNameList()[index] = fanProfileName;
      Settings.saveSettingsToLocalStorage();
      //Backend.applySettings(APPLYTYPE.SET_FAN);
    }
  }

  //添加一个风扇配置
  static addFanSetting(fanProfileName: string, fanSetting: FanSetting) {
    if (fanProfileName != undefined) {
      this._instance.fanSettings[fanProfileName] = fanSetting;
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
    if (newfanProfileName && fanProfileName in this._instance.fanSettings) {
      if (fanProfileName == newfanProfileName) {
        this._instance.fanSettings[fanProfileName] = fanSetting;
      } else {
        this._instance.fanSettings[newfanProfileName] = fanSetting;
        Object.entries(this._instance.perApp)?.forEach(
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
        delete this._instance.fanSettings[fanProfileName];
      }
      return true;
    } else {
      return false;
    }
  }

  //删除一个风扇配置
  static removeFanSetting(fanProfileName: string) {
    if (fanProfileName in this._instance.fanSettings) {
      delete this._instance.fanSettings[fanProfileName];
      Object.entries(this._instance.perApp)?.forEach(
        ([_appID, appSettings]) => {
          appSettings.defaultSettig.fanProfileNameList?.forEach(
            (value, index) => {
              if (fanProfileName == value) {
                appSettings.defaultSettig.fanProfileNameList!![index] =
                  this._instance.perApp[
                    DEFAULT_APP
                  ].defaultSettig.fanProfileNameList?.[index];
              }
            }
          );

          appSettings.acStting.fanProfileNameList?.forEach((value, index) => {
            if (fanProfileName == value) {
              appSettings.acStting.fanProfileNameList!![index] =
                this._instance.perApp[
                  DEFAULT_APP
                ].acStting.fanProfileNameList?.[index];
            }
          });

          appSettings.batSetting.fanProfileNameList?.forEach((value, index) => {
            if (fanProfileName == value) {
              appSettings.batSetting.fanProfileNameList!![index] =
                this._instance.perApp[
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
    return this._instance.fanSettings;
  }

  //获取风扇配置
  static getFanSetting(fanProfileName: string): FanSetting {
    return this._instance.fanSettings?.[fanProfileName];
  }

  static loadSettingsFromLocalStorage() {
    const settingsString = localStorage.getItem(SETTINGS_KEY) || "{}";
    const settingsJson = JSON.parse(settingsString);
    const loadSetting = serializer.deserializeObject(settingsJson, Settings);
    this._instance.enabled = loadSetting ? loadSetting.enabled : false;
    this._instance.perApp = loadSetting ? loadSetting.perApp : {};
    this._instance.fanSettings = loadSetting ? loadSetting.fanSettings : {};

    this._instance.overwrite = loadSetting ? loadSetting.overwrite : false;
    this._instance.enableCustomTDPRange = loadSetting
      ? loadSetting.enableCustomTDPRange
      : false;
    this._instance.customTDPRangeMax = loadSetting
      ? loadSetting.customTDPRangeMax
      : 30;
    this._instance.customTDPRangeMin = loadSetting
      ? loadSetting.customTDPRangeMin
      : 5;
  }

  static saveSettingsToLocalStorage() {
    const settingsJson = serializer.serializeObject(this._instance);
    const settingsString = JSON.stringify(settingsJson);
    localStorage.setItem(SETTINGS_KEY, settingsString);
  }
}
