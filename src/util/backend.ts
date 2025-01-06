import { APPLYTYPE, FANMODE, GPUMODE, Patch } from "./enum";
import { FanControl, PluginManager } from "./pluginMain";
import { Settings, SettingsData } from "./settings";
import { DEFAULT_TDP_MAX, DEFAULT_TDP_MIN, QAMPatch, SteamUtils, SystemInfo } from ".";
import { JsonSerializer } from "typescript-json-serializer";
import { call } from "@decky/api";

const serializer = new JsonSerializer();

const minSteamVersion = 1714854927;

export class BackendData {
  private cpuMaxNum = 0;
  private has_cpuMaxNum = false;
  private isSupportSMT = false;
  private has_isSupportSMT = false;
  private tdpMax = 0;
  private has_tdpMax = false;
  private gpuMax = 0;
  private has_gpuMax = false;
  private gpuMin = 0;
  private has_gpuMin = false;
  private fanConfigs: any[] = [];
  private has_fanConfigs = false;
  private current_version = "";
  private latest_version = "";
  private supportCPUMaxPct = false;
  private systemInfo: SystemInfo | undefined;
  private availableGovernors: string[] = [];
  private has_availableGovernors = false;
  private isEppSupported = false;
  private has_isEppSupported = false;
  private eppModes: string[] = [];
  private has_eppModes = false;
  private currentEpp: string | null = null;
  private has_currentEpp = false;

  public async init() {
    await call<[], number>("get_cpuMaxNum")
      .then((res) => {
        // console.info("cpuMaxNum = " + res.result);
        this.cpuMaxNum = res;
        this.has_cpuMaxNum = true;
      });
    await call<[], number>("get_tdpMax")
      .then((res) => {
        this.tdpMax = res;
        this.has_tdpMax = true;
      });
    await call<[], number[]>("get_gpuFreqRange")
      .then((res) => {
        this.gpuMin = res[0];
        this.gpuMax = res[1];
        this.has_gpuMin = true;
        this.has_gpuMax = true;
      });
    await call<[], []>(
      "get_fanConfigList"
    ).then((res) => {
      this.fanConfigs = res;
      this.has_fanConfigs = res.length > 0;
    });

    await call<[], boolean>(
      "get_isSupportSMT"
    ).then((res) => {
      this.isSupportSMT = res;
      this.has_isSupportSMT = true;
    });

    Backend.getMaxPerfPct().then((value) => {
      this.supportCPUMaxPct = value > 0;
    });

    await call<[], string>("get_version").then(
      (res) => {
        this.current_version = res;
      }
    );

    SteamUtils.getSystemInfo().then((systemInfo) => {
      this.systemInfo = systemInfo;
    });

    await call<[], string[]>("get_available_governors")
      .then((res) => {
        this.availableGovernors = res;
        this.has_availableGovernors = true;
      })
      .catch((err) => {
        console.error("获取可用 CPU 调度器失败:", err);
        this.availableGovernors = [];
        this.has_availableGovernors = false;
      });

    await call<[], boolean>("is_epp_supported")
      .then((res) => {
        this.isEppSupported = res;
        this.has_isEppSupported = true;
      })
      .catch((err) => {
        console.error("检查 EPP 支持失败:", err);
        this.isEppSupported = false;
        this.has_isEppSupported = false;
      });

    await call<[], string[]>("get_epp_modes")
      .then((res) => {
        this.eppModes = res;
        this.has_eppModes = true;
      })
      .catch((err) => {
        console.error("获取可用 EPP 模式失败:", err);
        this.eppModes = [];
        this.has_eppModes = false;
      });

    await call<[], string | null>("get_current_epp")
      .then((res) => {
        this.currentEpp = res;
        this.has_currentEpp = true;
      })
      .catch((err) => {
        console.error("获取当前 EPP 模式失败:", err);
        this.currentEpp = null;
        this.has_currentEpp = false;
      });
  }

  public getForceShowTDP() {
    // 检查 Steam 客户端版本，如果版本大于等于 minSteamVersion。不显示强制 TDP 开关。并默认显示 TDP 控制组件
    return this.systemInfo!.nSteamVersion >= minSteamVersion
  }

  public getCpuMaxNum() {
    return this.cpuMaxNum;
  }

  public HasCpuMaxNum() {
    return this.has_cpuMaxNum;
  }

