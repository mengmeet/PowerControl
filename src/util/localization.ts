import { ServerAPI } from "decky-frontend-lib";

export interface localizeString{
  schinese : string,
  tchinese : string,
  english : string,
  german : string,
}
var localizeMap:Map<number,localizeString>= new Map([
  [1,{
    schinese:"设置",
    tchinese:"設定",
    english:"SETTINGS",
    german:"Einstellungen",
  }],
  [2,{
    schinese:"使用按游戏设置的配置文件",
    tchinese:"使用按遊戲設定的配置文件",
    english:"Use per-game profile",
    german:"Spielspezifisches Profil",
  }],
  [3,{
    schinese:"正在使用",
    tchinese:"正在使用",
    english:"Using ",
    german:"Verwendet ",
  }],
  [4,{
    schinese:"默认",
    tchinese:"默認",
    english:"default",
    german:"standard",
  }],
  [5,{
    schinese:"配置文件",
    tchinese:"配置文件",
    english:" profile",
    german:" Profil",
  }],
  [6,{
    schinese:"睿 频",
    tchinese:"睿頻模式",
    english:"CPU Boost",
    german:"CPU Boost",
  }],
  [7,{
    schinese:"提升最大cpu频率",
    tchinese:"提升最大cpu頻率",
    english:"Increase the maximum CPU frequency",
    german:"Maximale CPU Frequenz erhöhen",
  }],
  [8,{
    schinese:"启用奇数编号的cpu",
    tchinese:"啟用多執行續",
    english:"Enables odd-numbered CPUs",
    german:"Aktiviert ungerade CPU-Kerne",
  }],
  [9,{
    schinese:"核 心 数",
    tchinese:"CPU內核數",
    english:"Number of cpu cores",
    german:"Anzahl CPU-Kerne",
  }],
  [10,{
    schinese:"设置启用的物理核心数量",
    tchinese:"設置啟用CPU內核數量",
    english:"Set the enabled physical core",
    german:"Anzahl physischer CPU-Kerne",
  }],
  [11,{
    schinese:"热设计功耗 (TDP) 限制",
    tchinese:"散熱設計功率 (TDP) 限制",
    english:"Thermal Power (TDP) Limit",
    german:"Maximale Verlustleistung (TDP)",
  }],
  [12,{
    schinese:"限制处理器功耗以降低总功耗",
    tchinese:"限制處理器功率以降低總功率",
    english:"Limits processor power for less total power",
    german:"CPU-Leistung einschränken um Strom zu sparen",
  }],
  [13,{
    schinese:"未检测到ryzenAdj",
    tchinese:"未檢測到ryzenAdj文件",
    english:"ryzenAdj not detected",
    german:"ryzenAdj nicht installiert",
  }],
  [14,{
    schinese:"瓦特",
    tchinese:"瓦特(W)",
    english:"Watts",
    german:"Watt",
  }],
  [15,{
    schinese:"GPU 频率模式",
    tchinese:"GPU頻率模式",
    english:"GPU clock frequency mode",
    german:"Grafikkartenfrequenz Modus",
  }],
  [16,{
    schinese:"不限制",
    tchinese:"不限制",
    english:"Unlimited",
    german:"Unbeschränkt",
  }],
  [17,{
    schinese:"固定频率",
    tchinese:"鎖定頻率",
    english:"fixed",
    german:"fix",
  }],
  [18,{
    schinese:"自动频率",
    tchinese:"自動頻率",
    english:"Automatic",
    german:"Automatisch",
  }],
  [19,{
    schinese:"GPU 频率",
    tchinese:"GPU頻率",
    english:"GPU Clock Frequency",
    german:"Grafikkartenfrequenz",
  }],
  [20,{
    schinese:"GPU 最大频率限制",
    tchinese:"GPU最大頻率限制",
    english:"maximum frequency limit",
    german:"Maximale Frequenz",
  }],
  [21,{
    schinese:"GPU 最小频率限制",
    tchinese:"GPU最小頻率限制",
    english:"minimum frequency limit",
    german:"Minimale Frequenz",
  }],
  [22,{
    schinese:"启用插件设置",
    tchinese:"啟用插件功能列",
    english:"Enable settings",
    german:"Einstellungen aktivieren",
  }],
  [23,{
    schinese:"范围频率",
    tchinese:"範圍頻率",
    english:"Range",
    german:"Bereich",
  }],
  [24,{
    schinese:"风扇转速",
    tchinese:"风扇转速",
    english:"Fan Speed",
    german:"Lüftergeschwindigkeit",
  }],
  [25,{
    schinese:"创建风扇配置文件",
    tchinese:"创建风扇配置文件",
    english:"Create fan profile",
    german:"Lüfterprofil erstellen",
  }],
  [26,{
    schinese:"网格对齐",
    tchinese:"",
    english:"",
    german:"",
  }],
  [27,{
    schinese:"风扇模式",
    tchinese:"",
    english:"",
    german:"",
  }],
  [28,{
    schinese:"不控制",
    tchinese:"",
    english:"",
    german:"",
  }],
  [29,{
    schinese:"固定",
    tchinese:"",
    english:"",
    german:"",
  }],
  [30,{
    schinese:"曲线",
    tchinese:"",
    english:"",
    german:"",
  }],
  [31,{
    schinese:"对齐到网格线交点",
    tchinese:"",
    english:"",
    german:"",
  }],
  [32,{
    schinese:"风扇转速百分比",
    tchinese:"",
    english:"",
    german:"",
  }],
])


export class localizationManager {
  private static language = "schinese"
  //private has_language  = false
  public static async init(serverAPI: ServerAPI) {
    await serverAPI!.callPluginMethod<{},string>("get_language",{}).then(res=>{
      if (res.success){
        //console.log("language = " + res.result);
        this.language = res.result;
        //this.has_language = true;
      }
    })
  }
  public static getString=(index:number, defaultString:string)=> {
    if(localizeMap.has(index)){
      if(this.language=="schinese"){
        return localizeMap.get(index)?.schinese;
      }else if(this.language=="tchinese"){
        return localizeMap.get(index)?.tchinese;
      }else if(this.language=="english"){
        return localizeMap.get(index)?.english;
      }else if(this.language=="german"){
        return localizeMap.get(index)?.german;
      }else{
        return defaultString;
      }
    }
    else{
      return defaultString
    }
  }
}

