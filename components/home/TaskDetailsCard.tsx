/**
 * Dropify 'Package Details' стиліндегі карточка.
 * 3 өлшем ұяшығы (Орындалған / Қалған / Әдеттер) + жауапты қолданушы мен әрекет түймесі.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Card } from '../ui';
import { UserIcon, ChatIcon } from '../icons';

export function TaskDetailsCard({
  title = 'Тапсырмалар мәліметі',
  subtitle = 'Бүгінгі күйі',
  doneCount = 0,
  leftCount = 0,
  habitCount = 0,
  userName = 'Қолданушы',
  userStatus = 'Белсенді қолданушы',
  onAction,
}: {
  title?: string;
  subtitle?: string;
  doneCount?: number;
  leftCount?: number;
  habitCount?: number;
  userName?: string;
  userStatus?: string;
  onAction?: () => void;
}) {
  return (
    <Card radius={22} style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* ── 3 өлшем ұяшығы ── */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipVal}>{doneCount}</Text>
          <Text style={styles.chipLbl}>Орындалды</Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipVal}>{leftCount}</Text>
          <Text style={styles.chipLbl}>Қалғаны</Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipVal}>{habitCount}</Text>
          <Text style={styles.chipLbl}>Әдеттер</Text>
        </View>
      </View>

      <Text style={styles.receiverLabel}>Жауапты тұлға</Text>

      {/* ── Қолданушы қатары ── */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={{ flexGrow: 1, minWidth: 0 }}>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.userStatus} numberOfLines={1}>{userStatus}</Text>
        </View>

        <Pressable onPress={onAction} style={styles.actionBtn} accessibilityRole="button">
          <ChatIcon size={16} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
  },
  title: {
    fontFamily: font.title,
    fontSize: 14,
    color: C.ink,
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
    marginTop: 2,
    marginBottom: 14,
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipVal: {
    fontFamily: font.bold,
    fontSize: 15,
    color: C.ink,
  },
  chipLbl: {
    fontFamily: font.body,
    fontSize: 10,
    color: C.ink3,
    marginTop: 3,
  },

  receiverLabel: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
    marginBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1D26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: font.bold,
    fontSize: 13.5,
    color: C.ink,
  },
  userStatus: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
    marginTop: 1,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
});
