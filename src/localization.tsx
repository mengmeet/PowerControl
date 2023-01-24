import { ServerAPI } from "decky-frontend-lib";

export interface localizeString{
  schinese : string,
  tchinese : string,
  english : string,
}
var localizeMap:Map<number,localizeString>= new Map([
  [1,{schinese:"设置",tchinese:"",english:""}],
  [2,{schinese:"使用按游戏设置的配置文件",tchinese:"",english:""}],
  [3,{schinese:"正在使用",tchinese:"",english:""}],
  [4,{schinese:"默认",tchinese:"",english:""}],
  [5,{schinese:"配置文件",tchinese:"",english:""}],
  [6,{schinese:"睿 频",tchinese:"",english:""}],
  [7,{schinese:"提升最大cpu频率",tchinese:"",english:""}],
  [8,{schinese:"启用奇数编号的cpu",tchinese:"",english:""}],
  [9,{schinese:"核 心 数",tchinese:"",english:""}],
  [10,{schinese:"设置启用的物理核心数量",tchinese:"",english:""}],
  [11,{schinese:"热设计功耗（TDP）限制",tchinese:"",english:""}],
  [12,{schinese:"限制处理器功耗以降低总功耗",tchinese:"",english:""}],
  [13,{schinese:"未检测到ryzenAdj",tchinese:"",english:""}],
  [14,{schinese:"瓦特",tchinese:"",english:""}],
  [15,{schinese:"GPU 频率模式",tchinese:"",english:""}],
  [16,{schinese:"不限制",tchinese:"",english:""}],
  [17,{schinese:"固定频率",tchinese:"",english:""}],
  [18,{schinese:"自动频率",tchinese:"",english:""}],
  [19,{schinese:"GPU 频率",tchinese:"",english:""}],
  [20,{schinese:"GPU 最大频率限制",tchinese:"",english:""}],
  [21,{schinese:"GPU 最小频率限制",tchinese:"",english:""}],
  [22,{schinese:"启用插件设置",tchinese:"",english:""}],
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

