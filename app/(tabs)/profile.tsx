/**
 * Профиль — әзірге тек аккаунт және шығу.
 * Толық баптау экранының макеті әлі жоқ (аудитте белгіленген олқылық).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color as C, radius as R, font, gutter, centered } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { Card, SectionLabel } from '../../components/ui';
import { UserIcon } from '../../components/icons';
import { useSession } from '../../lib/auth';
import { signOut } from '../../lib/supabase';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [busy, setBusy] = useState(false);

  const email = session?.user.email ?? '—';
  const initial = email.charAt(0).toUpperCase();

  const leave = async () => {
    setBusy(true);
    try {
      await signOut();
      // useProtectedRoute өзі кіру экранына шығарады
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <SectionLabel>{kk.nav.profile}</SectionLabel>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1 }}>
            <Text style={styles.email} numberOfLines={1}>{email}</Text>
            <Text style={styles.sync}>{kk.cascade.syncAll}</Text>
          </View>
          <UserIcon size={20} color={C.ink4} />
        </View>
      </Card>

      <Pressable
        onPress={leave}
        disabled={busy}
        style={[styles.leave, busy && { opacity: 0.6 }]}
        accessibilityRole="button"
      >
        {busy ? (
          <ActivityIndicator color={C.ink} />
        ) : (
          <Text style={styles.leaveText}>Шығу</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...centered, flex: 1, backgroundColor: C.bg, paddingHorizontal: gutter, gap: 10 },
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
