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
import { useI18n } from '../../i18n/context';
import { SearchIcon, BellIcon, ChatIcon, PlusIcon } from '../icons';
import { LangSwitcher } from '../ui';

export function TopBar({
  title,
  subtitle,
  right,
  actions,
  primaryAction,
  onSearch,
  padH = 26,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  actions?: React.ReactNode;
  primaryAction?: { label: string; onPress: () => void };
  onSearch?: (q: string) => void;
  padH?: number;
}) {
  const { session } = useSession();
  const { strings: S, isKk } = useI18n();
  const email = session?.user.email ?? '';
  const userName = email.split('@')[0] || 'User';

  const defaultTitle = isKk
    ? `Қош келдіңіз, ${userName}!`
    : `Добро пожаловать, ${userName}!`;

  const defaultSub = isKk
    ? 'Бүгінгі жоспарларыңыз бен тапсырмаларыңыз дайын.'
    : 'Ваши планы и задачи на сегодня готовы.';

  return (
    <View style={[styles.root, { paddingHorizontal: padH }]}>
      <View style={styles.row}>
        <View style={{ flexShrink: 1, minWidth: 160 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? defaultTitle}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle ?? defaultSub}
          </Text>
        </View>

        <View style={{ flexGrow: 1, minWidth: 12 }} />

        {/* ── Dropify стиліндегі дөңгелек батырмалар ── */}
        <View style={styles.actionPills}>
          <Pressable
            style={styles.circleBtn}
            onPress={() => router.navigate('/notes' as never)}
            accessibilityRole="button"
          >
            <BellIcon size={17} color={C.ink2} strokeWidth={2} />
            <View style={styles.bellDot} />
          </Pressable>

          <Pressable
            style={styles.circleBtn}
            onPress={() => {
              if (onSearch) onSearch('');
            }}
            accessibilityRole="button"
          >
            <SearchIcon size={17} color={C.ink2} strokeWidth={2} />
          </Pressable>

          <Pressable
            style={styles.circleBtn}
            onPress={() => router.navigate('/notes' as never)}
            accessibilityRole="button"
          >
            <ChatIcon size={17} color={C.ink2} strokeWidth={2} />
          </Pressable>
        </View>

        <LangSwitcher compact />

        {primaryAction ? (
          <Pressable
            style={styles.primaryBtn}
            onPress={primaryAction.onPress}
            accessibilityRole="button"
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.primaryBtnText}>{primaryAction.label}</Text>
          </Pressable>
        ) : actions}
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
    fontSize: 22,
    letterSpacing: -0.5,
    color: C.ink,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 12,
    color: C.ink3,
    marginTop: 2,
  },

  actionPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: R.pill,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 40,
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
    outlineStyle: 'none' as never,
  },

  right: { marginTop: 12 },
});
