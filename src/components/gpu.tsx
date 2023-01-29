import {
  PanelSection,
  PanelSectionRow,
  SliderField,
} from "decky-frontend-lib";
import { VFC, useEffect, useState} from "react";
import { localizationManager } from "../util";
import { Backend} from "../util";

// Appease TypeScript
declare var SteamClient: any;

export enum GPUMODE{
  NOLIMIT=0, //不限制
  FIX=1, //固定频率
  RANGE=2, //系统调度
  AUTO=3,  //自动频率
}
export enum GPUFunc{
  GPUMODE=0,
}

export class GPUComponents {
  //public language = "schinese"
  private static hideItemList:GPUFunc[] = []
  private static disableItemList:GPUFunc[] = []
  private static globalEnable:boolean=false;
  static ReloadComponents: () => void;
  static DisableItem: (funcName:GPUFunc,disabled:boolean) => void;
  static HideItem: (funcName:GPUFunc,Hide:boolean) => void;
  static HideAll: (funcName:GPUFunc,Hide:boolean) => void;

  static GPUItem: VFC<{apply: (appId: string,applyTarget:string) => void, reset: () => void, backend:Backend}> = ({ }) => {
    const [gpuMode, setGPUMode] = useState<number>(0);
    //const [gpuFreq, setGPUFreq] = useState<number>(1600);
    //const [gpuAutoMaxFreq, setGPUAutoMaxFreq] = useState<number>(1600);
    //const [gpuAutoMinFreq, setGPUAutoMinFreq] = useState<number>(200);
    //const [gpuRangeMaxFreq, setGPURangeMaxFreq] = useState<number>(1600);
    //const [gpuRangeMinFreq, setGPURangeMinFreq] = useState<number>(200);

    this.ReloadComponents=()=>{
      console.log("");
    }

    this.DisableItem=(funcName:GPUFunc,disabled:boolean)=>{
      if(this.disableItemList.indexOf(funcName) != -1 && disabled == true){
        this.disableItemList.push(funcName);
        this.hideItemList.push();
      }
      this.ReloadComponents();
    }

    

    //GPU模式设置
    useEffect(() => {
      console.log(`useEffect gpumode invoke  value=${gpuMode}`);
    }, [gpuMode]);
  
    return (
      <div>
        {this.globalEnable && <PanelSection title="GPU">
        {<PanelSectionRow>
          <SliderField
            label={localizationManager.getString(15, "GPU 频率模式")}
            value={gpuMode}
            step={1}
            max={3}
            min={0}
            onChange={(value: number) => {
              setGPUMode(value);
            }}
          />
        </PanelSectionRow>}
      </PanelSection>
      }
      </div>
    );
  };

}
