/**
 * Forma — Тіл таңдау және контекст жүйесі (i18n).
 *
 * Қазақша (kk) және Орысша (ru) арасында ауыстыру,
 * AsyncStorage арқылы таңдауды сақтау және бүкіл қосымшаға тарату.
 */
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kk, months as monthsKk, monthsUpper as monthsUpperKk, weekdaysShort as weekdaysShortKk, weekdaysLong as weekdaysLongKk, formatDayMonth as formatDayMonthKk, formatDayMonthWeekday as formatDayMonthWeekdayKk, t as tKk } from './kk';
import { ru, monthsRu, monthsUpperRu, weekdaysShortRu, weekdaysLongRu, formatDayMonthRu, formatDayMonthWeekdayRu } from './ru';

export type Language = 'kk' | 'ru';

export const LANGUAGE_STORAGE_KEY = 'forma_user_language_choice';

type I18nContextValue = {
  lang: Language;
  setLang: (l: Language) => Promise<void>;
  isKk: boolean;
  isRu: boolean;
  strings: typeof kk;
  months: readonly string[];
  monthsUpper: readonly string[];
  weekdaysShort: readonly string[];
  weekdaysLong: readonly string[];
  formatDayMonth: (d: Date) => string;
  formatDayMonthWeekday: (d: Date) => string;
  t: (template: string, vars: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

let currentGlobalLang: Language = 'kk';
export function getGlobalLang(): Language {
  return currentGlobalLang;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('kk');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'kk' || saved === 'ru') {
          setLangState(saved);
          currentGlobalLang = saved;
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setLang = async (newLang: Language) => {
    setLangState(newLang);
    currentGlobalLang = newLang;
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {}
  };

  const value = useMemo<I18nContextValue>(() => {
    const isKk = lang === 'kk';
    const strings = (isKk ? kk : ru) as unknown as typeof kk;

    return {
      lang,
      setLang,
      isKk,
      isRu: !isKk,
      strings,
      months: isKk ? monthsKk : monthsRu,
      monthsUpper: isKk ? monthsUpperKk : monthsUpperRu,
      weekdaysShort: isKk ? weekdaysShortKk : weekdaysShortRu,
      weekdaysLong: isKk ? weekdaysLongKk : weekdaysLongRu,
      formatDayMonth: isKk ? formatDayMonthKk : formatDayMonthRu,
      formatDayMonthWeekday: isKk ? formatDayMonthWeekdayKk : formatDayMonthWeekdayRu,
      t: tKk,
    };
  }, [lang]);

  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: 'kk',
      setLang: async () => {},
      isKk: true,
      isRu: false,
      strings: kk,
      months: monthsKk,
      monthsUpper: monthsUpperKk,
      weekdaysShort: weekdaysShortKk,
      weekdaysLong: weekdaysLongKk,
      formatDayMonth: formatDayMonthKk,
      formatDayMonthWeekday: formatDayMonthWeekdayKk,
      t: tKk,
    };
  }
  return ctx;
}
