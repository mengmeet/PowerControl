import * as schinese from "./schinese.json";
import * as tchinese from "./tchinese.json";
import * as english from "./english.json";
import * as german from "./german.json";
import * as japanese from "./japanese.json";
import * as koreana from "./koreana.json";
import * as thai from "./thai.json";
import * as bulgarian from "./bulgarian.json";
import * as italian from "./italian.json";
import * as french from "./french.json";

export interface LanguageProps {
  label: string;
  strings: any;
  credit: string[];
  locale: string;
}

export const defaultLanguage = "english";
export const defaultLocale = "en";
export const defaultMessages = english;

export const localizeMap: { [key: string]: LanguageProps } = {
  schinese: {
    label: "简体中文",
    strings: schinese,
    credit: ["yxx"],
    locale: "zh-CN",
  },
  tchinese: {
    label: "繁體中文",
    strings: tchinese,
    credit: [],
    locale: "zh-TW",
  },
  english: {
    label: "English",
    strings: english,
    credit: [],
    locale: "en",
  },
  german: {
    label: "Deutsch",
    strings: german,
    credit: ["dctr"],
    locale: "de",
  },
  japanese: {
    label: "日本語",
    strings: japanese,
    credit: [],
    locale: "ja",
  },
  koreana: {
    label: "한국어",
    strings: koreana,
    credit: [],
    locale: "ko",
  },
  thai: {
    label: "ไทย",
    strings: thai,
    credit: [],
    locale: "th",
  },
  bulgarian: {
    label: "Български",
    strings: bulgarian,
    credit: [],
    locale: "bg",
  },
  italian: {
    label: "Italiano",
    strings: italian,
    credit: [],
    locale: "it",
  },
  french: {
    label: "Français",
    strings: french,
    credit: [],
    locale: "fr",
  },
};

export enum localizeStrEnum {
  TITEL_SETTINGS = "TITEL_SETTINGS",
  ENABLE_SETTINGS = "ENABLE_SETTINGS",
  USE_PERGAME_PROFILE = "USE_PERGAME_PROFILE",
  USING = "USING",
  DEFAULT = "DEFAULT",
  PROFILE = "PROFILE",
  CPU_BOOST = "CPU_BOOST",
  CPU_BOOST_DESC = "CPU_BOOST_DESC",
  SMT_DESC = "SMT_DESC",
  CPU_NUM = "CPU_NUM",
  CPU_NUM_DESC = "CPU_NUM_DESC",
  TDP = "TDP",
  TDP_DESC = "TDP_DESC",
  RYZENADJ_NOT_FOUND = "RYZENADJ_NOT_FOUND",
  WATTS = "WATTS",
  GPU_FREQMODE = "GPU_FREQMODE",
  UNLIMITED = "UNLIMITED",
  FIXED_FREQ = "FIXED_FREQ",
  RANGE_FREQ = "RANGE_FREQ",
  AUTO_FREQ = "AUTO_FREQ",
  GPU_FIX_FREQ = "GPU_FIX_FREQ",
  GPU_MIN_FREQ = "GPU_MIN_FREQ",
  GPU_MAX_FREQ = "GPU_MAX_FREQ",
  FAN_SPEED = "FAN_SPEED",
  CREATE_FAN_PROFILE = "CREATE_FAN_PROFILE",
  GRID_ALIG = "GRID_ALIG",
  FAN_MODE = "FAN_MODE",
  NOT_CONTROLLED = "NOT_CONTROLLED",
  FIXED = "FIXED",
  CURVE = "CURVE",
  SNAP_GRIDLINE = "SNAP_GRIDLINE",
  FAN_SPEED_PERCENT = "FAN_SPEED_PERCENT",
  SENSOR_TEMP = "SENSOR_TEMP",
  CREATE_FAN_PROFILE_TIP = "CREATE_FAN_PROFILE_TIP",
  SELECT_FAN_PROFILE_TIP = "SELECT_FAN_PROFILE_TIP",
  FAN_PROFILE_NAME = "FAN_PROFILE_NAME",
  USE = "USE",
  DELETE = "DELETE",
  CREATE = "CREATE",
  CANCEL = "CANCEL",
  CURENT_STAT = "CURENT_STAT",
  EDIT = "EDIT",
  SAVE = "SAVE",
  NATIVE_FREQ = "NATIVE_FREQ",

  MORE = "MORE",
  REINSTALL_PLUGIN = "REINSTALL_PLUGIN",
  UPDATE_PLUGIN = "UPDATE_PLUGIN",
  INSTALLED_VERSION = "INSTALLED_VERSION",
  LATEST_VERSION = "LATEST_VERSION",

  GPU_NATIVE_SLIDER = "GPU_NATIVE_SLIDER",
  GPU_NATIVE_SLIDER_DESC = "GPU_NATIVE_SLIDER_DESC",

  USE_PERACMODE_PROFILE = "USE_PERACMODE_PROFILE",
  AC_MODE = "AC_MODE",
  BAT_MODE = "BAT_MODE",

  CUSTOM_TDP_RANGE = "CUSTOM_TDP_RANGE",

  RESET_ALL = "RESET_ALL",

  NATIVE_FREQ_DESC = "NATIVE_FREQ_DESC",
  UNLIMITED_DESC = "UNLIMITED_DESC",
  FIXED_FREQ_DESC = "FIXED_FREQ_DESC",
  RANGE_FREQ_DESC = "RANGE_FREQ_DESC",
  AUTO_FREQ_DESC = "AUTO_FREQ_DESC",
  AUTO_FREQ_TDP_NOTIF = "AUTO_FREQ_TDP_NOTIF",

  FORCE_SHOW_TDP = "FORCE_SHOW_TDP",
  FORCE_SHOW_TDP_DESC = "FORCE_SHOW_TDP_DESC"
}
