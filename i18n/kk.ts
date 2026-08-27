/**
 * Forma — барлық қазақ мәтіні.
 *
 * ЕРЕЖЕ (CLAUDE.md §9): компонент ішінде қатқыл жазылған мәтін БОЛМАЙДЫ.
 * Әр жол осы файлдан келеді. Макеттегі формулировка сақталған —
 * «жоспарыма қаншалықты әрекет жасадым» деген тон.
 */

// ─────────────────────────────────────────────────────────────
// Күнтізбе атаулары
// ─────────────────────────────────────────────────────────────

/** Толық ай атаулары (ілік септік — «25 тамыз» түрінде) */
export const months = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
] as const;

/** Бас әріппен — экран тақырыбына («ТАМЫЗ 2026») */
export const monthsUpper = [
  'ҚАҢТАР', 'АҚПАН', 'НАУРЫЗ', 'СӘУІР', 'МАМЫР', 'МАУСЫМ',
  'ШІЛДЕ', 'ТАМЫЗ', 'ҚЫРКҮЙЕК', 'ҚАЗАН', 'ҚАРАША', 'ЖЕЛТОҚСАН',
] as const;

/** Диаграмма белгісі — 3 әріп (Архив, Жыл, Таймлайн) */
export const monthsShort = [
  'Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау',
  'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел',
] as const;

/**
 * Бір әріпті ай белгісі — Жыл экранындағы 12 бағанды тор.
 * ⚠ Бірмәнді емес: Қ төрт рет, М екі рет кездеседі.
 * Сондықтан тек баған астындағы белгі ретінде, ені тар жерде ғана
 * қолданылады. Бөлек тұрса `monthsShort` алыңыз.
 */
export const monthsLetter = [
  'Қ', 'А', 'Н', 'С', 'М', 'М', 'Ш', 'Т', 'Қ', 'Қ', 'Қ', 'Ж',
] as const;

/** Апта дүйсенбіден басталады (CLAUDE.md §9) */
export const weekdaysShort = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жк'] as const;

export const weekdaysLong = [
  'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі', 'жексенбі',
] as const;

/** Планшет календары — толық атау бас әріппен */
export const weekdaysFull = [
  'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі', 'Жексенбі',
] as const;

// ─────────────────────────────────────────────────────────────
// Экран мәтіндері
// ─────────────────────────────────────────────────────────────

