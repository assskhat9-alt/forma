/**
 * Бүйір навигация — планшет пен ПК.
 *
 * Каскад деңгейлері (Бүгін · Апта · Ай · Жыл) «ЖОСПАРЛАР» тобына жиналған:
 * бұлар бөлек бөлімдер емес, бір ғана нәрсенің төрт масштабы. Пайызы
 * қасында тұрады — қай деңгейде артта қалғаныңыз бірден көрінеді.
 *
 * Қалғаны (Күнтізбе, Архив, Профиль) — бөлек құралдар, топқа кірмейді.
 *
 * Телефонда бұның орнына төменгі жолақ тұрады (BottomNav).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { DiamondIcon, QuoteIcon, ChevronUpIcon } from '../icons';

type Item = {
  name: string;
  href: string;
  /** Каскад деңгейінің орындалу пайызы */
  pct?: number;
};

/** Топ ішіндегі бір жолдың биіктігі — жиналу анимациясы осыған сүйенеді */
const ITEM_H = 38;
const ITEM_GAP = 3;

/**
 * ⚠ Мұнда пайыз КӨРСЕТІЛМЕЙДІ. Макетте сандар тұрған, бірақ олар
 * иллюстрация еді. Бүйір мәзір — навигация, есеп тақтасы емес:
 * жалған сан көрсеткеннен ештеңе көрсетпеген артық.
 */
const PLAN_ITEMS: Item[] = [
  { name: kk.nav.today, href: '/' },
  { name: kk.nav.year, href: '/goals' },
];

const TOOL_ITEMS: Item[] = [
  { name: kk.nav.calendar, href: '/calendar' },
  { name: kk.nav.focus, href: '/focus' },
  { name: kk.nav.profile, href: '/profile' },
];

const GROUP_H = PLAN_ITEMS.length * ITEM_H + (PLAN_ITEMS.length - 1) * ITEM_GAP;

export function Sidebar({ width = 232, motto }: { width?: number; motto?: string }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const t = useSharedValue(1);

  useEffect(() => {
    t.value = withTiming(open ? 1 : 0, {
      duration: 260,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [open, t]);

  const group = useAnimatedStyle(() => ({
    height: t.value * GROUP_H,
    opacity: t.value,
  }));

  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(1 - t.value) * 180}deg` }],
  }));

  const isOn = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  /** Топ ішіндегі бір деңгей активті ме — жиналған күйде де көрінсін */
  const activeLevel = PLAN_ITEMS.find((i) => isOn(i.href));

  return (
    <View
      style={[
        styles.root,
        { width, paddingTop: insets.top + 26, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.brand}>
        <DiamondIcon size={26} color={C.accent} />
        <Text style={styles.wordmark}>{kk.app.name}</Text>
      </View>

      {/* ── ЖОСПАРЛАР тобы ── */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.groupHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.groupLabel}>{kk.nav.plans}</Text>
        {!open && activeLevel ? (
          <Text style={styles.groupHint}>{activeLevel.name}</Text>
        ) : null}
        <View style={{ flexGrow: 1 }} />
        <Animated.View style={chevron}>
          <ChevronUpIcon size={12} color={C.ink4} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.groupClip, group]}>
        <View style={styles.groupBody}>
          {PLAN_ITEMS.map((it) => (
            <NavRow key={it.href} item={it} active={isOn(it.href)} indent />
          ))}
        </View>
      </Animated.View>

      <View style={styles.divider} />

      {/* ── Бөлек құралдар ── */}
      <View style={styles.tools}>
        {TOOL_ITEMS.map((it) => (
          <NavRow key={it.href} item={it} active={isOn(it.href)} />
        ))}
      </View>

      <View style={{ flexGrow: 1 }} />

      {motto ? (
        <View style={styles.motto}>
          <QuoteIcon size={16} color={C.accent2} />
          <Text style={styles.mottoLabel}>{kk.today.motto}</Text>
          <Text style={styles.mottoText}>{motto}</Text>
        </View>
      ) : null}
    </View>
  );
}

function NavRow({ item, active, indent = false }: { item: Item; active: boolean; indent?: boolean }) {
  return (
    <Pressable
      onPress={() => router.navigate(item.href as never)}
      style={[
        styles.item,
        indent && { paddingLeft: 16 },
        active && { backgroundColor: C.tintRow },
      ]}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.dot, { backgroundColor: active ? C.accent : C.lineSwitch }]} />
      <Text style={[styles.itemText, { color: active ? C.ink : C.darkInk3 }]}>{item.name}</Text>
      <View style={{ flexGrow: 1 }} />
      {item.pct != null && (
        <Text style={[styles.pct, { color: active ? C.accent : C.ink4 }]}>{item.pct}%</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexShrink: 0,
    backgroundColor: C.card,
    borderRightWidth: 1,
    borderRightColor: C.line,
    paddingHorizontal: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  wordmark: { fontFamily: font.display, fontSize: 15, letterSpacing: 2.4, color: C.ink },

  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 8,
    paddingHorizontal: 12,
    minHeight: 24,
  },
  groupLabel: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: C.ink3,
  },
  groupHint: { fontFamily: font.title, fontSize: 11, color: C.accent },
  groupClip: { overflow: 'hidden' },
  groupBody: { gap: ITEM_GAP },

  divider: { height: 1, backgroundColor: C.lineSoft, marginVertical: 12, marginHorizontal: 6 },
  tools: { gap: ITEM_GAP },

  item: {
    height: ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    borderRadius: R.chipSm,
  },
  dot: { width: 7, height: 7, borderRadius: 999 },
  itemText: { fontFamily: font.title, fontSize: 13 },
  pct: { fontFamily: font.bold, fontSize: 11 },

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
