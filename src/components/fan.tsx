import {
  PanelSection,
  PanelSectionRow,
  Field,
  ButtonItem,
  showModal,
  ModalRoot,
  Focusable,
  DialogButton,
  ToggleField,
  SliderField,
} from "decky-frontend-lib";
import { useEffect, useState,useRef,VFC} from "react";
import { localizationManager, Settings,Backend, PluginManager,ComponentName, UpdateType} from "../util";
import { GPUComponent,CPUComponent} from "./index";
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
  const canvasRef: any = useRef(null);
  const refresh=()=>{
    const tempMax=100;
    const fanMax=100;
    const totalLines = 9;
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const lineDistance = 1 / (totalLines + 1);
    //网格绘制
    ctx.beginPath();
    ctx.strokeStyle = "#093455";
    for (let i = 1; i <= totalLines + 1; i++) {
      ctx.moveTo(lineDistance * i * width, 0);
      ctx.lineTo(lineDistance * i * width, height);
      ctx.moveTo(0, lineDistance * i * height);
      ctx.lineTo(width, lineDistance * i * height);
    }
    ctx.stroke();
    //文字绘制
    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    for (let i = 1; i <= totalLines + 1; i++) {
      const tempText= tempMax / (totalLines + 1) * i +"°C";
      const fanText= fanMax / (totalLines + 1) * i +"%";
      ctx.textAlign = "right";
      ctx.fillText(tempText, lineDistance * i * width - 2, height - 2);
      ctx.textAlign = "left";
      ctx.fillText(fanText, 2, height-lineDistance * i * height + 10);
    }
    ctx.stroke();
  }
  useEffect(() => {
    refresh();
  }, []);
  function onClickCanvas(e: any): void {
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const realEvent: any = e.nativeEvent;
    ctx.beginPath();
    ctx.arc(realEvent.layerX,realEvent.layerY,8, 0, Math.PI * 2);
    ctx.stroke();
    //console.log("Canvas click @ (" + realEvent.layerX.toString() + ", " + realEvent.layerY.toString() + ")");
  }
  return(
    <PanelSectionRow>
        <canvas ref={canvasRef} width={300} height={300} style={{
          "width": "300px",
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
      <div style={{marginBlockEnd: "0px", marginBlockStart: "0px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", padding: "8px 0"}}>
        <FANCanvasComponent/>
        <div style={{
          "width": "300px",
          "height": "300px",
          "overflow": "scroll",
        }}><PanelSection>
          <ToggleField
        label={localizationManager.getString(26, "网格对齐")}
        description={localizationManager.getString(31, "对齐到网格线交点")}
        checked={true}
        onChange={(value) => {
          
        }}
      /><SliderField
            label={localizationManager.getString(27, "风扇模式")}
            value={1}
            step={1}
            max={2}
            min={0}
            notchCount={3}
            notchLabels={
              [{
                notchIndex: 0,
                label: `${localizationManager.getString(28, "不控制")}`,
                value: 0,
              }, {
                notchIndex: 1,
                label: `${localizationManager.getString(29, "固定")}`,
                value: 1,
              }, {
                notchIndex: 2,
                label: `${localizationManager.getString(30, "曲线")}`,
                value: 2,
              }
              ]
            }
            onChange={(value: number) => {
              
            }}
          /></PanelSection></div>
      </div>
      
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
        <FANRPMComponent/>
        <FANCreateProfileComponent/>
      </PanelSection>}
    </div>
  );
};


