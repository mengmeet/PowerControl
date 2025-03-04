import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  ToggleField,
} from "@decky/ui";
import { FC, useEffect, useState } from "react";
import {
  Backend,
  ComponentName,
  PluginManager,
  Settings,
  UpdateType,
} from "../util";
import { SlowSliderField } from "./SlowSliderField";
import { localizationManager, localizeStrEnum } from "../i18n";
import { RiArrowDownSFill, RiArrowUpSFill } from "react-icons/ri";

const BypassChargeComponent: FC = () => {
  const [bypassCharge, setBypassCharge] = useState<boolean>(
    Settings.appBypassCharge()
  );

  // const [chargeLimit, setChargeLimit] = useState<number>(
  //   Settings.appChargeLimit()
  // );

  const refresh = () => {
    setBypassCharge(Settings.appBypassCharge());
    // setChargeLimit(Settings.appChargeLimit());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.POWER_BYPASS_CHARGE,
      [
        ComponentName.POWER_BYPASS_CHARGE,
        ComponentName.POWER_ALL,
        ComponentName.POWER_CHARGE_LIMIT,
      ],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
  }, []);

  // useEffect(() => {
  //   // 实时获取旁路供电状态
  //   Backend.getBypassCharge().then((value) => {
  //     setBypassCharge(value);
  //   });
  // }, [bypassCharge]);

  return (
    <>
      <PanelSectionRow>
        <ToggleField
          label={localizationManager.getString(
            localizeStrEnum.MANUAL_BYPASS_CHARGE
          )}
          // description={localizationManager.getString(
          //   localizeStrEnum.MANUAL_BYPASS_CHARGE_DESC
          // )}
          checked={bypassCharge}
          onChange={(value) => {
            Settings.setBypassCharge(value);
          }}
        />
      </PanelSectionRow>
    </>
  );
};

const ChargeLimitComponent: FC = () => {
  const [chargeLimit, setChargeLimit] = useState<number>(
    Settings.appChargeLimit()
  );
  const [bypassCharge, setBypassCharge] = useState<boolean>(
    Settings.appBypassCharge()
  );

  const [supportsResetChargeLimit, __] = useState<boolean>(
    Backend.data.isSupportResetChargeLimit()
  );

  const [enableChargeLimit, setEnableChargeLimit] = useState<boolean>(
    Settings.appEnableChargeLimit()
  );

  const refresh = () => {
    setChargeLimit(Settings.appChargeLimit());
    setBypassCharge(Settings.appBypassCharge());
    setEnableChargeLimit(Settings.appEnableChargeLimit());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.POWER_CHARGE_LIMIT,
      [
        ComponentName.POWER_CHARGE_LIMIT,
        ComponentName.POWER_ALL,
        ComponentName.POWER_BYPASS_CHARGE,
      ],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );
  }, []);

  return (
    <>
      {supportsResetChargeLimit && (
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(localizeStrEnum.CHARGE_LIMIT)}
            checked={enableChargeLimit}
            onChange={(enableChargeLimit) => {
              Settings.setEnableChargeLimit(enableChargeLimit);
            }}
          />
        </PanelSectionRow>
      )}
      {((supportsResetChargeLimit && enableChargeLimit) ||
        !supportsResetChargeLimit) && (
        <PanelSectionRow>
          <SlowSliderField
            label={
              supportsResetChargeLimit
                ? "Max"
                : localizationManager.getString(localizeStrEnum.CHARGE_LIMIT)
            }
            description={
              bypassCharge
                ? localizationManager.getString(
                    localizeStrEnum.CHARGE_LIMIT_DESC_WITH_BYPASS
                  )
                : localizationManager.getString(
                    localizeStrEnum.CHARGE_LIMIT_DESC
                  )
            }
            value={chargeLimit}
            valueSuffix=" %"
            step={5}
            max={100}
            min={70}
            validValues="steps"
            showValue={true}
            disabled={bypassCharge}
            onChangeEnd={(value: number) => {
              Settings.setChargeLimit(value);
            }}
          />
        </PanelSectionRow>
      )}
    </>
  );
};

export const PowerComponent: FC = () => {
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());

  const [supportChargeLimit, _] = useState<boolean>(
    Backend.data.getIsSupportChargeLimit()
  );
  const [supportBypassCharge, __] = useState<boolean>(
    Backend.data.getIsSupportBypassCharge()
  );

  const [showPowerMenu, setShowPowerMenu] = useState<boolean>(
    Settings.showPowerMenu
  );
  const updateShowPowerMenu = (show: boolean) => {
    setShowPowerMenu(show);
    Settings.showPowerMenu = show;
  };

  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.POWER_ALL,
      [ComponentName.POWER_ALL],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.HIDE: {
            hide(true);
            break;
          }
          case UpdateType.SHOW: {
            hide(false);
            break;
          }
        }
      }
    );
  }, []);

  useEffect(() => {
    setShow(
      Settings.ensureEnable() && (supportChargeLimit || supportBypassCharge)
    );
  }, [supportChargeLimit, supportBypassCharge]);

  return (
    <>
      {show && (
        <PanelSection title="Power">
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              // @ts-ignore
              style={{
                height: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => updateShowPowerMenu(!showPowerMenu)}
            >
              {showPowerMenu ? <RiArrowUpSFill /> : <RiArrowDownSFill />}
            </ButtonItem>
          </PanelSectionRow>
          {showPowerMenu && (
            <>
              {supportChargeLimit && <ChargeLimitComponent />}
              {supportBypassCharge && <BypassChargeComponent />}
            </>
          )}
        </PanelSection>
      )}
    </>
  );
};
