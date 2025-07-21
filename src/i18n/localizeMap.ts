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

// 创建一个类型安全的常量生成函数
function createLocalizeConstants<T extends readonly string[]>(keys: T) {
  return keys.reduce((obj, key) => {
    obj[key as keyof typeof obj] = key;
    return obj;
  }, {} as { [K in T[number]]: K });
}

// 定义所有键名
const I18N_KEYS = [
  "TITEL_SETTINGS",
  "ENABLE_SETTINGS",
  "USE_PERGAME_PROFILE",
  "USING",
  "DEFAULT",
  "PROFILE",
  "CPU_BOOST",
  "CPU_BOOST_DESC",
  "HT_DESC",
  "SMT_DESC",
  "CPU_NUM",
  "CPU_NUM_DESC",
  "CPU_MAX_PERF",
  "CPU_MAX_PERF_AUTO",
  "TDP",
  "TDP_DESC",
  "RYZENADJ_NOT_FOUND",
  "WATTS",
  "GPU_FREQMODE",
  "UNLIMITED",
  "FIXED_FREQ",
  "RANGE_FREQ",
  "AUTO_FREQ",
  "GPU_FIX_FREQ",
  "GPU_MIN_FREQ",
  "GPU_MAX_FREQ",
  "FAN_SPEED",
  "CREATE_FAN_PROFILE",
  "GRID_ALIG",
  "FAN_MODE",
  "NOT_CONTROLLED",
  "FIXED",
  "CURVE",
  "SNAP_GRIDLINE",
  "FAN_SPEED_PERCENT",
  "SENSOR_TEMP",
  "CREATE_FAN_PROFILE_TIP",
  "SELECT_FAN_PROFILE_TIP",
  "FAN_PROFILE_NAME",
  "USE",
  "DELETE",
  "CREATE",
  "CANCEL",
  "CURENT_STAT",
  "EDIT",
  "SAVE",
  "NATIVE_FREQ",
  "MORE",
  "REINSTALL_PLUGIN",
  "UPDATE_PLUGIN",
  "ROLLBACK_PLUGIN",
  "INSTALLED_VERSION",
  "LATEST_VERSION",
  "GPU_NATIVE_SLIDER",
  "GPU_NATIVE_SLIDER_DESC",
  "USE_PERACMODE_PROFILE",
  "AC_MODE",
  "BAT_MODE",
  "CUSTOM_TDP_RANGE",
  "RESET_ALL",
  "NATIVE_FREQ_DESC",
  "UNLIMITED_DESC",
  "FIXED_FREQ_DESC",
  "RANGE_FREQ_DESC",
  "AUTO_FREQ_DESC",
  "AUTO_FREQ_TDP_NOTIF",
  "NATIVE_TDP_SLIDER",
  "NATIVE_TDP_SLIDER_DESC",
  "CPU_GOVERNOR",
  "CPU_GOVERNOR_DESC",
  "CPU_EPP",
  "CPU_EPP_DESC",
  "CPU_FREQ_CONTROL",
  "CORE_FREQUENCY",
  "CPU_FREQUENCY",
  "ALL_CORES",
  "MANUAL_BYPASS_CHARGE",
  "MANUAL_BYPASS_CHARGE_DESC",
  "MANUAL_BYPASS_CHARGE_DESC_WITH_LIMIT",
  "CHARGE_LIMIT",
  "CHARGE_LIMIT_DESC",
  "CHARGE_LIMIT_DESC_WITH_BYPASS",
  "USE_OLD_UI",
  "USE_OLD_UI_DESC",
] as const;

// 创建常量对象并导出
export const L = createLocalizeConstants(I18N_KEYS);

// 导出类型
export type LocalizeStrKey = keyof typeof L;

// 为了向后兼容，保留 localizeStrEnum 名称
export const localizeStrEnum = L;
