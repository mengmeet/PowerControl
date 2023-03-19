import { Router, ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, ComponentName, FANMODE, PluginState, UpdateType } from "./enum";
import { Backend} from "./backend";
import { localizationManager } from "./localization";
import { Settings } from "./settings";
import { AppOverviewExt } from "./steamClient";
import { calPointInLine, fanPosition } from "./position";

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
        this.listeners.forEach((h) => h(newApp, this.lastAppId));
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

export class FanControl{
  private static intervalId: any;
  public static nowPoint:fanPosition=new fanPosition(0,0);
  public static setPoint:fanPosition=new fanPosition(0,0);
  public static fanMode:FANMODE;
  public static fanRPM:number=0;
  public static fanIsEnable:boolean=false;
  static async register() {
    if(!Backend.data.getFanIsAdapt()){
      this.disableFan();
      return;
    }
    if (this.intervalId == undefined)
      this.intervalId = setInterval(() => this.updateFan(), 1000);
    this.fanIsEnable=true;
  }
  
  static async updateFan(){
    FanControl.updateFanMode();
    FanControl.updateFanInfo();
    PluginManager.updateComponent(ComponentName.FAN_DISPLAY,UpdateType.UPDATE);
  }

  static async updateFanMode(){
    const fanSetting = Settings.appFanSetting();
    const fanMode = fanSetting?.fanMode;
    if(FanControl.fanMode==undefined||FanControl.fanMode!=fanMode)
    {
      FanControl.fanMode = fanMode!!;
      Backend.applySettings(APPLYTYPE.SET_FANMODE);
    }
  }

  static async updateFanInfo(){
    await Backend.data.getFanRPM().then((value)=>{
      this.fanRPM=value;
      FanControl.nowPoint.fanRPMpercent=Backend.data.HasFanMAXPRM()?value/Backend.data.getFanMAXPRM()*100:-273;
    });
    await Backend.data.getFanTemp().then((value)=>{
      FanControl.nowPoint.temperature=value;
    });
    const fanSetting = Settings.appFanSetting();
    const fanMode = fanSetting?.fanMode;
    switch(fanMode){
      case(FANMODE.NOCONTROL):{
        break;
      }
      case(FANMODE.FIX):{
        var fixSpeed = fanSetting?.fixSpeed;
        FanControl.setPoint.temperature=FanControl.nowPoint.temperature;
        FanControl.setPoint.fanRPMpercent=fixSpeed;
        break;
      }
      case(FANMODE.CURVE):{
        var curvePoints = fanSetting?.curvePoints!!.sort((a:fanPosition,b:fanPosition)=>{
          return a.temperature==b.temperature?a.fanRPMpercent!!-b.fanRPMpercent!!:a.temperature!!-b.temperature!!
        });
        //每俩点判断是否在这俩点之间
        var lineStart = new fanPosition(fanPosition.tempMin,fanPosition.fanMin);
        if(curvePoints?.length!!>0){
          var lineEnd = curvePoints!![0];
          if(FanControl.nowPoint.temperature!!>lineStart.temperature!!&&FanControl.nowPoint.temperature!!<=lineEnd.temperature!!){
            FanControl.setPoint = calPointInLine(lineStart,lineEnd,FanControl.nowPoint.temperature!!)!!;
            break;
          }
          curvePoints?.forEach((value,index)=>{
            if(index>=curvePoints?.length!!-1)
              return;
            lineStart = value;
            lineEnd = curvePoints!![index+1];
            if(FanControl.nowPoint.temperature!!>lineStart.temperature!!&&FanControl.nowPoint.temperature!!<=lineEnd.temperature!!){
              FanControl.setPoint = calPointInLine(lineStart,lineEnd,FanControl.nowPoint.temperature!!)!!;
              return;
            }
          })
        }else{
          var lineEnd = new fanPosition(fanPosition.tempMax,fanPosition.fanMax);
          if(FanControl.nowPoint.temperature!!>lineStart.temperature!!&&FanControl.nowPoint.temperature!!<=lineEnd.temperature!!){
            FanControl.setPoint = calPointInLine(lineStart,lineEnd,FanControl.nowPoint.temperature!!)!!;
            break;
          }
        }
        break;
      }
      default:{
        console.error(`错误的fanmode = ${fanMode}`)
      }
    }
    Backend.applySettings(APPLYTYPE.SET_FANRPM);
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
    await localizationManager.init(serverAPI);
    RunningApps.register();
    FanControl.register();
    RunningApps.listenActiveChange((newAppId, oldAppId) => {
      console.log(`newAppId=${newAppId} oldAppId=${oldAppId}`)
      if (Settings.ensureEnable()) {
        Backend.applySettings(APPLYTYPE.SET_ALL);
      }
    });
    Settings.loadSettingsFromLocalStorage();
    Backend.applySettings(APPLYTYPE.SET_ALL);
    PluginManager.suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
      if (Settings.ensureEnable()) {
        Backend.throwSuspendEvt()
      }
      Backend.applySettings(APPLYTYPE.SET_ALL);
    });
    PluginManager.state = PluginState.RUN;
  }

  public static isIniting()
  {
    return PluginManager.state==PluginState.INIT
  }

  public static unregister = ()=>{
    PluginManager.suspendEndHook!.unregister();
    PluginManager.updateAllComponent(UpdateType.DISMOUNT);
    RunningApps.unregister();
    FanControl.unregister();
    Backend.resetSettings();
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
    this.listeners.forEach((listenList,lisComName) => {
      listenList.forEach((fn)=>{
        fn(lisComName, updateType);
        //console.log(`test_fn:comName=${lisComName} updateType=${updateType}`);
      })
    });
  }

  //监听组件更新事件（哪个组件监听，被监听组件，监听事件）
  static listenUpdateComponent(whoListen:ComponentName,lisComponentNames:ComponentName[],lisfn: ComponentUpdateHandler) {
    lisComponentNames.forEach((lisComponentName)=>{
      if(this.listeners.has(lisComponentName)&&this.listeners.get(lisComponentName)!=undefined){
        this.listeners.get(lisComponentName)?.set(whoListen,lisfn);
      }else{
        this.listeners.set(lisComponentName,new Map());
        this.listeners.get(lisComponentName)?.set(whoListen,lisfn);
      }
    })
    
  }
}

