import {
    findModuleChild,
    afterPatch,
} from "decky-frontend-lib";
import { Backend } from "./backend";
import { GPUMODE, GPUPerformanceLevel, Patch } from "./enum";
import { Settings } from "./settings";
import { BatteryStateChange } from ".";

export class QAMPatch {
    private static TDP_Patch: TDPPatch;
    private static GPUPerformance_Patch: GPUPerformancePatch;
    private static patchResult: { [patchName: string]: Boolean }={};
    public static perfStore: any;
    public static async init(){
        try{
            var perfStoreClass;
            var count = 0;
            while(!this.perfStore){
                perfStoreClass = findModuleChild((m: any) => {
                    if (typeof m !== "object") return undefined;
                    for (let prop in m) {
                      if (m[prop]?.prototype?.SetFPSLimit) return m[prop];
                    }
                  });
                this.perfStore = perfStoreClass?.Get();
                count++;
                if(count>=10){
                    console.error("获取perfStore失败，结束修补")
                }
            }
            this.TDP_Patch = new TDPPatch();
            this.TDP_Patch.init(perfStoreClass);
            this.GPUPerformance_Patch = new GPUPerformancePatch();
            this.GPUPerformance_Patch.init(perfStoreClass);
            this.patch()
        }catch(e){
            console.error(e)
        }
    }
    
    public static async patch() {
        console.debug("QAM patch");
        this.TDP_Patch.patch((e)=>{this.patchResult[Patch.TDPPatch] = e});
        this.GPUPerformance_Patch.patch((e)=>{this.patchResult[Patch.GPUPerformancePatch] = e});
    }

    public static unpatch() {
        console.debug("QAM unpatch");
        this.TDP_Patch?.unpatch();
    }

    public static getPatchResult(patch:string){
        return this.patchResult?.[patch]??false;
    }

}

class TDPPatch{
    private perfStoreClass:any;
    private perfStore:any;
    private stateChangeHook:any;
    private batteryChangeHook:any;
    private suspendEndHook:any;
    private tdpPatch:any;
    private applyCount:number=0;
    private last_tdp_limit:number=0;
    private last_is_tdp_limit_enabled:boolean=false;
    private last_ac_state:number=0;
    public init(perfStoreClass:any){
        this.perfStoreClass = perfStoreClass;
        this.perfStore = perfStoreClass.Get();
    }
    private applyTDP = ()=>{
        if(this.perfStore?.msgSettingsPerApp?.is_tdp_limit_enabled){
            Backend.applyTDP(this.perfStore?.msgSettingsPerApp?.tdp_limit)
        }else{
            Backend.applyTDP(Backend.data.getTDPMax())
        }
    }

    public patch(patchCallBack:(isPatchSuccess:boolean)=>void){
        try{
            //tdp最大值修补
            this.tdpPatch = afterPatch(this.perfStoreClass, "Get", (_: any[], ret: any) => {
                try{
                    if(Backend.data.HasTDPMax()){
                        this.perfStore.msgLimits.tdp_limit_max = Backend.data.getTDPMax();
                    }else{
                        console.error("未获取到tdp最大值,结束修补");
                        patchCallBack(false);
                    }
                }catch(e){
                    console.error(`tdp最大值修补失败: ${e}`)
                    patchCallBack(false);
                }
                return ret;
            });
            
            
            //挂起结束时修改一次TDP
            this.suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
                setTimeout(()=>{
                    this.applyTDP();
                },1000)
            });

            //状态改变时tdp发生变化，则应用一次tdp
            this.stateChangeHook = SteamClient.System.Perf.RegisterForStateChanges(()=>{
                this.applyCount++;
                setTimeout(()=>{
                    this.applyCount--;
                    if(this.applyCount){
                        return;
                    }
                    //开关状态发生改变
                    if(this.last_is_tdp_limit_enabled!=this.perfStore?.msgSettingsPerApp?.is_tdp_limit_enabled||this.last_tdp_limit!=this.perfStore?.msgSettingsPerApp?.tdp_limit){
                        this.last_is_tdp_limit_enabled = this.perfStore?.msgSettingsPerApp?.is_tdp_limit_enabled;
                        this.last_tdp_limit = this.perfStore?.msgSettingsPerApp?.tdp_limit;
                        this.applyTDP();
                    }
                        
                },500)
                
            })

