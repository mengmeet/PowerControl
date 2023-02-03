import { JsonObject, JsonProperty, JsonSerializer } from 'typescript-json-serializer';
import { APPLYTYPE, ComponentName, GPUMODE, UpdateType } from './enum';
import { Backend } from './backend';
import { DEFAULT_APP, PluginManager, RunningApps } from './pluginMain';

const SETTINGS_KEY = "PowerControl";
const serializer = new JsonSerializer();

@JsonObject()
export class AppSetting {
  @JsonProperty()
  overwrite?: boolean;
  @JsonProperty()
  smt?: boolean;
  @JsonProperty()
  cpuNum?: number;
  @JsonProperty()
  cpuboost?: boolean;
  @JsonProperty()
  tdp?:number;
  @JsonProperty()
  tdpEnable?:boolean
  @JsonProperty()
  gpuMode?:number
  @JsonProperty()
  gpuFreq?:number
  @JsonProperty()
  gpuAutoMaxFreq?:number
  @JsonProperty()
  gpuAutoMinFreq?:number
  @JsonProperty()
  gpuRangeMaxFreq?:number
  @JsonProperty()
  gpuRangeMinFreq?:number
  constructor(){
    this.overwrite=false;
    this.smt=false;
    this.cpuNum=Backend.data?.HasCpuMaxNum()?Backend.data?.getCpuMaxNum():4;
    this.cpuboost=false;
    this.tdpEnable=true;
    this.tdp=Backend.data?.HasTDPMax()?Backend.data?.getTDPMax()/2:15;
    this.gpuMode=GPUMODE.NOLIMIT;
    this.gpuFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuAutoMaxFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuAutoMinFreq=200;
    this.gpuRangeMaxFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuRangeMinFreq=200;
  }
  deepCopy(copyTarget:AppSetting){
    this.overwrite=copyTarget.overwrite;
    this.smt=copyTarget.smt;
    this.cpuNum=copyTarget.cpuNum;
    this.cpuboost=copyTarget.cpuboost;
    this.tdpEnable=copyTarget.tdpEnable;
    this.tdp=copyTarget.tdp;
    this.gpuMode=copyTarget.gpuMode;
    this.gpuFreq=copyTarget.gpuFreq;
    this.gpuAutoMaxFreq=copyTarget.gpuAutoMaxFreq;
    this.gpuAutoMinFreq=copyTarget.gpuAutoMinFreq;
    this.gpuRangeMaxFreq=copyTarget.gpuRangeMaxFreq;
    this.gpuRangeMinFreq=copyTarget.gpuAutoMinFreq;
  }
}

@JsonObject()
export class Settings {
  private static _instance:Settings = new Settings();
  @JsonProperty()
  public enabled: boolean = true;
  @JsonProperty({ isDictionary: true, type: AppSetting })
  public perApp: { [appId: string]: AppSetting } = {};

  //插件是否开启
  public static ensureEnable():boolean{
    return this._instance.enabled;
  }

  //设置开启关闭
  public static setEnable(enabled:boolean){
    if(this._instance.enabled != enabled){
      this._instance.enabled = enabled;
      Settings.saveSettingsToLocalStorage();
      if(enabled){
        Backend.applySettings(APPLYTYPE.SET_ALL);
        PluginManager.updateAllComponent(UpdateType.SHOW);
      }else{
        Backend.resetSettings();
        PluginManager.updateAllComponent(UpdateType.HIDE);
      }
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  //获取当前配置文件
  public static ensureApp(): AppSetting {
    const appId = RunningApps.active() 
    //没有配置文件的时候新生成一个
    if (!(appId in this._instance.perApp)) {
      this._instance.perApp[appId]=new AppSetting();
      //新生成后如果有默认配置文件，则拷贝默认配置文件
      if(DEFAULT_APP in this._instance.perApp)
        this._instance.perApp[appId].deepCopy(this._instance.perApp[DEFAULT_APP]);
    }
    //如果未开启覆盖，则使用默认配置文件
    if(!this._instance.perApp[appId].overwrite){
      return this._instance.perApp[DEFAULT_APP];
    }
    //使用appID配置文件
    return this._instance.perApp[appId];
  }

  static currentSettingAppID():string{
    const appId = RunningApps.active() 
    if (!(appId in this._instance.perApp)) {
      this._instance.perApp[appId]=new AppSetting();
      if(DEFAULT_APP in this._instance.perApp){
        this._instance.perApp[appId].deepCopy(this._instance.perApp[DEFAULT_APP]);
        return DEFAULT_APP;
      }
      return appId;
    }
    if(!this._instance.perApp[appId].overwrite){
      return DEFAULT_APP;
    }
    return appId;
  }

  static appOverWrite():boolean {
    if(RunningApps.active()==DEFAULT_APP){
      return false;
    }
    return Settings.ensureApp().overwrite!!;
  }
  static setOverWrite(overwrite:boolean){
    if(RunningApps.active()!=DEFAULT_APP&&Settings.appOverWrite()!=overwrite){
      Settings._instance.perApp[RunningApps.active()].overwrite=overwrite;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_ALL);
      PluginManager.updateAllComponent(UpdateType.UPDATE);
    }
  }

  static appSmt(): boolean {
    return Settings.ensureApp().smt!!;
  }

  static setSmt(smt:boolean) {
    if(Settings.ensureApp().smt!=smt){
      Settings.ensureApp().smt=smt;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPUCORE);
      PluginManager.updateComponent(ComponentName.CPU_SMT,UpdateType.UPDATE);
    }
  }
  
