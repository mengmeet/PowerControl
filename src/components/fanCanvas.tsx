import { useEffect, useRef } from "react";
import { FC } from "react";
import {fanPosition } from "../util";
export interface FanCanvasProps{
  width:number;
  height:number;
  style:any;
  initDraw?(canvasRef:any):void
  onPointerDown?(position: any): void;
  onPointerMove?(position: any): void;
  onPointerUp?(position: any): void;
  onPointerShortPress?(position: any): void;
  onPointerLongPress?(position:any): void;
  onPointerDragDown?(position: any): boolean;
  onPointerDraging?(position: any): void;
}
export const FanCanvas: FC<FanCanvasProps> = (canvas) => {
  const pointerDownPos: any = useRef(null);
  const pointerUpPos: any = useRef(null);
  const pointerIsDrag = useRef(false);
  const canvasRef: any = useRef(null);
  useEffect(()=>{
    canvas.initDraw?.call(canvas,canvasRef.current);
  },[])
  function onPointerDown(e:any):void{
    const realEvent: any = e.nativeEvent;
    const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX,realEvent.layerY,canvas.width,canvas.height);
    pointerDownPos.current=[realEvent.layerX,realEvent.layerY]
    canvas.onPointerDown?.call(canvas,fanClickPos)
    onDragDown(e);
  }
  function onPointerUp(e:any):void{
    const realEvent: any = e.nativeEvent;
    const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX,realEvent.layerY,canvas.width,canvas.height);
    pointerUpPos.current=[realEvent.layerX,realEvent.layerY]
    canvas.onPointerUp?.call(canvas,fanClickPos)
    //call PointPressEvent
    if(approximatelyEqual(pointerDownPos.current[0],pointerUpPos.current[0],5) && approximatelyEqual(pointerDownPos.current[1],pointerUpPos.current[1],5)){
      onPointerShortPress(e);
    }
    if(pointerIsDrag.current){
      pointerIsDrag.current=false;
    }
  }
  function onPointerMove(e:any):void{
    const realEvent: any = e.nativeEvent;
    const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX,realEvent.layerY,canvas.width,canvas.height);
    canvas.onPointerMove?.call(canvas,fanClickPos)
    if(pointerIsDrag.current){
      onDraging(e);
    }
  }
  function onPointerLeave(_e:any):void{
    if(pointerIsDrag.current){
      pointerIsDrag.current=false;
    }
  }
  function onPointerShortPress(e:any):void{
    const realEvent: any = e.nativeEvent;
    const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX,realEvent.layerY,canvas.width,canvas.height);
    canvas.onPointerShortPress?.call(canvas,fanClickPos)
  }
  //@ts-ignore
  function onPointLongPress(e:any):void{

  }
  function onDragDown(e:any):void{
    const realEvent: any = e.nativeEvent;
    const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX,realEvent.layerY,canvas.width,canvas.height);
    pointerIsDrag.current=canvas.onPointerDragDown?.call(canvas,fanClickPos)!!;
  }
  function onDraging(e:any):void{
    const realEvent: any = e.nativeEvent;
    const fanClickPos = fanPosition.createFanPosByCanPos(realEvent.layerX,realEvent.layerY,canvas.width,canvas.height);
    canvas.onPointerDraging?.call(canvas,fanClickPos)
  }
  const {...option} = canvas;
  return(
    <canvas
      ref={canvasRef}
      //onClick={(e: any) => onClickCanvas(e)}
      onPointerDown={(e:any) => {onPointerDown(e)}}
      onPointerMove={(e:any) => {onPointerMove(e)}}
      onPointerUp={(e:any) => {onPointerUp(e)}}
      onPointerLeave={(e:any) => {onPointerLeave(e)}}
      {...option}
    />
  );
};

const approximatelyEqual=(a:number, b:number,error:number)=>{
  return Math.abs(b-a)<=error;
}

