/**
 * Үш өлшемді макет.
 *
 * CLAUDE.md §2-де тек екеуі бар (`>= 900px` — планшет). Үшінші саты
 * ноутбук/ПК үшін қосылды: планшетте орын тығыз, ал 1280px-тен кейін
 * күн панелі мен бланканы ҚАТАР көрсетуге орын жетеді.
 *
 *   phone    < 900     iPhone, тік планшет
 *   tablet   900–1279  iPad (1194×834 — макеттің өлшемі)
 *   desktop  ≥ 1280    ноутбук, ПК, iPad Pro көлденең
 */
import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export const TABLET_MIN = 900;
export const DESKTOP_MIN = 1280;

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  if (width >= DESKTOP_MIN) return 'desktop';
  if (width >= TABLET_MIN) return 'tablet';
  return 'phone';
}

/** Бүйір панель бар ма — телефонда төменгі навигация, қалғанында sidebar */
export function useHasSidebar(): boolean {
  return useBreakpoint() !== 'phone';
}

/**
 * Календарь экранының өлшемдері — үш сатының әрқайсысына.
 *
 * Планшет мәндері KuntizbePlanshet.dc.html макетінен дәл алынған:
 * календарь 642 → 562, күн панелі 260 → 0, бланка 0 → 340.
 *
 * Десктопта календарь икемді, ал күн панелі бланка ашылғанда ЖОҒАЛМАЙДЫ —
 * үшеуі қатар тұрады. Планшетте оған орын жетпейді.
 */
export function calendarLayout(bp: Breakpoint, adding: boolean) {
  if (bp === 'desktop') {
    return {
      sidebar: 260,
      calendarWidth: undefined as number | undefined, // flex — қалған орынды алады
      dayWidth: 300,
      dayVisible: true, // бланка ашылса да қалады
      formWidth: adding ? 380 : 0,
      gap: 18,
    };
  }
  if (bp === 'tablet') {
    return {
      sidebar: 232,
      calendarWidth: adding ? 562 : 642,
      dayWidth: adding ? 0 : 260,
      dayVisible: !adding,
      formWidth: adding ? 340 : 0,
      gap: 16,
    };
  }
  // Телефон: панельдер жоқ, тор жиырылады
  return {
    sidebar: 0,
    calendarWidth: undefined,
    dayWidth: 0,
    dayVisible: false,
    formWidth: 0,
    gap: 0,
  };
}
