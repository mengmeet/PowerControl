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
    var canPosx=this.temperature!!/tempMax*canWidth;
    var canPosy=(1-this.fanRPMpercent!!/fanMax)*canHeight;
    return [canPosx,canPosy]
  }
}
export const createFanPosByCanvasPos=(canPosx:number,canPosy:number,canWidth:number,canHeight:number)=>{
  const tempMax=100; 
  const fanMax=100;
  var temperature=canPosx/canWidth*tempMax;
  var fanRPMpercent=(1-canPosy/canHeight)*fanMax;
  return new fanPosition(temperature,fanRPMpercent)
}