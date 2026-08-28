/**
 * Forma дизайн токендері.
 *
 * ЕРЕЖЕ: бұл файлдағы әр мән design/*.dc.html макеттерінен көшірілген.
 * Ойдан түс, радиус немесе өлшем ҚОСПАҢЫЗ. Жаңа мән керек болса —
 * алдымен макеттен табыңыз.
 *
 * CLAUDE.md §3-тегі атаулар өзгертілмеген. Қалғаны — макеттерде
 * қолданылған, бірақ спецификацияда болмаған мәндер.
 */

export const color = {
  // ── Фон және беттер ───────────────────────────────────────────
  bg: '#F1F1F7',
  card: '#FFFFFF',
  cardSoft: '#FBFBFD', // input фоны, әдеттің бос ұяшығы

  // ── Мәтін: қоюдан ашыққа қарай ────────────────────────────────
  ink: '#14141B',
  inkProse: '#3A3A52', // ұзын мәтін, рефлексия
  inkBody: '#43435A', // тізім мәтіні, деңгей атауы
  ink2: '#5A5A70',
  inkSoft: '#7A7A92',
  inkSeg: '#7C7C92', // сегмент — белсенді емес
  inkMuted: '#8A8A9E', // subtitle, қосалқы мәтін
  ink3: '#9A9AAE', // .lbl бөлім тақырыбы
  inkFaint: '#A6A6B8', // орындалған тапсырма мәтіні
  ink4: '#B4B4C6',
  inkIcon: '#C4C4D4', // chevron, өшірілген иконка
  inkOut: '#CFCFDC', // көрші айдың күндері

  // ── Жиектер мен бөлгіштер ─────────────────────────────────────
  line: '#ECECF3',
  lineSoft: '#F4F4F9',
  lineFaint: '#F7F7FB',
  lineField: '#E6E6EF', // ақ түйменің жиегі
  lineBox: '#DEDEE9', // чекбокс жиегі
  lineSwitch: '#E2E2EC', // свитч өшірулі, drag handle
  lineDash: '#DEDAF8', // әдеттер блогының үзік сызығы

  // ── Тректер (прогресс, сегмент, чип) ──────────────────────────
  track: '#F0F0F6',
  trackSeg: '#E7E7F0', // сегмент ауыстырғышының трегі
  trackChip: '#F2F2F8', // бейтарап чип фоны
  trackHabit: '#F5F5FA', // әдеттің орындалмаған ұяшығы

  // ── Акцент шкаласы ────────────────────────────────────────────
  accent: '#7A6CF0',
  accent2: '#8B7DF3',
  accent3: '#9A8DF5',
  accent4: '#AA9EF7',
  accent5: '#BDB4FA',
  accentDeep: '#6A59EC',
  accentOnDark: '#A79BF8', // қара фондағы акцент (Фокус, Мақсат hero)
  accentSoft: '#C6BEFB', // диаграмманың екінші деңгейі
  accentGlow: '#C9C0FB', // кіру экранының атмосфералық дағы
  accentLine: '#DCD6FB', // жеңіл күлгін жиек, нүкте
  accentLine2: '#D8D1FB',
  accentLine3: '#E4E0FC',

  // ── Тінттер (ашық күлгін фондар) ──────────────────────────────
  tint: '#EFEDFE',
  tintSoft: '#F7F6FF',
  tintLine: '#EAE6FD',
  tintChip: '#EDEAFE', // күн белгісінің чипі
  tintRow: '#F4F2FE', // таңдалған жол, планшет навигациясы
  tintToday: '#F1EFFE', // календарьдағы бүгінгі күн
  tintRing: '#F0EEFE', // кіші сақинаның трегі
  tintRing2: '#F1F0FE',
  tintBar: '#F0EFFA', // таймлайн жолағының бос бөлігі
  tintImpact: '#E8E5FB', // рефлексиядағы әсер жолағы

  // ── Қара тақырып ──────────────────────────────────────────────
  darkBg: '#14141B', // қара карточка (мотивация, серия, hero)
  darkBg0: '#0F0F16', // ⚠ Фокус экранының фоны — darkBg-дан бір саты қою
  darkCard: '#1A1A24',
  darkCard2: '#1C1C26', // Фокус басқару түймесі
  darkLine: '#26262F',
  darkLine2: '#191921',
  darkLine3: '#3A3A48', // радио жиегі (Таймлайн)
  darkTrack: '#2A2A38', // прогресс трегі қараңғыда
  darkInk2: '#8F8FA8',
  darkInk3: '#6E6E86',
  lockGrad: '#2A2740', // құлып экраны градиентінің басы
} as const;

