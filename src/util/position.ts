import { JsonObject, JsonProperty } from 'typescript-json-serializer';

@JsonObject()
export class fanPosition {
  @JsonProperty()
  posX?:number;
  @JsonProperty()
  posY?:number;
  public getCanvasPos()
  {

  }
  public getFanPos()
  {

  }
}
