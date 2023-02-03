import { Router, ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, ComponentName, UpdateType } from "../components";
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
    private static lastAppId: string = "";
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
export enum PluginState{
  INIT="0",
  INIT_END="1",
}
export class PluginManager{
  public static state:PluginState;
  private static listeners: Map<ComponentName,ComponentUpdateHandler> = new Map();
  public static init = async(serverAPI:ServerAPI)=>{
    PluginManager.state = PluginState.INIT; 
    await Backend.init(serverAPI);
    console.log("Backend Init End");
    await localizationManager.init(serverAPI);
    console.log("localization Init End");
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
    console.log("RunningApp Init End");
    PluginManager.state = PluginState.INIT_END;
  }

  static updateComponent(componentName:ComponentName,updateType:UpdateType) {
    if(this.listeners.has(componentName)){
      const fn=this.listeners.get(componentName)!!;
      fn(componentName,updateType);
      console.log(`test_fn:comName=${componentName} updateType=${updateType}`);
    }else{
      console.warn(`componentName is not listening${componentName}`)
    }
  }

  static updateAllComponent(updateType:UpdateType) {
    this.listeners.forEach((fn,comName) => fn(comName, updateType));
  }

  static listenUpdateComponent(componentName:ComponentName,lisfn: ComponentUpdateHandler) {
    this.listeners.set(componentName,lisfn)
  }
}

