export enum GPUMODE{
    NOLIMIT=0, //不限制
    FIX=1, //固定频率
    RANGE=2, //系统调度
    AUTO=3,  //自动频率
}
export enum APPLYTYPE{
    SET_ALL = "ALL",
    SET_CPUBOOST = "SET_CPUBOOST",
    SET_CPUCORE = "SET_CPUCORE",
    SET_TDP = "SET_TDP",
    SET_GPUMODE = "SET_GPUMODE",
}

export enum ComponentName{
    SET_ENABLE="SET_ENABLE",
    SET_PERAPP="SET_PERAPP",
    CPU_ALL="CPU_ALL",
    CPU_BOOST="CPU_BOOST",
    CPU_SMT="CPU_SMT",
    CPU_NUM="CPU_NUM",
    CPU_TDP="CPU_TDP",
    GPU_ALL="GPU_ALL",
    GPU_FREQMODE="GPU_FREQMODE",
    GPU_FREQFIX="GPU_FREQFIX",
    GPU_FREQRANGE="GPU_FREQRANGE",
    GPU_FREQAUTO="GPU_FREQAUTO",
}

export enum UpdateType{
    DISABLE="DISABLE",
    UPDATE="UPDATE",
    HIDE="HIDE",
    SHOW="SHOW",
    ENABLE="ENABLE",
}

export enum PluginState{
    INIT="0",
    RUN="1",
    QUIT="2",
  }