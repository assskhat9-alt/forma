/**
 * Төменгі навигация.
 *
 * ⚠ ШЕШІМ: макеттерде таб жолағының құрамы тоғыз экранда үш түрлі болатын
 * (2 және 4-слоттар күнтізбе / диаграмма / архив болып ауысатын), ал
 * CLAUDE.md §6 маршрут кестесі мүлде басқа төртеуді атайтын.
 * Біріздендірілген құрам:
 *
 *   үй · күнтізбе · [FAB] · жыл · профиль
 *
 * Архив пен Уақыт есебі — бұрғылау экрандары, таб емес.
 * FAB — таб емес, «жаңа мақсат» модалі.
 *
 * SDK 56+ ережесі: @react-navigation/* тікелей импортталмайды, сондықтан
 * проп типі осында құрылымдық түрде сипатталған.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color as C, radius as R, font, navHeight } from '../../theme/tokens';
import {
  HomeIcon,
  CalendarIcon,
  DiamondIcon,
  BarChartIcon,
  UserIcon,
  type IconProps,
} from '../icons';

export type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

type Slot = {
  route: string;
  Icon: (p: IconProps) => React.JSX.Element;
  label: string;
};

/** Таб реті — маршрут атаулары app/(tabs)/ ішіндегі файл аттарымен сәйкес */
const SLOTS: Slot[] = [
  { route: 'index', Icon: HomeIcon, label: 'Бүгін' },
  { route: 'calendar', Icon: CalendarIcon, label: 'Күнтізбе' },
  { route: 'goals', Icon: BarChartIcon, label: 'Жыл' },
  { route: 'profile', Icon: UserIcon, label: 'Профиль' },
];

export function BottomNav({ state, navigation, onFabPress }: TabBarProps & { onFabPress?: () => void }) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index]?.name;

  const item = (slot: Slot) => {
    const on = activeRoute === slot.route;
    return (
      <Pressable
        key={slot.route}
        onPress={() => navigation.navigate(slot.route)}
        style={styles.item}
        accessibilityRole="tab"
        accessibilityLabel={slot.label}
        accessibilityState={{ selected: on }}
      >
        <slot.Icon size={22} color={on ? C.accent : C.ink4} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { height: navHeight + insets.bottom, paddingBottom: insets.bottom + 12 }]}>
      {item(SLOTS[0]!)}
      {item(SLOTS[1]!)}

      <Pressable
        onPress={onFabPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Жаңа мақсат"
      >
        <DiamondIcon size={22} color="#FFFFFF" />
      </Pressable>

      {item(SLOTS[2]!)}
      {item(SLOTS[3]!)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 18,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  item: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Басу аймағы 44×44-тен кем болмауы керек
    minHeight: 44,
    marginTop: 10,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: R.pill,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    // ⚠ Макетте FAB екі стильде болатын (ақ жиекті және тұтас күлгін).
    // Тұтас күлгін таңдалды — айқынырақ әрі shadow.float-пен сәйкес.
    shadowColor: C.accent,
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  label: { fontFamily: font.bold, fontSize: 9 },
});
