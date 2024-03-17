import { Router, ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, ComponentName, FANMODE, Patch, PluginState, UpdateType } from "./enum";
import { Backend} from "./backend";
import { localizationManager } from "../i18n";
import { Settings } from "./settings";
import { ACState, AppOverviewExt, BatteryStateChange } from "./steamClient";
import { calPointInLine, FanPosition } from "./position";
import { QAMPatch } from "./patch";

type ActiveAppChangedHandler = (newAppId: string, oldAppId: string) => void;
type ComponentUpdateHandler = (componentsName: ComponentName,updateType:UpdateType) => void;
type UnregisterFn = () => void;
export const DEFAULT_APP = "0";
export class RunningApps {
    private static listeners: ActiveAppChangedHandler[] = [];
    private static lastAppId: string = DEFAULT_APP;
    private static intervalId: any;
  
    private static pollActive() {
      const newApp = RunningApps.active();
      if (this.lastAppId != newApp) {
        this.listeners?.forEach((h) => h(newApp, this.lastAppId));
      }
      this.lastAppId = newApp;
    }
  
    static register() {
      if (this.intervalId == undefined)
        this.intervalId = setInterval(() => this.pollActive(), 100);
    }
  
    static unregister() {
      if (this.intervalId != undefined)
        clearInterval(this.intervalId);
  
      this.listeners.splice(0, this.listeners.length);
    }
  
    static listenActiveChange(fn: ActiveAppChangedHandler): UnregisterFn {
      const idx = this.listeners.push(fn) - 1;
      return () => {
        this.listeners.splice(idx, 1);
      };
    }
  
    static active() {
      return Router.MainRunningApp?.appid || DEFAULT_APP;
    }
  
    static active_appInfo() {
      return Router.MainRunningApp as unknown as AppOverviewExt || null;
    }
}

export class ACStateManager {
  // 电源状态
  private static acState: ACState = ACState.Unknown;

  private static acStateListeners : any;

  static register() {
    this.acStateListeners = SteamClient.System.RegisterForBatteryStateChanges((batteryStateChange: BatteryStateChange) => {
      // 监听电源状态变化, 更新所有组件，应用全部设置一次
      this.acState = batteryStateChange.eACState;
      PluginManager.updateAllComponent(UpdateType.UPDATE);
      if (Settings.ensureEnable()) {
        Backend.applySettings(APPLYTYPE.SET_ALL);
      }
    });
  }

  public static unregister(){
    this.acStateListeners?.unregister();
  }

  static getACState() {
    return this.acState;
  }

}

export class FanControl{
  private static intervalId: any;
  public static fanIsEnable:boolean=false;
  public static fanInfo:{nowPoint:FanPosition,setPoint:FanPosition,lastSetPoint:FanPosition,fanMode:FANMODE,fanRPM:number,bFanNotSet:Boolean}[]=[];

  static async register() {
    if(Backend.data.getFanCount()==0){
      this.disableFan();
      return;
    }
    for(var index = 0;index<Backend.data.getFanCount();index++){
      this.fanInfo[index] = {nowPoint:new FanPosition(0,0),setPoint:new FanPosition(0,0),lastSetPoint:new FanPosition(0,0),fanMode:FANMODE.NOCONTROL,fanRPM:0,bFanNotSet:false}
    }
    if (this.intervalId == undefined)
      this.intervalId = setInterval(() => this.updateFan(), 1000);
    this.fanIsEnable=true;
  }
  
  static async updateFan(){
    //FanControl.updateFanMode();
    FanControl.updateFanInfo();
  }

  /*
  static async updateFanMode(){
    var settings = Settings.appFanSettings()
    for(var index=0;index<=settings.length;index++){
      var fanSetting = Settings.appFanSettings()?.[index];
      console.log("index = ",index,"fanSetiing = ",fanSetting)
      if(!fanSetting){
        //未设置
        if(!FanControl.fanInfo[index].bFanNotSet){
          FanControl.fanInfo[index].bFanNotSet = true;
          Backend.applySettings(APPLYTYPE.SET_FANMODE);
        }
      }else{
        const fanMode = fanSetting?.fanMode;
        if(FanControl.fanInfo[index].fanMode==undefined||FanControl.fanInfo[index].fanMode!=fanMode)
        {
          FanControl.fanInfo[index].fanMode = fanMode!!;
          Backend.applySettings(APPLYTYPE.SET_FANMODE);
        }
      }
      
    }
  }*/

