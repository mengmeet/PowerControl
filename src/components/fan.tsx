import {
  PanelSection,
  PanelSectionRow,
  Field,
  ButtonItem,
  showModal,
  ModalRoot,
  DialogButton,
  TextField,
  SliderField,
  Dropdown,
  DropdownOption,
} from "decky-frontend-lib";
import { useEffect, useState,useRef,VFC} from "react";
import { localizationManager, Settings,Backend, PluginManager,ComponentName, UpdateType, FANMODE, getTextPosByCanvasPos, fanPosition, FanSetting, FANPROFILEACTION} from "../util";
import {FanCanvas} from "./fanCanvas";
var fanRPMIntervalID:any;
var fanDisplayIntervalID:any;
const tempMax=100; 
const fanMax=100;
const totalLines = 9;
const pointBlockDis = 5;
const pointColor = "#1A9FFF";
const selectColor = "#FF0000";
const textColor = "#FFFFFF";
const lineColor = "#1A4AFF";
const nowPointColor = "#03FF09";
const realPointColor = "#FF0309";

//选择配置文件下拉框
const FANSelectProfileComponent: VFC = () =>{
  //@ts-ignore
  const [items, setItems] = useState<DropdownOption[]>(
    Object.entries(Settings.getFanSettings()).map(([profileName, fanSetting]) => ({
      label: profileName,
      options:[
        {label:localizationManager.getString(38,"使用"),data:{profileName:profileName,type:FANPROFILEACTION.USE,setting:fanSetting}},
        {label:localizationManager.getString(39,"删除"),data:{profileName:profileName,type:FANPROFILEACTION.DELETE,setting:fanSetting}},
      ]
    }))
  );
  //@ts-ignore
  const [selectedItem,setSelectedItem] = useState<DropdownOption|undefined>(items.find((item)=>{
    return item.label==Settings.appFanSettingName(); 
  }));
  return (
    <PanelSectionRow>
          <Dropdown
            focusable={true}
            disabled={items.length==0}
            rgOptions={items}
            strDefaultLabel={selectedItem?selectedItem.label?.toString():(items.length==0?localizationManager.getString(35,"创建一个风扇配置"):localizationManager.getString(36,"选择一个风扇配置"))}
            selectedOption={selectedItem}
            onChange={(item:DropdownOption)=>{
              //setSelectedItem(item);
              if(item.data.type==FANPROFILEACTION.USE){
                Settings.setAppFanSettingName(item.data.profileName)
              }else if(item.data.type==FANPROFILEACTION.DELETE){
                Settings.removeFanSetting(item.data.profileName)
              }
            }}
          />
    </PanelSectionRow>
);
}