            //某些机型充电状态改变时tdp会重置，应用一次tdp
            this.batteryChangeHook = SteamClient.System.RegisterForBatteryStateChanges((steamBattery:BatteryStateChange)=>{
                /*
                console.log("SteamBattery Information:");
                console.log("bHasBattery:", steamBattery.bHasBattery);
                console.log("bShutdownRequested:", steamBattery.bShutdownRequested);
                console.log("eACState:", steamBattery.eACState);
                console.log("eBatteryState:", steamBattery.eBatteryState);
                console.log("flLevel:", steamBattery.flLevel);
                console.log("nSecondsRemaining:", steamBattery.nSecondsRemaining);
                console.log("\n");
                */
               if(this.last_ac_state!=steamBattery.eACState){
                    this.last_ac_state = steamBattery.eACState;
                    setTimeout(()=>{
                        this.applyTDP()
                    },500)
               }
            })
            patchCallBack(true);
        }catch(e){
            console.error(e)
            patchCallBack(false);
        }
        
    }

    public unpatch(){
        this.stateChangeHook?.unregister();
        this.suspendEndHook?.unregister();
        this.batteryChangeHook?.unregister();
        this.tdpPatch?.unpatch();
    }
}

class GPUPerformancePatch{
    private perfStoreClass:any;
    private perfStore:any;
    private stateChangeHook:any;
    private gpuClockPatch:any;
    private applyCount:number=0;
    private last_gpu_performance_manual_mhz:number=0;
    private last_gpu_performance_level:GPUPerformanceLevel = GPUPerformanceLevel.DISABLE;
    public init(perfStoreClass:any){
        this.perfStoreClass = perfStoreClass;
        this.perfStore = perfStoreClass.Get();
    }
    private applyGPUFreq = ()=>{
        //其他模式时防止原生设置改变频率
        // if(Settings.appGPUMode()==GPUMODE.RANGE||Settings.appGPUMode()==GPUMODE.AUTO){
        //     return;
        // }
        if ( Settings.appGPUMode() != GPUMODE.NATIVE ) {
            return;
        }
        if(GPUPerformanceLevel.ENABLE == this.perfStore?.msgSettingsPerApp?.gpu_performance_level){
            console.log("Applying gpuFreq " + this.perfStore.msgSettingsPerApp.gpu_performance_manual_mhz?.toString() + "gpu_enable " + this.perfStore?.msgSettingsPerApp?.gpu_performance_level);
            Backend.applyGPUFreq(this.perfStore.msgSettingsPerApp.gpu_performance_manual_mhz??0)
        }else{
            console.log("Applying gpuFreq 0" +"gpu_enable " + this.perfStore?.msgSettingsPerApp?.gpu_performance_level);
            Backend.applyGPUFreq(0)
        }
        
    }
    private onGpuModeChange = ()=>{
        //插件设置切换回原生时主动应用一次
        if(Settings.appGPUMode()==GPUMODE.NATIVE){
            this.applyGPUFreq()
        }
    }
    public patch(patchCallBack:(isPatchSuccess:boolean)=>void){
        try{
            //gpu范围修补
            this.gpuClockPatch = afterPatch(this.perfStoreClass, "Get", (_: any[], ret: any) => {
                try{
                    if(Backend.data.HasGPUFreqMax()){
                        this.perfStore.msgLimits.gpu_performance_manual_max_mhz=Backend.data.getGPUFreqMax();
                        this.perfStore.msgLimits.gpu_performance_manual_min_mhz=Backend.data.getGPUFreqMin();
                        if(!this.perfStore.msgLimits.gpu_performance_manual_mhz){
                            this.perfStore.msgLimits.gpu_performance_manual_mhz=Backend.data.getGPUFreqMin();
                        }
                    }else{
                        console.error("未获取到gpu频率范围,结束修补");
                        patchCallBack(false);
                    }
                }catch(e){
                    console.error(`gpu范围修补失败: ${e}`);
                    patchCallBack(false);
                }
                return ret;
            });
            //状态改变时gpu频率发生变化则修改gpu频率
            this.stateChangeHook = SteamClient.System.Perf.RegisterForStateChanges(()=>{
                this.applyCount++;
                setTimeout(()=>{
                    this.applyCount--;
                    if(this.applyCount)
                        return;
                    if(this.last_gpu_performance_level != this.perfStore.msgSettingsPerApp.gpu_performance_level||this.last_gpu_performance_manual_mhz != this.perfStore.msgSettingsPerApp.gpu_performance_manual_mhz){
                        this.last_gpu_performance_manual_mhz = this.perfStore.msgSettingsPerApp.gpu_performance_manual_mhz;
                        this.last_gpu_performance_level = this.perfStore.msgSettingsPerApp.gpu_performance_level as GPUPerformanceLevel;
                        this.applyGPUFreq();
                    }
                },300)
            })
            Settings.addGpuModeEventListener(this.onGpuModeChange);
            patchCallBack(true);
        }catch(e){
            console.error(e)
            patchCallBack(false);
        }
        
    }

    public unpatch(){
        this.stateChangeHook?.unregister();
        this.gpuClockPatch?.unpatch();
        Settings.removeGpuModeEventListener(this.onGpuModeChange);
    }
}
