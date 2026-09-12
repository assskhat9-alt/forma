/**
 * Бүйір навигация — планшет пен ПК.
 *
 * Құрылымы: жоғарыда сөзбелгі, ортасында иконкалы навигация, астында
 * бөлек топ — Профиль мен Шығу. Екеуінің ортасында мотивация карточкасы:
 * қара, панельдегі жалғыз түсті нәрсе.
 *
 * «Басты бет» — топтан тыс, ең жоғарғы жол: ол жоспардың бір деңгейі
 * емес, бүкіл жүйенің кіреберісі. «ЖОСПАРЛАР» тобында каскад
 * деңгейлері ғана тұрады.
 *
 * Телефонда бұның орнына төменгі жолақ тұрады (BottomNav).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, router } from 'expo-router';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { signOut } from '../../lib/supabase';
import { useSession } from '../../lib/auth';
import {
  DiamondIcon,
  QuoteIcon,
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  BarChartIcon,
  CheckIcon,
  FilterIcon,
  BookmarkIcon,
  QuoteIcon as QuoteNav,
  PencilIcon,
  UserIcon,
  LogOutIcon,
  ShieldIcon,
  type IconProps,
} from '../icons';

type Item = {
  name: string;
  href: string;
  Icon: (p: IconProps) => React.ReactElement;
};

/** Бір жолдың биіктігі */
const ITEM_H = 40;
const ITEM_GAP = 2;

/** Топтан тыс, ең жоғарғы жол — панельдің кіреберісі */
const HOME: Item = { name: kk.nav.home, href: '/', Icon: HomeIcon };

/**
 * ⚠ Мұнда пайыз КӨРСЕТІЛМЕЙДІ. Макетте сандар тұрған, бірақ олар
 * иллюстрация еді. Бүйір мәзір — навигация, есеп тақтасы емес:
 * жалған сан көрсеткеннен ештеңе көрсетпеген артық.
 */
const GROUPS: { label: string; items: Item[] }[] = [
  {
    // Жоспар — не істеймін деген сұрақ
    label: kk.nav.plans,
    items: [
      { name: kk.nav.year, href: '/goals', Icon: DiamondIcon },
      { name: kk.nav.calendar, href: '/calendar', Icon: CalendarIcon },
      { name: kk.nav.weekly, href: '/week', Icon: FilterIcon },
    ],
  },
  {
    // Құрал — қалай істеймін деген сұрақ
    label: kk.nav.tools,
    items: [
      { name: kk.nav.focus, href: '/focus', Icon: ClockIcon },
      { name: kk.nav.habits, href: '/habits', Icon: CheckIcon },
      { name: kk.nav.time, href: '/time', Icon: BarChartIcon },
      { name: kk.nav.motivation, href: '/motivation', Icon: QuoteNav },
      { name: kk.nav.myNotes, href: '/notes', Icon: PencilIcon },
      { name: kk.nav.archive, href: '/archive', Icon: BookmarkIcon },
    ],
  },
];

/** Төменгі тұрақты топ — навигация емес, аккаунт */
const FOOT_ITEMS: Item[] = [
  { name: kk.nav.profile, href: '/profile', Icon: UserIcon },
];

export function Sidebar({ width = 232, motto }: { width?: number; motto?: string }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isAdmin } = useSession();

  const isOn = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <View
      style={[
        styles.root,
        { width, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 18 },
      ]}
    >
      <View style={styles.brand}>
        <DiamondIcon size={24} color={C.accent} />
        <Text style={styles.wordmark}>{kk.app.name}</Text>
      </View>

      <View style={styles.home}>
        <NavRow item={HOME} active={isOn(HOME.href)} />
      </View>

      {/*
        ⚠ Топтар ЖИНАЛМАЙДЫ. Бұрын жиналатын, бірақ ішінде бір ғана жол
        болатын — жинаудың да, ашудың да мәні жоқ еді. Енді әр топта
        бірнеше жол бар да, олар әрқашан көрініп тұрады.
      */}
      {GROUPS.map((g) => (
        <View key={g.label}>
          <Text style={styles.groupLabel}>{g.label}</Text>
          <View style={styles.groupBody}>
            {g.items.map((it) => (
              <NavRow key={it.href} item={it} active={isOn(it.href)} />
            ))}
          </View>
        </View>
      ))}

      <View style={{ flexGrow: 1, minHeight: 16 }} />

      {motto ? (
        <View style={styles.motto}>
          <QuoteIcon size={16} color={C.accent2} />
          <Text style={styles.mottoLabel}>{kk.today.motto}</Text>
          <Text style={styles.mottoText} numberOfLines={3}>
            {motto}
          </Text>
        </View>
      ) : null}

      {/* ── Аккаунт — навигациядан сызықпен бөлінген ── */}
      <View style={styles.divider} />

      <View style={styles.foot}>
        {isAdmin ? (
          <NavRow
            item={{ name: kk.nav.admin, href: '/admin', Icon: ShieldIcon }}
            active={isOn('/admin')}
            muted
          />
        ) : null}
        {FOOT_ITEMS.map((it) => (
          <NavRow key={it.href} item={it} active={isOn(it.href)} muted />
        ))}

        <Pressable
          onPress={() => void signOut()}
          style={styles.item}
          accessibilityRole="button"
        >
          <LogOutIcon size={18} color={C.ink3} strokeWidth={2} />
          <Text style={[styles.itemText, { color: C.ink3 }]}>{kk.nav.signOut}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NavRow({
  item,
  active,
  muted = false,
}: {
  item: Item;
  active: boolean;
  muted?: boolean;
}) {
  const tone = active ? C.ink : muted ? C.ink3 : C.ink2;

  return (
    <Pressable
      onPress={() => router.navigate(item.href as never)}
      style={[styles.item, active && styles.itemOn]}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
    >
      <item.Icon size={18} color={active ? C.accent : tone} strokeWidth={2} />
      <Text style={[styles.itemText, { color: tone }]} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={{ flexGrow: 1 }} />
      {active ? <View style={styles.mark} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderRightColor: C.line,
    paddingHorizontal: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  wordmark: { fontFamily: font.display, fontSize: 15, letterSpacing: 2.4, color: C.ink },

  groupLabel: {
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: C.ink3,
  },
  groupBody: { gap: ITEM_GAP },

  home: { marginTop: 22 },
  foot: { gap: ITEM_GAP },
  divider: { height: 1, backgroundColor: C.lineSoft, marginVertical: 12, marginHorizontal: 6 },

  item: {
    height: ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: R.chipSm,
  },
  itemOn: { backgroundColor: C.tintRow },
  itemText: { fontFamily: font.title, fontSize: 13.5, flexShrink: 1 },
  /** Активті жолдың оң жақ белгісі — түске сенбейтін екінші сигнал */
  mark: { width: 4, height: 4, borderRadius: 999, backgroundColor: C.accent },

  motto: {
    backgroundColor: C.darkBg,
    borderRadius: R.cardXs,
    padding: 15,
    overflow: 'hidden',
  },
  mottoLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.44,
    color: C.accent2,
    marginTop: 8,
  },
  mottoText: {
    fontFamily: font.title,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#FFFFFF',
    marginTop: 7,
  },
});
