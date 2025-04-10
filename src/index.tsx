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
import { FC, useState } from "react";
import { FaFan, FaLayerGroup, FaSuperpowers } from "react-icons/fa";
import { Backend, PluginManager, Settings } from "./util";
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

const TabView: FC<{}> = ({}) => {
  const [currentTabRoute, setCurrentTabRoute] = useState<string>(
    Settings.currentTabRoute
  );

  const updateCurrentTabRoute = (route: string) => {
    setCurrentTabRoute(route);
    Settings.currentTabRoute = route;
  };

  const [supportChargeLimit, _] = useState<boolean>(
    Backend.data.getIsSupportChargeLimit()
  );

  const [isSupportSoftwareChargeLimit, __] = useState<boolean>(
    Backend.data.isSupportSoftwareChargeLimit()
  );

  const [showPowerTab, ___] = useState<boolean>(
    supportChargeLimit || isSupportSoftwareChargeLimit
  );

  return (
    <>
      <style>
        {`
.main-tabs > div > div:first-child::before {
  background: #0D141C;
  box-shadow: none;
  backdrop-filter: none;
}
`}
      </style>
      <SettingsComponent />
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
                      <PiLightningFill size={20} style={{ display: "block" }} />
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
    </>
  );
};
const Content: FC<{}> = ({}) => {
  return (
    <>
      {PluginManager.isIniting() && (
        <PanelSectionRow>
          <SteamSpinner />
        </PanelSectionRow>
      )}
      {PluginManager.isRunning() && <TabView />}
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
