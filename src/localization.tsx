import { ServerAPI } from "decky-frontend-lib";

export interface localizeString{
  schinese : string,
  tchinese : string,
  english : string,
}
var localizeMap:Map<number,localizeString>= new Map([
  [1,{schinese:"设置",tchinese:"設定",english:"SETTINGS"}],
  [2,{schinese:"使用按游戏设置的配置文件",tchinese:"使用按遊戲設定的配置文件",english:"Use per-game profile"}],
  [3,{schinese:"正在使用",tchinese:"正在使用",english:"Using"}],
  [4,{schinese:"默认",tchinese:"默認",english:"default"}],
  [5,{schinese:"配置文件",tchinese:"配置文件",english:"profile"}],
  [6,{schinese:"睿 频",tchinese:"睿頻模式",english:"CPU Boost"}],
  [7,{schinese:"提升最大cpu频率",tchinese:"提升最大cpu頻率",english:"Increase the maximum CPU frequency"}],
  [8,{schinese:"启用奇数编号的cpu",tchinese:"啟用多執行續",english:"Enables odd-numbered CPUs"}],
  [9,{schinese:"核 心 数",tchinese:"CPU內核數",english:"Number of cpu cores"}],
  [10,{schinese:"设置启用的物理核心数量",tchinese:"設置啟用CPU內核數量",english:"Set the enabled physical core"}],
  [11,{schinese:"热设计功耗（TDP）限制",tchinese:"散熱設計功率(TDP)限制",english:"Thermal Power(TDP)Limit"}],
  [12,{schinese:"限制处理器功耗以降低总功耗",tchinese:"限制處理器功率以降低總功率",english:"Limits processor power for less total power"}],
  [13,{schinese:"未检测到ryzenAdj",tchinese:"未檢測到ryzenAdj文件",english:"ryzenAdj not detected"}],
  [14,{schinese:"瓦特",tchinese:"瓦特(W)",english:"Watts"}],
  [15,{schinese:"GPU 频率模式",tchinese:"GPU頻率模式",english:"GPU clock frequency mode"}],
  [16,{schinese:"不限制",tchinese:"不限制",english:"Unlimited"}],
  [17,{schinese:"固定频率",tchinese:"鎖定頻率",english:"fixed"}],
  [18,{schinese:"自动频率",tchinese:"自動頻率",english:"Automatic"}],
  [19,{schinese:"GPU 频率",tchinese:"GPU頻率",english:"GPU Clock Frequency"}],
  [20,{schinese:"GPU 最大频率限制",tchinese:"GPU最大頻率限制",english:"maximum frequency limit"}],
  [21,{schinese:"GPU 最小频率限制",tchinese:"GPU最小頻率限制",english:"minimum frequency limit"}],
  [22,{schinese:"启用插件设置",tchinese:"啟用插件功能列",english:"Enable settings"}],
  [23,{schinese:"范围频率",tchinese:"範圍頻率",english:"Range"}],
])


export class localizationManager {
  private language = "schinese"
  //private has_language  = false
  constructor(serverAPI: ServerAPI) {
    serverAPI!.callPluginMethod<{},string>("get_language",{}).then(res=>{
      if (res.success){
        console.log("language = " + res.result);
        this.language = res.result;
        //this.has_language = true;
      }
    })
  }
  public getString=(index:number, defaultString:string)=> {
    if(localizeMap.has(index)){
      if(this.language=="schinese"){
        return localizeMap.get(index)?.schinese;
      }else if(this.language=="tchinese"){
        return localizeMap.get(index)?.tchinese;
      }else if(this.language=="english"){
        return localizeMap.get(index)?.english;
      }else{
        return defaultString;
      }
    }
    else{
      return defaultString
    }
}
}