  public getSupportSMT() {
    return this.isSupportSMT;
  }

  public HasSupportSMT() {
    return this.has_isSupportSMT;
  }

  public getTDPMax() {
    return this.tdpMax;
  }

  public getGPUFreqMax() {
    return this.gpuMax;
  }

  public HasGPUFreqMax() {
    return this.has_gpuMax;
  }

  public getGPUFreqMin() {
    return this.gpuMin;
  }

  public HasGPUFreqMin() {
    return this.has_gpuMin;
  }

  public HasTDPMax() {
    return this.has_tdpMax;
  }

  public getFanMAXPRM(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_max_rpm ?? 0;
    }
    return 0;
  }

  public getFanCount() {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.length ?? 0;
    }
    return 0;
  }

  public getFanName(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_name ?? "Fan";
    }
    return "Fan";
  }

  public getFanConfigs() {
    if (this.has_fanConfigs) {
      return this.fanConfigs;
    }
    return [];
  }

  public getFanHwmonMode(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_hwmon_mode ?? 0;
    }
    return 0;
  }

  public getCurrentVersion() {
    return this.current_version;
  }

  public getLatestVersion() {
    return this.latest_version;
  }

  public getSupportCPUMaxPct() {
    return this.supportCPUMaxPct;
  }

  public HasAvailableGovernors() {
    return this.has_availableGovernors;
  }

  public getAvailableGovernors(): string[] {
    return this.availableGovernors;
  }

  public async getFanRPM(index: number) {
    var fanPRM: number = 0;
    await call<[index: number], number>("get_fanRPM", index).then((res) => {
      fanPRM = res;
    }).catch((error) => {
      console.error("get_fanRPM error", error);
    });
    return fanPRM;
  }

  public async getFanTemp(index: number) {
    var fanTemp: number = -1;
    await call<[index: number], number>("get_fanTemp", index).then((res) => {
      fanTemp = res / 1000;
    }).catch((error) => {
      console.error("get_fanTemp error", error);
    });
    return fanTemp;
  }

  public async getFanIsAuto(index: number) {
    var fanIsAuto: boolean = false;
    await call<[index: number], boolean>("get_fanIsAuto", index).then((res) => {
      fanIsAuto = res;
    }).catch((error) => {
      console.error("get_fanIsAuto error", error);
    });
    return fanIsAuto;
  }

  public isEPPSupported() {
    return this.isEppSupported;
  }

  public hasEPPSupported() {
    return this.has_isEppSupported;
  }

  public getEPPModes() {
    return this.eppModes;
  }

  public hasEPPModes() {
    return this.has_eppModes;
  }

  public getCurrentEPP() {
    return this.currentEpp;
  }

  public hasCurrentEPP() {
    return this.has_currentEpp;
  }
}

export class Backend {
  public static data: BackendData;
  public static async init() {
    this.data = new BackendData();
    await this.data.init();
  }

  private static applySmt(smt: boolean) {
    // console.log("Applying smt " + smt.toString());
    // this.serverAPI!.callPluginMethod("set_smt", { value: smt });
    call("set_smt", smt);
  }

  private static applyCpuNum(cpuNum: number) {
    // console.log("Applying cpuNum " + cpuNum.toString());
    // this.serverAPI!.callPluginMethod("set_cpuOnline", { value: cpuNum });
    call("set_cpuOnline", cpuNum);
  }

  private static applyCpuBoost(cpuBoost: boolean) {
    // console.log("Applying cpuBoost " + cpuBoost.toString());
    // this.serverAPI!.callPluginMethod("set_cpuBoost", { value: cpuBoost });
    call("set_cpuBoost", cpuBoost);
  }

  public static applyTDP = (tdp: number) => {
    console.log("Applying tdp " + tdp.toString());
    // this.serverAPI!.callPluginMethod("set_cpuTDP", { value: tdp });
    call("set_cpuTDP", tdp);
  };

  public static applyGPUFreq(freq: number) {
    // console.log("Applying gpuFreq " + freq.toString());
    // this.serverAPI!.callPluginMethod("set_gpuFreq", { value: freq });
    call("set_gpuFreq", freq);
  }

