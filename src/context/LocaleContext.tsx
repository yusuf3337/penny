import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../locales/translations.json';
import { OVERRIDES } from '../locales/overrides';
import { DEFAULT_LABELS } from '../locales/defaultLabels';

export type AppLanguage = 'tr' | 'en' | 'de' | 'fr' | 'ko' | 'zh' | 'ja' | 'ru' | 'it';
export type LanguagePreference = AppLanguage | 'system';

export const LANGUAGE_OPTIONS: { code: AppLanguage; name: string }[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '简体中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ru', name: 'Русский' },
  { code: 'it', name: 'Italiano' },
];

const languageNames: Record<AppLanguage, Record<AppLanguage, string>> = {
  tr: { tr: 'Türkçe', en: 'İngilizce', de: 'Almanca', fr: 'Fransızca', ko: 'Korece', zh: 'Çince', ja: 'Japonca', ru: 'Rusça', it: 'İtalyanca' },
  en: { tr: 'Turkish', en: 'English', de: 'German', fr: 'French', ko: 'Korean', zh: 'Chinese', ja: 'Japanese', ru: 'Russian', it: 'Italian' },
  de: { tr: 'Türkisch', en: 'Englisch', de: 'Deutsch', fr: 'Französisch', ko: 'Koreanisch', zh: 'Chinesisch', ja: 'Japanisch', ru: 'Russisch', it: 'Italienisch' },
  fr: { tr: 'Turc', en: 'Anglais', de: 'Allemand', fr: 'Français', ko: 'Coréen', zh: 'Chinois', ja: 'Japonais', ru: 'Russe', it: 'Italien' },
  ko: { tr: '튀르키예어', en: '영어', de: '독일어', fr: '프랑스어', ko: '한국어', zh: '중국어', ja: '일본어', ru: '러시아어', it: '이탈리아어' },
  zh: { tr: '土耳其语', en: '英语', de: '德语', fr: '法语', ko: '韩语', zh: '中文', ja: '日语', ru: '俄语', it: '意大利语' },
  ja: { tr: 'トルコ語', en: '英語', de: 'ドイツ語', fr: 'フランス語', ko: '韓国語', zh: '中国語', ja: '日本語', ru: 'ロシア語', it: 'イタリア語' },
  ru: { tr: 'Турецкий', en: 'Английский', de: 'Немецкий', fr: 'Французский', ko: 'Корейский', zh: 'Китайский', ja: 'Японский', ru: 'Русский', it: 'Итальянский' },
  it: { tr: 'Turco', en: 'Inglese', de: 'Tedesco', fr: 'Francese', ko: 'Coreano', zh: 'Cinese', ja: 'Giapponese', ru: 'Russo', it: 'Italiano' },
};
export const getLanguageName = (code: AppLanguage, inLanguage: AppLanguage): string => languageNames[inLanguage][code];

const STORAGE_KEY = '@penny_language_preference_v1';
const supported = new Set<AppLanguage>(LANGUAGE_OPTIONS.map((option) => option.code));
const localeTags: Record<AppLanguage, string> = {
  tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', ko: 'ko-KR',
  zh: 'zh-CN', ja: 'ja-JP', ru: 'ru-RU', it: 'it-IT',
};

const deviceLanguage = (): AppLanguage => {
  const iosSettings = Platform.OS === 'ios' ? NativeModules.SettingsManager?.settings : undefined;
  const deviceLocale = iosSettings?.AppleLanguages?.[0]
    ?? iosSettings?.AppleLocale
    ?? Intl.DateTimeFormat().resolvedOptions().locale;
  const code = typeof deviceLocale === 'string'
    ? deviceLocale.toLowerCase().split(/[-_]/)[0] as AppLanguage
    : undefined;
  return code && supported.has(code) ? code : 'en';
};

let activeLanguage: AppLanguage = deviceLanguage();
export const getActiveLanguage = (): AppLanguage => activeLanguage;
export const getFormattingLocale = (): string => localeTags[activeLanguage];

const dictionary = translations as Record<string, Record<string, string>>;
export const localize = (source: string, language: AppLanguage = activeLanguage): string => {
  if (language === 'tr' || !source.trim()) return source;
  const key = source.replace(/\s+/g, ' ').trim();
  const code = language === 'zh' ? 'zh-CN' : language;
  const translated = DEFAULT_LABELS[language]?.[key] ?? OVERRIDES[code]?.[key] ?? dictionary[code]?.[key]
    ?? OVERRIDES.en?.[key] ?? dictionary.en?.[key];
  if (!translated) return source;
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
};

export const localizeFormat = (source: string, values: Array<string | number>, language: AppLanguage = activeLanguage): string =>
  localize(source, language).replace(/\{(\d+)\}/g, (match, index: string) =>
    values[Number(index)] === undefined ? match : String(values[Number(index)]));

export const localizeTransactionTitle = (title: string, language: AppLanguage = activeLanguage): string => {
  for (const suffix of [' · Ortak Harcama Tahsilatı', ' Ortak Harcama Payı']) {
    if (title.endsWith(suffix)) {
      return `${title.slice(0, -suffix.length)}${suffix.startsWith(' · ') ? ' · ' : ' '}${localize(suffix.trim().replace(/^·\s*/, ''), language)}`;
    }
  }
  return title;
};

interface LocaleContextValue {
  language: AppLanguage;
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => Promise<void>;
  t: (source: string) => string;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, updatePreference] = useState<LanguagePreference>('system');
  const [systemLanguage, updateSystemLanguage] = useState<AppLanguage>(deviceLanguage);
  const language = preference === 'system' ? systemLanguage : preference;
  activeLanguage = language;

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'system' || (stored && supported.has(stored as AppLanguage))) {
        updatePreference(stored as LanguagePreference);
      }
    });
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') updateSystemLanguage(deviceLanguage());
    });
    return () => listener.remove();
  }, []);

  const setPreference = async (value: LanguagePreference) => {
    await AsyncStorage.setItem(STORAGE_KEY, value);
    updatePreference(value);
    if (value === 'system') updateSystemLanguage(deviceLanguage());
  };

  return <LocaleContext.Provider value={{ language, preference, setPreference, t: (source) => localize(source, language) }}>
    {children}
  </LocaleContext.Provider>;
};

export const useLocale = (): LocaleContextValue => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
};