export const kk = {
  app: {
    name: 'FORMA',
    tagline: 'ЖЫЛ · АЙ · АПТА · КҮН',
  },

  /** Период ауыстырғышы — Бүгін, Күнтізбе экрандарында */
  period: {
    day: 'КҮН',
    week: 'АПТА',
    month: 'АЙ',
    year: 'ЖЫЛ',
  },

  nav: {
    today: 'Бүгін',
    calendar: 'Күнтізбе',
    week: 'Апта',
    month: 'Ай',
    year: 'Жыл',
    archive: 'Архив',
    time: 'Уақыт есебі',
    notes: 'Менің ойларым',
    deadlines: 'Мерзімдер',
    settings: 'Баптау',
    profile: 'Профиль',
  },

  signIn: {
    headline: 'Үлкен мақсат бүгінгі\nбір ғана әрекеттен басталады',
    apple: 'Apple ID арқылы кіру',
    email: 'Email арқылы кіру',
    sync: 'Бір аккаунт — iPhone, iPad, Mac',
  },

  today: {
    motto: 'МЕНІҢ СӨЗІМ',
    goalsCard: 'Мақсат бойынша орындалу',
    ringLabel: 'КҮН',
    habits: 'Әдеттер',
    /** Бұл белгі әдейі көрінеді — жүйенің басты ережесі */
    habitsExcluded: 'ПАЙЫЗҒА КІРМЕЙДІ',
  },

  year: {
    title: 'Жылдық орындалу',
    pace: 'Орташа қарқын',
    goals: 'Жылдық мақсаттар',
    byMonth: 'Айлар бойынша',
    more: 'Толығырақ →',
    /** {done} — алда келе жатқан мақсат саны, {behind} — артта қалғаны */
    summary: '{total} мақсаттың {ahead}-еуі алда, {behind}-еуі артта. Әрқайсысының өз мерзімі бар.',
    fromGoals: '{n} мақсаттан',
    /** Уақыт емес, жоспар бойынша керек мән */
    plannedLabel: 'Керек еді {pct}%',
    actualLabel: 'Орындалды {pct}%',
  },

  goal: {
    title: 'МАҚСАТ',
    stages: 'Кезеңдер',
    byMonth: 'Айлық бөлу',
    addMonth: '+ Ай қосу',
    current: 'АҒЫМДАҒЫ',
    completed: 'орындалды',
    daysLeft: '{n} күн қалды',
    redistribute: 'Қайта тарату',
    lastReflection: 'Соңғы рефлексия · {date}',
    /** «Керек еді 65% · 7% артта» */
    needed: 'Керек еді {planned}%',
    behind: '{n}% артта',
    ahead: '{n}% алда',
    onTrack: 'жоспармен тең',
  },

  goalNew: {
    title: 'ЖАҢА МАҚСАТ',
    what: 'Не істегім келеді',
    deadline: 'Мерзім',
    deadlineHint: 'Жыл соңы болуы міндетті емес',
    amount: 'Көлемі',
    distribution: 'Автоматты тарату',
    perWeek: 'АПТАСЫНА',
    perDay: '≈ {n} мин / күн',
    splitInto: '{n} айға бөлінеді · {note}',
    daysWeeksLeft: '{days} күн · {weeks} апта қалды',
    note: 'Мерзімді кейін де өзгертуге болады — жүктеме автоматты түрде қайта таралады.',
    create: 'Мақсатты құру',
    terms: {
      m3: '3 ай',
      m6: '6 ай',
      yearEnd: 'Жыл соңы',
      custom: 'Өз күнім',
    },
    curves: {
      even: 'Біркелкі',
      front: 'Басында',
      back: 'Соңында',
    },
    curveNotes: {
      even: 'біркелкі',
      front: 'басында қарқынды',
      back: 'соңына қарай күшейеді',
    },
  },

  calendar: {
    /** {date} — «25 тамыз, сейсенбі» */
    dayHeader: '{date} · {n} тапсырма',
    donePct: '{pct}% орындалды',
    addTask: '{date}-ға тапсырма қосу',
    newTask: 'Жаңа тапсырма',
    taskLabel: 'Тапсырма',
    taskPlaceholder: 'Не істеу керек?',
    time: 'Уақыт',
    noTime: 'Уақытсыз',
    whichGoal: 'Қай мақсатқа жатады',
    repeat: 'Қайталау',
    /** Бланка ашық тұрғанда календарь жоғарыда қалады — §7.1 */
    changeDateHint: 'Күнді ауыстыру үшін жоғарыдағы календарьды басыңыз',
    add: '{date} қосу',
    repeats: {
      once: 'Бір рет',
      daily: 'Күн сайын',
      weekly: 'Апта сайын',
    },
  },

  week: {
    title: '{n}-АПТА',
    tasks: 'Апталық тапсырмалар',
    spread: 'Күндерге тарату',
    spreadDone: 'Күндерге таратылған',
    left: 'ҚАЛДЫ',
    daysLeft: '{n} күн',
    taskCount: '{done}/{total} тапсырма',
    dayCount: '{done}/{total} күн',
  },

  weekReview: {
    title: 'АПТА ҚОРЫТЫНДЫСЫ',
    done: 'Орындалды',
    slipped: 'Қалып қойды',
    whatNext: 'Қалып қойғанын не істейміз?',
    move: 'Көшіру',
    drop: 'Жабу',
    fromMonth: '{n}-аптаға {month} мақсатынан',
    selected: '{n} таңдалды',
    lessonPlaceholder: 'Осы аптаның басты сабағы не болды?',
    close: 'Аптаны жабу және {n}-аптаны бастау',
    prevWeek: 'Өткен аптада {pct}% болатын',
  },

  reflection: {
    doneAt: 'Орындалды · {time}',
    /** Қосымшаның ең мотивациялық тұсы — §7.4 */
    impact: 'Бұл қай мақсаттарды жылжытты',
    howWasIt: 'Қалай өтті?',
    comment: 'Коментарий',
    commentPlaceholder: 'Не жақсы өтті? Не кедергі болды? Келесі жолы нені өзгертесің?',
    /** §7.5 — фокус деректері таймерсіз де жиналуы үшін */
    howLong: 'Қанша уақыт кетті?',
    later: 'Кейін',
    save: 'Сақтау және жабу',
    moods: ['Қиын', 'Орташа', 'Жақсы', 'Керемет'] as const,
    quickTags: ['Фокус жақсы', 'Уақыт жетпеді', 'Қайталау керек'] as const,
    durations: ['30 мин', '1 сағат', '2 сағат', 'Өзім жазамын'] as const,
  },

  habits: {
    title: 'ӘДЕТТЕР',
    mine: 'Менің әдеттерім',
    longestStreak: 'ЕҢ ҰЗАҚ ҮЗІЛІССІЗ СЕРИЯ',
    daysInRow: 'күн қатарынан',
    today: 'БҮГІН',
    doneToday: '{done}/{total} орындалды',
    consistency: '{month}ДАҒЫ ТҰРАҚТЫЛЫҚ',
    days30: '30 КҮН',
    /** Бұл мәтін экранда тұрады — жүйенің философиясы */
    explainer:
      'Әдеттер мақсат пайызына қосылмайды. Бұл — жететін нәтиже емес, қанға сіңетін күнделікті рефлекс.',
  },

  focus: {
    title: 'ФОКУС',
    currentTask: 'Ағымдағы тапсырма',
    duration: 'Сессия ұзақтығы',
    running: 'ФОКУСТА',
    paused: 'КІДІРТІЛДІ',
    elapsed: '{pct}% өтті',
    todayTotal: 'Бүгін фокуста',
    hours: 'сағат',
    fullReport: 'Толық есеп',
    attribution: 'Бұл сессияның уақыты «{goal}» мақсатына жазылады',
  },

  time: {
    title: 'УАҚЫТ',
    ranges: { day: 'Күн', week7: '7 күн', month: 'Ай' },
    byGoal: 'Мақсаттар бойынша',
    average: 'ОРТАША',
    tapHint: 'Бағанды басып, бөлшектеп көріңіз',
    tapAgainHint: 'Бағанды қайта бассаңыз — жалпы есеп',
    byHour: 'Сағат бойынша',
    byDay: 'Күн бойынша',
    byWeek: 'Апта бойынша',
    other: 'Басқа',
    perHour: 'сағатына',
    perDay: 'күніне',
    perWeek: 'аптасына',
  },

  archive: {
    title: 'АРХИВ',
    monthly: 'Ай сайынғы орындалу',
    average: 'орт. {pct}%',
    filters: ['Бәрі', 'Жыл', 'Ай', 'Апта', 'Күн'] as const,
    stats: {
      tasks: 'Аяқталған\nтапсырма',
      reflections: 'Жазылған\nрефлексия',
      average: 'Орташа\nорындалу',
    },
  },

  motto: {
    title: 'МОТИВАЦИЯ',
    preview: 'Басты бетте осылай көрінеді',
    everyOpen: 'ӘР АШҚАН САЙЫН КӨРІНЕДІ',
    rotate: 'Күн сайын кезекпен ауыссын',
    rotateHint: 'Әр таңда келесі сөз шығады',
    mine: 'Менің сөздерім',
    onHome: 'БАСТЫ БЕТТЕ',
    add: 'Өз сөзімді қосу',
  },

  notes: {
    title: 'МЕНІҢ ОЙЛАРЫМ',
    tools: {
      text: 'Мәтін',
      pen: 'Қалам',
      marker: 'Маркер',
      eraser: 'Өшіргіш',
    },
  },

  widgets: {
    title: 'ВИДЖЕТ ЖӘНЕ ЕСКЕРТУ',
    lockScreen: 'Құлып экраны',
    homeSmall: 'Басты экран · шағын',
    homeMedium: 'Басты экран · орташа',
    styles: ['Пайыз', 'Тапсырма', 'Мотивация'] as const,
    reminders: 'Ескертулер',
    next: 'Келесі: {task} — {time}',
    doneOf: '{done}/{total} тапсырма орындалды',
    alerts: {
      morning: { name: 'Таңғы жоспар', sub: 'Күн сайын 07:00' },
      task: { name: 'Тапсырма уақыты', sub: 'Әр тапсырманың уақытында' },
      evening: { name: 'Кешкі рефлексия', sub: 'Күн сайын 22:00' },
      weekly: { name: 'Апта қорытындысы', sub: 'Жексенбі 20:00' },
    },
  },

  /** Мерзімдер таймлайны — тек планшет/десктоп */
  timeline: {
    title: 'Мерзімдер',
    subtitle: 'Әр мақсаттың өз мерзімі бар — жыл соңы болуы міндетті емес',
    legendDone: 'Орындалды',
    legendNeeded: 'Керек еді',
    redistribute: 'ҚАЙТА ТАРАТУ',
    left: 'ҚАЛДЫ',
    update: 'Жоспарды жаңарту',
    spreadHint: 'Таңдағаныңыз апта мен күн деңгейіне автоматты түрде таралады',
    /** §5.3 — үш шешім */
    options: {
      harder: 'Қарқынды күшейту',
      keep: 'Қарқынды сақтау',
      moveDeadline: 'Мерзімді жылжыту',
      pullDeadline: 'Мерзімді жақындату',
      reduce: 'Көлемді азайту',
      enlarge: 'Көлемді ұлғайту',
    },
    /** locked кезең кездескенде — §5.3 */
    lockedWarning:
      '{stage}-кезең {n} аптаға ұзарды. {locked} {date}-да бекітілген. {next} {from} күннен {to} күнге қысқарады.',
  },

  cascade: {
    title: 'Мақсат каскады',
    allGoals: 'Барлық мақсаттар · бір мақсатты таңдап, тізбегін көріңіз',
    focused: '{goal} — тізбек бойынша',
    streak: 'Үзіліссіз серия',
    days: 'күн',
    syncAll: 'Барлық құрылғыда синхрон',
    dueSoon: 'Мерзімі жақын',
  },

  common: {
    today: 'Бүгін',
    cancel: 'Болдырмау',
    save: 'Сақтау',
    delete: 'Жою',
    edit: 'Өңдеу',
    add: 'Қосу',
    done: 'Дайын',
    weekN: '{n}-апта',
    /** Желі жоқ кезде — CLAUDE.md §10.4 */
    offline: 'Желі жоқ. Өзгерістер сақталды, байланыс қалпына келгенде жіберіледі.',
    empty: 'Әзірге бос',
    loadError: 'Деректі жүктеу мүмкін болмады. Қайта көріңіз.',
    retry: 'Қайталау',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Форматтау көмекшілері (CLAUDE.md §9)
// ─────────────────────────────────────────────────────────────

/** Жіңішке бөлгіш — «5 000 000 ₸» дегендегі бос орын */
const NBSP = ' ';

/** `5000000` → `5 000 000 ₸` */
export function formatTenge(n: number): string {
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}₸`;
}

/** `84.2` → `84,2` — ондық бөлшек ҮТІР арқылы */
export function formatDecimal(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',');
}

/** `3150000` → `3,15 млн ₸` */
export function formatMillions(n: number): string {
  return `${formatDecimal(n / 1_000_000, 2)}${NBSP}млн${NBSP}₸`;
}

/** `255` → `4 сағ 15 мин`, `45` → `45 мин`, `120` → `2 сағ` */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} сағ`;
  return `${h} сағ ${m} мин`;
}

/** `255` → `4:15` — таймер мен компакт есеп үшін */
export function formatClock(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** `{n}` сияқты орындарды толтырады: t(kk.week.title, { n: 34 }) */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

/** `2026-08-25` → `25 тамыз` */
export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** `2026-08-25` → `25 тамыз, сейсенбі` */
export function formatDayMonthWeekday(d: Date): string {
  // getDay(): 0 = жексенбі. Апта дүйсенбіден басталады.
  const idx = (d.getDay() + 6) % 7;
  return `${formatDayMonth(d)}, ${weekdaysLong[idx]}`;
}

/** `2026-08-25` → `31 жел` түріндегі қысқа мерзім белгісі */
export function formatDueShort(d: Date): string {
  return `${d.getDate()} ${monthsShort[d.getMonth()].toLowerCase()}`;
}
