export enum GPUMODE {
  NATIVE = "NATIVE", //系统原生设置
  NOLIMIT = "NOLIMIT", //不限制
  FIX = "FIX", //固定频率
  RANGE = "RANGE", //系统调度
  AUTO = "AUTO", //自动频率
}
export enum FANMODE {
  NOCONTROL = 0, //不控制
  FIX = 1, //固定
  CURVE = 2, //曲线
}

export enum FAN_PWM_MODE {
  SINGLE = 0, // 单文件
  MULTI_SAME = 1, // 多文件相同值
  MULTI_DIFF = 2, // 多文件不同值
}

export enum FANPROFILEACTION {
  DELETE = "DELETE", //删除风扇配置
  USE = "USE", //使用风扇配置
  EDIT = "EDIT", //编辑风扇配置
  ADD = "ADD", //添加风扇配置
  CANCEL = "CANCEL", //取消当前配置
}

export enum APPLYTYPE {
  SET_ALL = "ALL",
  SET_CPUBOOST = "SET_CPUBOOST",
  SET_CPUCORE = "SET_CPUCORE",
  SET_TDP = "SET_TDP",
  SET_CPU_MAX_PERF = "SET_CPU_MAX_PERF",
  SET_GPUMODE = "SET_GPUMODE",
  SET_FANMODE = "SET_FANMODE",
  SET_FANRPM = "SET_FANRPM",
  SET_GPUSLIDERFIX = "SET_GPUSLIDEFIX",
  SET_CPU_GOVERNOR = "SET_CPU_GOVERNOR",
  SET_EPP = "SET_EPP",
  SET_POWER_BATTERY = "SET_POWER_BATTERY",
}

export enum ComponentName {
  SET_ENABLE = "SET_ENABLE",
  SET_PERAPP = "SET_PERAPP",
  CPU_ALL = "CPU_ALL",
  CPU_BOOST = "CPU_BOOST",
  CPU_SMT = "CPU_SMT",
  CPU_NUM = "CPU_NUM",
  CPU_TDP = "CPU_TDP",
  CPU_PERFORMANCE = "CPU_PERFORMANCE",
  CPU_GOVERNOR = "CPU_GOVERNOR",
  CPU_EPP = "CPU_EPP",
  EPP_LEVEL_1 = "EPP_LEVEL_1",
  EPP_LEVEL_2 = "EPP_LEVEL_2",
  EPP_LEVEL_3 = "EPP_LEVEL_3",
  GPU_ALL = "GPU_ALL",
  GPU_FREQMODE = "GPU_FREQMODE",
  GPU_FREQFIX = "GPU_FREQFIX",
  GPU_FREQRANGE = "GPU_FREQRANGE",
  GPU_FREQAUTO = "GPU_FREQAUTO",
  GPU_SLIDERFIX = "GPU_SLIDERFIX",
  FAN_ALL = "FAN_ALL",
  FAN_RPM = "FAN_RPM",
  FAN_DISPLAY = "FAN_DISPLAY",
  SET_PERACMODE = "SET_PERACMODE",
  CUSTOM_TDP = "CUSTOM_TDP",
  POWER_ALL = "POWER_ALL",
  POWER_BYPASS_CHARGE = "POWER_BYPASS_CHARGE",
  POWER_CHARGE_LIMIT = "POWER_CHARGE_LIMIT",
}

export enum UpdateType {
  DISABLE = "DISABLE",
  UPDATE = "UPDATE",
  HIDE = "HIDE",
  SHOW = "SHOW",
  ENABLE = "ENABLE",
  DISMOUNT = "DISMOUNT",
}

export enum PluginState {
  INIT = "0",
  RUN = "1",
  QUIT = "2",
  ERROR = "3",
}

export enum Patch {
  TDPPatch = "TDPPatch",
  GPUPerformancePatch = "GPUPerformancePatch",
}

export enum GPUPerformanceLevel {
  DISABLE = 1,
  ENABLE = 2,
}

export enum SettingChangeEvent {
  GPUMODE = "GPUMODE",
}
