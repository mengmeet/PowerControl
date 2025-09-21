import { Module, findModuleChild } from "@decky/ui";
import { SystemInfo } from ".";
import { ReactNode } from "react";
import { FaSuperpowers } from "react-icons/fa";
import { toaster } from "@decky/api";
import { isNil } from 'lodash';

//#region Find SteamOS modules
const findModule = (property: string) => {
  return findModuleChild((m: Module) => {
    if (typeof m !== "object") return undefined;
    for (let prop in m) {
      try {
        if (m[prop][property]) return m[prop];
      } catch {
        return undefined;
      }
    }
  });
};
// @ts-ignore
const NavSoundMap = findModule("ToastMisc");
//#endregion

export interface NotifyProps {
  message: ReactNode;
  title?: ReactNode;
  logo?: ReactNode;
  icon?: ReactNode;
  showToast?: boolean;
  playSound?: boolean;
  sound?: number;
  duration?: number;
}

export class SteamUtils {
  //#region Notification Wrapper
  static async notify({
    title,
    message,
    logo,
    icon,
    showToast,
    playSound,
    sound,
    duration,
  }: NotifyProps) {
    let toastData = {
      title: title || "PowerControl",
      body: message,
      logo: logo,
      icon: icon || <FaSuperpowers />,
      duration: duration,
      sound: sound || NavSoundMap?.ToastMisc,
      playSound: playSound || false,
      showToast: showToast || false,
    };
    toaster.toast(toastData);
  }

  static async simpleToast(message: string, duration?: number) {
    this.notify({ message, showToast: true, duration });
  }
  ;
  static async getSystemInfo(): Promise<SystemInfo> {
    const systemInfo = await SteamClient.System.GetSystemInfo();
    return systemInfo;
  }

  static hasLegacySuspendEvents() {
    if (
      !isNil(SteamClient.System.RegisterForOnResumeFromSuspend) &&
      !isNil(SteamClient.System.RegisterForOnSuspendRequest)
    ) {
      return true;
    }
    return false;
  }

  /**
   * NOTE(ynhhoJ): Those methods was removed on
   * `Steam Deck Beta Client Update: September 17th` update
   */
  static hasSystemSuspendEvents() {
    if (
      !isNil(SteamClient?.System?.RegisterForOnSuspendRequest) &&
      !isNil(SteamClient?.System?.RegisterForOnResumeFromSuspend)
    ) {
      return true;
    }

    return false;
  }

  static hasUserSuspendEvents() {
    if (
      !isNil(SteamClient?.User?.RegisterForPrepareForSystemSuspendProgress) &&
      !isNil(SteamClient?.User?.RegisterForResumeSuspendedGamesProgress)
    ) {
      return true;
    }

    return false;
  }

  static RegisterForOnSuspendRequest(callback: () => void) {
    const hasSystemSuspendEvents = SteamUtils.hasSystemSuspendEvents();
    const hasUserSuspendEvents = SteamUtils.hasUserSuspendEvents();
    if (hasSystemSuspendEvents) {
      return SteamClient.System.RegisterForOnSuspendRequest(callback);
    } else if (hasUserSuspendEvents) {
      return SteamClient.User.RegisterForPrepareForSystemSuspendProgress(callback);
    }
    return null;
  }

  static RegisterForOnResumeFromSuspend(callback: () => void) {
    const hasSystemSuspendEvents = SteamUtils.hasSystemSuspendEvents();
    const hasUserSuspendEvents = SteamUtils.hasUserSuspendEvents();
    if (hasSystemSuspendEvents) {
      return SteamClient.System.RegisterForOnResumeFromSuspend(callback);
    } else if (hasUserSuspendEvents) {
      return SteamClient.User.RegisterForResumeSuspendedGamesProgress(callback);
    }
    return null;
  }
}
