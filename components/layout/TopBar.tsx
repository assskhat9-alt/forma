/**
 * Кең экранның жоғарғы жолағы — планшет пен ПК.
 *
 * Сол жақта беттің аты (сөзбелгі емес: сөзбелгі бүйір мәзірде тұр),
 * оң жақта аккаунт. Астына `right` арқылы қосымша қатар қоюға болады.
 *
 * ⚠ Мұнда хабарлама қоңырауы ЖОҚ. Ол бұрын тұрған да, басқанда ештеңе
 * болмайтын: хабарлама орталығы деген экран жоқ. Істемейтін түйме —
 * жоқ түймеден жаман.
 *
 * ⚠ Телефонда бұл қолданылмайды: онда әр экранның өз ықшам хедері бар.
 */
import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { color as C, radius as R, font } from '../../theme/tokens';
import { useSession } from '../../lib/auth';
import { SearchIcon } from '../icons';

export function TopBar({
  title,
  right,
  actions,
  onSearch,
  padH = 26,
}: {
  title: string;
  /** Тақырыптың астындағы қосымша қатар — период ауыстырғышы, күн аралығы */
  right?: React.ReactNode;
  /** Беттің өз батырмалары — аватардың сол жағында тұрады */
  actions?: React.ReactNode;
  /** Берілмесе іздеу өрісі мүлде шықпайды — жұмыс істемейтін өріс қоймаймыз */
  onSearch?: (q: string) => void;
  /** Экранның өз шеті болса — 0 беріңіз, әйтпесе шет екі есе болады */
  padH?: number;
}) {
  const { session } = useSession();
  const email = session?.user.email ?? '';
  const initial = email.charAt(0).toUpperCase() || '·';

  return (
    <View style={[styles.root, { paddingHorizontal: padH }]}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={{ flexGrow: 1, minWidth: 12 }} />

        {onSearch ? (
          <View style={styles.search}>
            <SearchIcon size={16} color={C.ink3} strokeWidth={2} />
            <TextInput
              placeholder="Іздеу…"
              placeholderTextColor={C.ink4}
              onChangeText={onSearch}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        ) : null}

        {actions}

        <Pressable
          onPress={() => router.navigate('/profile' as never)}
          style={styles.avatar}
          accessibilityRole="link"
          accessibilityLabel={email}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 6, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  title: {
    fontFamily: font.display,
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.ink,
    flexShrink: 1,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 40,
    // Іздеу — ең кең элемент, бірақ тақырыпты қыспауы керек
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: 300,
    minWidth: 120,
    paddingHorizontal: 15,
    borderRadius: R.pill,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  searchInput: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 13,
    color: C.ink,
    // Веб-браузердің өз контуры дизайнды бұзады
    outlineStyle: 'none' as never,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: C.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.bold, fontSize: 15, color: '#FFFFFF' },

  right: { marginTop: 12 },
});
