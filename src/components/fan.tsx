import {
  PanelSection,
  PanelSectionRow,
  Field,
  showModal,
  ModalRoot,
  DialogButton,
  TextField,
  SliderField,
  DropdownOption,
  Focusable,
  DropdownItem,
} from "decky-frontend-lib";
import { useEffect, useState,useRef,VFC} from "react";
import { FiPlusCircle }from "react-icons/fi"
import { Settings, PluginManager,ComponentName, UpdateType, FANMODE, getTextPosByCanvasPos, fanPosition, FanSetting, FANPROFILEACTION, FanControl, Backend} from "../util";
import { localizeStrEnum,localizationManager } from "../i18n";
import {FanCanvas} from "./fanCanvas";
const totalLines = 9;
const pointBlockDis = 5;
const pointColor = "#1A9FFF";
const selectColor = "#FF0000";
const textColor = "#FFFFFF";
const lineColor = "#1E90FF";
const setPointColor = "#00BFFF";

//选择配置文件下拉框
const FANSelectProfileComponent:VFC<{fanIndex:number}> = ({fanIndex}) =>{
  //@ts-ignore
  const [items, setItems] = useState<DropdownOption[]>(
    Object.entries(Settings.getFanSettings()).map(([profileName, fanSetting]) => {
      var useOption = {label:localizationManager.getString(localizeStrEnum.USE),data:{profileName:profileName,type:FANPROFILEACTION.USE,setting:fanSetting}};
      if (profileName==Settings.appFanSettingNameList()?.[fanIndex]) {
        useOption ={label:localizationManager.getString(localizeStrEnum.CANCEL),data:{profileName:profileName,type:FANPROFILEACTION.CANCEL,setting:fanSetting}};
      }
      return {
        label: profileName,
        options:[
          useOption,
          {label:localizationManager.getString(localizeStrEnum.EDIT),data:{profileName:profileName,type:FANPROFILEACTION.EDIT,setting:fanSetting}},
          {label:localizationManager.getString(localizeStrEnum.DELETE),data:{profileName:profileName,type:FANPROFILEACTION.DELETE,setting:fanSetting}}
        ]
      };
    })
  );
  //@ts-ignore
  const [selectedItem,setSelectedItem] = useState<DropdownOption|undefined>(items.find((item)=>{
    return item.label==Settings.appFanSettingNameList()?.[fanIndex]; 
  }));
  return (
    <div>
    <PanelSectionRow>
          <DropdownItem
            rgOptions={[
              ...items,
              {
                data: FANPROFILEACTION.ADD,
                label: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "start",
                      gap: "1em",
                    }}
                  >
                    <FiPlusCircle />
                    <span>{localizationManager.getString(localizeStrEnum.CREATE_FAN_PROFILE_TIP)}</span>
                  </div>
                ),
              },
            ]}
            strDefaultLabel={selectedItem?selectedItem.label?.toString():(items.length==0?localizationManager.getString(localizeStrEnum.CREATE_FAN_PROFILE_TIP):localizationManager.getString(localizeStrEnum.SELECT_FAN_PROFILE_TIP))}
            selectedOption={selectedItem}
            bottomSeparator={"none"}
            onChange={(item:DropdownOption)=>{
              if(item.data==FANPROFILEACTION.ADD){
                // @ts-ignore
                showModal(<FANCretateProfileModelComponent fanProfileName={item.data.profileName} fanSetting={Settings.getFanSetting(item.data.profileName)}/>);
                return;
              }
              //setSelectedItem(item);
              if(item.data.type==FANPROFILEACTION.USE){
                Settings.setAppFanSettingName(item.data.profileName,fanIndex)
              }else if(item.data.type==FANPROFILEACTION.DELETE){
                Settings.removeFanSetting(item.data.profileName)
              }else if(item.data.type==FANPROFILEACTION.EDIT){
                 // @ts-ignore
                showModal(<FANCretateProfileModelComponent fanProfileName={item.data.profileName} fanSetting={Settings.getFanSetting(item.data.profileName)}/>);
              }else if(item.data.type==FANPROFILEACTION.CANCEL){
                Settings.setAppFanSettingName(undefined,fanIndex);
             }
            }}
          />
          </PanelSectionRow>
          </div>
);
}

