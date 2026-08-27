/**
 * Бүйір навигация — планшет пен ПК.
 *
 * Телефонда бұның орнына төменгі жолақ тұрады (BottomNav).
 * Макетте ені 232px; ПК-де 260px — атаулар кеңірек отырсын.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, router } from 'expo-router';

import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { DiamondIcon, QuoteIcon } from '../icons';

type Item = { name: string; href: string };

/**
 * Бүйір мәзірде табтан гөрі көбірек тармақ бар — телефонда орын жоқ
 * экрандар (Архив, Уақыт есебі, Мерзімдер) осында шығады.
 */
const ITEMS: Item[] = [
  { name: kk.nav.today, href: '/' },
  { name: kk.nav.calendar, href: '/calendar' },
  { name: kk.nav.year, href: '/goals' },
  { name: kk.nav.profile, href: '/profile' },
];

export function Sidebar({ width = 232, motto }: { width?: number; motto?: string }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.root, { width, paddingTop: insets.top + 26, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.brand}>
        <DiamondIcon size={26} color={C.accent} />
        <Text style={styles.wordmark}>{kk.app.name}</Text>
      </View>

      <View style={styles.nav}>
        {ITEMS.map((it) => {
          const on = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));
          return (
            <Pressable
              key={it.href}
              onPress={() => router.navigate(it.href as never)}
              style={[styles.item, on && { backgroundColor: C.tintRow }]}
              accessibilityRole="link"
              accessibilityState={{ selected: on }}
            >
              <View style={[styles.dot, { backgroundColor: on ? C.accent : C.lineSwitch }]} />
              <Text style={[styles.itemText, { color: on ? C.ink : C.darkInk3 }]}>{it.name}</Text>
            </Pressable>
          );
        })}
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
  nav: { gap: 3, marginTop: 30 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: R.chipSm,
  },
  dot: { width: 7, height: 7, borderRadius: 999 },
  itemText: { fontFamily: font.title, fontSize: 13 },
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
