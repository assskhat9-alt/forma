/**
 * 0-фаза: дизайн жүйесінің тексеру экраны.
 *
 * Бұл БҮГІН экраны емес — ол 1-фазада design/Main.dc.html бойынша жазылады.
 * Мұнда токендер, шрифттер және қайталанатын компоненттер нақты құрылғыда
 * дұрыс көрінетінін тексереміз. Ең бастысы — қазақ әріптері.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter } from '../../theme/tokens';
import { kk, formatTenge, formatDecimal, formatMinutes } from '../../i18n/kk';
import {
  Card,
  DarkCard,
  DashedCard,
  SectionLabel,
  ProgressRing,
  ProgressBar,
  Checkbox,
  HabitCell,
  Chip,
  PaceBadge,
  CollapsibleSegments,
  Toggle,
} from '../../components/ui';
import {
  MenuIcon, BellIcon, StarIcon, ChatIcon, QuoteIcon, SearchIcon,
  PlusIcon, CloseIcon, ClockIcon, InfoIcon, PencilIcon, ResetIcon,
  PlayIcon, MailIcon, CheckIcon, ChevronRightIcon,
} from '../../components/icons';

const PERIODS = [kk.period.day, kk.period.week, kk.period.month, kk.period.year] as const;

/** Барлық қазақ әрпі — шрифт тексерісі */
const ALPHABET = 'Ә Ғ Қ Ң Ө Ұ Ү Һ І · ә ғ қ ң ө ұ ү һ і · ₸';

