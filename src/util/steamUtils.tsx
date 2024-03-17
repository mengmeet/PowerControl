import { Module, findModuleChild } from "decky-frontend-lib";
import { Backend } from ".";
import { ReactNode } from "react";
import { FaSuperpowers } from "react-icons/fa";

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
    Backend.getServerAPI().toaster.toast(toastData);
  }

  static async simpleToast(message: string, duration?: number) {
    this.notify({ message, showToast: true, duration });
  }
}
