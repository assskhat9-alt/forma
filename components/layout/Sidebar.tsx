/**
 * Бүйір навигация — Dropify стиліндегі заманауи дизайн.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, router } from 'expo-router';
import { color as C, radius as R, font } from '../../theme/tokens';
import { signOut } from '../../lib/supabase';
import { useSession } from '../../lib/auth';
import { useI18n } from '../../i18n/context';
import { LangSwitcher } from '../ui';
import {
  DiamondIcon, QuoteIcon, HomeIcon, CalendarIcon, ClockIcon,
  BarChartIcon, CheckIcon, FilterIcon, BookmarkIcon,
  QuoteIcon as QuoteNav, PencilIcon, LogOutIcon, ChevronRightIcon,
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
  const { session, isAdmin } = useSession();
  const { strings: S } = useI18n();

  const userEmail = session?.user?.email ?? 'demo@forma.kz';
  const userName = userEmail.split('@')[0] ?? 'User';
  const initial = userName.charAt(0).toUpperCase();

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

  return (
    <View
      style={[
        styles.root,
        { width, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.brand}>
        <View style={styles.brandIconBox}>
          <DiamondIcon size={18} color="#FFFFFF" />
        </View>
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

      <View style={{ flexGrow: 1, minHeight: 12 }} />
      {motto ? (
        <View style={styles.motto}>
          <QuoteIcon size={14} color={C.accent2} />
          <Text style={styles.mottoLabel}>{S.today.motto}</Text>
          <Text style={styles.mottoText} numberOfLines={2}>
            {motto}
          </Text>
        </View>
      ) : null}
      <View style={styles.divider} />
      <View style={styles.foot}>
        <Pressable
          onPress={() => router.navigate('/profile' as never)}
          style={styles.userCard}
          accessibilityRole="button"
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{initial}</Text>
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            <Text style={styles.userSub} numberOfLines={1}>
              {isAdmin ? S.nav.admin : 'Алматы, KZ'}
            </Text>
          </View>
          <Pressable onPress={() => void signOut()} hitSlop={8}>
            <LogOutIcon size={16} color={C.ink3} strokeWidth={2} />
          </Pressable>
        </Pressable>

        <View style={styles.bottomControls}>
          <View style={styles.themePill}>
            <View style={styles.themeActive}>
              <Text style={styles.themeActiveText}>Light</Text>
            </View>
            <Text style={styles.themeInactiveText}>Dark</Text>
          </View>

          <LangSwitcher compact />
        </View>
      </View>
    </View>
  );
}

function NavRow({
  item,
  active,
}: {
  item: Item;
  active: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.navigate(item.href as never)}
      style={[styles.item, active && styles.itemOn]}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
    >
      <item.Icon
        size={18}
        color={active ? '#FFFFFF' : C.ink2}
        strokeWidth={active ? 2.4 : 1.8}
      />
      <Text
        style={[styles.itemText, { color: active ? '#FFFFFF' : C.ink2 }]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <View style={{ flexGrow: 1 }} />
      {active ? (
        <ChevronRightIcon size={14} color="#FFFFFF" strokeWidth={2.4} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderRightColor: C.line,
    paddingHorizontal: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontFamily: font.display, fontSize: 16, letterSpacing: 1.5, color: C.ink },

  groupLabel: {
    marginTop: 14,
    marginBottom: 5,
    paddingHorizontal: 12,
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.ink3,
  },
  groupBody: { gap: ITEM_GAP },

  home: { marginTop: 18 },
  foot: { gap: 10 },
  divider: { height: 1, backgroundColor: C.lineSoft, marginVertical: 10, marginHorizontal: 4 },

  item: {
    height: ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  itemOn: {
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  itemText: { fontFamily: font.title, fontSize: 13.5, flexShrink: 1 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.bg,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' },
  userName: { fontFamily: font.title, fontSize: 13, color: C.ink },
  userSub: { fontFamily: font.body, fontSize: 10.5, color: C.ink3 },

  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E222E',
    borderRadius: 20,
    padding: 3,
  },
  themeActive: {
    backgroundColor: '#323748',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  themeActiveText: { fontFamily: font.bold, fontSize: 11, color: '#FFFFFF' },
  themeInactiveText: {
    fontFamily: font.body,
    fontSize: 11,
    color: '#8A8F9E',
    paddingHorizontal: 8,
  },

  motto: {
    backgroundColor: C.darkBg,
    borderRadius: R.cardXs,
    padding: 12,
    overflow: 'hidden',
  },
  mottoLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.44,
    color: C.accent2,
    marginTop: 6,
  },
  mottoText: {
    fontFamily: font.title,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#FFFFFF',
    marginTop: 4,
  },
});