/**
 * Радиус. Макеттерде жиырма саты кездеседі — бәрі осында.
 * CLAUDE.md §3-тегі бес атау өзгермеген.
 */
export const radius = {
  sheetLg: 30, // төменгі бланканың жоғарғы бұрыштары (Рефлексия)
  sheet: 28, // төменгі бланка (Күнтізбе)
  widget: 26, // iOS виджеті
  cardLg: 24,
  card: 22,
  cardSm: 20,
  cardXs: 18,
  field: 16, // inner
  inner: 16,
  input: 15,
  chip: 14,
  chipSm: 13,
  sm: 12,
  box: 11,
  boxSm: 10,
  boxXs: 9,
  tiny: 8,
  tiny2: 7,
  micro: 6,
  micro2: 5,
  pill: 999,
} as const;

/**
 * Шрифттер — CLAUDE.md §3.
 *
 * ⚠ Макеттегі Manrope мен Unbounded ҚОЛДАНЫЛМАЙДЫ: екеуінде де қазақ
 * әріптері жоқ. Бәрі бір отбасына — Golos Text-ке көшірілді, Caveat
 * өзгеріссіз қалды.
 *
 * .ttf cmap кестесі бойынша тексерілген (npm run check:glyphs):
 *   Golos Text 400–900 — Ә Ғ Қ Ң Ө Ұ Ү Һ І және ₸ ТОЛЫҚ бар
 *   Caveat            — толық бар
 *
 * Ескерту: CLAUDE.md §3 кестесінде Onest «жоқ» деп белгіленген, бірақ
 * тексеріс оны жоққа шығарды — Onest-те де бәрі бар. Бәрібір Golos Text
 * таңдалды: бір отбасы алты салмақты да береді, екі шрифт ұстаудың
 * қажеті қалмайды.
 *
 * Golos Text Manrope-тан сәл кеңірек — сондықтан .lbl тақырыбының
 * letterSpacing мәні 1.3-тен 1.2-ге түсірілді (§3 нұсқауы).
 */
export const font = {
  // ── CLAUDE.md §3 канондық атаулары ──
  display: 'GolosText_800ExtraBold', // үлкен сандар, тақырып, .lbl
  body: 'GolosText_600SemiBold', // дене мәтіні (§3: weight 600)
  semi: 'GolosText_600SemiBold',
  bold: 'GolosText_800ExtraBold', // сан, түйме, бөлім тақырыбы
  black: 'GolosText_900Black', // ең ауыр екпін
  hand: 'Caveat_600SemiBold', // тек «Менің ойларым» экраны

  // ── Қосымша салмақтар ──
  regular: 'GolosText_400Regular',
  prose: 'GolosText_500Medium', // ұзын мәтін, рефлексия
  title: 'GolosText_700Bold', // карточка тақырыбы
  handBold: 'Caveat_700Bold',
} as const;

/**
 * Көлеңкелер.
 *
 * ⚠ Макеттерде көлеңке ЕКІ ҚАБАТТЫ, ал RN iOS бір View-ға бір ғана
 * көлеңке береді. Сондықтан әр нұсқаның `outer` (жұмсақ, кең) және
 * `inner` (тығыз, жақын) бөлігі бар — `<Shadow>` компоненті екеуін
 * қабаттасқан екі View-мен салады. Android-та тек `elevation` жұмыс істейді.
 */
const ios = (opacity: number, radius: number, y: number, colr = '#14142D') => ({
  shadowColor: colr,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
});

