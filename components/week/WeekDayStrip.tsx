/**
 * Аптаның 7 күндік интерактивті шолу жолағы.
 * Дүйсенбіден Жексенбіге дейінгі әр күннің жүктемесі мен орындалуын көрсетеді.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import type { WeekDayStats } from '../../lib/week';

export function WeekDayStrip({
  days,
  selectedIso,
  onSelectDay,
}: {
  days: WeekDayStats[];
  selectedIso: string | null;
  onSelectDay: (iso: string | null) => void;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.title}>Күндер бойынша шолу</Text>
        {selectedIso && (
          <Pressable onPress={() => onSelectDay(null)} style={styles.resetBtn} accessibilityRole="button">
            <Text style={styles.resetText}>Барлық күндер</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.daysRow}>
        {days.map((d) => {
          const isSelected = selectedIso === d.iso;
          const hasTasks = d.total > 0;
          const isComplete = hasTasks && d.done === d.total;

          return (
            <Pressable
              key={d.iso}
              onPress={() => onSelectDay(isSelected ? null : d.iso)}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
                d.isToday && styles.dayCardToday,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${d.dayName} ${d.dayNum}`}
            >
              <Text style={[styles.dayName, isSelected && styles.textSelected]}>
                {d.dayName}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.textSelected]}>
                {d.dayNum}
              </Text>

              {/* Прогресс индикаторы */}
              {hasTasks ? (
                <View style={styles.progressWrap}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${d.pct}%` },
                      isComplete ? styles.barComplete : styles.barPartial,
                      isSelected && { backgroundColor: '#FFFFFF' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.countText,
                      isSelected && styles.textSelected,
                      isComplete && !isSelected && styles.countComplete,
                    ]}
                  >
                    {d.done}/{d.total}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.emptyText, isSelected && styles.textSelected]}>—</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 13,
    color: C.ink,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.pill,
    backgroundColor: C.tint,
  },
  resetText: {
    fontFamily: font.bold,
    fontSize: 11,
    color: C.accentDeep,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 14,
    backgroundColor: '#F8F9FD',
    borderWidth: 1,
    borderColor: '#ECEEF2',
  },
  dayCardToday: {
    borderColor: C.accent,
    borderWidth: 1.5,
  },
  dayCardSelected: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  dayName: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
    marginBottom: 2,
  },
  dayNum: {
    fontFamily: font.display,
    fontSize: 15,
    color: C.ink,
    marginBottom: 6,
  },
  textSelected: {
    color: '#FFFFFF',
  },
  progressWrap: {
    width: '85%',
    alignItems: 'center',
    gap: 3,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  barComplete: {
    backgroundColor: C.accent,
  },
  barPartial: {
    backgroundColor: '#8B7DF3',
  },
  countText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    color: C.ink3,
  },
  countComplete: {
    color: C.accentDeep,
  },
  emptyText: {
    fontFamily: font.body,
    fontSize: 10,
    color: C.ink4,
  },
});
