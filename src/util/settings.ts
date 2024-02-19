import { JsonObject, JsonProperty, JsonSerializer } from 'typescript-json-serializer';
import { APPLYTYPE, ComponentName, FANMODE, GPUMODE, UpdateType } from './enum';
import { Backend } from './backend';
import { fanPosition } from './position';
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
  isSupportSMT?: boolean;
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
  //@JsonProperty()
  //gpuFreq?:number
  @JsonProperty()
  gpuAutoMaxFreq?:number
  @JsonProperty()
  gpuAutoMinFreq?:number
  @JsonProperty()
  gpuRangeMaxFreq?:number
  @JsonProperty()
  gpuRangeMinFreq?:number
  @JsonProperty()
  fanProfileNameList?:string[]|undefined[];
  constructor(){
    this.overwrite=false;
    this.smt=true;
    this.isSupportSMT=Backend.data?.HasSupportSMT()?Backend.data?.getSupportSMT():true;
    this.cpuNum=Backend.data?.HasCpuMaxNum()?Backend.data?.getCpuMaxNum():4;
    this.cpuboost=false;
    //this.tdpEnable=true;
    //this.tdp=Backend.data?.HasTDPMax()?Math.trunc(Backend.data?.getTDPMax()/2):15;
    this.gpuMode=GPUMODE.NATIVE;
    //this.gpuFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuAutoMaxFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuAutoMinFreq=Backend.data?.HasGPUFreqMin()?Backend.data.getGPUFreqMin():200;
    this.gpuRangeMaxFreq=Backend.data?.HasGPUFreqMax()?Backend.data.getGPUFreqMax():1600;
    this.gpuRangeMinFreq=Backend.data?.HasGPUFreqMin()?Backend.data.getGPUFreqMin():200;
    this.fanProfileNameList=[]
  }
  deepCopy(copyTarget:AppSetting){
    this.overwrite=copyTarget.overwrite;
    this.smt=copyTarget.smt;
    this.isSupportSMT=copyTarget.isSupportSMT;
    this.cpuNum=copyTarget.cpuNum;
    this.cpuboost=copyTarget.cpuboost;
    //this.tdpEnable=copyTarget.tdpEnable;
    //this.tdp=copyTarget.tdp;
    this.gpuMode=copyTarget.gpuMode;
    //this.gpuFreq=copyTarget.gpuFreq;
    this.gpuAutoMaxFreq=copyTarget.gpuAutoMaxFreq;
    this.gpuAutoMinFreq=copyTarget.gpuAutoMinFreq;
    this.gpuRangeMaxFreq=copyTarget.gpuRangeMaxFreq;
    this.gpuRangeMinFreq=copyTarget.gpuAutoMinFreq;
    this.fanProfileNameList=copyTarget.fanProfileNameList?.slice();
  }
}

@JsonObject()
export class FanSetting{
  @JsonProperty()
  snapToGrid?:boolean = false;
  @JsonProperty()
  fanMode?:number = FANMODE.NOCONTROL
  @JsonProperty()
  fixSpeed?:number = 50;
  @JsonProperty({type:fanPosition})
  curvePoints?:fanPosition[] = []
  constructor(snapToGrid:boolean,fanMode:number,fixSpeed:number,curvePoints:fanPosition[]){
    this.snapToGrid=snapToGrid;
    this.fanMode=fanMode;
    this.fixSpeed=fixSpeed;
    this.curvePoints = curvePoints;
  }
}

@JsonObject()
export class Settings {
  private static _instance:Settings = new Settings();
  @JsonProperty()
  public enabled: boolean = true;
  @JsonProperty({isDictionary:true, type: AppSetting })
  public perApp: { [appId: string]: AppSetting } = {};
  @JsonProperty({isDictionary:true, type: FanSetting })
  public fanSettings: { [fanProfile: string]: FanSetting } = {};
  public settingChangeEvent = new EventTarget();
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
    const appId = RunningApps.active(); 
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

