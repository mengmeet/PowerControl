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
} from "@decky/ui";
import { FC } from "react";
import { FaSuperpowers } from "react-icons/fa";
import { PluginManager } from "./util";
import {
  GPUComponent,
  CPUComponent,
  SettingsComponent,
  FANComponent,
  MoreComponent,
  QuickAccessTitleView,
  PowerComponent,
} from "./components";

const Content: FC<{}> = ({ }) => {
  return (
    <>
      {PluginManager.isIniting() && (
        <PanelSectionRow>
          <SteamSpinner />
        </PanelSectionRow>
      )}
      {PluginManager.isRunning() && (
        <>
          <SettingsComponent />
          <CPUComponent />
          <GPUComponent />
          <PowerComponent />
          <FANComponent />
          <MoreComponent />
        </>
      )}
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
