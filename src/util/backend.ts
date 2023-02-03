import {ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, GPUMODE } from "./enum";
import { Settings } from "./settings";



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

  private static applySmt(smt: boolean) {
    console.log("Applying smt " + smt.toString());
    this.serverAPI!.callPluginMethod("set_smt", { "value": smt });
  }

  private static applyCpuNum(cpuNum: number) {
    console.log("Applying cpuNum " + cpuNum.toString());
    this.serverAPI!.callPluginMethod("set_cpuOnline", { "value": cpuNum });
  }

  private static applyCpuBoost(cpuBoost: boolean) {
    console.log("Applying cpuBoost " + cpuBoost.toString());
    this.serverAPI!.callPluginMethod("set_cpuBoost", { "value": cpuBoost });
  }

  private static applyTDP(tdp: number) {
    console.log("Applying tdp " + tdp.toString());
    this.serverAPI!.callPluginMethod("set_cpuTDP", {"value":tdp});
  }
  
  private static applyGPUFreq(freq: number){
    console.log("Applying gpuFreq " + freq.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreq", {"value":freq});
  }

  private static applyGPUFreqRange(freqMin: number, freqMax: number){
    console.log("Applying gpuFreqRange  " + freqMin.toString() + "   "+ freqMax.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreqRange", {"value":freqMin, "value2":freqMax});
  }

  private static applyGPUAuto(auto: boolean){
    console.log("Applying gpuAuto" + auto.toString());
    this.serverAPI!.callPluginMethod("set_gpuAuto", {"value":auto});
  }

  private static applyGPUAutoMax(maxAutoFreq:number){
    console.log("Applying gpuAuto" + maxAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoMaxFreq", {"value":maxAutoFreq});
  }

  private static applyGPUAutoMin(minAutoFreq:number){
    console.log("Applying gpuAuto" + minAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoMinFreq", {"value":minAutoFreq});
  }

  public static throwSuspendEvt(){
    console.log("throwSuspendEvt");
    this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
  }

  public static applySettings = (applyTarget: string) => {
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_CPUCORE) {
      const smt = Settings.appSmt();
      const cpuNum = Settings.appCpuNum();
      Backend.applySmt(smt);
      Backend.applyCpuNum(cpuNum);
    }
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_CPUBOOST) {
      const cpuBoost = Settings.appCpuboost();
      Backend.applyCpuBoost(cpuBoost);
    }
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_TDP) {
      const tdp = Settings.appTDP();
      const tdpEnable = Settings.appTDPEnable();
      if (tdpEnable) {
        Backend.applyTDP(tdp);
      }
      else {
        Backend.applyTDP(Backend.data.getTDPMax());
      }
    }
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_GPUMODE) {
      const gpuMode = Settings.appGPUMode();
      const gpuFreq = Settings.appGPUFreq();
      const gpuAutoMaxFreq = Settings.appGPUAutoMaxFreq();
      const gpuAutoMinFreq = Settings.appGPUAutoMinFreq();
      const gpuRangeMaxFreq = Settings.appGPURangeMaxFreq();
      const gpuRangeMinFreq = Settings.appGPURangeMinFreq();
      if (gpuMode == GPUMODE.NOLIMIT) {
        Backend.applyGPUAuto(false);
        Backend.applyGPUFreq(0);
      } else if (gpuMode == GPUMODE.FIX) {
        Backend.applyGPUAuto(false);
        Backend.applyGPUFreq(gpuFreq);
      } else if (gpuMode == GPUMODE.AUTO) {
        console.log(`开始自动优化GPU频率`)
        Settings.setTDPEnable(false);
        Settings.setCpuboost(false);
        Backend.applyGPUAutoMax(gpuAutoMaxFreq);
        Backend.applyGPUAutoMin(gpuAutoMinFreq);
        Backend.applyGPUAuto(true);
      } else if (gpuMode == GPUMODE.RANGE) {
        Backend.applyGPUAuto(false);
        Backend.applyGPUFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
      }
      else {
        console.log(`出现意外的GPUmode = ${gpuMode}`)
        Backend.applyGPUFreq(0);
      }
    }
  };

  public static resetSettings = () => {
    console.log("重置所有设置");
    Backend.applySmt(true);
    Backend.applyCpuNum(Backend.data.getCpuMaxNum());
    Backend.applyCpuBoost(true);
    Backend.applyTDP(Backend.data.getTDPMax());
    Backend.applyGPUFreq(0);
  };
}
