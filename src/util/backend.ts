import { ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, FANMODE, GPUMODE, Patch } from "./enum";
import { FanControl, PluginManager } from "./pluginMain";
import { Settings, SettingsData } from "./settings";
import { DEFAULT_TDP_MAX, DEFAULT_TDP_MIN, QAMPatch } from ".";
import { JsonSerializer } from "typescript-json-serializer";

const serializer = new JsonSerializer();

export class BackendData {
  private serverAPI: ServerAPI | undefined;
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
  public async init(serverAPI: ServerAPI) {
    this.serverAPI = serverAPI;
    await serverAPI!
      .callPluginMethod<{}, number>("get_cpuMaxNum", {})
      .then((res) => {
        if (res.success) {
          // console.info("cpuMaxNum = " + res.result);
          this.cpuMaxNum = res.result;
          this.has_cpuMaxNum = true;
        }
      });
    await serverAPI!
      .callPluginMethod<{}, number>("get_tdpMax", {})
      .then((res) => {
        if (res.success) {
          // console.info("tdpMax = " + res.result);
          this.tdpMax = res.result;
          this.has_tdpMax = true;
        }
      });
    await serverAPI!
      .callPluginMethod<{}, number[]>("get_gpuFreqRange", {})
      .then((res) => {
        if (res.success) {
          // console.info("gpuRange = " + res.result);
          this.gpuMin = res.result[0];
          this.gpuMax = res.result[1];
          this.has_gpuMin = true;
          this.has_gpuMax = true;
        }
      });
    await this.serverAPI!.callPluginMethod<{}, []>(
      "get_fanConfigList",
      {}
    ).then((res) => {
      if (res.success) {
        // console.info("fanConfigList", res.result);
        this.fanConfigs = res.result;
        this.has_fanConfigs = true;
      } else {
        this.has_fanConfigs = false;
      }
    });

    await this.serverAPI!.callPluginMethod<{}, boolean>(
      "get_isSupportSMT",
      {}
    ).then((res) => {
      if (res.success) {
        console.info("isSupportSMT = " + res.result);
        this.isSupportSMT = res.result;
        this.has_isSupportSMT = true;
      }
    });

    await this.serverAPI!.callPluginMethod<{}, string>("get_version", {}).then(
      (res) => {
        if (res.success) {
          console.info("current_version = " + res.result);
          this.current_version = res.result;
        }
      }
    );
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

  public async getFanRPM(index: number) {
    var fanPRM: number;
    await this.serverAPI!.callPluginMethod<{ index: number }, number>(
      "get_fanRPM",
      { index: index }
    ).then((res) => {
      //console.log("get_fanRPM res=",res,"index=",index)
      if (res.success) {
        fanPRM = res.result;
      } else {
        fanPRM = 0;
      }
    });
    return fanPRM!!;
  }

  public async getFanTemp(index: number) {
    var fanTemp: number;
    await this.serverAPI!.callPluginMethod<{ index: number }, number>(
      "get_fanTemp",
      { index: index }
    ).then((res) => {
      if (res.success) {
        fanTemp = res.result / 1000;
      } else {
        fanTemp = -1;
      }
    });
    return fanTemp!!;
  }

  public async getFanIsAuto(index: number) {
    var fanIsAuto: boolean;
    await this.serverAPI!.callPluginMethod<{ index: number }, boolean>(
      "get_fanIsAuto",
      { index: index }
    ).then((res) => {
      if (res.success) {
        fanIsAuto = res.result;
      } else {
        fanIsAuto = false;
      }
    });
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
    // console.log("Applying smt " + smt.toString());
    this.serverAPI!.callPluginMethod("set_smt", { value: smt });
  }

  private static applyCpuNum(cpuNum: number) {
    // console.log("Applying cpuNum " + cpuNum.toString());
    this.serverAPI!.callPluginMethod("set_cpuOnline", { value: cpuNum });
  }

  private static applyCpuBoost(cpuBoost: boolean) {
    // console.log("Applying cpuBoost " + cpuBoost.toString());
    this.serverAPI!.callPluginMethod("set_cpuBoost", { value: cpuBoost });
  }

  public static applyTDP = (tdp: number) => {
    console.log("Applying tdp " + tdp.toString());
    this.serverAPI!.callPluginMethod("set_cpuTDP", { value: tdp });
  };

  public static applyGPUFreq(freq: number) {
    // console.log("Applying gpuFreq " + freq.toString());
    this.serverAPI!.callPluginMethod("set_gpuFreq", { value: freq });
  }

  private static applyGPUFreqRange(freqMin: number, freqMax: number) {
    // console.log(
    //   "Applying gpuFreqRange  " +
    //     freqMin.toString() +
    //     "   " +
    //     freqMax.toString()
    // );
    this.serverAPI!.callPluginMethod("set_gpuFreqRange", {
      value: freqMin,
      value2: freqMax,
    });
  }

  private static applyGPUAuto(auto: boolean) {
    // console.log("Applying gpuAuto" + auto.toString());
    this.serverAPI!.callPluginMethod("set_gpuAuto", { value: auto });
  }

  private static applyGPUAutoRange(minAutoFreq: number, maxAutoFreq: number) {
    // console.log("Applying gpuAuto" + maxAutoFreq.toString());
    this.serverAPI!.callPluginMethod("set_gpuAutoFreqRange", {
      min: minAutoFreq,
      max: maxAutoFreq,
    });
  }

  private static applyFanAuto(index: number, auto: boolean) {
    this.serverAPI!.callPluginMethod("set_fanAuto", {
      index: index,
      value: auto,
    });
  }

  private static applyFanPercent(index: number, percent: number) {
    this.serverAPI!.callPluginMethod("set_fanPercent", {
      index: index,
      value: percent,
    });
  }
  public static throwSuspendEvt() {
    console.log("throwSuspendEvt");
    this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
  }

  public static async getLatestVersion(): Promise<string> {
    return (await this.serverAPI!.callPluginMethod("get_latest_version", {}))
      .result as string;
  }

  // updateLatest
  public static async updateLatest() {
    await this.serverAPI!.callPluginMethod("update_latest", {});
  }

  public static async applyGPUSliderFix() {
    console.log("applyGPUSliderFix");
    await this.serverAPI!.callPluginMethod("fix_gpuFreqSlider", {});
  }

  // get_ryzenadj_info
  public static async getRyzenadjInfo(): Promise<string> {
    return (await this.serverAPI!.callPluginMethod("get_ryzenadj_info", {}))
      .result as string;
  }

  // set_settings
  public static async setSettings(settingsData: SettingsData) {
    const obj = serializer.serializeObject(settingsData);
    await this.serverAPI!.callPluginMethod("set_settings", {
      settings: obj,
    });
  }

  // get_settings
  public static async getSettings(): Promise<SettingsData> {
    const res = await this.serverAPI!.callPluginMethod("get_settings", {});
    if (!res.success) {
      return new SettingsData();
    }
    return (
      serializer.deserializeObject(res.result, SettingsData) ??
      new SettingsData()
    );
  }

  public static getServerAPI() {
    return this.serverAPI;
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
        // console.log(
        //   `>>>>> 插件方式更新 TDP = ${_tdp} TDPEnable = ${tdpEnable}`
        // );
        if (tdpEnable) {
          Backend.applyTDP(_tdp);
        } else {
          Backend.applyTDP(Backend.data.getTDPMax());
        }
        if (Settings.appForceShowTDP()) {
          try {
            QAMPatch.setTDPEanble(tdpEnable);
            if (tdpEnable) {
              QAMPatch.setTDP(_tdp);
            }
          } catch (error) {
            console.error(`>>>>> 强制显示 TDP 时设置QAM失败`, error);
          }
        }
      } else {
        // console.log(
        //   `>>>>> 原生设置更新 TDP = ${_tdp} TDPEnable = ${tdpEnable}`
        // );
        // patch 成功才更新 QAM 中设置的值
        QAMPatch.setTDPEanble(tdpEnable);
        QAMPatch.setTDP(_tdp);
        if (tdpEnable) {
          Backend.applyTDP(_tdp);
        }
      }
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
}
