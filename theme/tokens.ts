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
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardSoft: '#FAFBFD', // input фоны, әдеттің бос ұяшығы

  // ── Мәтін: қоюдан ашыққа қарай ────────────────────────────────
  ink: '#1A1D2B',
  inkProse: '#2E3346', // ұзын мәтін, рефлексия
  inkBody: '#474D66', // тізім мәтіні, деңгей атауы
  ink2: '#5A607F',
  inkSoft: '#717796',
  inkSeg: '#7A809E', // сегмент — белсенді емес
  inkMuted: '#8D93AC', // subtitle, қосалқы мәтін
  ink3: '#9DA2B8', // .lbl бөлім тақырыбы
  inkFaint: '#B0B5CB', // орындалған тапсырма мәтіні
  ink4: '#C2C7DB',
  inkIcon: '#D0D4E4', // chevron, өшірілген иконка
  inkOut: '#DCE0EE', // көрші айдың күндері

  // ── Жиектер мен бөлгіштер ─────────────────────────────────────
  line: '#EBEEF5',
  lineSoft: '#F3F5FA',
  lineFaint: '#F8F9FC',
  lineField: '#E4E7F0', // ақ түйменің жиегі
  lineBox: '#D8DCE8', // чекбокс жиегі
  lineSwitch: '#E0E3EC', // свитч өшірулі, drag handle
  lineDash: '#D6D8F8', // әдеттер блогының үзік сызығы

  // ── Тректер (прогресс, сегмент, чип) ──────────────────────────
  track: '#ECEEF5',
  trackSeg: '#E5E8F2', // сегмент ауыстырғышының трегі
  trackChip: '#F0F2F8', // бейтарап чип фоны
  trackHabit: '#F3F5FA', // әдеттің орындалмаған ұяшығы

  // ── Акцент шкаласы (Image 1 бойынша #5D65F6 Royal Indigo) ─────
  accent: '#5D65F6',
  accent2: '#6870F8',
  accent3: '#7B82F9',
  accent4: '#949BFA',
  accent5: '#B0B5FC',
  accentDeep: '#4A51E6',
  accentOnDark: '#8E94FA', // қара фондағы акцент (Фокус, Мақсат hero)
  accentSoft: '#C6C9FC', // диаграмманың екінші деңгейі
  accentGlow: '#D8DAFD', // атмосфералық дақ
  accentLine: '#E1E4FD', // жеңіл күлгін-көк жиек, нүкте
  accentLine2: '#E8EAFD',
  accentLine3: '#F0F1FE',

  // ── Тінттер (ашық индиго фондар) ──────────────────────────────
  tint: '#EEF0FE',
  tintSoft: '#F6F7FE',
  tintLine: '#E2E5FD',
  tintChip: '#EBEAFD', // күн белгісінің чипі
  tintRow: '#F3F4FE', // таңдалған жол, планшет навигациясы
  tintToday: '#EFF1FE', // календарьдағы бүгінгі күн
  tintRing: '#ECEEFE', // кіші сақинаның трегі
  tintRing2: '#EFF0FE',
  tintBar: '#EDEFFD', // таймлайн жолағының бос бөлігі
  tintImpact: '#E5E7FD', // рефлексиядағы әсер жолағы

  // ── Пастель түстері (Image 1 карточкалары мен тегтері) ─────────
  pastelLavender: '#EFE6FD',
  pastelLavenderText: '#7C3AED',
  pastelMint: '#E0F8EC',
  pastelMintText: '#15803D',
  pastelButter: '#FEF7CD',
  pastelButterText: '#D97706',
  pastelCoral: '#FDDDE4',
  pastelCoralText: '#BE123C',
  pastelSky: '#E1EDFC',
  pastelSkyText: '#0284C7',
  pastelPeach: '#FDEBD8',
  pastelPeachText: '#C2410C',

  // ── Қара тақырып ──────────────────────────────────────────────
  darkBg: '#131520', // қара карточка (мотивация, серия, hero)
  darkBg0: '#0E1018', // ⚠ Фокус экранының фоны — darkBg-дан бір саты қою
  darkCard: '#181A28',
  darkCard2: '#1C1F30', // Фокус басқару түймесі
  darkLine: '#24273C',
  darkLine2: '#1B1D2C',
  darkLine3: '#363B55', // радио жиегі (Таймлайн)
  darkTrack: '#262940', // прогресс трегі қараңғыда
  darkInk2: '#8E94B5',
  darkInk3: '#6B7092',
  lockGrad: '#252844', // құлып экраны градиентінің басы
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
