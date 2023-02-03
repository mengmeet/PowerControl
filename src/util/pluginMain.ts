import { Router, ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, ComponentName, PluginState, UpdateType } from "./enum";
import { Backend} from "./backend";
import { localizationManager } from "./localization";
import { Settings } from "./settings";
import { AppOverviewExt } from "./steamClient";

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

export class PluginManager{
  private static state:PluginState;
  private static listeners: Map<ComponentName,Map<ComponentName,ComponentUpdateHandler>> = new Map();
  private static suspendEndHook:any;
  public static register = async(serverAPI:ServerAPI)=>{
    PluginManager.state = PluginState.INIT; 
    await Backend.init(serverAPI);
    await localizationManager.init(serverAPI);
    RunningApps.register();
    RunningApps.listenActiveChange((newAppId, oldAppId) => {
      console.log(`newAppId=${newAppId} oldAppId=${oldAppId}`)
      if (Settings.ensureEnable()) {
        Backend.applySettings(APPLYTYPE.SET_ALL);
      }
    });
    Settings.loadSettingsFromLocalStorage();
    if (Settings.ensureEnable()) {
      Backend.applySettings(APPLYTYPE.SET_ALL);
    }
    PluginManager.suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
      console.log("休眠结束，重新应用设置")
      if (Settings.ensureEnable()) {
        Backend.throwSuspendEvt()
        Backend.applySettings(APPLYTYPE.SET_ALL);
      } else {
        Backend.resetSettings();
      }
    });
    PluginManager.state = PluginState.RUN;
  }

  public static isIniting()
  {
    return PluginManager.state==PluginState.INIT
  }

  public static unregister = ()=>{
    PluginManager.suspendEndHook!.unregister();
    RunningApps.unregister();
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

