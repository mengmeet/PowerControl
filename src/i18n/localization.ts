import { ServerAPI } from "decky-frontend-lib";
import { localizeMap, localizeStrEnum } from "./localizeMap";

export class localizationManager {
  private static language = "english"
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
  public static getString(defaultString:localizeStrEnum){
    var str = localizeMap[this.language]?.strings?.[defaultString]??localizeMap["english"]?.strings?.[defaultString];
    return str==""?localizeMap["english"]?.strings?.[defaultString]:str
  }
}