//显示当前风扇配置和温度转速信息
const FANDisplayComponent: VFC = () =>{
  const canvasRef: any = useRef(null);
  const curvePoints : any = useRef([]);
  const nowPoint : any = useRef(new fanPosition(0,0));
  const initDraw=(ref:any)=>{
    canvasRef.current=ref;
    curvePoints.current=Settings.appFanSetting()?.curvePoints;
  }
  const refresh = async() => {
    await Backend.data.getFanRPMPercent().then((value)=>{
      nowPoint.current.fanRPMpercent=value;
    });
    await Backend.data.getFanTemp().then((value)=>{
      nowPoint.current.temperature=value;
    });
    refreshCanvas(); 
  };
  const dismount = () =>{
    if(fanDisplayIntervalID!=null){
      clearInterval(fanDisplayIntervalID);
    }
  }
  useEffect(() => {
    refresh();
    if(fanDisplayIntervalID!=null){
      clearInterval(fanDisplayIntervalID);
    }
    fanDisplayIntervalID=setInterval(()=>{
      refresh();
    },1000)
    PluginManager.listenUpdateComponent(ComponentName.FAN_DISPLAY,[ComponentName.FAN_DISPLAY],(_ComponentName,updateType)=>{
      switch(updateType){
        case(UpdateType.UPDATE):{
          refresh();
          break;
        }
        case(UpdateType.DISMOUNT):{
          dismount();
          break;
        }
      }
    })
  }, []);
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
    /*
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
    ctx.stroke();*/
    //说明绘制
    ctx.beginPath();
    ctx.fillStyle = nowPointColor;
    ctx.textAlign = "left";
    ctx.fillText("当前坐标",22,16);
    ctx.arc(12,12,5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = realPointColor;
    ctx.textAlign = "left";
    ctx.fillText("实际坐标",22,30);
    ctx.arc(12,26,5, 0, Math.PI * 2);
    ctx.fill();
    //绘制实际点和设置点
    ctx.beginPath();
    ctx.fillStyle = realPointColor;
    var nowPointCanPos=(nowPoint.current as fanPosition).getCanvasPos(width,height);
    var textPos = getTextPosByCanvasPos(nowPointCanPos[0],nowPointCanPos[1],width,height)
    ctx.fillText(`(${Math.trunc(nowPoint.current.temperature!!)}°C,${Math.trunc(nowPoint.current.fanRPMpercent!!)}%)`, textPos[0],textPos[1]);
    ctx.arc(nowPointCanPos[0],nowPointCanPos[1],5, 0, Math.PI * 2);
    ctx.fill();
    switch(Settings.appFanSetting()?.fanMode){
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
    const anchorPoint = new fanPosition(tempMax/2,Settings.appFanSetting()?.fixSpeed!!).getCanvasPos(width,height);
    var lineStart=[0,anchorPoint[1]];
    var lineEnd=[width,anchorPoint[1]];
    var textPos=getTextPosByCanvasPos(anchorPoint[0],anchorPoint[1],width,height)
    ctx.beginPath();
    ctx.arc(lineStart[0],lineStart[1],8, 0, Math.PI * 2);
    ctx.arc(lineEnd[0],lineEnd[1],8, 0, Math.PI * 2);
    ctx.fillText(`(${Math.trunc(Settings.appFanSetting()?.fixSpeed!!!!)}%)`, textPos[0],textPos[1]);
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
      var pointCanvasPos = (curvePoint as fanPosition).getCanvasPos(width,height);
      ctx.lineTo(pointCanvasPos[0],pointCanvasPos[1]);
      ctx.moveTo(pointCanvasPos[0],pointCanvasPos[1]);
    }
    ctx.lineTo(width,0);
    ctx.stroke();
    //绘制点和坐标
    /*
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
    */
  }
  return (
    <PanelSectionRow>
    <FanCanvas width={250} height={250} style={{
      "width": "250px",
      "height": "250px",
      "border":"1px solid #1a9fff",
      "padding":"0px",
      // @ts-ignore
      "background-color":"#1a1f2c",
      "border-radius":"4px",
      "margin-top":"10px",
      "margin-left":"8px"
    }} 
      initDraw={(f:any)=>{initDraw(f)}}
      />
    </PanelSectionRow>
  );
}


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
  

  const [profileName,setProfileName]=useState<string>();
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
  const onCreateProfile=()=>{
    Settings.addFanSetting(profileName!!,new FanSetting(snapToGrid,fanMode,fixSpeed,curvePoints.current))
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
  }
  return (
    <div>
    <style>
      {
        //禁用滑动防止画布拖动事件失去焦点
        `
        .gamepaddialog_ModalPosition_30VHl{
          overflow-y:hidden
        }
        `
      }
      {`
        .DialogLabel, .DialogLabelStrong {
          font-weight: 500;
          color: #ffffff;
          text-transform: uppercase;
          line-height: 19px;
          font-size: 16px;
          margin-bottom: 4px;
          user-select: none;
          letter-spacing: initial;
        }
      `}
    </style>
    <ModalRoot onCancel={closeModal} onEscKeypress={closeModal} >
      <h1 style={{ marginBlockEnd: "5px", marginBlockStart: "-15px", fontSize:25}}>
        <div style={{width:180,display:"inline-block"}}>{localizationManager.getString(37, "配置文件名称")}</div>
        <div style={{width:250,height:20,display:"inline-block"}}><TextField
            value={profileName}
            onChange={(e) => {
              setProfileName(e.target.value);
              console.log(e.target.value);
            }}
          /></div>
      </h1>
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
      <DialogButton onClick={() => {
          onCreateProfile();
          closeModal();
        }}> Create Preset</DialogButton>
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
  //<FANSelectProfileComponent/>
  return (
    <div>
      {show&&<PanelSection title="FAN">
        <FANSelectProfileComponent/>
        <FANDisplayComponent/>
        <FANRPMComponent/>
        <FANCreateProfileComponent/>
      </PanelSection>}
    </div>
  );
};


