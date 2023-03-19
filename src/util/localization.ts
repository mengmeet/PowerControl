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
    english:"Settings",
    german:"Einstellungen",
  }],
  [2,{
    schinese:"使用按游戏设置的配置文件",
    tchinese:"使用按遊戲設定的配置文件",
    english:"Use per-game Profile",
    german:"Spielspezifisches Profil",
  }],
  [3,{
    schinese:"正在使用",
    tchinese:"正在使用",
    english:"Using",
    german:"Verwendet",
  }],
  [4,{
    schinese:"默认",
    tchinese:"默認",
    english:" default ",
    german:" standard ",
  }],
  [5,{
    schinese:"配置文件",
    tchinese:"配置文件",
    english:"Profile",
    german:"Profil",
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
    english:"Number Of CPU Cores",
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
    english:"RyzenAdj Not Detected",
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
    tchinese:"GPU 頻率模式",
    english:"GPU Clock Frequency Mode",
    german:"Grafikkartenfrequenz Modus",
  }],
  [16,{
    schinese:"不限制",
    tchinese:"不限制",
    english:"Unlimited",
    german:"Unbeschränkt",
  }],
  [17,{
    schinese:"固定",
    tchinese:"鎖定",
    english:"Fixed",
    german:"fix",
  }],
  [18,{
    schinese:"自适应",
    tchinese:"自適應",
    english:"Auto",
    german:"Automatisch",
  }],
  [19,{
    schinese:"GPU 频率",
    tchinese:"GPU 頻率",
    english:"GPU Clock Frequency",
    german:"Grafikkartenfrequenz",
  }],
  [20,{
    schinese:"GPU 最大频率限制",
    tchinese:"GPU 最大頻率限制",
    english:"Maximum Frequency Limit",
    german:"Maximale Frequenz",
  }],
  [21,{
    schinese:"GPU 最小频率限制",
    tchinese:"GPU 最小頻率限制",
    english:"Minimum Frequency Limit",
    german:"Minimale Frequenz",
  }],
  [22,{
    schinese:"启用插件设置",
    tchinese:"啟用插件功能列",
    english:"Enable Settings",
    german:"Einstellungen aktivieren",
  }],
  [23,{
    schinese:"范围",
    tchinese:"範圍",
    english:"Range",
    german:"Bereich",
  }],
  [24,{
    schinese:"风扇转速",
    tchinese:"風扇轉速",
    english:"Fan Speed",
    german:"Lüftergeschwindigkeit",
  }],
  [25,{
    schinese:"创建风扇配置文件",
    tchinese:"創建風扇配置檔",
    english:"Create Fan Profile",
    german:"Lüfterprofil erstellen",
  }],
  [26,{
    schinese:"网格对齐",
    tchinese:"網格對齊",
    english:"Grid Alignment",
    german:"",
  }],
  [27,{
    schinese:"风扇模式",
    tchinese:"風扇模式",
    english:"Fan Mode",
    german:"Lüfter-Modus",
  }],
  [28,{
    schinese:"不控制",
    tchinese:"不控制",
    english:"Not Controlled",
    german:"Nicht kontrolliert",
  }],
  [29,{
    schinese:"固定",
    tchinese:"固定",
    english:"Fixed",
    german:"Fest",
  }],
  [30,{
    schinese:"曲线",
    tchinese:"曲線",
    english:"Curve",
    german:"Kurve",
  }],
  [31,{
    schinese:"对齐到网格线交点",
    tchinese:"對齊到網格線交點",
    english:"Snap To The Gridline Intersection",
    german:"An der Gitternetzlinien-Schnittmenge ausrichten",
  }],
  [32,{
    schinese:"风扇转速百分比",
    tchinese:"風扇轉速百分比",
    english:"Fan Speed Percentage",
    german:"Prozentualer Anteil der Lüftergeschwindigkeit",
  }],
  [33,{
    schinese:"传感器温度",
    tchinese:"感測器溫度",
    english:"Sensor Temperature",
    german:"Temperatur des Sensors",
  }],
  [35,{
    schinese:"创建一个风扇配置文件",
    tchinese:"創建一個風扇配置檔",
    english:"Create A Fan Profile",
    german:"Fan-Profil erstellen",
  }],
  [36,{
    schinese:"选择一个风扇配置文件",
    tchinese:"選擇一個風扇配置檔",
    english:"Select A Fan Profile",
    german:"Wähle ein Fan-Profil aus",
  }],
  [37,{
    schinese:"配置文件名称",
    tchinese:"配置檔名稱",
    english:"Profile Name",
    german:"Name des Profils",
  }],
  [38,{
    schinese:"使用",
    tchinese:"使用",
    english:"Use",
    german:"gebrauchen",
  }],
  [39,{
    schinese:"删除",
    tchinese:"删除",
    english:"Delete",
    german:"Löschen",
  }],
  [40,{
    schinese:"创建",
    tchinese:"创建",
    english:"Create",
    german:"schaffen",
  }],
  [41,{
    schinese:"取消",
    tchinese:"取消",
    english:"Cancel",
    german:"Abbrechen",
  }],
  [42,{
    schinese:"当前状态",
    tchinese:"当前状态",
    english:"Current status",
    german:"Aktueller Stand",
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
    var str;
    if(localizeMap.has(index)){
      if(this.language=="schinese"){
        str = localizeMap.get(index)?.schinese;
      }else if(this.language=="tchinese"){
        str = localizeMap.get(index)?.tchinese;
      }else if(this.language=="english"){
        str = localizeMap.get(index)?.english;
      }else if(this.language=="german"){
        str = localizeMap.get(index)?.german;
      }
    }
    if(str==undefined||str==""){
      return defaultString 
    }
    return str
  }
}

