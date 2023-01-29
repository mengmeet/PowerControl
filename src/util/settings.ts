import { JsonObject, JsonProperty, JsonSerializer } from 'typescript-json-serializer';
import { DEFAULT_APP } from './runningApp';

const SETTINGS_KEY = "PowerControl";

const serializer = new JsonSerializer();

@JsonObject()
export class AppSetting {
  @JsonProperty()
  overwrite?: boolean;
  @JsonProperty()
  smt?: boolean;
  @JsonProperty()
  cpuNum?: number;
  @JsonProperty()
  cpuboost?: boolean;
  @JsonProperty()
  tdp?:number;
  @JsonProperty()
  tdpEnable?:boolean
  @JsonProperty()
  gpuMode?:number
  @JsonProperty()
  gpuFreq?:number
  @JsonProperty()
  gpuAutoMaxFreq?:number
  @JsonProperty()
  gpuAutoMinFreq?:number
  @JsonProperty()
  gpuRangeMaxFreq?:number
  @JsonProperty()
  gpuRangeMinFreq?:number

  hasSettings(): boolean {
    if (this.overwrite != undefined)
      return true;
    if (this.smt != undefined)
      return true;
    if (this.cpuNum != undefined)
      return true;
    if (this.cpuboost != undefined)
      return true;
    if (this.tdp != undefined)
      return true;
    if (this.tdpEnable != undefined)
      return true;
    if (this.gpuMode != undefined)
      return true;
    if (this.gpuFreq != undefined)
      return true;
    //if (this.cpuFreq != undefined)
      //return true;
    if (this.gpuAutoMaxFreq != undefined)
      return true;
    if (this.gpuAutoMinFreq != undefined)
      return true;
    if (this.gpuRangeMaxFreq != undefined)
      return true;
    if (this.gpuRangeMinFreq != undefined)
      return true;
    return false;
  }
}

@JsonObject()
export class Settings {
  @JsonProperty()
  static enabled: boolean = true;
  @JsonProperty({ isDictionary: true, type: AppSetting })
  static perApp: { [appId: string]: AppSetting } = {};

  static ensureApp(appId: string): AppSetting {
    if (!(appId in this.perApp)) {
      this.perApp[appId] = new AppSetting();
    }
    return this.perApp[appId];
  }

  public static appOverWrite(appId: string):boolean {
    if (this.perApp[appId]?.overwrite != undefined)
      return this.perApp[appId].overwrite!!;
    if (this.perApp[DEFAULT_APP]?.overwrite != undefined){
      this.perApp[appId].overwrite = this.perApp[DEFAULT_APP].overwrite;
      return this.perApp[appId].overwrite!!;
    }
    return false;
  }

  static appSmt(appId: string): boolean {
    if (this.perApp[appId]?.smt != undefined)
      return this.perApp[appId].smt!!;
    if (this.perApp[DEFAULT_APP]?.smt != undefined){
      this.perApp[appId].smt = this.perApp[DEFAULT_APP].smt;
      return this.perApp[appId].smt!!;
    }
    return true;
  }

  static appCpuNum(appId: string) {
    if (this.perApp[appId]?.cpuNum != undefined)
      return this.perApp[appId].cpuNum!!;
    if (this.perApp[DEFAULT_APP]?.cpuNum != undefined){
      this.perApp[appId].cpuNum = this.perApp[DEFAULT_APP].cpuNum;
      return this.perApp[appId].cpuNum!!;
    }
    return 4;
  }

  static appCpuboost(appId: string): boolean {
    if (this.perApp[appId]?.cpuboost != undefined)
      return this.perApp[appId].cpuboost!!;
    if (this.perApp[DEFAULT_APP]?.cpuboost != undefined){
      this.perApp[appId].cpuboost = this.perApp[DEFAULT_APP].cpuboost;
      return this.perApp[appId].cpuboost!!;
    }
    return true;
  }