  static async updateFanInfo(){
    Backend.data.getFanConfigs()?.forEach(async (_config,index)=>{
      await Backend.data.getFanRPM(index).then((value)=>{
        FanControl.fanInfo[index].fanRPM=value;
        FanControl.fanInfo[index].nowPoint.fanRPMpercent=value/Backend.data.getFanMAXPRM(index)*100;
      });
    })
    Settings.appFanSettings()?.forEach(async (fanSetting,index)=>{
      await Backend.data.getFanTemp(index).then((value)=>{
        FanControl.fanInfo[index].nowPoint.temperature=value;
      });
      const fanMode = fanSetting?.fanMode;
      switch(fanMode){
        case(FANMODE.NOCONTROL):{
          FanControl.fanInfo[index].setPoint.fanRPMpercent = 0;
          FanControl.fanInfo[index].setPoint.temperature = -10;
          break;
        }
        case(FANMODE.FIX):{
          var fixSpeed = fanSetting?.fixSpeed;
          FanControl.fanInfo[index].setPoint.temperature=FanControl.fanInfo[index].nowPoint.temperature;
          FanControl.fanInfo[index].setPoint.fanRPMpercent=fixSpeed;
          break;
        }
        case(FANMODE.CURVE):{
          var curvePoints = fanSetting?.curvePoints!!.sort((a:FanPosition,b:FanPosition)=>{
            return a.temperature==b.temperature?a.fanRPMpercent!!-b.fanRPMpercent!!:a.temperature!!-b.temperature!!
          });
          //每俩点判断是否在这俩点之间
          var lineStart = new FanPosition(FanPosition.tempMin,FanPosition.fanMin);
          if(curvePoints?.length!!>0){
            //初始点到第一个点
            var lineEnd = curvePoints!![0];
            if(FanControl.fanInfo[index].nowPoint.temperature!!>lineStart.temperature!!&&FanControl.fanInfo[index].nowPoint.temperature!!<=lineEnd.temperature!!){
              FanControl.fanInfo[index].setPoint = calPointInLine(lineStart,lineEnd,FanControl.fanInfo[index].nowPoint.temperature!!)!!;
            }

            curvePoints?.forEach((value,pointIndex)=>{
            if(pointIndex>curvePoints?.length!!-1)
                return;
              lineStart = value;
              lineEnd = pointIndex == curvePoints?.length!!-1?new FanPosition(FanPosition.tempMax,FanPosition.fanMax):curvePoints!![pointIndex+1];
              if(FanControl.fanInfo[index].nowPoint.temperature!!>lineStart.temperature!!&&FanControl.fanInfo[index].nowPoint.temperature!!<=lineEnd.temperature!!){
                FanControl.fanInfo[index].setPoint = calPointInLine(lineStart,lineEnd,FanControl.fanInfo[index].nowPoint.temperature!!)!!;
                return;
              }
            })
          }else{
            var lineEnd = new FanPosition(FanPosition.tempMax,FanPosition.fanMax);
            if(FanControl.fanInfo[index].nowPoint.temperature!!>lineStart.temperature!!&&FanControl.fanInfo[index].nowPoint.temperature!!<=lineEnd.temperature!!){
              FanControl.fanInfo[index].setPoint = calPointInLine(lineStart,lineEnd,FanControl.fanInfo[index].nowPoint.temperature!!)!!;
              break;
            }
          }

          break;
        }
      }
      
    })
    const fanSettings = Settings.appFanSettings();
    for(var index=0;index<fanSettings.length;index++){
      if(!fanSettings?.[index]){
        FanControl.fanInfo[index].setPoint.temperature = 0;
        FanControl.fanInfo[index].setPoint.fanRPMpercent = -10;
      }
      //console.log("判断转速变化 index=",index,"lastRPM=",FanControl.fanInfo[index].lastSetPoint.fanRPMpercent,"nowRPM=",FanControl.fanInfo[index].setPoint.fanRPMpercent,"result=",(Math.abs((FanControl.fanInfo[index].lastSetPoint.fanRPMpercent??0) - (FanControl.fanInfo[index].setPoint.fanRPMpercent??0))>=3))
      //转速变化超过3%才进行设置
      if(Math.abs((FanControl.fanInfo[index].lastSetPoint.fanRPMpercent??0) - (FanControl.fanInfo[index].setPoint.fanRPMpercent??0))>=3){
        FanControl.fanInfo[index].lastSetPoint.fanRPMpercent = FanControl.fanInfo[index].setPoint.fanRPMpercent;
        FanControl.fanInfo[index].lastSetPoint.temperature = FanControl.fanInfo[index].setPoint.temperature;
        Backend.applySettings(APPLYTYPE.SET_FANRPM);
    }
    }
    
  }

