/*!
 * Copyright (C) 2022 Sefa Eyeoglu <contact@scrumplex.net> (https://scrumplex.net)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  definePlugin,
  PanelSectionRow,
  staticClasses,
  SteamSpinner,
  Tabs,
} from "@decky/ui";
import { FC, useEffect, useMemo, useState } from "react";
import { FaFan, FaLayerGroup, FaSuperpowers } from "react-icons/fa";
import {
  Backend,
  ComponentName,
  PluginManager,
  Settings,
  UpdateType,
} from "./util";
import {
  GPUComponent,
  CPUComponent,
  SettingsComponent,
  FANComponent,
  MoreComponent,
  QuickAccessTitleView,
  PowerComponent,
} from "./components";
import { TabCpu, TabGpu, TabPower, TabMore, TabFans } from "./tab";
import { BsCpuFill } from "react-icons/bs";
import { PiGraphicsCardFill, PiLightningFill } from "react-icons/pi";

const ListView: FC<{}> = ({}) => {
  return (
    <>
      <SettingsComponent />
      <CPUComponent />
      <GPUComponent />
      <PowerComponent />
      <FANComponent />
      <MoreComponent />
    </>
  );
};

const TabView: FC<{ show?: boolean }> = ({ show = true }) => {
  const [currentTabRoute, setCurrentTabRoute] = useState<string>(
    Settings.currentTabRoute
  );

  const updateCurrentTabRoute = (route: string) => {
    setCurrentTabRoute(route);
    Settings.currentTabRoute = route;
  };

  const supportChargeLimit = useMemo(() => {
    return Backend.data.isSupportsChargeLimit();
  }, []);

  const isSupportSoftwareChargeLimit = useMemo(() => {
    return Backend.data.isSupportsSoftwareChargeLimit();
  }, []);

  const showPowerTab = useMemo(() => {
    return supportChargeLimit || isSupportSoftwareChargeLimit;
  }, [supportChargeLimit, isSupportSoftwareChargeLimit]);

  return (
    <>
      <style>
        {`
.main-tabs > div > div:first-child::before {
  background: transparent;
  box-shadow: none;
  backdrop-filter: blur(50px);
}
`}
      </style>
      <SettingsComponent />
      {show && (
        <div
          className="main-tabs"
          style={{
            height: "95%",
            width: "300px",
            marginTop: "-12px",
            position: "absolute",
            overflow: "visible",
          }}
        >
          <Tabs
            activeTab={currentTabRoute}
            onShowTab={(tabID: string) => {
              updateCurrentTabRoute(tabID);
            }}
            tabs={[
              {
                title: <BsCpuFill size={20} style={{ display: "block" }} />,
                content: <TabCpu />,
                id: "cpu",
              },
              {
                title: (
                  <PiGraphicsCardFill size={21} style={{ display: "block" }} />
                ),
                content: <TabGpu />,
                id: "gpu",
              },
              {
                title: <FaFan size={20} style={{ display: "block" }} />,
                content: <TabFans />,
                id: "fans",
              },
              ...(showPowerTab
                ? [
                    {
                      title: (
                        <PiLightningFill
                          size={20}
                          style={{ display: "block" }}
                        />
                      ),
                      content: <TabPower />,
                      id: "power",
                    },
                  ]
                : []),
              {
                title: <FaLayerGroup size={20} style={{ display: "block" }} />,
                content: <TabMore />,
                id: "more",
              },
            ]}
          />
        </div>
      )}
      {!show && <MoreComponent />}
    </>
  );
};
const Content: FC<{}> = ({}) => {
  const [useOldUI, setUseOldUI] = useState<boolean>(Settings.useOldUI);
  const [show, setShow] = useState<boolean>(Settings.ensureEnable());

  const hide = (ishide: boolean) => {
    setShow(!ishide);
  };

  const refresh = () => {
    setUseOldUI(Settings.useOldUI);
  };

  //listen Settings
  useEffect(() => {
    PluginManager.listenUpdateComponent(
      ComponentName.TAB_ALL,
      [ComponentName.TAB_ALL],
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
      {PluginManager.isIniting() && (
        <PanelSectionRow>
          <SteamSpinner />
        </PanelSectionRow>
      )}
      {PluginManager.isRunning() &&
        (useOldUI ? <ListView /> : <TabView show={show} />)}
      {PluginManager.isError() && (
        <>
          <PanelSectionRow>
            <div style={{ color: "red" }}>
              {`Error: ${PluginManager.getErrorMessage()}`}
            </div>
          </PanelSectionRow>
          <MoreComponent />
        </>
      )}
    </>
  );
};

export default definePlugin(() => {
  try {
    console.log(">>>>>>>>>>>>>>>> Registering plugin PowerControl");
    PluginManager.register();
  } catch (e) {
    console.log("Error while registering plugin", e);
  }

  return {
    title: <div className={staticClasses.Title}>PowerControl</div>,
    titleView: <QuickAccessTitleView title={"PowerControl"} />,
    content: <Content />,
    icon: <FaSuperpowers />,
    onDismount() {
      PluginManager?.unregister();
    },
  };
});
