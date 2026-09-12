import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk, t } from '../../i18n/kk';
import { useAdminUsers, type AdminUser } from '../../lib/admin';
import { Card, SectionLabel } from '../ui';
import { UserIcon, DiamondIcon, CheckIcon } from '../icons';

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }, [users, query]);

  if (isLoading || !users) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Card style={styles.searchCard}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={kk.admin.userSearchPlaceholder}
          placeholderTextColor={C.ink4}
          style={styles.searchInput}
        />
      </Card>

      <SectionLabel style={{ marginTop: 6, marginBottom: 10 }}>
        {t(kk.admin.usersFound, { n: filtered.length })}
      </SectionLabel>

      {filtered.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>{kk.admin.noUsersFound}</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {filtered.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </View>
      )}
    </View>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <Card style={styles.userCard}>
      <View style={styles.userHead}>
        <View style={styles.avatar}>
          <UserIcon size={16} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{user.status === 'active' ? 'Белсенді' : 'Бұғатталған'}</Text>
        </View>
      </View>

      <View style={styles.userMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>{kk.admin.userColJoined}:</Text>
          <Text style={styles.metaVal}>{user.createdAt}</Text>
        </View>
        <View style={styles.metaItem}>
          <DiamondIcon size={13} color={C.accent} />
          <Text style={styles.metaVal}>{user.goalsCount} мақсат</Text>
        </View>
        <View style={styles.metaItem}>
          <CheckIcon size={13} color={C.accent} />
          <Text style={styles.metaVal}>{user.habitsCount} әдет</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  center: { paddingVertical: 40, alignItems: 'center' },
  searchCard: { padding: 8 },
  searchInput: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: C.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.cardSoft,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.line,
  },
  list: { gap: 10 },
  userCard: { padding: 16 },
  userHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: R.pill,
    backgroundColor: C.tintRow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: font.bold,
    fontSize: 14,
    color: C.ink,
  },
  userEmail: {
    fontFamily: font.body,
    fontSize: 12,
    color: C.ink3,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    backgroundColor: C.tintRow,
  },
  statusText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: C.accentDeep,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaLabel: {
    fontFamily: font.body,
    fontSize: 12,
    color: C.ink4,
  },
  metaVal: {
    fontFamily: font.title,
    fontSize: 12,
    color: C.ink2,
  },
  emptyCard: { padding: 30, alignItems: 'center' },
  emptyText: { fontFamily: font.body, fontSize: 13, color: C.ink4 },
});