  static enableFan(){
    this.fanIsEnable=true;
    this.register();
  }

  static disableFan(){
    this.fanIsEnable=false;
    this.unregister();
  }

  static unregister(){
    Backend.resetFanSettings();
    if (this.intervalId != undefined)
      clearInterval(this.intervalId);
  }
}


export class PluginManager{
  private static state:PluginState;
  private static listeners: Map<ComponentName,Map<ComponentName,ComponentUpdateHandler>> = new Map();
  private static suspendEndHook:any;
  public static register = async(serverAPI:ServerAPI)=>{
    PluginManager.state = PluginState.INIT; 
    await Backend.init(serverAPI);
    await localizationManager.init();
    RunningApps.register();
    FanControl.register();
    RunningApps.listenActiveChange((newAppId, oldAppId) => {
      console.log(`newAppId=${newAppId} oldAppId=${oldAppId}`)
      if (Settings.ensureEnable()) {
        Backend.applySettings(APPLYTYPE.SET_ALL);
      }
    });
    await Settings.loadSettings();
    ACStateManager.register();
    await QAMPatch.init();
    try {
      Backend.applySettings(APPLYTYPE.SET_ALL);
    } catch (e) {
      console.error("Error while applying settings", e);
      Settings.resetToLocalStorage(false);
    }
    PluginManager.suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
      setTimeout(() => {
        if (Settings.ensureEnable()) {
          Backend.throwSuspendEvt()
        }
        Backend.applySettings(APPLYTYPE.SET_ALL);
      }, 10000)
    });
    PluginManager.state = PluginState.RUN;
  }

  public static isPatchSuccess(patch:Patch){
    return QAMPatch.getPatchResult(patch);
  }

  public static isIniting()
  {
    return PluginManager.state==PluginState.INIT
  }

  public static unregister(){
    PluginManager.suspendEndHook?.unregister();
    PluginManager.updateAllComponent(UpdateType.DISMOUNT);
    ACStateManager?.unregister();
    QAMPatch?.unpatch();
    RunningApps?.unregister();
    FanControl?.unregister();
    Backend?.resetSettings();
    PluginManager.state = PluginState.QUIT; 
  }

  //下发某个组件更新事件
  static updateComponent(comName:ComponentName,updateType:UpdateType) {
    if(this.listeners.has(comName)){
      this.listeners.get(comName)?.forEach((fn,_wholisten)=>{
        fn(comName,updateType);
        //console.log(`test_fn: wholisten=${wholisten} comName=${comName} updateType=${updateType}`);
      });
    }
  }

  //下发所有更新事件
  static updateAllComponent(updateType:UpdateType) {
    this.listeners?.forEach((listenList,lisComName) => {
      listenList?.forEach((fn)=>{
        fn(lisComName, updateType);
        //console.log(`test_fn:comName=${lisComName} updateType=${updateType}`);
      })
    });
  }

  //监听组件更新事件（哪个组件监听，被监听组件，监听事件）
  static listenUpdateComponent(whoListen:ComponentName,lisComponentNames:ComponentName[],lisfn: ComponentUpdateHandler) {
    lisComponentNames?.forEach((lisComponentName)=>{
      if(this.listeners.has(lisComponentName)&&this.listeners.get(lisComponentName)!=undefined){
        this.listeners.get(lisComponentName)?.set(whoListen,lisfn);
      }else{
        this.listeners.set(lisComponentName,new Map());
        this.listeners.get(lisComponentName)?.set(whoListen,lisfn);
      }
    })
    
  }
}