export const shadow = {
  /** Үлкен карточка — 0 1px 2px .04 + 0 10px 28px .05 */
  card: {
    outer: { ...ios(0.05, 28, 10), elevation: 3 },
    inner: ios(0.04, 2, 1),
  },
  /** Тізім карточкасы — 0 1px 2px .04 + 0 8px 22px .045 */
  cardSm: {
    outer: { ...ios(0.045, 22, 8), elevation: 2 },
    inner: ios(0.04, 2, 1),
  },
  /** Виджет, тулбар — 0 1px 2px .05 + 0 10px 26px .07 */
  widget: {
    outer: { ...ios(0.07, 26, 10), elevation: 4 },
    inner: ios(0.05, 2, 1),
  },
  /** Күлгін түйме, FAB — 0 8px 20px rgba(122,108,240,.30) */
  float: { ...ios(0.3, 20, 8, '#7A6CF0'), elevation: 6 },
  /** FAB ақ нұсқасы — .22 */
  floatSoft: { ...ios(0.22, 20, 8, '#7A6CF0'), elevation: 5 },
  /** Төменгі бланка — жоғары қарай */
  sheet: { ...ios(0.1, 34, -10), elevation: 12 },
  /** Модаль бланка — 0 -12px 44px rgba(20,20,45,.22) */
  sheetLg: { ...ios(0.22, 44, -12), elevation: 16 },
} as const;

/**
 * Типографика. CLAUDE.md §3-тегі ережелер.
 * letterSpacing RN-де em емес, px — сондықтан fontSize × em есептелген.
 */
export const text = {
  /** Бөлім тақырыбы: 10px / 800 / .13em / uppercase / ink3 */
  lbl: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    color: color.ink3,
  },
  /** Экран атауы хедерде: Unbounded 12–13px / .16em */
  screenTitle: {
    fontFamily: font.display,
    fontSize: 12,
    letterSpacing: 1.92,
  },
  /** Үлкен сан: Unbounded, letterSpacing теріс */
  numberLg: { fontFamily: font.display, fontSize: 40, letterSpacing: -1.6 },
  numberMd: { fontFamily: font.display, fontSize: 32, letterSpacing: -1.28 },
  numberSm: { fontFamily: font.display, fontSize: 22, letterSpacing: -0.66 },
  /** Негізгі мәтін */
  body: { fontFamily: font.body, fontSize: 12.5, color: color.ink },
  prose: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: color.inkProse },
  /** Диаграмма белгісі — ең кіші рұқсат етілген өлшем */
  micro: { fontFamily: font.bold, fontSize: 8, color: color.ink4 },
} as const;

/** Экран шеттері: макеттерде 20px тұрақты */
export const gutter = 20;

/**
 * Оқуға арналған контенттің ең үлкен ені.
 *
 * Макеттер 390pt-қа сызылған. Кең экранда мазмұнды шеттен шетке созса
 * жол тым ұзын болып, оқылмай қалады. Сондықтан Бүгін, Жыл, Мақсат,
 * Жаңа мақсат, Профиль және Кіру экрандары осы енмен ортада тұрады.
 *
 * ⚠ Күнтізбенің планшет/ПК нұсқасы бұған БАҒЫНБАЙДЫ — ондағы үш панель
 * әдейі бүкіл енді алады.
 */
export const contentMaxWidth = 560;

/**
 * Панель ені. Басты бет — оқу бағаны емес, есеп тақтасы: 560-қа сыйғызсақ
 * төрт сан бір қатарға түспейді, диаграмма мен кесте қысылады. Сондықтан
 * ол күнтізбенің кең нұсқасы сияқты бөлек енмен жүреді.
 */
export const dashboardMaxWidth = 1120;

/** Кең экранда панельді ортаға қоятын дайын стиль */
export const dashboardCentered = {
  width: '100%' as const,
  maxWidth: dashboardMaxWidth,
  alignSelf: 'center' as const,
};

/** Кең экранда контентті ортаға қоятын дайын стиль */
export const centered = {
  width: '100%' as const,
  maxWidth: contentMaxWidth,
  alignSelf: 'center' as const,
};

/** Планшет/десктоп бөлу нүктесі */
export const tabletBreakpoint = 900;

/** Төменгі навигацияның биіктігі (safe area-сыз) */
export const navHeight = 78;
