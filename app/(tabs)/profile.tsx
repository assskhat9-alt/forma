/**
 * Профиль — аккаунт, бөлімдер тізімі және шығу.
 *
 * ⚠ Бөлімдер тізімі ТЕК телефонда керек. Кең экранда сол жақтағы
 * панель сол рөлді атқарады, ал телефонда панель жоқ: төменгі жолақта
 * небәрі төрт бет сыяды. Тізімсіз «Менің ойларым» мен «Архивке»
 * телефоннан мүлде кіре алмайсың.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { Card, SectionLabel } from '../../components/ui';
import {
  UserIcon, ClockIcon, CheckIcon, BarChartIcon, FilterIcon,
  QuoteIcon, PencilIcon, BookmarkIcon, ChevronRightIcon, ShieldIcon, type IconProps,
} from '../../components/icons';
import { useBreakpoint } from '../../lib/breakpoints';
import { useSession } from '../../lib/auth';
import { signOut } from '../../lib/supabase';

/** Төменгі жолаққа сыймай қалған бөлімдер — реті панельдегідей */
const SECTIONS: { name: string; href: string; Icon: (p: IconProps) => React.ReactElement }[] = [
  { name: kk.nav.focus, href: '/focus', Icon: ClockIcon },
  { name: kk.nav.habits, href: '/habits', Icon: CheckIcon },
  { name: kk.nav.time, href: '/time', Icon: BarChartIcon },
  { name: kk.nav.weekly, href: '/week', Icon: FilterIcon },
  { name: kk.nav.motivation, href: '/motivation', Icon: QuoteNavIcon },
  { name: kk.nav.myNotes, href: '/notes', Icon: PencilIcon },
  { name: kk.nav.archive, href: '/archive', Icon: BookmarkIcon },
];

/** QuoteIcon-да strokeWidth жоқ — тізімнің типіне келтіреміз */
function QuoteNavIcon({ size, color }: IconProps) {
  return <QuoteIcon size={size} color={color} />;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const phone = useBreakpoint() === 'phone';
  const { session, isDemo, isAdmin, leaveDemoMode } = useSession();
  const [busy, setBusy] = useState(false);

  const email = isDemo ? 'demo@forma.kz' : (session?.user.email ?? '—');
  const initial = email.charAt(0).toUpperCase();

  const leave = async () => {
    setBusy(true);
    try {
      if (isDemo) {
        await leaveDemoMode();
      } else {
        await signOut();
      }
      // useProtectedRoute өзі кіру экранына шығарады
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.body,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 30 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <SectionLabel>{kk.nav.profile}</SectionLabel>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Text style={styles.email} numberOfLines={1}>{email}</Text>
            <Text style={styles.sync}>{isAdmin ? kk.nav.admin : isDemo ? kk.signIn.demoModeActive : kk.cascade.syncAll}</Text>
          </View>
          <UserIcon size={20} color={C.ink4} />
        </View>
      </Card>

      {isAdmin && (
        <Pressable
          onPress={() => router.push('/admin' as never)}
          style={styles.adminRow}
          accessibilityRole="button"
        >
          <ShieldIcon size={18} color={C.accent} />
          <Text style={styles.adminRowText}>{kk.nav.admin}</Text>
          <ChevronRightIcon size={14} color={C.ink3} />
        </Pressable>
      )}

      {phone && (
        <>
          <SectionLabel style={{ marginTop: 10 }}>{kk.nav.tools}</SectionLabel>
          <Card style={{ paddingVertical: 4 }}>
            {SECTIONS.map((s, i) => (
              <Pressable
                key={s.href}
                onPress={() => router.navigate(s.href as never)}
                style={[styles.link, i > 0 && styles.linkLine]}
                accessibilityRole="link"
              >
                <s.Icon size={17} color={C.ink3} />
                <Text style={styles.linkText}>{s.name}</Text>
                <ChevronRightIcon size={13} color={C.ink4} />
              </Pressable>
            ))}
          </Card>
        </>
      )}

      <Pressable
        onPress={leave}
        disabled={busy}
        style={[styles.leave, busy && { opacity: 0.6 }]}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={C.ink} />
        ) : (
          <Text style={styles.leaveText}>{kk.nav.signOut}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  body: { ...centered, paddingHorizontal: gutter, gap: 10 },
  link: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 12,
  },
  linkLine: { borderTopWidth: 1, borderTopColor: C.line },
  linkText: { flexGrow: 1, fontFamily: font.title, fontSize: 13.5, color: C.ink },
  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: R.pill,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: font.bold, fontSize: 16, color: '#FFFFFF' },
  email: { fontFamily: font.title, fontSize: 14, color: C.ink },
  sync: { fontFamily: font.body, fontSize: 11, color: C.inkFaint, marginTop: 2 },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: R.cardXs,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.accentLine,
    marginTop: 4,
  },
  adminRowText: {
    flexGrow: 1,
    fontFamily: font.bold,
    fontSize: 14,
    color: C.accent,
  },
  leave: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: R.cardXs,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.lineField,
    marginTop: 4,
  },
  leaveText: { fontFamily: font.bold, fontSize: 13.5, color: C.ink },
});

