import {
    findModuleChild,
    afterPatch,
    ServerAPI,
} from "decky-frontend-lib";
import { Backend } from "./backend";
  

export class QAMPatch {
    private static TDP_Patch: TDPPatch;
    public static async init(serverAPI:ServerAPI){
        var perfStoreClass;
        while(!perfStoreClass){
            perfStoreClass = findModuleChild((m: any) => {
                if (typeof m !== "object") return undefined;
                for (let prop in m) {
                  if (m[prop]?.prototype?.SetFPSLimit) return m[prop];
                }
              });
        }
        this.TDP_Patch = new TDPPatch();
        await this.TDP_Patch.init(serverAPI,perfStoreClass);
        this.patch();
    }
    
    public static patch() {
        console.debug("QAM patch");
        this.TDP_Patch.patch();
    }

    public static unpatch() {
        console.debug("QAM unpatch");
        this.TDP_Patch?.unpatch();
    }
}

class TDPPatch{
    private perfStoreClass:any;
    private perfStore:any;
    private serverAPI:any;
    private stateChangeHook:any;
    private suspendEndHook:any;
    private tdpPatch:any;
    private applyCount:number=0;
    private tdp_limit:number=0;
    private is_tdp_limit_enabled:boolean=false;
    public init(serverAPI:ServerAPI,perfStoreClass:any){
        this.serverAPI = serverAPI;
        this.perfStoreClass = perfStoreClass;
        this.perfStore = perfStoreClass.Get();
    }
    private applyTDP = ()=>{
        if(this.is_tdp_limit_enabled){
            console.log("Applying tdp " + this.tdp_limit.toString());
            this.serverAPI!.callPluginMethod("set_cpuTDP", {"value":this.tdp_limit});
        }else{
            if(Backend.data.HasTDPMax()){
                console.log("Applying tdp " + Backend.data.getTDPMax().toString());
                this.serverAPI!.callPluginMethod("set_cpuTDP", {"value":Backend.data.getTDPMax()});
            }
        }
        
    }

    public patch(){
        //状态改变时tdp发生变化则修改TDP
        this.stateChangeHook = SteamClient.System.Perf.RegisterForStateChanges(()=>{
            this.applyCount++;
            setTimeout(()=>{
                this.applyCount--;
                if(this.applyCount!=0)
                    return;
                if(this.tdp_limit != this.perfStore.msgSettingsPerApp.tdp_limit||this.is_tdp_limit_enabled != this.perfStore.msgSettingsPerApp.is_tdp_limit_enabled){
                    this.tdp_limit = this.perfStore.msgSettingsPerApp.tdp_limit;
                    this.is_tdp_limit_enabled = this.perfStore.msgSettingsPerApp.is_tdp_limit_enabled;
                    this.applyTDP();
                }
            },500)
        })
        //挂起结束时修改一次TDP
        this.suspendEndHook = SteamClient.System.RegisterForOnResumeFromSuspend(async () => {
            this.applyTDP();
          });
         
        //tdp最大值修补
        this.tdpPatch = afterPatch(this.perfStoreClass, "Get", (_: any[], ret: any) => {
            if(Backend.data.HasTDPMax()){
                this.perfStore.msgLimits.tdp_limit_max = Backend.data.getTDPMax();
            }
            return ret;
        });
    }

    public unpatch(){
        this.stateChangeHook?.unregister();
        this.suspendEndHook?.unregister();
        this.tdpPatch?.unpatch();
    }
}