export default function DesignCheck() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState(0);
  const [segOpen, setSegOpen] = useState(true);
  const [done, setDone] = useState([true, true, false, false]);
  const [hab, setHab] = useState([true, false, true, false, true]);
  const [rotate, setRotate] = useState(false);

  const doneCount = done.filter(Boolean).length;
  const pct = Math.round((doneCount / done.length) * 100);

  const toggleTask = (i: number) =>
    setDone((prev) => prev.map((v, k) => (k === i ? !v : v)));
  const toggleHab = (i: number) =>
    setHab((prev) => prev.map((v, k) => (k === i ? !v : v)));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* хедер */}
      <View style={styles.header}>
        <MenuIcon size={22} />
        <Text style={styles.wordmark}>{kk.app.name}</Text>
        <BellIcon size={22} />
      </View>

      <View style={styles.body}>
        {/* ── шрифт тексерісі ── */}
        <SectionLabel>Шрифт тексерісі</SectionLabel>
        <Card style={styles.pad}>
          <Text style={styles.alphabet}>{ALPHABET}</Text>
          <Text style={styles.alphabetNote}>
            Жоғарыдағы әріптердің бірде-бірі төртбұрышқа айналмауы керек.
            Unbounded пен Manrope дәл осы әріптерді көтермегендіктен
            Onest пен Montserrat-қа ауыстырылды.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.displaySample}>42%</Text>
          <Text style={styles.titleSample}>Ағылшын тілін C1 деңгейіне жеткізу</Text>
          <Text style={styles.proseSample}>
            «Тыңдалым жақсарды, бірақ сөйлеу артта. Келесі аптада күніне
            20 минут дауыстап сөйлеуді қосу керек.»
          </Text>
          <View style={styles.rowWrap}>
            <Text style={styles.money}>{formatTenge(5_000_000)}</Text>
            <Text style={styles.money}>{formatDecimal(84.2)} кг</Text>
            <Text style={styles.money}>{formatMinutes(255)}</Text>
          </View>
        </Card>

        {/* ── период ауыстырғышы ── */}
        <SectionLabel style={styles.gap}>Жиналмалы период ауыстырғышы</SectionLabel>
        <CollapsibleSegments
          items={PERIODS}
          index={period}
          onChange={setPeriod}
          open={segOpen}
          onToggleOpen={() => setSegOpen((v) => !v)}
          maxWidth={250}
        />

        {/* ── мотивация: қара карточка ── */}
        <DarkCard style={[styles.pad, styles.gap]} radius={R.cardXs}>
          <QuoteIcon size={20} color={C.accent2} />
          <Text style={styles.mottoLabel}>{kk.today.motto}</Text>
          <Text style={styles.motto}>
            «Мен армандаған адам — бүгін тұрып жасайтын адам.»
          </Text>
        </DarkCard>

        {/* ── сақина + жолақтар ── */}
        <SectionLabel style={styles.gap}>{kk.today.goalsCard}</SectionLabel>
        <Card style={styles.pad}>
          <View style={styles.ringRow}>
            <ProgressRing
              pct={pct}
              size={100}
              strokeWidth={10}
              label={kk.today.ringLabel}
              numberSize={22}
            />
            <View style={styles.levels}>
              {[
                { name: 'Апта', pct: 62, c: C.accent },
                { name: 'Тамыз', pct: 55, c: C.accent3 },
                { name: '2026 жыл', pct: 42, c: C.accent5 },
              ].map((lv) => (
                <View key={lv.name} style={{ gap: 4 }}>
                  <View style={styles.levelHead}>
                    <View style={styles.levelName}>
                      <View style={[styles.dot, { backgroundColor: lv.c }]} />
                      <Text style={styles.levelText}>{lv.name}</Text>
                    </View>
                    <Text style={styles.levelPct}>{lv.pct}%</Text>
                  </View>
                  <ProgressBar pct={lv.pct} color={lv.c} height={4} />
                </View>
              ))}
            </View>
          </View>

          {/* «керек еді» маркері бар жолақ */}
          <View style={styles.divider} />
          <SectionLabel style={{ marginBottom: 10 }}>Жоспар маркері</SectionLabel>
          <ProgressBar pct={58} plannedPct={65} height={10} />
          <View style={styles.rowBetween}>
            <Text style={styles.legendAccent}>Орындалды 58%</Text>
            <Text style={styles.legendMuted}>Керек еді 65%</Text>
          </View>

          {/* тапсырмалар */}
          <View style={styles.divider} />
          {[
            { t: 'Таңғы жаттығу — 5 км', time: '06:30', goal: 'Дене · 78 кг' },
            { t: 'Ағылшын тыңдалым, 45 мин', time: '08:00', goal: 'Ағылшын C1' },
            { t: 'Жобаның авторизациясы', time: '14:00', goal: 'Жеке жоба' },
            { t: '20 бет оқу', time: '21:00', goal: '12 кітап' },
          ].map((task, i) => (
            <View key={task.t} style={styles.taskRow}>
              <Checkbox checked={done[i]!} onToggle={() => toggleTask(i)} size={22} />
              <View style={{ flexGrow: 1, flexShrink: 1 }}>
                <Text
                  style={[
                    styles.taskTitle,
                    done[i] && { color: C.inkFaint, textDecorationLine: 'line-through' },
                  ]}
                >
                  {task.t}
                </Text>
                <View style={styles.taskMeta}>
                  <Text style={styles.taskTime}>{task.time}</Text>
                  <View style={styles.metaDot} />
                  <Chip label={task.goal} size="sm" />
                </View>
              </View>
              {done[i] && <ChatIcon size={15} color={C.accent} />}
            </View>
          ))}
        </Card>

        {/* ── әдеттер: үзік сызық, пайызға кірмейді ── */}
        <DashedCard style={[styles.padSm, styles.gap]}>
          <View style={styles.rowBetween}>
            <View style={styles.habHead}>
              <SectionLabel>{kk.today.habits}</SectionLabel>
              <Chip label={kk.today.habitsExcluded} tone="flat" size="sm" />
            </View>
            <Text style={styles.habCount}>
              {hab.filter(Boolean).length}/{hab.length}
            </Text>
          </View>
          <View style={styles.habRow}>
            {['Ерте тұру', 'Су', 'Медитация', 'Экрансыз', 'Күнделік'].map((n, i) => (
              <View key={n} style={styles.habCol}>
                <HabitCell done={hab[i]!} onToggle={() => toggleHab(i)} />
                <Text style={[styles.habLabel, hab[i] && { color: C.accentDeep }]}>{n}</Text>
              </View>
            ))}
          </View>
        </DashedCard>

        {/* ── қарқын белгілері ── */}
        <SectionLabel style={styles.gap}>Қарқын белгісі</SectionLabel>
        <Card level="cardSm" radius={R.cardSm} style={styles.padSm}>
          <View style={styles.rowWrap}>
            <PaceBadge gap={10} />
            <PaceBadge gap={-2} />
            <PaceBadge gap={-7} />
            <PaceBadge gap={-38} />
          </View>
          <Text style={styles.hint}>
            −20%-тан өткенде белгі қараяды. Ереже Zhyl.dc.html пен
            Taimlain.dc.html макеттерінен алынған.
          </Text>
        </Card>

        {/* ── чиптер мен ауыстырғыш ── */}
        <SectionLabel style={styles.gap}>Чиптер</SectionLabel>
        <Card level="cardSm" radius={R.cardSm} style={styles.padSm}>
          <View style={styles.rowWrap}>
            <Chip label="Ағылшын C1" />
            <Chip label="Дене · 78 кг" tone="flat" />
            <Chip label="Бәрі" tone="dark" />
            <Chip label="Өз күнім" tone="outline" />
          </View>
          <View style={[styles.rowBetween, { marginTop: 14 }]}>
            <Text style={styles.toggleLabel}>{kk.motto.rotate}</Text>
            <Toggle value={rotate} onChange={setRotate} />
          </View>
        </Card>

        {/* ── иконкалар ── */}
        <SectionLabel style={styles.gap}>Иконкалар</SectionLabel>
        <Card level="cardSm" radius={R.cardSm} style={styles.padSm}>
          <View style={styles.iconGrid}>
            {[MenuIcon, BellIcon, SearchIcon, PlusIcon, CloseIcon, CheckIcon,
              StarIcon, ChatIcon, ClockIcon, InfoIcon, PencilIcon, MailIcon,
              ResetIcon, ChevronRightIcon].map((Icon, i) => (
              <View key={i} style={styles.iconCell}>
                <Icon size={20} color={C.ink2} />
              </View>
            ))}
            <View style={styles.iconCell}>
              <PlayIcon size={20} color={C.ink2} />
            </View>
          </View>
        </Card>

        {/* ── сақина өлшемдері ── */}
        <SectionLabel style={styles.gap}>Сақина өлшемдері</SectionLabel>
        <Card level="cardSm" radius={R.cardSm} style={styles.padSm}>
          <View style={styles.ringSizes}>
            <ProgressRing pct={40} size={34} strokeWidth={4} numberSize={10} showPercentSign={false} />
            <ProgressRing pct={58} size={44} strokeWidth={5} numberSize={11} showPercentSign={false} />
            <ProgressRing pct={75} size={64} strokeWidth={6} numberSize={14} />
            <ProgressRing pct={62} size={84} strokeWidth={9} numberSize={19} />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 10,
  },
  wordmark: { fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink },
  body: { paddingHorizontal: gutter, gap: 10 },
  gap: { marginTop: 18 },
  pad: { padding: 17 },
  padSm: { padding: 15 },

  alphabet: { fontFamily: font.title, fontSize: 17, color: C.ink, letterSpacing: 0.5, lineHeight: 28 },
  alphabetNote: { fontFamily: font.prose, fontSize: 12, color: C.ink3, marginTop: 8, lineHeight: 18 },
  displaySample: { fontFamily: font.display, fontSize: 40, letterSpacing: -1.6, color: C.ink },
  titleSample: { fontFamily: font.title, fontSize: 15, color: C.ink, marginTop: 6, letterSpacing: -0.2 },
  proseSample: { fontFamily: font.prose, fontSize: 12.5, color: C.inkProse, marginTop: 8, lineHeight: 19 },
  money: { fontFamily: font.display, fontSize: 15, color: C.ink },

  divider: { height: 1, backgroundColor: C.lineSoft, marginVertical: 14 },

  mottoLabel: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.44, color: C.accent2, marginTop: 10 },
  motto: { fontFamily: font.title, fontSize: 15, color: '#FFFFFF', marginTop: 6, lineHeight: 21 },

  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  levels: { flexGrow: 1, flexShrink: 1, gap: 9 },
  levelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelName: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  levelText: { fontFamily: font.body, fontSize: 11.5, color: C.inkBody },
  levelPct: { fontFamily: font.bold, fontSize: 11.5, color: C.ink },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 },
  legendAccent: { fontFamily: font.title, fontSize: 11, color: C.accent },
  legendMuted: { fontFamily: font.title, fontSize: 11, color: C.darkInk3 },

  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 },
  taskTitle: { fontFamily: font.body, fontSize: 12.5, color: C.ink, letterSpacing: -0.12 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  taskTime: { fontFamily: font.title, fontSize: 9.5, color: C.inkFaint },
  metaDot: { width: 3, height: 3, borderRadius: 999, backgroundColor: C.lineSwitch },

  habHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  habCount: { fontFamily: font.bold, fontSize: 11, color: C.accent },
  habRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  habCol: { flexGrow: 1, flexShrink: 1, alignItems: 'center', gap: 5 },
  habLabel: { fontFamily: font.bold, fontSize: 8, color: C.inkFaint },

  hint: { fontFamily: font.prose, fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 17 },
  toggleLabel: { fontFamily: font.title, fontSize: 13, color: C.ink },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconCell: {
    width: 44, height: 44, borderRadius: R.sm,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.tintSoft,
  },

  ringSizes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
});
