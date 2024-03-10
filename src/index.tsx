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
  ServerAPI,
  staticClasses,
  SteamSpinner,
} from "decky-frontend-lib";
import { VFC } from "react";
import { FaSuperpowers } from "react-icons/fa";
import { PluginManager } from "./util";
import { GPUComponent, CPUComponent, SettingsComponent, FANComponent, MoreComponent, QuickAccessTitleView } from "./components";

const Content: VFC<{}> = ({ }) => {
  return (
    <div>
      {PluginManager.isIniting() &&
        <PanelSectionRow>
          <SteamSpinner />
        </PanelSectionRow>}
      {!PluginManager.isIniting() &&
        <div>
          <SettingsComponent />
          <CPUComponent />
          <GPUComponent />
          <FANComponent />
          <MoreComponent />
        </div>}
    </div>
  );
};

export default definePlugin((serverAPI: ServerAPI) => {
  try {
    PluginManager.register(serverAPI);
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
    }
  };
});