  static appTDP(appId: string) {
    if (this.perApp[appId]?.tdp != undefined)
      return this.perApp[appId].tdp!!;
    if (this.perApp[DEFAULT_APP]?.tdp != undefined){
      this.perApp[appId].tdp = this.perApp[DEFAULT_APP].tdp;
      return this.perApp[appId].tdp!!;
    }
    return 15;
  }

  static appTDPEnable(appId: string){
    if (this.perApp[appId]?.tdpEnable != undefined)
      return this.perApp[appId].tdpEnable!!;
    if (this.perApp[DEFAULT_APP]?.tdpEnable != undefined){
      this.perApp[appId].tdpEnable = this.perApp[DEFAULT_APP].tdpEnable;
      return this.perApp[appId].tdpEnable!!;
    }
    return false;
  }

  static appGPUMode(appId: string){
    if (this.perApp[appId]?.gpuMode != undefined)
      return this.perApp[appId].gpuMode!!;
    if (this.perApp[DEFAULT_APP]?.gpuMode != undefined){
      this.perApp[appId].gpuMode = this.perApp[DEFAULT_APP].gpuMode;
      return this.perApp[appId].gpuMode!!;
    }
    return 0;
  }

  static appGPUFreq(appId: string){
    if (this.perApp[appId]?.gpuFreq != undefined)
      return this.perApp[appId].gpuFreq!!;
    if (this.perApp[DEFAULT_APP]?.gpuFreq != undefined){
      this.perApp[appId].gpuFreq = this.perApp[DEFAULT_APP].gpuFreq;
      return this.perApp[appId].gpuFreq!!;
    }
    return 1600;
  }

  static appGPUAutoMaxFreq(appId: string){
    if (this.perApp[appId]?.gpuAutoMaxFreq != undefined)
      return this.perApp[appId].gpuAutoMaxFreq!!;
    if (this.perApp[DEFAULT_APP]?.gpuAutoMaxFreq != undefined){
      this.perApp[appId].gpuAutoMaxFreq = this.perApp[DEFAULT_APP].gpuAutoMaxFreq;
      return this.perApp[appId].gpuAutoMaxFreq!!;
    }
    return 1600;
  }

  static appGPUAutoMinFreq(appId: string){
    if (this.perApp[appId]?.gpuAutoMinFreq != undefined)
      return this.perApp[appId].gpuAutoMinFreq!!;
    if (this.perApp[DEFAULT_APP]?.gpuAutoMinFreq != undefined){
      this.perApp[appId].gpuAutoMinFreq = this.perApp[DEFAULT_APP].gpuAutoMinFreq;
      return this.perApp[appId].gpuAutoMinFreq!!;    
    }
    return 200;
  }

  static appGPURangeMaxFreq(appId: string){
    if (this.perApp[appId]?.gpuRangeMaxFreq != undefined)
      return this.perApp[appId].gpuRangeMaxFreq!!;
    if (this.perApp[DEFAULT_APP]?.gpuRangeMaxFreq != undefined){
      this.perApp[appId].gpuRangeMaxFreq = this.perApp[DEFAULT_APP].gpuRangeMaxFreq;
      return this.perApp[appId].gpuRangeMaxFreq!!;
    }
    return 1600;
  }

  static appGPURangeMinFreq(appId: string){
    if (this.perApp[appId]?.gpuRangeMinFreq != undefined)
      return this.perApp[appId].gpuRangeMinFreq!!;
    if (this.perApp[DEFAULT_APP]?.gpuRangeMinFreq != undefined){
      this.perApp[appId].gpuRangeMinFreq = this.perApp[DEFAULT_APP].gpuRangeMinFreq;
      return this.perApp[appId].gpuRangeMinFreq!!;    
    }
    return 200;
  }

  static loadSettingsFromLocalStorage(){
    const settingsString = localStorage.getItem(SETTINGS_KEY) || "{}";
    const settingsJson = JSON.parse(settingsString);
    serializer.deserializeObject(settingsJson, Settings);
  }

  static saveSettingsToLocalStorage() {
    const settingsJson = serializer.serializeObject(this) || {};
    const settingsString = JSON.stringify(settingsJson);
    localStorage.setItem(SETTINGS_KEY, settingsString);
  }

}