  static appCpuNum() {
    return Settings.ensureApp().cpuNum!!;
  }

  static setCpuNum(cpuNum:number) {
    if(Settings.ensureApp().cpuNum!=cpuNum){
      Settings.ensureApp().cpuNum=cpuNum;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPUCORE);
      PluginManager.updateComponent(ComponentName.CPU_NUM,UpdateType.UPDATE);
    }
  }

  static appCpuboost(): boolean {
    return Settings.ensureApp().cpuboost!!;
  }

  static setCpuboost(cpuboost:boolean) {
    if(Settings.ensureApp().cpuboost!=cpuboost){
      Settings.ensureApp().cpuboost=cpuboost;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_CPUBOOST);
      PluginManager.updateComponent(ComponentName.CPU_BOOST,UpdateType.UPDATE);
    }
  }

  static appTDP() {
    return Settings.ensureApp().tdp!!;
  }

  static setTDP(tdp:number) {
    if(Settings.ensureApp().tdp!=tdp){
      Settings.ensureApp().tdp=tdp;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(ComponentName.CPU_TDP,UpdateType.UPDATE);
    }
  }

  static appTDPEnable(){
    return Settings.ensureApp().tdpEnable!!;
  }

  static setTDPEnable(tdpEnable:boolean) {
    if(Settings.ensureApp().tdpEnable!=tdpEnable){
      Settings.ensureApp().tdpEnable=tdpEnable;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_TDP);
      PluginManager.updateComponent(ComponentName.CPU_TDP,UpdateType.UPDATE);
    }
  }

  static appGPUMode(){
    return Settings.ensureApp().gpuMode!!;
  }
  //写入gpu模式配置并应用
  static setGPUMode(gpuMode:GPUMODE){
    if(Settings.ensureApp().gpuMode!=gpuMode){
      Settings.ensureApp().gpuMode=gpuMode;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(ComponentName.GPU_FREQMODE,UpdateType.UPDATE);
      
    }
  }

  static appGPUFreq(){
    return Settings.ensureApp().gpuFreq!!;
  }

  //写入gpu固定频率并配置
  static setGPUFreq(gpuFreq:number){
    if(Settings.ensureApp().gpuFreq!=gpuFreq){
      Settings.ensureApp().gpuFreq=gpuFreq;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(ComponentName.GPU_FREQFIX,UpdateType.UPDATE);
    }
  }

  static appGPUAutoMaxFreq(){
    return Settings.ensureApp().gpuAutoMaxFreq!!;
  }

  //写入自动gpu最大频率
  static setGPUAutoMaxFreq(gpuAutoMaxFreq:number){
    if(Settings.ensureApp().gpuAutoMaxFreq!=gpuAutoMaxFreq){
      Settings.ensureApp().gpuAutoMaxFreq=gpuAutoMaxFreq;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(ComponentName.GPU_FREQRANGE,UpdateType.UPDATE);
    }
  }

  static appGPUAutoMinFreq(){
    return Settings.ensureApp().gpuAutoMinFreq!!;
  }

  //写入自动gpu最小频率
  static setGPUAutoMinFreq(gpuAutoMinFreq:number){
    if(Settings.ensureApp().gpuAutoMinFreq!=gpuAutoMinFreq){
      Settings.ensureApp().gpuAutoMinFreq=gpuAutoMinFreq;
      Settings.saveSettingsToLocalStorage();
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      PluginManager.updateComponent(ComponentName.GPU_FREQRANGE,UpdateType.UPDATE);
    }
  }

  static appGPURangeMaxFreq(){
    return Settings.ensureApp().gpuRangeMaxFreq!!;
  }

  static appGPURangeMinFreq(){
    return Settings.ensureApp().gpuRangeMinFreq!!;
  }

  //写入gpu范围频率
  static setGPURangeFreq(gpuRangeMaxFreq:number,gpuRangeMinFreq:number){
    if(Settings.ensureApp().gpuRangeMaxFreq!=gpuRangeMaxFreq||Settings.ensureApp().gpuRangeMinFreq!=gpuRangeMinFreq){
      Settings.ensureApp().gpuRangeMaxFreq=gpuRangeMaxFreq;
      Settings.ensureApp().gpuRangeMinFreq=gpuRangeMinFreq;
      Backend.applySettings(APPLYTYPE.SET_GPUMODE);
      Settings.saveSettingsToLocalStorage();
      PluginManager.updateComponent(ComponentName.GPU_FREQRANGE,UpdateType.UPDATE);
    }
  }

  static loadSettingsFromLocalStorage(){
    const settingsString = localStorage.getItem(SETTINGS_KEY) || "{}";
    const settingsJson = JSON.parse(settingsString);
    const loadSetting=serializer.deserializeObject(settingsJson, Settings);
    this._instance.enabled = loadSetting?loadSetting.enabled:false;
    this._instance.perApp = loadSetting?loadSetting.perApp:{};
  }

  static saveSettingsToLocalStorage() {
    const settingsJson = serializer.serializeObject(this._instance);
    const settingsString = JSON.stringify(settingsJson);
    localStorage.setItem(SETTINGS_KEY, settingsString);
  }

}
