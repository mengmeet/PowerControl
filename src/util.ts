import {AppOverview, Router, ServerAPI } from "decky-frontend-lib";

type ActiveAppChangedHandler = (newAppId: string, oldAppId: string) => void;
type UnregisterFn = () => void;

export const DEFAULT_APP = "0";


export interface AppOverviewExt extends AppOverview {
  appid: string; // base
  display_name: string; // base
  sort_as: string; // base
  icon_data: string; // base, base64 encoded image
  icon_data_format: string; // base, image type without "image/" (e.g.: jpg, png)
  icon_hash: string; // base, url hash to fetch the icon for steam games (e.g.: "/assets/" + appid + "_icon.jpg?v=" + icon_hash)
}


export class RunningApps {
  private listeners: ActiveAppChangedHandler[] = [];
  private lastAppId: string = "";
  private intervalId: any;

  private pollActive() {
    const newApp = RunningApps.active();
    if (this.lastAppId != newApp) {
      this.listeners.forEach((h) => h(newApp, this.lastAppId));
    }
    this.lastAppId = newApp;
  }

  register() {
    if (this.intervalId == undefined)
      this.intervalId = setInterval(() => this.pollActive(), 100);
  }

  unregister() {
    if (this.intervalId != undefined)
      clearInterval(this.intervalId);

    this.listeners.splice(0, this.listeners.length);
  }

  listenActiveChange(fn: ActiveAppChangedHandler): UnregisterFn {
    const idx = this.listeners.push(fn) - 1;
    return () => {
      this.listeners.splice(idx, 1);
    };
  }

  static active() {
    return Router.MainRunningApp?.appid || DEFAULT_APP;
  }

  static active_app() {
    return Router.MainRunningApp as AppOverviewExt || null;
  }
}

export class BackendData{
  private cpuMaxNum = 0;
  private has_cpuMaxNum = false;
  private tdpMax = 0;
  private has_tdpMax= false;
  private has_ryzenadj = false;
  private gpuMax = 0;
  private has_gpuMax = false;
  public init(serverAPI:ServerAPI){
    serverAPI!.callPluginMethod<{},number>("get_cpuMaxNum",{}).then(res=>{
      if (res.success){
        console.log("cpuMaxNum = " + res.result);
        this.cpuMaxNum = res.result;
        this.has_cpuMaxNum = true;
      }
    })
    serverAPI!.callPluginMethod<{},number>("get_tdpMax",{}).then(res=>{
      if (res.success){
        console.log("tdpMax = " + res.result);
        this.tdpMax = res.result;
        this.has_tdpMax = true;
      }
    })
    serverAPI!.callPluginMethod<{},number>("get_tdpMax",{}).then(res=>{
      if (res.success){
        console.log("tdpMax = " + res.result);
        this.tdpMax = res.result;
        this.has_tdpMax = true;
      }
    })
    serverAPI!.callPluginMethod<{},boolean>("get_hasRyzenadj",{}).then(res=>{
      if (res.success){
        console.log("has_ryzenadj = " + res.result);
        this.has_ryzenadj= res.result;
      }
    })
    serverAPI!.callPluginMethod<{},number>("get_gpuFreqMax",{}).then(res=>{
      if (res.success){
        console.log("gpuMax = " + res.result);
        this.gpuMax = res.result;
        this.has_gpuMax = true;
      }
    })
  }

  public getCpuMaxNum(){
    console.log("cpuMaxNum = " + this.cpuMaxNum);
    console.log("has_cpuMaxNum = " + this.has_cpuMaxNum);
    return this.cpuMaxNum;
  }

  public HasCpuMaxNum(){
    return this.has_cpuMaxNum;
  }

  public getTDPMax(){
    console.log("tdpMax = " + this.tdpMax);
    console.log("has_tdpMax = " + this.has_tdpMax);
    return this.tdpMax;
  }

  public getGPUFreqMax(){
    console.log("gpuMax = " + this.tdpMax);
    return this.gpuMax;
  }

  public HasGPUFreqMax(){
    console.log("has_gpuMax = " + this.has_gpuMax);
    return this.has_gpuMax;
  }

  public HasTDPMax(){
    return this.has_tdpMax;
  }

  public HasRyzenadj(){
    console.log("has_ryzenadj = " + this.has_ryzenadj);
    return this.has_ryzenadj;
  }
}


export class Backend {
  private serverAPI: ServerAPI;
  public data: BackendData;
  constructor(serverAPI: ServerAPI) {
    this.serverAPI = serverAPI;
    this.data = new BackendData();
    this.data.init(serverAPI);
  }

  applySmt(smt: boolean) {
    console.log("Applying smt " + smt.toString());
    this.serverAPI!.callPluginMethod("set_smt", { "value": smt });
  }

  applyCpuNum(cpuNum: number) {
    console.log("Applying cpuNum " + cpuNum.toString());
    this.serverAPI!.callPluginMethod("set_cpuOnline", { "value": cpuNum });
  }

  applyCpuBoost(cpuBoost: boolean) {
    console.log("Applying cpuBoost " + cpuBoost.toString());
    this.serverAPI!.callPluginMethod("set_cpuBoost", { "value": cpuBoost });
  }

  applyTDP(tdp: number) {
    console.log("Applying tdp " + tdp.toString());
    this.serverAPI!.callPluginMethod("set_cpuTDP", {"value":tdp});
  }
  
  applyGPUFreq(freq: number){
    this.applyGPUAuto(false,0);
    console.log("Applying gpuFreq " + freq.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreq", {"value":freq});
  }

  applyGPUAuto(auto: boolean, startFreq:number){
    console.log("Applying gpuAuto" + auto.toString());
    this.serverAPI!.callPluginMethod("set_gpuAuto", {"value":auto, "value2":startFreq});
  }
}
