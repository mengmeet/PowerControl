export enum GPUMODE{
    NATIVE=0, //系统原生设置
    RANGE=1, //系统调度
    AUTO=2,  //自动频率
}
export enum FANMODE{
    NOCONTROL=0, //不控制
    FIX=1, //固定
    CURVE=2, //曲线
}

export enum FANPROFILEACTION{
    DELETE="DELETE",    //删除风扇配置
    USE="USE",  //使用风扇配置
    EDIT="EDIT", //编辑风扇配置
    ADD="ADD", //添加风扇配置
    CANCEL="CANCEL" //取消当前配置
}

export enum APPLYTYPE{
    SET_ALL = "ALL",
    SET_CPUBOOST = "SET_CPUBOOST",
    SET_CPUCORE = "SET_CPUCORE",
    SET_TDP = "SET_TDP",
    SET_GPUMODE = "SET_GPUMODE",
    SET_FANMODE = "SET_FANMODE",
    SET_FANRPM = "SET_FANRPM",
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
    FAN_ALL="FAN_ALL",
    FAN_RPM="FAN_RPM",
    FAN_DISPLAY="FAN_DISPLAY"
}

export enum UpdateType{
    DISABLE="DISABLE",
    UPDATE="UPDATE",
    HIDE="HIDE",
    SHOW="SHOW",
    ENABLE="ENABLE",
    DISMOUNT="DISMOUNT"
}

export enum PluginState{
    INIT="0",
    RUN="1",
    QUIT="2",
}

export enum Patch{
    TDPPatch="TDPPatch",
    GPUPerformancePatch="GPUPerformancePatch",
}

export enum GPUPerformanceLevel{
    DISABLE=1,
    ENABLE=2,
}

export enum SettingChangeEvent{
    GPUMODE="GPUMODE"
}