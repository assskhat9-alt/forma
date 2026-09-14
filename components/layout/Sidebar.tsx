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
import { useI18n } from '../../i18n/context';
import { LangSwitcher } from '../ui';
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

const ITEM_H = 40;
const ITEM_GAP = 2;

export function Sidebar({ width = 232, motto }: { width?: number; motto?: string }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isAdmin } = useSession();
  const { strings: S } = useI18n();

  const isOn = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const homeItem: Item = { name: S.nav.home, href: '/', Icon: HomeIcon };

  const groups: { label: string; items: Item[] }[] = [
    {
      label: S.nav.plans,
      items: [
        { name: S.nav.year, href: '/goals', Icon: DiamondIcon },
        { name: S.nav.calendar, href: '/calendar', Icon: CalendarIcon },
        { name: S.nav.weekly, href: '/week', Icon: FilterIcon },
      ],
    },
    {
      label: S.nav.tools,
      items: [
        { name: S.nav.focus, href: '/focus', Icon: ClockIcon },
        { name: S.nav.habits, href: '/habits', Icon: CheckIcon },
        { name: S.nav.time, href: '/time', Icon: BarChartIcon },
        { name: S.nav.motivation, href: '/motivation', Icon: QuoteNav },
        { name: S.nav.myNotes, href: '/notes', Icon: PencilIcon },
        { name: S.nav.archive, href: '/archive', Icon: BookmarkIcon },
      ],
    },
  ];

  const footItems: Item[] = [
    { name: S.nav.profile, href: '/profile', Icon: UserIcon },
  ];

  return (
    <View
      style={[
        styles.root,
        { width, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 18 },
      ]}
    >
      <View style={styles.brand}>
        <DiamondIcon size={24} color={C.accent} />
        <Text style={styles.wordmark}>{S.app.name}</Text>
      </View>

      <View style={styles.home}>
        <NavRow item={homeItem} active={isOn(homeItem.href)} />
      </View>

      {groups.map((g) => (
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
          <Text style={styles.mottoLabel}>{S.today.motto}</Text>
          <Text style={styles.mottoText} numberOfLines={3}>
            {motto}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.foot}>
        <View style={{ marginBottom: 10, alignItems: 'flex-start' }}>
          <LangSwitcher compact />
        </View>
        {isAdmin ? (
          <NavRow
            item={{ name: S.nav.admin, href: '/admin', Icon: ShieldIcon }}
            active={isOn('/admin')}
            muted
          />
        ) : null}
        {footItems.map((it) => (
          <NavRow key={it.href} item={it} active={isOn(it.href)} muted />
        ))}

        <Pressable
          onPress={() => void signOut()}
          style={styles.item}
          accessibilityRole="button"
        >
          <LogOutIcon size={18} color={C.ink3} strokeWidth={2} />
          <Text style={[styles.itemText, { color: C.ink3 }]}>{S.nav.signOut}</Text>
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
