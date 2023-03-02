import {
  PanelSection,
  PanelSectionRow,
  Field,
  ButtonItem,
  showModal,
  ModalRoot,
  Focusable,
  DialogButton,
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
  function drawCanvas(ctx: any, frameCount: number): void {
    console.log(`frameCount=${frameCount}`)
  }
  function onClickCanvas(e: any): void {
    console.log(e);
  }
  return(
    <PanelSectionRow>
        <canvas draw={drawCanvas} width={600} height={300} style={{
          "width": "600px",
          "height": "300px",
          "padding":"0px",
          "border":"1px solid #1a9fff",
          //"position":"relative",
          // @ts-ignore
          "background-color":"#1a1f2c",
          "border-radius":"4px",
          //"margin":"center",
        }} onClick={(e: any) => onClickCanvas(e)}/>
      </PanelSectionRow>
  )
};

const FANCreateProfileComponent: VFC = ()=>{
  return(
    <PanelSectionRow>
      <ButtonItem
        layout="below"
        onClick={() => {
          // @ts-ignore
          showModal(<FANCretateProfileModelComponent/>);
        }}>
        {localizationManager.getString(25,"创建风扇配置文件")}
      </ButtonItem>
    </PanelSectionRow>
  )
}

function FANCretateProfileModelComponent({
  closeModal,
}: {
  closeModal: () => void;
}){
  return (
    <ModalRoot onCancel={closeModal} onEscKeypress={closeModal}>
      <h1 style={{ marginBlockEnd: "5px", marginBlockStart: "-15px", fontSize:25}}>{localizationManager.getString(25,"创建风扇配置文件")}</h1>
      <FANCanvasComponent/>
      <Focusable style={{marginBlockEnd: "-25px", marginBlockStart: "-5px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)",gridGap: "0.5rem", padding: "8px 0"}}>
      <DialogButton onClick={() => {closeModal()}}> Create Preset</DialogButton>
      <DialogButton onClick={() => {closeModal()}}>Close</DialogButton>
      </Focusable>
    </ModalRoot>
  );
}
export function FANComponent(){
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
        <FANCreateProfileComponent/>
      </PanelSection>}
    </div>
  );
};