  private static applyGPUFreqRange(freqMin: number, freqMax: number) {
    // console.log(
    //   "Applying gpuFreqRange  " +
    //     freqMin.toString() +
    //     "   " +
    //     freqMax.toString()
    // );
    // this.serverAPI!.callPluginMethod("set_gpuFreqRange", {
    //   value: freqMin,
    //   value2: freqMax,
    // });
    call<[value: number, value2: number], void>("set_gpuFreqRange", freqMin, freqMax);
  }

  private static applyGPUAuto(auto: boolean) {
    // console.log("Applying gpuAuto" + auto.toString());
    // this.serverAPI!.callPluginMethod("set_gpuAuto", { value: auto });
    call("set_gpuAuto", auto);
  }

  private static applyGPUAutoRange(minAutoFreq: number, maxAutoFreq: number) {
    // console.log("Applying gpuAuto" + maxAutoFreq.toString());
    // this.serverAPI!.callPluginMethod("set_gpuAutoFreqRange", {
    //   min: minAutoFreq,
    //   max: maxAutoFreq,
    // });
    call<[min: number, max: number], void>("set_gpuAutoFreqRange", minAutoFreq, maxAutoFreq);
  }

  private static applyFanAuto(index: number, auto: boolean) {
    // this.serverAPI!.callPluginMethod("set_fanAuto", {
    //   index: index,
    //   value: auto,
    // });
    call<[index: number, value: boolean], void>("set_fanAuto", index, auto);
  }

  private static applyFanPercent(index: number, percent: number) {
    // this.serverAPI!.callPluginMethod("set_fanPercent", {
    //   index: index,
    //   value: percent,
    // });
    call<[index: number, value: number], void>("set_fanPercent", index, percent);
  }
  public static throwSuspendEvt() {
    console.log("throwSuspendEvt");
    // this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
    call("receive_suspendEvent");
  }

  public static async getLatestVersion(): Promise<string> {
    // return (await this.serverAPI!.callPluginMethod("get_latest_version", {}))
    //   .result as string;
    return (await call("get_latest_version")) as string;
  }

  // updateLatest
  public static async updateLatest() {
    // return await this.serverAPI!.callPluginMethod("update_latest", {});
    return await call("update_latest");
  }

  public static async applyGPUSliderFix() {
    console.log("applyGPUSliderFix");
    // await this.serverAPI!.callPluginMethod("fix_gpuFreqSlider", {});
    return await call("fix_gpuFreqSlider");
  }

  // get_ryzenadj_info
  public static async getRyzenadjInfo(): Promise<string> {
    // return (await this.serverAPI!.callPluginMethod("get_ryzenadj_info", {}))
    //   .result as string;
    return (await call("get_ryzenadj_info")) as string;
  }

  // set_settings
  public static async setSettings(settingsData: SettingsData) {
    const obj = serializer.serializeObject(settingsData);
    // await this.serverAPI!.callPluginMethod("set_settings", {
    //   settings: obj,
    // });
    await call("set_settings", obj);
  }

  // get_settings
  public static async getSettings(): Promise<SettingsData> {
    // const res = await this.serverAPI!.callPluginMethod("get_settings", {});
    // if (!res.success) {
    //   return new SettingsData();
    // }
    // return (
    //   serializer.deserializeObject(res.result, SettingsData) ??
    //   new SettingsData()
    // );
    try {
      const res = await call("get_settings") as string;
      return serializer.deserializeObject(res, SettingsData) ?? new SettingsData();
    } catch (error) {
      console.error("getSettings error", error);
      return new SettingsData();
    }
  }

  // get_max_perf_pct
  public static async getMaxPerfPct(): Promise<number> {
    // return (await this.serverAPI!.callPluginMethod("get_max_perf_pct", {}))
    //   .result as number;
    return (await call("get_max_perf_pct")) as number;
  }

  // set_max_perf_pct
  public static async setMaxPerfPct(value: number) {
    // await this.serverAPI!.callPluginMethod("set_max_perf_pct", { value: value });
    return await call("set_max_perf_pct", value);
  }

