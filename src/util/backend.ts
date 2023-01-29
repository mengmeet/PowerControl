import {ServerAPI } from "decky-frontend-lib";


export class BackendData{
  private cpuMaxNum = 0;
  private has_cpuMaxNum = false;
  private tdpMax = 0;
  private has_tdpMax= false;
  private has_ryzenadj = false;
  private gpuMax = 0;
  private has_gpuMax = false;
  public async init(serverAPI:ServerAPI){
    await serverAPI!.callPluginMethod<{},number>("get_cpuMaxNum",{}).then(res=>{
      if (res.success){
        console.info("cpuMaxNum = " + res.result);
        this.cpuMaxNum = res.result;
        this.has_cpuMaxNum = true;
      }
    })
    await serverAPI!.callPluginMethod<{},number>("get_tdpMax",{}).then(res=>{
      if (res.success){
        console.info("tdpMax = " + res.result);
        this.tdpMax = res.result;
        this.has_tdpMax = true;
      }
    })
    await serverAPI!.callPluginMethod<{},boolean>("get_hasRyzenadj",{}).then(res=>{
      if (res.success){
        console.info("has_ryzenadj = " + res.result);
        this.has_ryzenadj= res.result;
      }
    })
    await serverAPI!.callPluginMethod<{},number>("get_gpuFreqMax",{}).then(res=>{
      if (res.success){
        console.info("gpuMax = " + res.result);
        this.gpuMax = res.result;
        this.has_gpuMax = true;
      }
    })
  }
  public getCpuMaxNum(){
    return this.cpuMaxNum;
  }

  public HasCpuMaxNum(){
    return this.has_cpuMaxNum;
  }

  public getTDPMax(){
    return this.tdpMax;
  }

  public getGPUFreqMax(){
    return this.gpuMax;
  }

  public HasGPUFreqMax(){
    return this.has_gpuMax;
  }

  public HasTDPMax(){
    return this.has_tdpMax;
  }

  public HasRyzenadj(){
    return this.has_ryzenadj;
  }
}


export class Backend {
  private static serverAPI: ServerAPI;
  public static data: BackendData;
  public static async init(serverAPI: ServerAPI) {
    this.serverAPI = serverAPI;
    this.data = new BackendData();
    await this.data.init(serverAPI);
  }

  public static applySmt(smt: boolean) {
    console.log("Applying smt " + smt.toString());
    this.serverAPI!.callPluginMethod("set_smt", { "value": smt });
  }

  public static applyCpuNum(cpuNum: number) {
    console.log("Applying cpuNum " + cpuNum.toString());
    this.serverAPI!.callPluginMethod("set_cpuOnline", { "value": cpuNum });
  }

  public static applyCpuBoost(cpuBoost: boolean) {
    console.log("Applying cpuBoost " + cpuBoost.toString());
    this.serverAPI!.callPluginMethod("set_cpuBoost", { "value": cpuBoost });
  }

  public static applyTDP(tdp: number) {
    console.log("Applying tdp " + tdp.toString());
    this.serverAPI!.callPluginMethod("set_cpuTDP", {"value":tdp});
  }
  
  public static applyGPUFreq(freq: number){
    this.applyGPUAuto(false);
    console.log("Applying gpuFreq " + freq.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreq", {"value":freq});
  }

  public static applyGPUFreqRange(freqMin: number, freqMax: number){
    this.applyGPUAuto(false);
    console.log("Applying gpuFreqRange  " + freqMin.toString() + "   "+ freqMax.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreqRange", {"value":freqMin, "value2":freqMax});
  }

  public static applyGPUAuto(auto: boolean){
    console.log("Applying gpuAuto" + auto.toString());
    this.serverAPI!.callPluginMethod("set_gpuAuto", {"value":auto});
  }

  public static applyGPUAutoMax(maxAutoFreq:number){
    console.log("Applying gpuAuto" + maxAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoMaxFreq", {"value":maxAutoFreq});
  }

  public static applyGPUAutoMin(minAutoFreq:number){
    console.log("Applying gpuAuto" + minAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoMinFreq", {"value":minAutoFreq});
  }

  public static throwSuspendEvt(){
    console.log("throwSuspendEvt");
    this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
  }
}