//显示当前风扇配置和温度转速信息
const FANDisplayComponent: VFC<{fanIndex:number}> = ({fanIndex}) =>{
  const canvasRef: any = useRef(null);
  const curvePoints : any = useRef([]);
  const initDraw=(ref:any)=>{
    canvasRef.current=ref;
    curvePoints.current=Settings.appFanSettings()?.[fanIndex]?.curvePoints;
  }
  const refresh = () => {
    refreshCanvas(); 
  };
  useEffect(() => {
    refresh();
    
    const fanDisplayIntervalID=setInterval(()=>{
      refresh();
    },1000)
    return ()=>{
      clearInterval(fanDisplayIntervalID);
    }
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
    switch(Settings.appFanSettings()?.[fanIndex]?.fanMode){
      case(FANMODE.NOCONTROL):{
        drawNoControlMode();
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
  const drawNoControlMode=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    ctx.beginPath();
    ctx.fillStyle = setPointColor;
    ctx.textAlign = "left";
    ctx.fillText(localizationManager.getString(localizeStrEnum.CURENT_STAT),22,16);
    ctx.arc(12,12,5, 0, Math.PI * 2);
    ctx.fill();
    //绘制实际点
    ctx.fillStyle = setPointColor;
    var nowPointCanPos=FanControl.fanInfo[fanIndex].nowPoint.getCanvasPos(width,height);
    var textPos = getTextPosByCanvasPos(nowPointCanPos[0],nowPointCanPos[1],width,height)
    ctx.fillText(`(${Math.trunc(FanControl.fanInfo[fanIndex].nowPoint.temperature!!)}°C,${Math.trunc(FanControl.fanInfo[fanIndex].nowPoint.fanRPMpercent!!)}%)`, textPos[0],textPos[1]);
    ctx.arc(nowPointCanPos[0],nowPointCanPos[1],5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
  }
  const drawFixMode=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    const anchorPoint = new fanPosition(fanPosition.tempMax/2,Settings.appFanSettings()?.[fanIndex].fixSpeed!!).getCanvasPos(width,height);
    //说明绘制
    ctx.beginPath();
    ctx.fillStyle = setPointColor;
    ctx.textAlign = "left";
    ctx.fillText(localizationManager.getString(localizeStrEnum.CURENT_STAT),22,16);
    ctx.arc(12,12,5, 0, Math.PI * 2);
    ctx.fill();
    //点线绘制
    var lineStart=[0,anchorPoint[1]];
    var lineEnd=[width,anchorPoint[1]];
    var textPos=getTextPosByCanvasPos(anchorPoint[0],anchorPoint[1],width,height)
    ctx.beginPath();
    ctx.strokeStyle=lineColor;
    //ctx.fillText(`(${Math.trunc(Settings.appFanSetting()?.fixSpeed!!!!)}%)`, textPos[0],textPos[1]);
    ctx.moveTo(lineStart[0],lineStart[1]);
    ctx.lineTo(lineEnd[0], lineEnd[1]);
    ctx.stroke();
    //绘制设置点
    ctx.beginPath();
    ctx.fillStyle = setPointColor;
    var setPointCanPos=FanControl.fanInfo[fanIndex].setPoint.getCanvasPos(width,height);
    var textPos = getTextPosByCanvasPos(setPointCanPos[0],setPointCanPos[1],width,height)
    ctx.fillText(`(${Math.trunc(FanControl.fanInfo[fanIndex].setPoint.temperature!!)}°C,${Math.trunc(FanControl.fanInfo[fanIndex].setPoint.fanRPMpercent!!)}%)`, textPos[0],textPos[1]);
    ctx.arc(setPointCanPos[0],setPointCanPos[1],5, 0, Math.PI * 2);
    ctx.fill();
  }
  const drawCurveMode=()=>{
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    curvePoints.current = curvePoints.current.sort((a:fanPosition,b:fanPosition)=>{
      return a.temperature==b.temperature?a.fanRPMpercent!!-b.fanRPMpercent!!:a.temperature!!-b.temperature!!
    });
    //说明绘制
    ctx.beginPath();
    ctx.fillStyle = setPointColor;
    ctx.textAlign = "left";
    ctx.fillText(localizationManager.getString(localizeStrEnum.CURENT_STAT),22,16);
    ctx.arc(12,12,5, 0, Math.PI * 2);
    ctx.fill();
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

    //绘制实际点和设置点
    ctx.beginPath();
    ctx.fillStyle = setPointColor;
    var setPointCanPos=FanControl.fanInfo[fanIndex].setPoint.getCanvasPos(width,height);
    var textPos = getTextPosByCanvasPos(setPointCanPos[0],setPointCanPos[1],width,height)
    ctx.fillText(`(${Math.trunc(FanControl.fanInfo[fanIndex].setPoint.temperature!!)}°C,${Math.trunc(FanControl.fanInfo[fanIndex].setPoint.fanRPMpercent!!)}%)`, textPos[0],textPos[1]);
    ctx.arc(setPointCanPos[0],setPointCanPos[1],5, 0, Math.PI * 2);
    ctx.fill();
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
const FANRPMComponent: VFC<{fanIndex:number}> = ({fanIndex}) =>{
  const [fanrpm, setFanRPM] = useState<number>(0);
  const refresh = async() => {
      setFanRPM(FanControl.fanInfo[fanIndex].fanRPM);
  };
  
  useEffect(() => {
    const fanRPMIntervalID=setInterval(()=>{
      refresh();
    },1000)
    return ()=>{
      clearInterval(fanRPMIntervalID);
    }
  }, []);
  return (
      <PanelSectionRow>
            <Field focusable={true}
              label= {localizationManager.getString(localizeStrEnum.FAN_SPEED)}>
              {fanrpm + " RPM"}
            </Field>
      </PanelSectionRow>
  );
};

function FANCretateProfileModelComponent({
  fanProfileName,
  fanSetting,
  closeModal,
}: {
  fanProfileName:string,
  fanSetting:FanSetting,
  closeModal: () => void;
}){
  const canvasRef: any = useRef(null);
  const curvePoints : any = useRef(fanSetting?.curvePoints??[]);
  //drag
  const dragPoint : any = useRef(null);
  //select
  const selectedPoint: any = useRef(null);
  

  const [profileName,setProfileName]=useState<string>(fanProfileName??undefined);
  //@ts-ignore
  const [snapToGrid,setSnapToGrid] = useState(true);
  const [fanMode,setFanMode] = useState(fanSetting?.fanMode??FANMODE.NOCONTROL);
  const [fixSpeed,setFixSpeed] = useState(fanSetting?.fixSpeed??50);
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
      const tempText= fanPosition.tempMax / (totalLines + 1) * i +"°C";
      const fanText= fanPosition.fanMax / (totalLines + 1) * i +"%";
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
    const anchorPoint = new fanPosition(fanPosition.tempMax/2,fixSpeed).getCanvasPos(width,height);
    var lineStart=[0,anchorPoint[1]];
    var lineEnd=[width,anchorPoint[1]];
    var textPos=getTextPosByCanvasPos(anchorPoint[0],anchorPoint[1],width,height)
    ctx.beginPath();
    ctx.strokeStyle=lineColor;
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
  const onCreateProfile=(isEdit:boolean)=>{
    if(isEdit){
      Settings.editFanSetting(fanProfileName,profileName,new FanSetting(snapToGrid,fanMode,fixSpeed,curvePoints.current))
    }
    return Settings.addFanSetting(profileName,new FanSetting(snapToGrid,fanMode,fixSpeed,curvePoints.current))
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
        var isPressPoint = false;
        //短按时如果按到点 删除该点 
        //如果该点是选中点 取消选中
        for(let i=0;i<curvePoints.current.length;i++){
          if(curvePoints.current[i].isCloseToOther(shortPressPos,pointBlockDis)){
            if(curvePoints.current[i]==selectedPoint.current){
              selectedPoint.current = null;
              setSelPointTemp(0);
              setSelPointSpeed(0);
            }
            curvePoints.current.splice(i,1);
            isPressPoint=true;
            break;
          }
        }
        //没有按到点 在该位置生成一个点
        if(!isPressPoint)
          curvePoints.current.push(shortPressPos);
        /*
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
        }*/
        refreshCanvas();
        break;
      }
    }
  }

  function onPointerLongPress(longPressPos: fanPosition): void {
    switch(fanMode){
      case(FANMODE.NOCONTROL):{
        break;
      }
      case(FANMODE.FIX):{
        var percent=longPressPos.fanRPMpercent!!;
        setFixSpeed(percent);
        break;
      }
      case(FANMODE.CURVE):{
        //长按时按到点 则选中该点
        for(let i=0;i<curvePoints.current.length;i++){
          if(longPressPos.isCloseToOther(curvePoints.current[i],pointBlockDis)){
            selectedPoint.current = curvePoints.current[i];
            setSelPointTemp(Math.trunc(selectedPoint.current.temperature));
            setSelPointSpeed(Math.trunc(selectedPoint.current.fanRPMpercent));
            break;
          }
        }
        /*
        //选中点时如果长按该点 则取消选中
        if(selectedPoint.current){
          for(let i=0;i<curvePoints.current.length;i++){
            if(longPressPos.isCloseToOther(selectedPoint.current,pointBlockDis)&&curvePoints.current[i]==selectedPoint.current){
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
        }*/
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
    return false;
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
        setSelPointTemp(Math.trunc(selectedPoint.current.temperature));
        setSelPointSpeed(Math.trunc(selectedPoint.current.fanRPMpercent));
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
        <div style={{width:180,display:"inline-block"}}>{localizationManager.getString(localizeStrEnum.FAN_PROFILE_NAME)}</div>
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
            onPointerLongPress={(e:fanPosition) => {onPointerLongPress(e)}}
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
              label={localizationManager.getString(localizeStrEnum.FAN_MODE)}
              value={fanMode}
              step={1}
              max={2}
              min={0}
              notchCount={3}
              notchLabels={
                [{
                  notchIndex: FANMODE.NOCONTROL,
                  label: `${localizationManager.getString(localizeStrEnum.NOT_CONTROLLED)}`,
                  value: FANMODE.NOCONTROL,
                }, {
                  notchIndex: FANMODE.FIX,
                  label: `${localizationManager.getString(localizeStrEnum.FIXED)}`,
                  value: FANMODE.FIX,
                }, {
                  notchIndex: FANMODE.CURVE,
                  label: `${localizationManager.getString(localizeStrEnum.CURVE)}`,
                  value: FANMODE.CURVE,
                }
                ]
              }
              onChange={(value: number) => {
                setFanMode(value);
                }}
              />
              {fanMode==FANMODE.FIX&&<SliderField
                label={localizationManager.getString(localizeStrEnum.FAN_SPEED_PERCENT)}
                value={fixSpeed}
                step={1}
                max={100}
                min={0}
                onChange={(value: number) => {
                  setFixSpeed(value);
                }}
              />}
              {fanMode==FANMODE.CURVE&&<SliderField
                label={localizationManager.getString(localizeStrEnum.SENSOR_TEMP)}
                value={selPointTemp}
                valueSuffix={"°C"}
                showValue={true}
                layout={"inline"}
                disabled={!selectedPoint.current}
                step={1}
                max={fanPosition.tempMax}
                min={0}
                onChange={(value: number) => {
                  setSelPointTemp(value);
                }}
              />}
              {fanMode==FANMODE.CURVE&&<SliderField
                label={localizationManager.getString(localizeStrEnum.FAN_SPEED_PERCENT)}
                value={selPointSpeed}
                valueSuffix={"%"}
                showValue={true}
                layout={"inline"}
                disabled={!selectedPoint.current}
                step={1}
                max={fanPosition.fanMax}
                min={0}
                onChange={(value: number) => {
                  setSelPointSpeed(value);
                }}
              />}
          </PanelSection>
        </div>
      </div>
      <Focusable style={{marginBlockEnd: "-25px", marginBlockStart: "-5px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)",gridTemplateRows: "repeat(1, 1fr)",gridGap: "0.5rem", padding: "8px 0"}}>
      <DialogButton onClick={() => {
          if(onCreateProfile(fanSetting!=undefined)){
            closeModal();
          }
        }}> {localizationManager.getString(fanSetting?localizeStrEnum.SAVE:localizeStrEnum.CREATE)}</DialogButton>
      <DialogButton onClick={() => {closeModal()}}> {localizationManager.getString(localizeStrEnum.CANCEL)}</DialogButton>
      </Focusable>
    </ModalRoot>
    </div>
  );
}

export function FANComponent(){
  const [show,setShow] = useState<boolean>(Settings.ensureEnable());
  const [index,setIndex] = useState<number>(0);
  const fanEnable = useRef<boolean>(FanControl.fanIsEnable);
  const fanCount = useRef<number>(Backend.data.getFanCount());
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
    });
  }, []);
  //<FANSelectProfileComponent/>
  return (
    <div>
      {show&&fanEnable.current&&fanCount.current>=0&&<PanelSection title="FAN">
      {
        fanCount.current==1&&(<div>
          <FANSelectProfileComponent fanIndex={0} />
          <FANDisplayComponent fanIndex={0} />
          <FANRPMComponent fanIndex={0} />
        </div>)
      }
      {
        fanCount.current==2&&(<div>
          <PanelSectionRow>
            <SliderField value={index} min={0} max={fanCount.current-1} step={1} notchCount={fanCount.current} notchLabels={
                Backend.data.getFanConfigs().map((config,index) => {
                  return {notchIndex:index,label:config.fan_name,value:index}
                })
            } onChange={(value)=>{
              setIndex(value);
            }}>
            </SliderField>
           
          </PanelSectionRow>
          {Backend.data.getFanConfigs().map((_config,configIndex) => {
            return index==configIndex&&(<div>
              <FANSelectProfileComponent key={configIndex} fanIndex={index} />
              <FANDisplayComponent key={configIndex} fanIndex={index} />
              <FANRPMComponent key={configIndex} fanIndex={index} />
            </div>)
          })}
        </div>)
      }
      
      </PanelSection>}
    </div>
  );
};


