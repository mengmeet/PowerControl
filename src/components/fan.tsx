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
import { localizationManager, Settings,Backend, PluginManager,ComponentName, UpdateType, FANMODE, getTextPosByCanvasPos, fanPosition} from "../util";
import {FanCanvas} from "./fanCanvas";
var fanRPMIntervalID:any;
const tempMax=100; 
const fanMax=100;
const totalLines = 9;
const pointBlockDis = 5;
const pointColor = "#1A9FFF";
const selectColor = "#FF0000";
const textColor = "#FFFFFF";
const lineColor = "#1A4AFF";
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
  //drag
  const dragPoint : any = useRef(null);
  //select
  const selectedPoint: any = useRef(null);
  

  const [snapToGrid,setSnapToGrid] = useState(true);
  const [fanMode,setFanMode] = useState(FANMODE.NOCONTROL);
  const [fixSpeed,setFixSpeed] = useState(50);
  const [selPointTemp,setSelPointTemp] = useState(0);
  const [selPointSpeed,setSelPointSpeed] = useState(0);
  const initDraw=(ref:any)=>{
    canvasRef.current=ref;
  }
  const refreshCanvas=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
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
    const ctx = canvas?.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const anchorPoint = new fanPosition(tempMax/2,fixSpeed).getCanvasPos(width,height);
    var lineStart=[0,anchorPoint[1]];
    var lineEnd=[width,anchorPoint[1]];
    var textPos=getTextPosByCanvasPos(anchorPoint[0],anchorPoint[1],width,height)
    ctx.beginPath();
    ctx.arc(lineStart[0],lineStart[1],8, 0, Math.PI * 2);
    ctx.arc(lineEnd[0],lineEnd[1],8, 0, Math.PI * 2);
    ctx.fillText(`(${Math.trunc(fixSpeed!!)}%)`, textPos[0],textPos[1]);
    ctx.moveTo(lineStart[0],lineStart[1]);
    ctx.lineTo(lineEnd[0], lineEnd[1]);
    ctx.stroke();
  }
  const drawCurveMode=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    curvePoints.current = curvePoints.current.sort((a:fanPosition,b:fanPosition)=>{
      return a.temperature==b.temperature?a.fanRPMpercent!!-b.fanRPMpercent!!:a.temperature!!-b.temperature!!
    });
    
    //绘制线段
    ctx.beginPath();
    ctx.moveTo(0,height);
    ctx.strokeStyle=lineColor;
    for(let pointIndex = 0; pointIndex < curvePoints.current.length;pointIndex++){
      var curvePoint = curvePoints.current[pointIndex];
      var pointCanvasPos = curvePoint.getCanvasPos(width,height);
      ctx.lineTo(pointCanvasPos[0],pointCanvasPos[1]);
      ctx.moveTo(pointCanvasPos[0],pointCanvasPos[1]);
    }
    ctx.lineTo(width,0);
    ctx.stroke();
    //绘制点和坐标
    for(let pointIndex = 0; pointIndex < curvePoints.current.length;pointIndex++){
      var curvePoint = curvePoints.current[pointIndex];
      var pointCanvasPos = curvePoint.getCanvasPos(width,height);
      var textPox = getTextPosByCanvasPos(pointCanvasPos[0],pointCanvasPos[1],width,height)
      ctx.beginPath();
      ctx.fillStyle = curvePoint == selectedPoint.current?selectColor:pointColor;
      ctx.arc(pointCanvasPos[0],pointCanvasPos[1],8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = textColor;
      ctx.fillText(`(${Math.trunc(curvePoint.temperature!!)}°C,${Math.trunc(curvePoint.fanRPMpercent!!)}%)`, textPox[0],textPox[1]);
      ctx.fill();
    }
  }
  useEffect(()=>{
    refreshCanvas();
  },[snapToGrid,fanMode,fixSpeed]);
  useEffect(()=>{
    if(selectedPoint.current){
      selectedPoint.current.temperature=selPointTemp;
      selectedPoint.current.fanRPMpercent=selPointSpeed;
      refreshCanvas();
    }
  },[selPointTemp,selPointSpeed]);
  useEffect(() => {
    refreshCanvas();
  }, []);

  function onPointerShortPress(shortPressPos: fanPosition): void {
    switch(fanMode){
      case(FANMODE.NOCONTROL):{

      }
      case(FANMODE.FIX):{
        var percent=shortPressPos.fanRPMpercent!!;
        setFixSpeed(percent);
        break;
      }
      case(FANMODE.CURVE):{
        //选中点时再点击则取消该点,点击其他位置则取消当前选中
        if(selectedPoint.current){
          for(let i=0;i<curvePoints.current.length;i++){
            if(shortPressPos.isCloseToOther(selectedPoint.current,pointBlockDis)&&curvePoints.current[i]==selectedPoint.current){
              curvePoints.current.splice(i,1);
              break;
            }
          }
          selectedPoint.current = null;
          setSelPointTemp(0);
          setSelPointSpeed(0);
        }else{
          //没有选中点时，获取选中的点
          for(let i=0;i<curvePoints.current.length;i++){
            if(curvePoints.current[i].isCloseToOther(shortPressPos,pointBlockDis)){
              selectedPoint.current = curvePoints.current[i];
              setSelPointTemp(selectedPoint.current.temperature);
              setSelPointSpeed(selectedPoint.current.fanRPMpercent);
              break;
            }
          }
          if(!selectedPoint.current){
            curvePoints.current.push(shortPressPos);
          }
        }
        refreshCanvas();
        break;
      }
    }
    console.log(`onPointerShortPress temperature=${shortPressPos.temperature} fanRPMpercent=${shortPressPos.fanRPMpercent}`)
  }

  function onPointerDragDown(dragDownPos:fanPosition):boolean{
    switch(fanMode){
      case(FANMODE.NOCONTROL):{
        return false;
      }
      case(FANMODE.FIX):{
        if(Math.abs(dragDownPos.fanRPMpercent!! - fixSpeed)<=3)
          return true;
      }
      case(FANMODE.CURVE):{
        for(let i=0;i<curvePoints.current.length;i++){
          if(curvePoints.current[i].isCloseToOther(dragDownPos,pointBlockDis)){
            dragPoint.current=curvePoints.current[i];
            return true;
          }
        }
      }
      return false;
    }
  }
  function onPointerDraging(fanClickPos:fanPosition):void{
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
        selectedPoint.current = dragPoint.current;
        setSelPointTemp(selectedPoint.current.temperature);
        setSelPointSpeed(selectedPoint.current.fanRPMpercent);
        refreshCanvas();
        break;
      }
    }
    console.log(`onClickCanvas temperature=${fanClickPos.temperature} fanRPMpercent=${fanClickPos.fanRPMpercent}`)
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
        <FanCanvas width={300} height={300} style={{
          "width": "300px",
          "height": "300px",
          "padding":"0px",
          "border":"1px solid #1a9fff",
          // @ts-ignore
          "background-color":"#1a1f2c",
          "border-radius":"4px",
        }}  //onClick={(e: any) => onClickCanvas(e)}
            //onPointerDown={(e:any) => onPointerDown(e)}
            //onPointerMove={(e:any) => onPointerMove(e)}
            //onPointerUp={(e:any) => onPointerUp(e)}
            //onPointerDown={(e:fanPosition) => {onPointerDown(e)}}
            //onPointerMove={(e:fanPosition) => {onPointerMove(e)}}
            //onPointerUp={(e:fanPosition) => {onPointerUp(e)}}
            onPointerShortPress={(e:fanPosition) => {onPointerShortPress(e)}}
            onPointerDragDown={(e:fanPosition) => {return onPointerDragDown(e)!!}}
            onPointerDraging={(e:fanPosition) => {onPointerDraging(e)}}
            initDraw={(f:any)=>{initDraw(f)}}
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
              {fanMode==FANMODE.CURVE&&<SliderField
                label={localizationManager.getString(33, "传感器温度")}
                value={selPointTemp}
                valueSuffix={"°C"}
                showValue={true}
                layout={"inline"}
                disabled={!selectedPoint.current}
                step={1}
                max={tempMax}
                min={0}
                onChange={(value: number) => {
                  setSelPointTemp(value);
                }}
              />}
              {fanMode==FANMODE.CURVE&&<SliderField
                label={localizationManager.getString(32, "风扇转速百分比")}
                value={selPointSpeed}
                valueSuffix={"%"}
                showValue={true}
                layout={"inline"}
                disabled={!selectedPoint.current}
                step={1}
                max={fanMax}
                min={0}
                onChange={(value: number) => {
                  setSelPointSpeed(value);
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


