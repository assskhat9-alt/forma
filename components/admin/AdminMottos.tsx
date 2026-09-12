import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { kk } from '../../i18n/kk';
import { useAdminMottos, useSaveAdminMottos } from '../../lib/admin';
import { Card, SectionLabel, Toggle } from '../ui';
import { PlusIcon, TrashIcon, QuoteIcon } from '../icons';
import type { Motto } from '../../lib/database.types';

export function AdminMottos() {
  const { data: mottos, isLoading } = useAdminMottos();
  const saveMutation = useSaveAdminMottos();
  const [newText, setNewText] = useState('');

  if (isLoading || !mottos) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;

    const newMotto: Motto = {
      id: `sys-motto-${Date.now()}`,
      user_id: 'system',
      text,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    saveMutation.mutate([newMotto, ...mottos]);
    setNewText('');
  };

  const handleToggle = (id: string) => {
    const updated = mottos.map((m) =>
      m.id === id ? { ...m, is_active: !m.is_active } : m
    );
    saveMutation.mutate(updated);
  };

  const handleDelete = (id: string) => {
    const updated = mottos.filter((m) => m.id !== id);
    saveMutation.mutate(updated);
  };

  return (
    <View style={styles.root}>
      {/* Жаңа сөз қосу */}
      <Card style={styles.addCard}>
        <SectionLabel style={{ marginBottom: 8 }}>{kk.admin.mottoAddTitle}</SectionLabel>
        <TextInput
          value={newText}
          onChangeText={setNewText}
          placeholder={kk.admin.mottoTextPlaceholder}
          placeholderTextColor={C.ink4}
          multiline
          style={styles.addInput}
        />
        <Pressable
          onPress={handleAdd}
          disabled={!newText.trim() || saveMutation.isPending}
          style={[styles.addBtn, !newText.trim() && { opacity: 0.5 }]}
          accessibilityRole="button"
        >
          <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.6} />
          <Text style={styles.addBtnText}>{kk.common.add}</Text>
        </Pressable>
      </Card>

      <SectionLabel style={{ marginTop: 8, marginBottom: 10 }}>
        {`${kk.admin.tabMottos} (${mottos.length})`}
      </SectionLabel>

      <View style={styles.list}>
        {mottos.map((motto) => (
          <Card key={motto.id} style={styles.mottoCard}>
            <View style={styles.mottoHead}>
              <View style={styles.iconWrap}>
                <QuoteIcon size={14} color={C.accent} />
              </View>
              <Text style={styles.mottoText}>«{motto.text}»</Text>
            </View>

            <View style={styles.mottoActions}>
              <View style={styles.toggleWrap}>
                <Text style={styles.toggleLabel}>
                  {motto.is_active ? kk.admin.mottoActive : kk.admin.mottoInactive}
                </Text>
                <Toggle
                  value={motto.is_active}
                  onChange={() => handleToggle(motto.id)}
                />
              </View>

              <Pressable
                onPress={() => handleDelete(motto.id)}
                hitSlop={8}
                style={styles.delBtn}
                accessibilityRole="button"
              >
                <TrashIcon size={15} color={C.ink3} />
              </Pressable>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  center: { paddingVertical: 40, alignItems: 'center' },
  addCard: { padding: 18 },
  addInput: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: C.ink,
    minHeight: 64,
    padding: 12,
    backgroundColor: C.cardSoft,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.line,
    textAlignVertical: 'top',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.accent,
    paddingVertical: 12,
    borderRadius: R.cardXs,
    marginTop: 12,
  },
  addBtnText: {
    fontFamily: font.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  list: { gap: 10 },
  mottoCard: { padding: 16 },
  mottoHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    marginTop: 2,
    width: 26,
    height: 26,
    borderRadius: R.sm,
    backgroundColor: C.tintRow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mottoText: {
    flex: 1,
    fontFamily: font.prose,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.ink,
  },
  mottoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  toggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontFamily: font.title,
    fontSize: 12,
    color: C.ink3,
  },
  delBtn: {
    padding: 6,
    borderRadius: R.sm,
    backgroundColor: '#FEF2F2',
  },
});
