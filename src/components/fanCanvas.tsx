import { useEffect, useRef } from "react";
import { FC } from "react";
import { FanPosition } from "../util";
export interface FanCanvasProps {
  width: number;
  height: number;
  style: any;
  initDraw?(canvasRef: any): void
  onPointerDown?(position: any): void;
  onPointerMove?(position: any): void;
  onPointerUp?(position: any): void;
  onPointerShortPress?(position: any): void;
  onPointerLongPress?(position: any): void;
  onPointerDragDown?(position: any): boolean;
  onPointerDraging?(position: any): void;
}
export const FanCanvas: FC<FanCanvasProps> = (canvas) => {
  const pointerDownPos: any = useRef(null);
  const pointerDownTime: any = useRef(null);
  const pointerUpPos: any = useRef(null);
  const pointerUpTime: any = useRef(null);
  const pointerIsDrag = useRef(false);
  const canvasRef: any = useRef(null);
  useEffect(() => {
    canvas.initDraw?.call(canvas, canvasRef.current);
  }, [])

  function getlayerXY(e: any): { layerX: number, layerY: number } {
    const realEvent: any = e.nativeEvent;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = realEvent.clientX - rect.left;
    const y = realEvent.clientY - rect.top;
    return { layerX: x, layerY: y }
  }

  function onPointerDown(e: any): void {
    const { layerX, layerY } = getlayerXY(e);
    const fanClickPos = FanPosition.createFanPosByCanPos(layerX, layerY, canvas.width, canvas.height);
    pointerDownPos.current = [layerX, layerY]
    pointerDownTime.current = Date.parse(new Date().toString());
    canvas.onPointerDown?.call(canvas, fanClickPos)
    onDragDown(e);
  }

  function onPointerUp(e: any): void {
    const { layerX, layerY } = getlayerXY(e);
    const fanClickPos = FanPosition.createFanPosByCanPos(layerX, layerY, canvas.width, canvas.height);
    pointerUpPos.current = [layerX, layerY]
    pointerUpTime.current = Date.parse(new Date().toString());
    canvas.onPointerUp?.call(canvas, fanClickPos)
    //call PointPressEvent
    if (approximatelyEqual(pointerDownPos.current[0], pointerUpPos.current[0], 3) &&
      approximatelyEqual(pointerDownPos.current[1], pointerUpPos.current[1], 3)) {
      if (pointerUpTime.current - pointerDownTime.current <= 1000)
        onPointerShortPress(e);
      else
        onPointLongPress(e);
    }
    //console.log(`pressDownTime=${pointerDownTime.current} pressUpTime=${pointerUpTime.current}`)
    if (pointerIsDrag.current) {
      pointerIsDrag.current = false;
    }
  }

  function onPointerMove(e: any): void {
    const { layerX, layerY } = getlayerXY(e);
    const fanClickPos = FanPosition.createFanPosByCanPos(layerX, layerY, canvas.width, canvas.height);
    canvas.onPointerMove?.call(canvas, fanClickPos)
    if (pointerIsDrag.current) {
      onDraging(e);
    }
  }
  function onPointerLeave(_e: any): void {
    if (pointerIsDrag.current) {
      pointerIsDrag.current = false;
    }
  }

  function onPointerShortPress(e: any): void {
    const { layerX, layerY } = getlayerXY(e);
    const fanClickPos = FanPosition.createFanPosByCanPos(layerX, layerY, canvas.width, canvas.height);
    canvas.onPointerShortPress?.call(canvas, fanClickPos)
  }
  //@ts-ignore
  function onPointLongPress(e: any): void {

  }
  function onDragDown(e: any): void {
    const { layerX, layerY } = getlayerXY(e);
    const fanClickPos = FanPosition.createFanPosByCanPos(layerX, layerY, canvas.width, canvas.height);
    pointerIsDrag.current = canvas.onPointerDragDown?.call(canvas, fanClickPos)!!;
  }

  function onDraging(e: any): void {
    const { layerX, layerY } = getlayerXY(e);
    const fanClickPos = FanPosition.createFanPosByCanPos(layerX, layerY, canvas.width, canvas.height);
    canvas.onPointerDraging?.call(canvas, fanClickPos)
  }

  const { ...option } = canvas;

  return (
    <canvas
      ref={canvasRef}
      //onClick={(e: any) => onClickCanvas(e)}
      onPointerDown={(e: any) => { onPointerDown(e) }}
      onPointerMove={(e: any) => { onPointerMove(e) }}
      onPointerUp={(e: any) => { onPointerUp(e) }}
      onPointerLeave={(e: any) => { onPointerLeave(e) }}
      {...option}
    />
  );
};

const approximatelyEqual = (a: number, b: number, error: number) => {
  return Math.abs(b - a) <= error;
}

