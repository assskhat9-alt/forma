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
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { color as C, radius as R, font } from '../../theme/tokens';
import { useSession } from '../../lib/auth';
import { useI18n } from '../../i18n/context';
import { useAdminAnnouncement } from '../../lib/admin';
import { SearchIcon, BellIcon, ChatIcon, PlusIcon, CloseIcon } from '../icons';
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
  const { data: notice } = useAdminAnnouncement();
  const [showNotice, setShowNotice] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const fullName = session?.user.user_metadata?.full_name;
  const email = session?.user.email ?? '';
  const userName = fullName || (email.split('@')[0] || 'User');

  const defaultTitle = isKk
    ? `Қош келдіңіз, ${userName}!`
    : `Добро пожаловать, ${userName}!`;

  const defaultSub = isKk
    ? 'Бүгінгі жоспарларыңыз бен тапсырмаларыңыз дайын.'
    : 'Ваши планы и задачи на сегодня готовы.';

  const handleSearchSubmit = () => {
    if (onSearch) {
      onSearch(query);
    } else {
      router.navigate('/calendar' as never);
    }
  };

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
            style={[styles.circleBtn, showNotice && styles.circleBtnActive]}
            onPress={() => setShowNotice((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={isKk ? 'Хабарламалар' : 'Уведомления'}
          >
            <BellIcon size={17} color={showNotice ? C.accent : C.ink2} strokeWidth={2} />
            {notice?.enabled ? <View style={styles.bellDot} /> : null}
          </Pressable>

          <Pressable
            style={[styles.circleBtn, showSearch && styles.circleBtnActive]}
            onPress={() => {
              setShowSearch((v) => !v);
              if (onSearch) onSearch('');
            }}
            accessibilityRole="button"
            accessibilityLabel={isKk ? 'Іздеу' : 'Поиск'}
          >
            <SearchIcon size={17} color={showSearch ? C.accent : C.ink2} strokeWidth={2} />
          </Pressable>

          <Pressable
            style={styles.circleBtn}
            onPress={() => router.navigate('/notes' as never)}
            accessibilityRole="button"
            accessibilityLabel={isKk ? 'Ойлар мен жазбалар' : 'Заметки'}
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

      {/* ── Іздеу жолағы ── */}
      {showSearch && (
        <View style={styles.searchBarRow}>
          <SearchIcon size={15} color={C.ink3} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (onSearch) onSearch(t);
            }}
            placeholder={isKk ? 'Тапсырма немесе мақсат іздеу...' : 'Поиск задачи или цели...'}
            placeholderTextColor={C.ink4}
            style={styles.searchBarInput}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            autoFocus
          />
          <Pressable onPress={() => setShowSearch(false)} hitSlop={8}>
            <CloseIcon size={14} color={C.ink3} />
          </Pressable>
        </View>
      )}

      {/* ── Хабарлама қалқымалы карточкасы ── */}
      {showNotice && (
        <View style={styles.noticeCard}>
          <View style={styles.noticeHead}>
            <View style={styles.noticeTitleRow}>
              <BellIcon size={15} color={C.accent} />
              <Text style={styles.noticeTitle}>{isKk ? 'Хабарламалар' : 'Уведомления'}</Text>
            </View>
            <Pressable onPress={() => setShowNotice(false)} hitSlop={8}>
              <CloseIcon size={14} color={C.ink3} />
            </Pressable>
          </View>
          <Text style={styles.noticeBody}>
            {notice?.enabled && notice.text
              ? notice.text
              : isKk
              ? 'Жаңа хабарландыру жоқ. Барлық мақсаттарыңызға сәттілік!'
              : 'Новых уведомлений нет. Удачи в достижении целей!'}
          </Text>
        </View>
      )}

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
  circleBtnActive: {
    borderColor: C.accent,
    backgroundColor: C.cardSoft,
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

  searchBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: R.input, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.accentLine,
  },
  searchBarInput: { flex: 1, fontFamily: font.body, fontSize: 13, color: C.ink },
  noticeCard: {
    marginTop: 10, padding: 14, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.accentLine, gap: 8,
  },
  noticeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noticeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeTitle: { fontFamily: font.bold, fontSize: 13, color: C.ink },
  noticeBody: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: C.ink2 },
  right: { marginTop: 12 },
});
