import { JsonObject, JsonProperty } from 'typescript-json-serializer';

@JsonObject()
export class fanPosition {
  @JsonProperty()
  temperature?:number;
  @JsonProperty()
  fanRPMpercent?:number;
  constructor(temperature:number,fanRPMpercent:number){
    this.fanRPMpercent=fanRPMpercent;
    this.temperature=temperature;
  }
  public getCanvasPos(canWidth:number,canHeight:number)
  {
    const tempMax=100; 
    const fanMax=100;
    var canPosx=Math.min(Math.max(this.temperature!!/tempMax*canWidth,0),canWidth);
    var canPosy=Math.min(Math.max((1-this.fanRPMpercent!!/fanMax)*canHeight,0),canHeight);
    return new canvasPosition(canPosx,canPosy)
  }
  public isCloseToOther(other:fanPosition,distance:number){
    var getDis =Math.sqrt(Math.pow((other.temperature!!-this.temperature!!),2)+Math.pow((other.fanRPMpercent!!-this.fanRPMpercent!!),2))
    return getDis<=distance
  }
}
export class canvasPosition {
  @JsonProperty()
  canx?:number;
  @JsonProperty()
  cany?:number;
  constructor(canx:number,cany:number){
    this.canx=canx;
    this.cany=cany;
  }
  public getFanPos(canWidth:number,canHeight:number)
  {
    const tempMax=100; 
    const fanMax=100;
    const fanMin=0;
    const tempMin=0;
    var temperature=Math.min(Math.max(this.canx!!/canWidth*tempMax,tempMin),tempMax);
    var fanRPMpercent=Math.min(Math.max((1-this.cany!!/canHeight)*fanMax,fanMin),fanMax);
    return new fanPosition(temperature,fanRPMpercent)
  }
}
//通过画布位置来调整文字位置
export const getTextPosByCanvasPos=(canPosx:number,canPosy:number,canWidth:number,_canHeight:number)=>{
  var textlen=55
  var textheight=12
  var offsetX=0;
  var offsetY=0;
  if(canPosx + textlen/2>=canWidth - 5){
    offsetX = canWidth-textlen-canPosx;
  }else if(canPosx - textlen/2<= 5){
    offsetX = - canPosx;
  }else{
    offsetX = -textlen/2 + 2;
  }
  if(canPosy -textheight <= 5){
    offsetY = textheight +5;
  }else{
    offsetY = -textheight;
  }
  return new canvasPosition(canPosx+offsetX,canPosy+offsetY)
}

//检测该点位置周围是否有
export const checkfanPosHasPoint=(point:fanPosition,points:fanPosition[])=>{

}


