import {
  PanelSection,
  PanelSectionRow,
  Field
} from "decky-frontend-lib";
import { useEffect, useState,useRef,VFC} from "react";
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

const FANCanvasComponent: VFC = () =>{
  const Canvas = (props: any) => {

    const { draw, options, ...rest } = props;
    //const { context, ...moreConfig } = options;
    const canvasRef = useCanvas(draw);
  
    return <canvas ref={canvasRef} {...rest}/>;
  }
  
  const useCanvas = (draw: (ctx: any, count: number) => void) => {
  
  const canvasRef: any = useRef(null);
  
  useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas!.getContext('2d');
      let frameCount = 0;
      let animationFrameId: number;
  
      const render = () => {
        frameCount++;
        draw(context, frameCount);
        animationFrameId = window.requestAnimationFrame(render);
      }
      render();
  
      return () => {
        window.cancelAnimationFrame(animationFrameId);
      }
    }, [draw]);
    return canvasRef;
  }
  function drawCanvas(ctx: any, frameCount: number): void {}
  function onClickCanvas(e: any): void {
    throw new Error("Function not implemented.");
  }
  return(
    <PanelSectionRow>
        <Canvas draw={drawCanvas} width={268} height={200} style={{
          "width": "268px",
          "height": "200px",
          "padding":"0px",
          "border":"1px solid #1a9fff",
          //"position":"relative",
          "background-color":"#1a1f2c",
          "border-radius":"4px",
          //"margin":"center",
        }} onClick={(e: any) => onClickCanvas(e)}/>
      </PanelSectionRow>
  )
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
        <FANCanvasComponent/>
        <FANRPMComponent/>
      </PanelSection>}
    </div>
  );
};