  public static applySettings = (applyTarget: string) => {
    if (!Settings.ensureEnable()) {
      Backend.resetSettings();
      return;
    }

    // 把 OverWrite 同步到系统 QAM 的使用游戏配置文件开关
    if (applyTarget == APPLYTYPE.SET_ALL) {
      // console.log(`PtoQ.0 >>>>`);
      // console.log(`PtoQ.1 >>>> 同步 OverWrite 到 QAM ${Settings.appOverWrite()}`)
      QAMPatch.togglePreferAppProfile(Settings.appOverWrite());
    }

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_CPUCORE
    ) {
      const smt = Settings.appSmt();
      const cpuNum = Settings.appCpuNum();
      Backend.applySmt(smt);
      Backend.applyCpuNum(cpuNum);
    }
    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_CPUBOOST
    ) {
      const cpuBoost = Settings.appCpuboost();
      Backend.applyCpuBoost(cpuBoost);
    }
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_TDP) {
      // 自定义 QAM TDP范围
      const enableCustomTDPRange = Settings.appEnableCustomTDPRange();
      const customTDPRangeMax = Settings.appCustomTDPRangeMax();
      const customTDPRangeMin = Settings.appCustomTDPRangeMin();

      // patch 成功才设置 QAM 的 TDP 范围
      if (PluginManager.isPatchSuccess(Patch.TDPPatch)) {
        if (enableCustomTDPRange) {
          QAMPatch.setTDPRange(customTDPRangeMin, customTDPRangeMax);
        } else {
          QAMPatch.setTDPRange(
            DEFAULT_TDP_MIN,
            Backend.data.getTDPMax() !== 0
              ? Backend.data.getTDPMax()
              : DEFAULT_TDP_MAX
          );
        }
      }

      // 应用 TDP
      const tdp = Settings.appTDP();
      const tdpEnable = Settings.appTDPEnable();
      const _tdp = enableCustomTDPRange
        ? Math.min(customTDPRangeMax, Math.max(customTDPRangeMin, tdp))
        : tdp;

      if (!PluginManager.isPatchSuccess(Patch.TDPPatch) || Settings.appForceShowTDP()) {
        console.log(
          `>>>>> 插件方式更新 TDP = ${_tdp} TDPEnable = ${tdpEnable}`
        );

        if (tdpEnable) {
          Backend.applyTDP(_tdp);
        } else {
          Backend.applyTDP(Backend.data.getTDPMax());
        }

        try {
          QAMPatch.setTDPEanble(tdpEnable);
          if (tdpEnable) {
            QAMPatch.setTDP(_tdp);
          }
        } catch (error) {
          console.error(`>>>>> 强制显示 TDP 时设置QAM失败`, error);
        }
      }

      // patch 成功, 更新 QAM 中设置的值
      if (PluginManager.isPatchSuccess(Patch.TDPPatch)) {
        console.log(
          `>>>>> 原生设置更新 TDP = ${_tdp} TDPEnable = ${tdpEnable}`
        );
        // patch 成功才更新 QAM 中设置的值
        QAMPatch.setTDPEanble(tdpEnable);
        QAMPatch.setTDP(_tdp);
        if (tdpEnable) {
          Backend.applyTDP(_tdp);
        } else {
          Backend.applyTDP(Backend.data.getTDPMax());
        }
      }
    }

    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_CPU_MAX_PERF) {
      const maxPerfPct = Settings.appCpuMaxPerfPct();
      Backend.setMaxPerfPct(maxPerfPct);
    }

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_GPUMODE
    ) {
      const gpuMode = Settings.appGPUMode();
      const gpuFreq = Settings.appGPUFreq();
      const gpuSliderFix = Settings.appGPUSliderFix();
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
      } else if (gpuMode == GPUMODE.NATIVE && gpuSliderFix) {
        console.log(`原生设置无需处理`);
      } else if (gpuMode == GPUMODE.AUTO) {
        console.log(`开始自动优化GPU频率`);
        Settings.setTDPEnable(false);
        Settings.setCpuboost(false);
        Backend.applyGPUAutoRange(gpuAutoMinFreq, gpuAutoMaxFreq);
        Backend.applyGPUAuto(true);
      } else if (gpuMode == GPUMODE.RANGE) {
        Backend.applyGPUAuto(false);
        Backend.applyGPUFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
      } else {
        console.log(`出现意外的GPUmode = ${gpuMode}`);
        Backend.applyGPUFreq(0);
      }
    }

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_GPUSLIDERFIX
    ) {
      const gpuSlideFix = Settings.appGPUSliderFix();
      if (gpuSlideFix) {
        Backend.applyGPUSliderFix();
      }
    }

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_CPU_GOVERNOR
    ) {
      const cpuGovernor = Settings.appCPUGovernor();
      if (cpuGovernor) {
        Backend.setCpuGovernor(cpuGovernor);
      }
    }

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_EPP
    ) {
      const eppMode = Settings.appEPPMode();
      if (eppMode) {
        Backend.setEPP(eppMode);
      }
    }

    /*
    if (applyTarget == APPLYTYPE.SET_ALL || applyTarget == APPLYTYPE.SET_FANMODE){
      if(!FanControl.fanIsEnable){
        return;
      }
      const fanSettings = Settings.appFanSettings();
      fanSettings?.forEach((fanSetting,index)=>{
        const fanMode = fanSetting?.fanMode;
        if (fanMode == FANMODE.NOCONTROL) {
            Backend.applyFanAuto(index,true);
        } else if (fanMode == FANMODE.FIX) {
          Backend.applyFanAuto(index,false);
        } else if (fanMode == FANMODE.CURVE) {
          Backend.applyFanAuto(index,false);
        } else {
            Backend.applyFanAuto(index,true);
            console.log(`出现意外的FanMode = ${fanMode}`)
        };
      })
      
    }*/

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_FANRPM
    ) {
      if (!FanControl.fanIsEnable) {
        return;
      }
      const fanSettings = Settings.appFanSettings();
      for (var index = 0; index < fanSettings.length; index++) {
        var fanSetting = Settings.appFanSettings()?.[index];
        //没有配置时转自动
        if (!fanSetting) {
          Backend.applyFanAuto(index, true);
          // console.log(`没有配置 index= ${index}`);
          continue;
        }
        const fanMode = fanSetting.fanMode;
        //写入转速后再写入控制位
        if (fanMode == FANMODE.NOCONTROL) {
          // console.log(`不控制 index= ${index}`);
          Backend.applyFanAuto(index, true);
        } else if (fanMode == FANMODE.FIX) {
          // console.log(`直线 index= ${index}`);
          Backend.applyFanPercent(
            index,
            FanControl.fanInfo[index].setPoint.fanRPMpercent!!
          );
          Backend.applyFanAuto(index, false);
        } else if (fanMode == FANMODE.CURVE) {
          // console.log(`曲线 index= ${index}`);
          Backend.applyFanPercent(
            index,
            FanControl.fanInfo[index].setPoint.fanRPMpercent!!
          );
          Backend.applyFanAuto(index, false);
        } else {
          console.error(`出现意外的FanMode = ${fanMode}`);
        }
      }
    }
  };

  public static resetFanSettings = () => {
    FanControl.fanInfo.forEach((_value, index) => {
      Backend.applyFanAuto(index, true);
    });
  };

  public static resetSettings = () => {
    console.log("重置所有设置");
    Backend.applySmt(true);
    Backend.applyCpuNum(Backend.data.getCpuMaxNum());
    Backend.applyCpuBoost(true);
    Backend.applyTDP(Backend.data.getTDPMax());
    Backend.applyGPUFreq(0);
    FanControl.fanInfo.forEach((_value, index) => {
      Backend.applyFanAuto(index, true);
    });
  };

  // 获取当前 CPU 调度器
  public static async getCpuGovernor(): Promise<string> {
    try {
      return await call<[], string>("get_cpu_governor");
    } catch (error) {
      console.error("获取 CPU 调度器失败:", error);
      return "";
    }
  }

  // 获取所有可用的 CPU 调度器
  public static async getAvailableGovernors(): Promise<string[]> {
    try {
      return await call<[], string[]>("get_available_governors");
    } catch (error) {
      console.error("获取可用 CPU 调度器列表失败:", error);
      return [];
    }
  }

  // 设置 CPU 调度器
  public static async setCpuGovernor(governor: string): Promise<boolean> {
    try {
      return await call<[string], boolean>("set_cpu_governor", governor);
    } catch (error) {
      console.error("设置 CPU 调度器失败:", error);
      return false;
    }
  }

  // 获取当前 EPP 模式
  public static getCurrentEPP(): Promise<string | null> {
    return call("get_current_epp");
  }

  // 获取可用的 EPP 模式列表
  public static getEPPModes(): Promise<string[]> {
    return call("get_epp_modes");
  }

  // 检查是否支持 EPP 功能
  public static isEPPSupported(): Promise<boolean> {
    return call("is_epp_supported");
  }

  // 设置 EPP 模式
  public static setEPP(mode: string): Promise<boolean> {
    return call("set_epp", mode);
  }
}
