import {ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, FANMODE, GPUMODE } from "./enum";
import { FanControl } from "./pluginMain";
import { Settings } from "./settings";



export class BackendData{
  private serverAPI:ServerAPI | undefined;
  private cpuMaxNum = 0;
  private has_cpuMaxNum = false;
  private tdpMax = 0;
  private has_tdpMax= false;
  private has_ryzenadj = false;
  private gpuMax = 0;
  private has_gpuMax = false;
  private gpuMin = 0;
  private has_gpuMin = false;
  private fanMaxRPM = 0;
  private has_fanMaxRPM = false;
  public async init(serverAPI:ServerAPI){
    this.serverAPI=serverAPI;
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
    await serverAPI!.callPluginMethod<{},number>("get_gpuFreqMin",{}).then(res=>{
      if (res.success){
        console.info("gpuMin = " + res.result);
        this.gpuMin = res.result;
        this.has_gpuMin = true;
      }
    })
    await this.serverAPI!.callPluginMethod<{},number>("get_fanMAXRPM",{}).then(res=>{
      if (res.success){
        this.fanMaxRPM=res.result;
        this.has_fanMaxRPM=true;
      }else{
        this.fanMaxRPM=1;
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

  public getGPUFreqMin(){
    return this.gpuMin;
  }

  public HasGPUFreqMin(){
    return this.has_gpuMin;
  }

  public HasTDPMax(){
    return this.has_tdpMax;
  }

  public HasRyzenadj(){
    return this.has_ryzenadj;
  }

  public getFanMAXPRM(){
    return this.fanMaxRPM;
  }

  public HasFanMAXPRM(){
    return this.has_fanMaxRPM;
  }



  public async getFanRPM(){
    var fanPRM:number;
    await this.serverAPI!.callPluginMethod<{},number>("get_fanRPM",{}).then(res=>{
      if (res.success){
        fanPRM=res.result;
      }else{
        fanPRM=0;
      }
    })
    return fanPRM!!;
  }

  public async getFanRPMPercent(){
    var fanRPMpercent:number;
    await this.serverAPI!.callPluginMethod<{},number>("get_fanRPMPercent",{}).then(res=>{
      if (res.success){
        fanRPMpercent=res.result*100;
      }else{
        fanRPMpercent=0;
      }
    })
    return fanRPMpercent!!;
  }

  public async getFanTemp(){
    var fanTemp:number;
    await this.serverAPI!.callPluginMethod<{},number>("get_fanTemp",{}).then(res=>{
      if (res.success){
        fanTemp=res.result/1000;
      }else{
        fanTemp=-1;
      }
    })
    return fanTemp!!;
  }

  public async getFanIsAuto(){
    var fanIsAuto:boolean;
    await this.serverAPI!.callPluginMethod<{},boolean>("get_fanIsAuto",{}).then(res=>{
      if (res.success){
        fanIsAuto=res.result;
      }else{
        fanIsAuto=false;
      }
    })
    return fanIsAuto!!;
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
  private static applyFanAuto(auto:boolean){
    this.serverAPI!.callPluginMethod("set_fanAuto", {"value":auto});
  }
  private static applyFanPercent(percent:number){
    this.serverAPI!.callPluginMethod("set_fanPercent", {"value":percent});
  }
  public static throwSuspendEvt(){
    console.log("throwSuspendEvt");
    this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
  }

  public static applySettings = (applyTarget: string) => {
    if (!Settings.ensureEnable()) {
      Backend.resetSettings();
      return;
    }
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
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_FANMODE){
      const fanSetting = Settings.appFanSetting();
      const fanMode = fanSetting?.fanMode;
      if (fanMode == FANMODE.NOCONTROL) {
          Backend.applyFanAuto(true);
      } else if (fanMode == FANMODE.FIX) {
        Backend.applyFanAuto(false);
      } else if (fanMode == FANMODE.CURVE) {
        Backend.applyFanAuto(false);
      } else {
          Backend.applyFanAuto(true);
          console.log(`出现意外的FanMode = ${fanMode}`)
      };
    }
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_FANRPM){
      const fanSetting = Settings.appFanSetting();
      const fanMode = fanSetting?.fanMode;
      if (fanMode == FANMODE.NOCONTROL) {

      } else if (fanMode == FANMODE.FIX) {
        Backend.applyFanPercent(FanControl.setPoint.fanRPMpercent!!);
      } else if (fanMode == FANMODE.CURVE) {
        Backend.applyFanPercent(FanControl.setPoint.fanRPMpercent!!);
      } else {
        console.log(`出现意外的FanMode = ${fanMode}`)
      }
    }
  };

  public static resetFanSettings = () =>{
    Backend.applyFanAuto(true);
  }

  public static resetSettings = () => {
    console.log("重置所有设置");
    Backend.applySmt(true);
    Backend.applyCpuNum(Backend.data.getCpuMaxNum());
    Backend.applyCpuBoost(true);
    Backend.applyTDP(Backend.data.getTDPMax());
    Backend.applyGPUFreq(0);
    Backend.applyFanAuto(true);
  };
}
