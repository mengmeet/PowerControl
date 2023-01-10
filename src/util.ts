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
  private cpuFreqList:number[] = [];
  private has_cpuFreqList = false;
  private cpuMaxFreqIndex = 0;
  private cpuMaxFreq = 0;
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
    serverAPI!.callPluginMethod<{},number[]>("get_cpu_AvailableFreq",{}).then(res=>{
      if (res.success){
        console.log("res.result = " + res.result)
        this.cpuFreqList = res.result;
        if(this.cpuFreqList.length>=1){
          this.cpuMaxFreqIndex = this.cpuFreqList.length - 1;
          this.cpuMaxFreq = this.cpuFreqList[this.cpuFreqList.length - 1]
          this.has_cpuFreqList = true;
        }
        console.log("cpuFreqList = " + this.cpuFreqList)
        console.log("cpuFreqList.length = " + this.cpuFreqList.length)
      }
    })
  }

  public getCpuMaxNum(){
    console.log("cpuMaxNum = " + this.cpuMaxNum);
    return this.cpuMaxNum;
  }

  public HasCpuMaxNum(){
    console.log("has_cpuMaxNum = " + this.has_cpuMaxNum);
    return this.has_cpuMaxNum;
  }

  public getTDPMax(){
    console.log("tdpMax = " + this.tdpMax);
    return this.tdpMax;
  }

  public getGPUFreqMax(){
    console.log("gpuMax = " + this.tdpMax);
    return this.gpuMax;
  }

  public getCPUFreqMaxIndex(){
    console.log("cpuMaxFreqIndez = " + this.cpuMaxFreqIndex);
    return this.cpuMaxFreqIndex;
  }

  public getCPUFreqIndexByFreq(freq:number){
    if(this.has_cpuFreqList){
      var freqIndex = this.getCPUFreqList().findIndex((value)=>{
        return value == freq;
      })
      if(freqIndex == -1)
        return this.cpuMaxFreqIndex
      else
        return freqIndex
    }
    return 0
  }

  public getCPUFreqByIndex(index:number){
    if(this.has_cpuFreqList){
      if(index>this.cpuMaxFreqIndex){
        console.log("cpuFreqIndex超出最大数组下标");
        return this.cpuMaxFreq;
      }
      else if(index <=0){
        console.log("cpuFreqIndex小于0");
        return this.getCPUFreqList()[0];
      }
      else{
        return this.getCPUFreqList()[index];
      }
    }
    else
      return 0;
  }

  public getCPUFreqMax(){
    console.log("cpuMaxFreq = " + this.cpuMaxFreq);
    if(this.HasCPUFreqList()){
      return this.cpuMaxFreq;
    }
    return 0;
  }

  public getCPUFreqList(){
    console.log("cpuFreqList = " + this.cpuFreqList);
    return this.cpuFreqList;
  }

  public HasGPUFreqMax(){
    console.log("has_gpuMax = " + this.has_gpuMax);
    return this.has_gpuMax;
  }

  public HasTDPMax(){
    console.log("has_tdpMax = " + this.has_tdpMax);
    return this.has_tdpMax;
  }

  public HasRyzenadj(){
    console.log("has_ryzenadj = " + this.has_ryzenadj);
    return this.has_ryzenadj;
  }

  public HasCPUFreqList(){
    console.log("has_cpuFreqList = " + this.has_cpuFreqList)
    return this.has_cpuFreqList
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
    if(cpuBoost&&this.data.HasCPUFreqList()){
      console.log("cpuBoost = " + cpuBoost.toString()+"Applying cpuMaxFreq" + this.data.getCPUFreqMax().toString());
      this.serverAPI!.callPluginMethod("set_cpuFreq", {"value":this.data.getCPUFreqMax()});
    }
    this.serverAPI!.callPluginMethod("set_cpuBoost", { "value": cpuBoost });
  }

  applyTDP(tdp: number) {
    console.log("Applying tdp " + tdp.toString());
    this.serverAPI!.callPluginMethod("set_cpuTDP", {"value":tdp});
  }
  
  applyGPUFreq(freq: number){
    this.applyGPUAuto(false);
    console.log("Applying gpuFreq " + freq.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreq", {"value":freq});
  }

  applyGPUAuto(auto: boolean){
    console.log("Applying gpuAuto" + auto.toString());
    this.serverAPI!.callPluginMethod("set_gpuAuto", {"value":auto});
  }

  applyGPUAutoMax(maxAutoFreq:number){
    console.log("Applying gpuAuto" + maxAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoMaxFreq", {"value":maxAutoFreq});
  }

  applyGPUAutoMin(minAutoFreq:number){
    console.log("Applying gpuAuto" + minAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoMinFreq", {"value":minAutoFreq});
  }

  applyCPUFreq(boost:boolean,freq: number){
    if(!boost&&(freq!=0||this.data.HasCPUFreqList())){
      console.log("boost = " + boost.toString()+"Applying cpuFreq" + freq.toString());
      this.serverAPI!.callPluginMethod("set_cpuFreq", {"value":freq});
    }
  }

  throwSuspendEvt(){
    console.log("throwSuspendEvt");
    this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
  }
}
