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

// 创建常量对象并导出
export const L = createLocalizeConstants(Object.keys(defaultMessages));

// 导出类型
export type LocalizeStrKey = keyof typeof L;

// 为了向后兼容，保留 localizeStrEnum 名称
export const localizeStrEnum = L;
