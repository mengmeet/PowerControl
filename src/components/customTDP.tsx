import { VFC, useEffect, useState } from "react";
import { ComponentName, DEFAULT_TDP_MIN, PluginManager, Settings, UpdateType } from "../util";
import { PanelSectionRow, SliderField, ToggleField } from "decky-frontend-lib";
import { localizationManager, localizeStrEnum } from "../i18n";

export const CustomTDPComponent: VFC = () => {
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());
  const [enableCustomTDPRange, setEnableCustomTDPRange] = useState<boolean>(Settings.appEnableCustomTDPRange());
  const [customTDPRangeMax, setCustomTDPRangeMax] = useState<number>(Settings.appCustomTDPRangeMax());
  // const [customTDPRangeMin, setCustomTDPRangeMin] = useState<number>(Settings.appCustomTDPRangeMin());

  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };
  const refresh = () => {
    setEnableCustomTDPRange(Settings.appEnableCustomTDPRange());
    setCustomTDPRangeMax(Settings.appCustomTDPRangeMax());
    // setCustomTDPRangeMin(Settings.appCustomTDPRangeMin());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(ComponentName.CUSTOM_TDP, [ComponentName.CPU_TDP,ComponentName.CUSTOM_TDP], (_ComponentName, updateType: string) => {
      switch (updateType) {
        case UpdateType.UPDATE:
          refresh();
          break;
        case UpdateType.SHOW:
          hide(false);
          break;
        case UpdateType.HIDE:
          hide(true);
          break;
      }
    });
  });

  const _sliderMin = DEFAULT_TDP_MIN;
  const _sliderMax = 65;

  return (
    <div>
      {show && <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(localizeStrEnum.CUSTOM_TDP_RANGE)}
          checked={enableCustomTDPRange}
          onChange={(val) => {
            Settings.setEnableCustomTDPRange(val);
          }}
        />
      </PanelSectionRow>}
      {show && enableCustomTDPRange &&
        <PanelSectionRow>
          <SliderField
            label={"Max"}
            showValue={true}
            valueSuffix={"W"}
            value={customTDPRangeMax}
            min={_sliderMin}
            max={_sliderMax}
            step={1}
            onChange={(value) => {
              if (value > Settings.appCustomTDPRangeMin()) {
                Settings.setCustomTDPRangeMax(value);
              }
            }}
          />
        </PanelSectionRow>}
      {/* {show && enableCustomTDPRange &&
        <PanelSectionRow>
          <SliderField
            label={"Min"}
            showValue={true}
            valueSuffix={"W"}
            value={customTDPRangeMin}
            min={_sliderMin}
            max={_sliderMax}
            step={1}
            onChange={(value) => {
              if (value < Settings.appCustomTDPRangeMax()) {
                Settings.setCustomTDPRangeMin(value);
              }
            }}
          />
        </PanelSectionRow>} */}
    </div>
  )
}