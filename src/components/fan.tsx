import {
  PanelSection,
  PanelSectionRow,
  Field
} from "decky-frontend-lib";
import { useEffect, useState, VFC} from "react";
import { localizationManager, Settings,Backend, PluginManager,ComponentName, UpdateType} from "../util";

var fanRPMIntervalID:any;
//FANRPM模块
const FANRPMComponent: VFC = () => {
  const [fanrpm, setFanPRM] = useState<number>(0);
  const refresh = async() => {
    Backend.data.getFanPRM().then((value)=>{
      setFanPRM(value);
    });
  };
  useEffect(() => {
    if(fanRPMIntervalID!=null){
      clearInterval(fanRPMIntervalID);
    }
    fanRPMIntervalID=setInterval(()=>{
      refresh();
      console.log(fanRPMIntervalID+" refresh");
    },1000)
  }, []);
  return (
      <PanelSectionRow>
            <Field
              label= {localizationManager.getString(24,"风扇转速")}>
              {fanrpm + " PRM"}
            </Field>
      </PanelSectionRow>
  );
};

export const FANComponent: VFC = () =>{
  const [show,setShow] = useState<boolean>(Settings.ensureEnable());
  const hide = (ishide:boolean) => {
    setShow(!ishide);
  };
  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.FAN_ALL,[ComponentName.FAN_ALL],(_ComponentName,updateType)=>{
      switch(updateType){
        case(UpdateType.HIDE):{
          hide(true);
          break;
        }
        case(UpdateType.SHOW):{
          hide(false);
          break;
        }
      }
    })
  }, []);
  return (
    <div>
      {show&&<PanelSection title="FAN">
        <FANRPMComponent/>
      </PanelSection>}
    </div>
  );
};