  static ensureAppID():string{
    const appId = RunningApps.active();
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

  static appIsSupportSMT(): boolean {
    return Settings.ensureApp().isSupportSMT!!;
  }

  static setIsSupportSMT(isSupportSMT:boolean) {
    if(Settings.ensureApp().isSupportSMT!=isSupportSMT){
      Settings.ensureApp().isSupportSMT=isSupportSMT;
      Settings.saveSettingsToLocalStorage();
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
      this._instance.settingChangeEvent.dispatchEvent(new Event("GPU_FREQ_Change"))
    }
  }

  //监听gpu模式变化
  static addGpuModeEventListener(callback:()=>void){
    this._instance.settingChangeEvent.addEventListener("GPU_FREQ_Change",callback)
  }

  static removeGpuModeEventListener(callback: () => void) {
    this._instance.settingChangeEvent.removeEventListener("GPU_FREQ_Change", callback);
  }
  /*
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
  */

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

  //风扇配置文件名称
  static appFanSettingNameList(){
    //长度不一致时补齐或截断
    if((Settings.ensureApp().fanProfileNameList?.length??0)!=Backend.data.getFanCount()){
      var newArray = new Array(Backend.data.getFanCount())
      Settings.ensureApp().fanProfileNameList?.forEach((value,index)=>{
        if(index>=newArray.length)
          return;
        newArray[index] = value;
      })
      Settings.ensureApp().fanProfileNameList = newArray;
    }
    //console.log("appFanSettingNameList=",Settings.ensureApp().fanProfileNameList,"(Settings.ensureApp().fanProfileNameList?.length??0)=",(Settings.ensureApp().fanProfileNameList?.length??0),"Backend.data.getFanCount()=",Backend.data.getFanCount())
    return Settings.ensureApp().fanProfileNameList!!
  }

  //风扇配置文件内容
  static appFanSettings(){
    var fanProfileName = Settings.appFanSettingNameList();
    var fanSettings:FanSetting[] = new Array(Backend.data.getFanCount());
    fanProfileName?.forEach((fanProfileName,index)=>{
      if(fanProfileName){
        fanSettings[index] = this._instance.fanSettings[fanProfileName]
      }
    })
    return fanSettings
  }

  //设置使用的风扇配置文件名称
  static setAppFanSettingName(fanProfileName:string|undefined,index:number){
    if(Settings.appFanSettingNameList()[index]!=fanProfileName){
      Settings.appFanSettingNameList()[index]=fanProfileName;
      Settings.saveSettingsToLocalStorage();
      //Backend.applySettings(APPLYTYPE.SET_FAN);
    }
  }

  //添加一个风扇配置
  static addFanSetting(fanProfileName:string,fanSetting:FanSetting){
    if(fanProfileName!=undefined){
      this._instance.fanSettings[fanProfileName] = fanSetting;
      Settings.saveSettingsToLocalStorage();
      return true;
    }else{
      return false;
    }
  }

  //修改一个风扇配置
  static editFanSetting(fanProfileName:string,newfanProfileName:string,fanSetting:FanSetting){
    if(newfanProfileName&&(fanProfileName in this._instance.fanSettings)){
      if(fanProfileName==newfanProfileName){
        this._instance.fanSettings[fanProfileName] = fanSetting;
      }else{
        this._instance.fanSettings[newfanProfileName] = fanSetting;
        Object.entries(this._instance.perApp)?.forEach(([_appID, appSettings]) => {
          appSettings.fanProfileNameList?.forEach((value,index)=>{
            if(fanProfileName==value){
              appSettings.fanProfileNameList!![index]=newfanProfileName;
            }
          })
        })
        delete this._instance.fanSettings[fanProfileName];
      }
      return true;
    }else{
      return false;
    }
  }

  //删除一个风扇配置
  static removeFanSetting(fanProfileName:string){
    if(fanProfileName in this._instance.fanSettings){
      delete this._instance.fanSettings[fanProfileName];
      Object.entries(this._instance.perApp)?.forEach(([_appID, appSettings]) => {
        appSettings.fanProfileNameList?.forEach((value,index)=>{
          if(fanProfileName==value){
            appSettings.fanProfileNameList!![index]=this._instance.perApp[DEFAULT_APP].fanProfileNameList?.[index];
          }
        })
      })
      Settings.saveSettingsToLocalStorage();
    }
  }


  //获取风扇配置列表
  static getFanSettings():{[fanProfile: string]:FanSetting}{
    return this._instance.fanSettings;
  }

  //获取风扇配置
  static getFanSetting(fanProfileName:string):FanSetting{
    return this._instance.fanSettings?.[fanProfileName];
  }

  static loadSettingsFromLocalStorage(){
    const settingsString = localStorage.getItem(SETTINGS_KEY) || "{}";
    const settingsJson = JSON.parse(settingsString);
    const loadSetting=serializer.deserializeObject(settingsJson, Settings);
    this._instance.enabled = loadSetting?loadSetting.enabled:false;
    this._instance.perApp = loadSetting?loadSetting.perApp:{};
    this._instance.fanSettings=loadSetting?loadSetting.fanSettings:{};
  }

  static saveSettingsToLocalStorage() {
    const settingsJson = serializer.serializeObject(this._instance);
    const settingsString = JSON.stringify(settingsJson);
    localStorage.setItem(SETTINGS_KEY, settingsString);
  }

}
