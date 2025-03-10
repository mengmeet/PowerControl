import { APPLYTYPE, FANMODE, GPUMODE, Patch } from "./enum";
import { FanControl, PluginManager } from "./pluginMain";
import { FanSetting, Settings, SettingsData } from "./settings";
import {
  DEFAULT_TDP_MAX,
  DEFAULT_TDP_MIN,
  FanPosition,
  QAMPatch,
  SteamUtils,
  SystemInfo,
} from ".";
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
  private cpuVendor: string = "";
  private has_cpuVendor = false;
  private supportsBypassCharge = false;
  private has_supportsBypassCharge = false;
  private supportsChargeLimit = false;
  private has_supportsChargeLimit = false;
  private supportsResetChargeLimit = false;
  private has_supportsResetChargeLimit = false;
  private supportsSoftwareChargeLimit = false;
  private has_supportsSoftwareChargeLimit = false;

  public async init() {
    await call<[], number>("get_cpuMaxNum").then((res) => {
      // console.info("cpuMaxNum = " + res.result);
      this.cpuMaxNum = res;
      this.has_cpuMaxNum = true;
    });
    await call<[], number>("get_tdpMax").then((res) => {
      this.tdpMax = res;
      this.has_tdpMax = true;
    });
    await call<[], number[]>("get_gpuFreqRange").then((res) => {
      this.gpuMin = res[0];
      this.gpuMax = res[1];
      this.has_gpuMin = true;
      this.has_gpuMax = true;
    });
    await call<[], []>("get_fanConfigList").then((res) => {
      this.fanConfigs = res;
      this.has_fanConfigs = res.length > 0;
    });

    await call<[], boolean>("get_isSupportSMT").then((res) => {
      this.isSupportSMT = res;
      this.has_isSupportSMT = true;
    });

    Backend.getMaxPerfPct().then((value) => {
      this.supportCPUMaxPct = value > 0;
    });

    await call<[], string>("get_version").then((res) => {
      this.current_version = res;
    });

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

    await call<[], string>("get_cpu_vendor")
      .then((res) => {
        this.cpuVendor = res;
        this.has_cpuVendor = true;
      })
      .catch((err) => {
        console.error("获取 CPU 厂商失败:", err);
        this.cpuVendor = "";
        this.has_cpuVendor = false;
      });

    await call<[], boolean>("supports_bypass_charge")
      .then((res) => {
        this.supportsBypassCharge = res;
        this.has_supportsBypassCharge = true;
      })
      .catch((err) => {
        console.error("检查 BYPASS_CHARGE 支持失败:", err);
        this.supportsBypassCharge = false;
        this.has_supportsBypassCharge = false;
      });

    await call<[], boolean>("supports_charge_limit")
      .then((res) => {
        this.supportsChargeLimit = res;
        this.has_supportsChargeLimit = true;
      })
      .catch((err) => {
        console.error("检查 CHARGE_LIMIT 支持失败:", err);
        this.supportsChargeLimit = false;
        this.has_supportsChargeLimit = false;
      });

    await call<[], boolean>("supports_reset_charge_limit")
      .then((res) => {
        this.supportsResetChargeLimit = res;
        this.has_supportsResetChargeLimit = true;
      })
      .catch((err) => {
        console.error("检查 RESET_CHARGE_LIMIT 支持失败:", err);
        this.supportsResetChargeLimit = false;
        this.has_supportsResetChargeLimit = false;
      });
  }

  public getForceShowTDP() {
    // 检查 Steam 客户端版本，如果版本大于等于 minSteamVersion。不显示强制 TDP 开关。并默认显示 TDP 控制组件
    return this.systemInfo!.nSteamVersion >= minSteamVersion;
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

  public getFanPwmMode(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_hwmon_mode ?? 0;
    }
    return 0;
  }

  public getFanHwmonDefaultCurve(
    index: number
  ): { speedValue: number; tempValue: number }[] {
    const result: { speedValue: number; tempValue: number }[] = [];
    if (this.has_fanConfigs) {
      const defaultCurve = this.fanConfigs?.[index]?.fan_default_curve ?? [];
      const pwmWriteMax: number =
        this.fanConfigs?.[index]?.fan_pwm_write_max ?? 255;
      console.log(">>>>>>>>>>> getHwmonDefaultCurve", defaultCurve);
      if (defaultCurve instanceof Array && defaultCurve.length > 0) {
        for (let i = 0; i < defaultCurve.length; i++) {
          const pwmValue = defaultCurve[i]?.pwm_value;
          const tempValue = defaultCurve[i]?.temp_value;
          if (pwmValue !== undefined && tempValue !== undefined) {
            result.push({
              speedValue: (pwmValue / pwmWriteMax) * 100, // pwmValue 转为百分比
              tempValue,
            });
          }
        }
      }
    }
    return result;
  }

  public getDefaultFanSetting(index: number): FanSetting | undefined {
    const defaultFanPoints = this.getFanHwmonDefaultCurve(index);
    if (defaultFanPoints.length > 0) {
      const curvePoints: FanPosition[] = defaultFanPoints.map(
        (point) => new FanPosition(point.tempValue, point.speedValue)
      );
      console.log(">>>>>>>>>> getHwmonAutoFanSetting", curvePoints);
      return new FanSetting(false, FANMODE.CURVE, 50, curvePoints);
    }
    return undefined;
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
    await call<[index: number], number>("get_fanRPM", index)
      .then((res) => {
        fanPRM = res;
      })
      .catch((error) => {
        console.error("get_fanRPM error", error);
      });
    return fanPRM;
  }

  public async getFanTemp(index: number) {
    var fanTemp: number = -1;
    await call<[index: number], number>("get_fanTemp", index)
      .then((res) => {
        fanTemp = res / 1000;
      })
      .catch((error) => {
        console.error("get_fanTemp error", error);
      });
    return fanTemp;
  }

  public async getFanIsAuto(index: number) {
    var fanIsAuto: boolean = false;
    await call<[index: number], boolean>("get_fanIsAuto", index)
      .then((res) => {
        fanIsAuto = res;
      })
      .catch((error) => {
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

  public getCpuVendor() {
    return this.cpuVendor;
  }

  public hasCpuVendor() {
    return this.has_cpuVendor;
  }

  public getIsSupportBypassCharge() {
    return this.supportsBypassCharge;
  }

  public hasIsSupportBypassCharge() {
    return this.has_supportsBypassCharge;
  }

  public getIsSupportChargeLimit() {
    return this.supportsChargeLimit;
  }

  public hasIsSupportChargeLimit() {
    return this.has_supportsChargeLimit;
  }

  public isSupportResetChargeLimit() {
    return this.supportsResetChargeLimit;
  }

  public hasIsSupportResetChargeLimit() {
    return this.has_supportsResetChargeLimit;
  }

  // isSupportSoftwareChargeLimit
  public isSupportSoftwareChargeLimit() {
    return this.supportsSoftwareChargeLimit;
  }

  public hasIsSupportSoftwareChargeLimit() {
    return this.has_supportsSoftwareChargeLimit;
  }
}

export class Backend {
  public static data: BackendData;
  public static async init() {
    this.data = new BackendData();
    await this.data.init();
  }

  public static async applySettings(applyTarget: APPLYTYPE) {
    try {
      if (!Settings.ensureEnable()) {
        Backend.resetSettings();
        return;
      }

      if (applyTarget === APPLYTYPE.SET_ALL) {
        // 同步 OverWrite 到 QAM
        QAMPatch.togglePreferAppProfile(Settings.appOverWrite());
      }

      // CPU 相关设置处理
      if (applyTarget === APPLYTYPE.SET_ALL) {
        const cpuHandlers = [
          Backend.handleCPUNum,
          Backend.handleCPUBoost,
          Backend.handleCPUGovernor,
          Backend.handleEPP,
          Backend.handleCpuMaxPerfPct,
        ];
        await Promise.all(cpuHandlers.map((handler) => handler()));

        // GPU 相关设置处理
        const gpuHandlers = [Backend.handleGPUMode, Backend.handleGPUSliderFix];
        await Promise.all(gpuHandlers.map((handler) => handler()));

        // TDP 相关设置处理
        await Backend.handleTDPRange();
        await Backend.handleTDP();

        // 风扇控制设置处理
        await Backend.handleFanControl();

        // 电池限制设置处理
        await Backend.handleChargeLimit();
      } else {
        const handler = Backend.settingsHandlers.get(applyTarget);
        if (handler) {
          await handler();
        }
      }
    } catch (error) {
      console.error(`应用设置失败: ${applyTarget}`, error);
    }
  }

  private static async handleCPUNum(): Promise<void> {
    const cpuNum = Settings.appCpuNum();
    const smt = Settings.appSmt();
    if (cpuNum) {
      await Backend.applySmt(smt);
      await Backend.applyCpuNum(cpuNum);
    }
  }

  private static async handleCPUBoost(): Promise<void> {
    const cpuBoost = Settings.appCpuboost();
    if (cpuBoost !== undefined) {
      await Backend.applyCpuBoost(cpuBoost);
    }
  }

  private static async handleCPUGovernor(): Promise<void> {
    await Backend.handleGovernorAndEPP();
  }

  private static async handleCpuMaxPerfPct(): Promise<void> {
    const cpuMaxPerfPct = Settings.appCpuMaxPerfPct();
    const autoCPUMaxPct = Settings.appAutoCPUMaxPct();
    await Backend.setAutoCPUMaxPct(autoCPUMaxPct);
    if (!autoCPUMaxPct) {
      await Backend.setMaxPerfPct(cpuMaxPerfPct);
    }
  }

  private static async handleEPP(): Promise<void> {
    await Backend.handleGovernorAndEPP();
  }

  private static async handleGovernorAndEPP(): Promise<void> {
    const eppMode = Settings.appEPPMode();
    const cpuGovernor = Settings.appCPUGovernor();
    if (cpuGovernor) {
      await Backend.setCpuGovernor(cpuGovernor);
    }
    if (eppMode) {
      await Backend.setEPP(eppMode);
    }
  }

  private static async handleGPUMode(): Promise<void> {
    const gpuMode = Settings.appGPUMode();
    const gpuFreq = Settings.appGPUFreq();
    const gpuSliderFix = Settings.appGPUSliderFix();
    const gpuAutoMaxFreq = Settings.appGPUAutoMaxFreq();
    const gpuAutoMinFreq = Settings.appGPUAutoMinFreq();
    const gpuRangeMaxFreq = Settings.appGPURangeMaxFreq();
    const gpuRangeMinFreq = Settings.appGPURangeMinFreq();

    switch (gpuMode) {
      case GPUMODE.NOLIMIT:
        await Backend.applyGPUAuto(false);
        await Backend.applyGPUFreq(0);
        break;
      case GPUMODE.FIX:
        await Backend.applyGPUAuto(false);
        await Backend.applyGPUFreq(gpuFreq);
        break;
      case GPUMODE.NATIVE:
        if (gpuSliderFix) {
          console.log(`原生设置无需处理`);
        }
        break;
      case GPUMODE.AUTO:
        Settings.setTDPEnable(false);
        Settings.setCpuboost(false);
        await Backend.applyGPUAutoRange(gpuAutoMinFreq, gpuAutoMaxFreq);
        await Backend.applyGPUAuto(true);
        break;
      case GPUMODE.RANGE:
        await Backend.applyGPUAuto(false);
        await Backend.applyGPUFreqRange(gpuRangeMinFreq, gpuRangeMaxFreq);
        break;
      default:
        console.log(`出现意外的GPUmode = ${gpuMode}`);
        await Backend.applyGPUFreq(0);
    }
  }

  private static async handleGPUSliderFix(): Promise<void> {
    const gpuSliderFix = Settings.appGPUSliderFix();
    if (gpuSliderFix) {
      await Backend.applyGPUSliderFix();
    }
  }

  private static async handleTDPRange(): Promise<void> {
    const enableCustomTDPRange = Settings.appEnableCustomTDPRange();
    const customTDPRangeMax = Settings.appCustomTDPRangeMax();
    const customTDPRangeMin = Settings.appCustomTDPRangeMin();

    if (PluginManager.isPatchSuccess(Patch.TDPPatch)) {
      if (enableCustomTDPRange) {
        await QAMPatch.setTDPRange(customTDPRangeMin, customTDPRangeMax);
      } else {
        await QAMPatch.setTDPRange(
          DEFAULT_TDP_MIN,
          Backend.data.getTDPMax() !== 0
            ? Backend.data.getTDPMax()
            : DEFAULT_TDP_MAX
        );
      }
    }
  }

  private static async handleTDP(): Promise<void> {
    const enableCustomTDPRange = Settings.appEnableCustomTDPRange();
    const customTDPRangeMax = Settings.appCustomTDPRangeMax();
    const customTDPRangeMin = Settings.appCustomTDPRangeMin();
    const tdp = Settings.appTDP();
    const tdpEnable = Settings.appTDPEnable();
    const _tdp = enableCustomTDPRange
      ? Math.min(customTDPRangeMax, Math.max(customTDPRangeMin, tdp))
      : tdp;

    // 处理非插件模式或强制显示 TDP 的情况
    if (
      !PluginManager.isPatchSuccess(Patch.TDPPatch) ||
      Settings.appForceShowTDP()
    ) {
      if (tdpEnable) {
        await Backend.applyTDP(_tdp);
      } else {
        await Backend.applyTDP(Backend.data.getTDPMax());
      }

      try {
        await QAMPatch.setTDPEanble(tdpEnable);
        if (tdpEnable) {
          await QAMPatch.setTDP(_tdp);
        }
      } catch (error) {
        console.error(`强制显示 TDP 时设置QAM失败`, error);
      }
    }

    // 处理插件模式的情况
    if (PluginManager.isPatchSuccess(Patch.TDPPatch)) {
      await QAMPatch.setTDPEanble(tdpEnable);
      await QAMPatch.setTDP(_tdp);
      if (tdpEnable) {
        await Backend.applyTDP(_tdp);
      } else {
        await Backend.applyTDP(Backend.data.getTDPMax());
      }
    }
  }

  private static async handleFanControl(): Promise<void> {
    if (!FanControl.fanIsEnable) {
      return;
    }

    const fanSettings = Settings.appFanSettings();
    for (let index = 0; index < fanSettings.length; index++) {
      const fanSetting = Settings.appFanSettings()?.[index];
      //没有配置时转自动
      if (!fanSetting) {
        await Backend.applyFanAuto(index, true);
        // console.log(`没有配置 index= ${index}`);
        continue;
      }

      const fanMode = fanSetting.fanMode;
      const fanRPMPercent = FanControl.fanInfo[index].setPoint.fanRPMpercent;

      if (!fanRPMPercent) {
        console.error(`风扇转速百分比未设置: index=${index}`);
        continue;
      }

      //写入转速后再写入控制位
      switch (fanMode) {
        case FANMODE.NOCONTROL:
          // console.log(`不控制 index= ${index}`);
          await Backend.applyFanAuto(index, true);
          break;
        case FANMODE.FIX:
        case FANMODE.CURVE:
          // console.log(`${fanMode == FANMODE.FIX ? '直线' : '曲线'} index= ${index}`);
          await Backend.applyFanPercent(index, fanRPMPercent);
          await Backend.applyFanAuto(index, false);
          break;
        default:
          console.error(`出现意外的FanMode = ${fanMode}`);
          await Backend.applyFanAuto(index, true);
      }
    }
  }

  private static async handleChargeLimit() {
    const chargeLimit = Settings.appChargeLimit();
    const bypassCharge = Settings.appBypassCharge();
    const supportsChargeLimit = Backend.data.getIsSupportChargeLimit();
    const supportsBypassCharge = Backend.data.getIsSupportBypassCharge();
    const enableChargeLimit = Settings.appEnableChargeLimit();
    const supportsResetChargeLimit = Backend.data.isSupportResetChargeLimit();
    // const softwareChargeLimit = Backend.data.isSupportSoftwareChargeLimit();

    if (supportsResetChargeLimit && !enableChargeLimit) {
      console.log(`重置电池充电限制`);
      await Backend.resetChargeLimit();
      return;
    }

    console.log(`电池充电限制 = ${chargeLimit}, 旁路供电 = ${bypassCharge}`);
    if (bypassCharge) {
      if (supportsBypassCharge) {
        console.log(`手动开启旁路供电`);
        await Backend.setBypassCharge(bypassCharge);
      }
    } else if (supportsChargeLimit) {
      console.log(`关闭旁路供电, 但设置了电池充电限制 = ${chargeLimit}`);
      await Backend.setChargeLimit(chargeLimit);
    } else {
      if (supportsBypassCharge) {
        console.log(`手动关闭旁路供电`);
        await Backend.setBypassCharge(false);
      }
    }
  }

  private static settingsHandlers: Map<APPLYTYPE, () => Promise<void>> =
    new Map([
      [APPLYTYPE.SET_CPUCORE, Backend.handleCPUNum],
      [APPLYTYPE.SET_CPUBOOST, Backend.handleCPUBoost],
      [APPLYTYPE.SET_CPU_GOVERNOR, Backend.handleCPUGovernor],
      [APPLYTYPE.SET_CPU_MAX_PERF, Backend.handleCpuMaxPerfPct],
      [APPLYTYPE.SET_EPP, Backend.handleEPP],
      [APPLYTYPE.SET_GPUMODE, Backend.handleGPUMode],
      [APPLYTYPE.SET_GPUSLIDERFIX, Backend.handleGPUSliderFix],
      [APPLYTYPE.SET_TDP, Backend.handleTDP],
      [APPLYTYPE.SET_FANRPM, Backend.handleFanControl],
      [APPLYTYPE.SET_POWER_BATTERY, Backend.handleChargeLimit],
    ]);

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

  private static applySmt(smt: boolean) {
    call("set_smt", smt);
  }

  private static applyCpuNum(cpuNum: number) {
    call("set_cpuOnline", cpuNum);
  }

  private static applyCpuBoost(cpuBoost: boolean) {
    call("set_cpuBoost", cpuBoost);
  }

  public static applyTDP = (tdp: number) => {
    call("set_cpuTDP", tdp);
  };

  public static applyGPUFreq(freq: number) {
    call("set_gpuFreq", freq);
  }

  private static applyGPUFreqRange(freqMin: number, freqMax: number) {
    call<[value: number, value2: number], void>(
      "set_gpuFreqRange",
      freqMin,
      freqMax
    );
  }

  private static applyGPUAuto(auto: boolean) {
    call("set_gpuAuto", auto);
  }

  private static applyGPUAutoRange(minAutoFreq: number, maxAutoFreq: number) {
    call<[min: number, max: number], void>(
      "set_gpuAutoFreqRange",
      minAutoFreq,
      maxAutoFreq
    );
  }

  private static applyFanAuto(index: number, auto: boolean) {
    call<[index: number, value: boolean], void>("set_fanAuto", index, auto);
  }

  private static applyFanPercent(index: number, percent: number) {
    call<[index: number, value: number], void>(
      "set_fanPercent",
      index,
      percent
    );
  }
  public static throwSuspendEvt() {
    console.log("throwSuspendEvt");
    call("receive_suspendEvent");
  }

  public static async getLatestVersion(): Promise<string> {
    return (await call("get_latest_version")) as string;
  }

  // updateLatest
  public static async updateLatest() {
    return await call("update_latest");
  }

  public static async applyGPUSliderFix() {
    console.log("applyGPUSliderFix");
    return await call("fix_gpuFreqSlider");
  }

  // get_ryzenadj_info
  public static async getRyzenadjInfo(): Promise<string> {
    return (await call("get_ryzenadj_info")) as string;
  }

  // set_settings
  public static async setSettings(settingsData: SettingsData) {
    const obj = serializer.serializeObject(settingsData);
    await call("set_settings", obj);
  }

  // get_settings
  public static async getSettings(): Promise<SettingsData> {
    try {
      const res = (await call("get_settings")) as string;
      return (
        serializer.deserializeObject(res, SettingsData) ?? new SettingsData()
      );
    } catch (error) {
      console.error("getSettings error", error);
      return new SettingsData();
    }
  }

  // get_max_perf_pct
  public static async getMaxPerfPct(): Promise<number> {
    return (await call("get_max_perf_pct")) as number;
  }

  // set_max_perf_pct
  public static async setMaxPerfPct(value: number) {
    return await call("set_max_perf_pct", value);
  }

  // set_auto_cpumax_pct
  public static async setAutoCPUMaxPct(value: boolean) {
    return await call("set_auto_cpumax_pct", value);
  }

  // get_cpu_vendor
  public static async getCpuVendor(): Promise<string> {
    return (await call("get_cpu_vendor")) as string;
  }

  // set_bypass_charge
  public static async setBypassCharge(value: boolean) {
    return await call("set_bypass_charge", value);
  }

  // get_bypass_charge
  public static async getBypassCharge(): Promise<boolean> {
    return (await call("get_bypass_charge")) as boolean;
  }

  // set_charge_limit
  public static async setChargeLimit(value: number) {
    return await call("set_charge_limit", value);
  }

  // reset_charge_limit
  public static async resetChargeLimit() {
    return await call("reset_charge_limit");
  }

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
    console.log(`设置 EPP 模式为: ${mode}`);
    return call("set_epp", mode);
    // return Promise.resolve(true);
  }
}
