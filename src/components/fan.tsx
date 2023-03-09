import {
  PanelSection,
  PanelSectionRow,
  Field,
  ButtonItem,
  showModal,
  ModalRoot,
  DialogButton,
  ToggleField,
  SliderField,
} from "decky-frontend-lib";
import { useEffect, useState,useRef,VFC} from "react";
import { localizationManager, Settings,Backend, PluginManager,ComponentName, UpdateType, FANMODE, getTextPosByCanvasPos, canvasPosition, fanPosition} from "../util";
var fanRPMIntervalID:any;
const tempMax=100; 
const fanMax=100;
const totalLines = 9;
const pointBlockDis = 5;
const pointColor = "1a9fff";
const selectColor = "ff0000";
const textColor = "FFFFFF";
//FANRPM模块
const FANRPMComponent: VFC = () => {
  const [fanrpm, setFanRPM] = useState<number>(0);
  const refresh = async() => {
    Backend.data.getFanPRM().then((value)=>{
      setFanRPM(value);
    });
  };
  const dismount = () =>{
    if(fanRPMIntervalID!=null){
      clearInterval(fanRPMIntervalID);
    }
  }
  useEffect(() => {
    if(fanRPMIntervalID!=null){
      clearInterval(fanRPMIntervalID);
    }
    fanRPMIntervalID=setInterval(()=>{
      refresh();
    },1000)
    PluginManager.listenUpdateComponent(ComponentName.FAN_RPM,[ComponentName.FAN_RPM],(_ComponentName,updateType)=>{
      switch(updateType){
        case(UpdateType.DISMOUNT):{
          dismount()
          break;
        }
      }
    })
  }, []);
  return (
      <PanelSectionRow>
            <Field
              label= {localizationManager.getString(24,"风扇转速")}>
              {fanrpm + " RPM"}
            </Field>
      </PanelSectionRow>
  );
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
  const canvasRef: any = useRef(null);
  const curvePoints : any = useRef([]);
  const dragPoint : any = useRef(null);
  const isDrag:any = useRef(false);
  const selectedPoint: any = useRef(null);
  const [snapToGrid,setSnapToGrid] = useState(true);
  const [fanMode,setFanMode] = useState(FANMODE.NOCONTROL);
  const [fixSpeed,setFixSpeed] = useState(50);
  const refreshCanvas=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const lineDistance = 1 / (totalLines + 1);
    ctx.clearRect(0, 0, width, height);
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
    switch(fanMode){
      case(FANMODE.NOCONTROL):{
        break;
      }
      case(FANMODE.FIX):{
        drawFixMode();
        break;
      }
      case(FANMODE.CURVE):{
        drawCurveMode();
        break;
      }
    }
  }
  const drawFixMode=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const anchorPoint = new fanPosition(tempMax/2,fixSpeed).getCanvasPos(width,height);
    var lineStart=new canvasPosition(0,anchorPoint.cany!!);
    var lineEnd=new canvasPosition(width,anchorPoint.cany!!);
    var textPos=getTextPosByCanvasPos(anchorPoint.canx!!,anchorPoint.cany!!,width,height)
    ctx.beginPath();
    ctx.arc(lineStart.canx,lineStart.cany,8, 0, Math.PI * 2);
    ctx.arc(lineEnd.canx,lineEnd.cany,8, 0, Math.PI * 2);
    ctx.fillText(`(${Math.trunc(fixSpeed!!)}%)`, textPos.canx,textPos.cany);
    ctx.moveTo(lineStart.canx,lineStart.cany);
    ctx.lineTo(lineEnd.canx, lineEnd.cany);
    ctx.stroke();
  }
  const drawCurveMode=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    for(let pointIndex = 0; pointIndex < curvePoints.current.length;pointIndex++){
      var curvePoint = curvePoints.current[pointIndex];
      var pointCanvasPos = curvePoint.getCanvasPos(width,height);
      var textPox = getTextPosByCanvasPos(pointCanvasPos.canx,pointCanvasPos.cany,width,height)
      ctx.beginPath();
      ctx.fillStyle = curvePoint == selectedPoint.current ? selectColor:pointColor;
      ctx.arc(pointCanvasPos.canx,pointCanvasPos.cany,8, 0, Math.PI * 2,true);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.fillText(`(${Math.trunc(curvePoint.temperature!!)}°C,${Math.trunc(curvePoint.fanRPMpercent!!)}%)`, textPox.canx,textPox.cany);
      ctx.fill();
    }
  }
  useEffect(()=>{
    refreshCanvas();
  },[snapToGrid,fanMode,fixSpeed]);
  useEffect(() => {
    refreshCanvas();
  }, []);
  function onClickCanvas(e: any): void {
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const realEvent: any = e.nativeEvent;
    const canClickPos = new canvasPosition(realEvent.layerX,realEvent.layerY)
    const fanclickPos = canClickPos.getFanPos(width,height)
    console.log(`clickPosx=${fanclickPos.temperature} clickPosy=${fanclickPos.fanRPMpercent}`)
    switch(fanMode){
      case(FANMODE.NOCONTROL):{

      }
      case(FANMODE.FIX):{
        var percent=fanclickPos.fanRPMpercent!!;
        setFixSpeed(percent);
        break;
      }
      case(FANMODE.CURVE):{
        curvePoints.current.push(fanclickPos);
        refreshCanvas();
        break;
      }
    }
  }
  function onMouseDown(e:any):void{
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const realEvent: any = e.nativeEvent;
    const canClickPos = new canvasPosition(realEvent.layerX,realEvent.layerY)
    const fanClickPos = canClickPos.getFanPos(width,height)
    switch(fanMode){
      case(FANMODE.NOCONTROL):{

      }
      case(FANMODE.FIX):{
        if(Math.abs(fanClickPos.fanRPMpercent!! - fixSpeed)<=3)
          isDrag.current = true;
        break;
      }
      case(FANMODE.CURVE):{
        //按下时获取选中点
        if(selectedPoint.current!=null && !selectedPoint.current.isCloseToOther(fanClickPos,pointBlockDis)){
          selectedPoint.current = null;
        }else if(selectedPoint.current == null){
          for(let i=0;i<curvePoints.current.length;i++){
            if(curvePoints.current[i].isCloseToOther(fanClickPos,pointBlockDis)){
              selectedPoint.current = curvePoints.current[i];
              break;
            }
          }
        }
        //按下时标记拖动初始
        for(let i=0;i<curvePoints.current.length;i++){
          if(curvePoints.current[i].isCloseToOther(fanClickPos,pointBlockDis)){
            isDrag.current = true;
            dragPoint.current=curvePoints.current[i];
            break;
          }
        }
        break;
      }
    }
    console.log(`onmousedown x= ${realEvent.layerX}, y=${realEvent.layerY}`);
  }
  function onMouseUp(e:any):void{
    if(isDrag.current){
      isDrag.current = false;
      dragPoint.current=null;
    }else{
      onClickCanvas(e);
    }
  }
  function onMouseMove(e:any):void{
    if(isDrag.current){
      onDrag(e);
    }
      
  }
  function onDrag(e:any):void{
    const canvas = canvasRef.current;
    const ctx = canvas!.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const realEvent: any = e.nativeEvent;
    const canClickPos = new canvasPosition(realEvent.layerX,realEvent.layerY)
    const fanClickPos = canClickPos.getFanPos(width,height)
    switch(fanMode){
      case(FANMODE.NOCONTROL):{

      }
      case(FANMODE.FIX):{
        setFixSpeed(fanClickPos.fanRPMpercent!!);
        break;
      }
      case(FANMODE.CURVE):{
        dragPoint.current.temperature = fanClickPos.temperature;
        dragPoint.current.fanRPMpercent = fanClickPos.fanRPMpercent;
        console.log(`curveDrag  tem=${dragPoint.current.temperature}  rpm=${dragPoint.current.fanRPMpercent}`)
        refreshCanvas();
        break;
      }
    }
    console.log(`onmouseMove x= ${realEvent.layerX}, y=${realEvent.layerY}`);
  }
  return (
    <div>
    <style>
      {`
        .gamepaddialog_ModalPosition_30VHl{
          overflow-y:hidden
        }
      `}
    </style>
    <ModalRoot onCancel={closeModal} onEscKeypress={closeModal} >
      <h1 style={{ marginBlockEnd: "5px", marginBlockStart: "-15px", fontSize:25}}>{localizationManager.getString(25,"创建风扇配置文件")}</h1>
      <div style={{marginBlockEnd: "0px", marginBlockStart: "0px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", padding: "8px 0"}}>
        <canvas ref={canvasRef} width={300} height={300} style={{
          "width": "300px",
          "height": "300px",
          "padding":"0px",
          "border":"1px solid #1a9fff",
          // @ts-ignore
          "background-color":"#1a1f2c",
          "border-radius":"4px",
        }}  //onClick={(e: any) => onClickCanvas(e)}
            //onMouseDown={(e:any) => onMouseDown(e)}
            //onMouseMove={(e:any) => onMouseMove(e)}
            //onMouseUp={(e:any) => onMouseUp(e)}
            onPointerDown={(e:any) => onMouseDown(e)}
            onPointerMove={(e:any) => onMouseMove(e)}
            onPointerUp={(e:any) => onMouseUp(e)}
            //onPointerDown={(e:any) => console.log(`onPointDown X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerMove={(e:any) => console.log(`onPointMove X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerUp={(e:any) => console.log(`ononPointUp X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerCancel={(e:any) => console.log(`ononPointCancel X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerEnter={(e:any) => console.log(`ononPointEnter X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerLeave={(e:any) => console.log(`ononPointLeave X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerOut={(e:any) => console.log(`ononPointOut X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
            //onPointerOver={(e:any) => console.log(`ononPointOver X=${e.nativeEvent.layerX} Y=${e.nativeEvent.layerY}`)}
          />
        <div style={{
          "width": "300px",
          "height": "300px",
          // @ts-ignore
          "overflow-x": "hidden",
          "overflow-y": "scroll",
        }}>
          <PanelSection>
            <ToggleField
              label={localizationManager.getString(26, "网格对齐")}
              description={localizationManager.getString(31, "对齐到网格线交点")}
              checked={snapToGrid}
              onChange={(value) => {
                setSnapToGrid(value);
              }}
            />
            <SliderField
              label={localizationManager.getString(27, "风扇模式")}
              value={fanMode}
              step={1}
              max={2}
              min={0}
              notchCount={3}
              notchLabels={
                [{
                  notchIndex: FANMODE.NOCONTROL,
                  label: `${localizationManager.getString(28, "不控制")}`,
                  value: FANMODE.NOCONTROL,
                }, {
                  notchIndex: FANMODE.FIX,
                  label: `${localizationManager.getString(29, "固定")}`,
                  value: FANMODE.FIX,
                }, {
                  notchIndex: FANMODE.CURVE,
                  label: `${localizationManager.getString(30, "曲线")}`,
                  value: FANMODE.CURVE,
                }
                ]
              }
              onChange={(value: number) => {
                setFanMode(value);
                }}
              />
              {fanMode==FANMODE.FIX&&<SliderField
                label={localizationManager.getString(32, "风扇转速百分比")}
                value={fixSpeed}
                step={1}
                max={100}
                min={0}
                onChange={(value: number) => {
                  setFixSpeed(value);
                }}
              />}
          </PanelSection>
        </div>
      </div>
      <div style={{marginBlockEnd: "-25px", marginBlockStart: "-5px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)",gridGap: "0.5rem", padding: "8px 0"}}>
      <DialogButton onClick={() => {closeModal()}}> Create Preset</DialogButton>
      <DialogButton onClick={() => {closeModal()}}>Close</DialogButton>
      </div>
    </ModalRoot>
    </div>
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


