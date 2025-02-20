import { PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
import { FC, useEffect, useState } from "react";
import { Backend, ComponentName, PluginManager, Settings, UpdateType } from "../util";

const BypassChargeComponent: FC = () => {
  const [bypassCharge, setBypassCharge] = useState<boolean>(
    Settings.appBypassCharge()
  );
  const refresh = () => {
    setBypassCharge(Settings.appBypassCharge());
  };

  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.POWER_BYPASS_CHARGE,
      [ComponentName.POWER_BYPASS_CHARGE],
      (_ComponentName, updateType) => {
        switch (updateType) {
          case UpdateType.UPDATE: {
            refresh();
            break;
          }
        }
      }
    );

    // 实时获取旁路供电状态
    Backend.getBypassCharge().then((value) => {
      setBypassCharge(value);
    });

  }, []);

  return (
    <>
      <PanelSectionRow>
        <ToggleField
          label="Bypass Charge"
          description={""}
          checked={bypassCharge}
          onChange={(smt) => {
            Settings.setBypassCharge(smt);
          }}
        />
      </PanelSectionRow>
    </>
  );
};

export const PowerComponent: FC = () => {
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());

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

  return (
    <>
      {show && (
        <PanelSection title="Power">
          <BypassChargeComponent />
        </PanelSection>
      )}
    </>
  );
};
