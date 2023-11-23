import {
  NotchLabel, SliderField,
} from "decky-frontend-lib";
import { ItemProps } from "decky-frontend-lib/dist/deck-components/Item";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { FC } from "react";

export interface SlowSliderFieldProps extends ItemProps {
  value: number;
  min?: number;
  max?: number;
  changeMin?: number;
  changeMax?: number;
  step?: number;
  notchCount?: number;
  notchLabels?: NotchLabel[];
  notchTicksVisible?: boolean;
  showValue?: boolean;
  resetValue?: number;
  disabled?: boolean;
  editableValue?: boolean;
  validValues?: 'steps' | 'range' | ((value: number) => boolean);
  valueSuffix?: string;
  minimumDpadGranularity?: number;
  onChange?(value: number): void;
  onChangeEnd?(value:number): void;
}
export const SlowSliderField: FC<SlowSliderFieldProps> = (slider) => {
  const [changeValue,SetChangeValue] = useState<number>(slider.value);
  const isChanging=useRef<Boolean>(false);
  useEffect(() => {
    setTimeout(()=>{
      //console.debug("changeValue=",changeValue,"slider=",slider.value)
      if(changeValue==slider.value){
        slider.onChangeEnd?.call(slider,slider.value);
        isChanging.current=false;
      }
    },500)
  }, [changeValue]);
  return(
    <SliderField 
      value={slider.value}
      label={slider.label}
      description={slider.description}
      min={slider.min}
      max={slider.max}
      step={slider.step}
      notchCount={slider.notchCount}
      notchLabels={slider.notchLabels}
      notchTicksVisible={slider.notchTicksVisible}
      showValue={slider.showValue}
      resetValue={slider.resetValue}
      disabled={slider.disabled}
      editableValue={slider.editableValue}
      validValues={slider.validValues}
      valueSuffix={slider.valueSuffix}
      minimumDpadGranularity={slider.minimumDpadGranularity}
      onChange={(value:number)=>{
        var tpvalue=value;
        if(slider.changeMax!=undefined)
          tpvalue=slider.changeMax<=value?slider.changeMax:value;
        if(slider.changeMin!=undefined)
          tpvalue=slider.changeMin>=value?slider.changeMin:value;
        isChanging.current=true;
        slider.onChange?.call(slider,tpvalue);
        slider.value=tpvalue;
        SetChangeValue(tpvalue);
      }}
    />
  );
};

