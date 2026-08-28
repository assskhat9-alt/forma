/**
 * Күн таңдағыш.
 *
 * Нативті пикер орнына өз торымыз: үш платформада да бірдей көрінеді
 * әрі қосымшаның дизайнынан ажырамайды. `buildMonthGrid` күнтізбе
 * экранымен ортақ — апта дүйсенбіден басталады.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { isSameDay, isAfter, isBefore } from 'date-fns';

import { color as C, radius as R, font } from '../../theme/tokens';
import { weekdaysShort, months, formatDayMonth } from '../../i18n/kk';
import { buildMonthGrid, nextMonth, prevMonth, COLS } from '../../lib/calendar';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CloseIcon } from '../icons';

type FieldProps = {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  /** Осыдан ерте күнді таңдауға болмайды */
  min?: Date;
  /** Осыдан кеш күнді таңдауға болмайды */
  max?: Date;
  /** Өріс астындағы қосымша мәлімет */
  hint?: string;
};

export function DateField({ label, value, onChange, min, max, hint }: FieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDayMonth(value)}`}
      >
        <CalendarIcon size={17} color={C.accent} />
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>
            {formatDayMonth(value)} {value.getFullYear()}
          </Text>
        </View>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
        <ChevronRightIcon size={15} color={C.inkIcon} />
      </Pressable>

      <CalendarModal
        visible={open}
        value={value}
        min={min}
        max={max}
        title={label}
        onClose={() => setOpen(false)}
        onPick={(d) => {
          onChange(d);
          setOpen(false);
        }}
      />
    </>
  );
}

function CalendarModal({
  visible,
  value,
  min,
  max,
  title,
  onClose,
  onPick,
}: {
  visible: boolean;
  value: Date;
  min?: Date;
  max?: Date;
  title: string;
  onClose: () => void;
  onPick: (d: Date) => void;
}) {
  const [anchor, setAnchor] = useState(value);

  // Терезе әр ашылғанда таңдалған айға оралады
  const shownAnchor = useMemo(() => (visible ? anchor : value), [visible, anchor, value]);
  const cells = useMemo(() => buildMonthGrid(shownAnchor, new Date()), [shownAnchor]);

  const blocked = (d: Date) =>
    (min ? isBefore(d, stripTime(min)) : false) || (max ? isAfter(d, stripTime(max)) : false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Ішкі басу терезені жаппауы керек */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
              <CloseIcon size={12} color={C.darkInk3} />
            </Pressable>
          </View>

          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setAnchor((a) => prevMonth(a))}
              style={styles.arrow}
              accessibilityRole="button"
            >
              <ChevronLeftIcon size={14} color={C.darkInk3} strokeWidth={2.4} />
            </Pressable>

            <Text style={styles.monthName}>
              {cap(months[shownAnchor.getMonth()]!)} {shownAnchor.getFullYear()}
            </Text>

            <Pressable
              onPress={() => setAnchor((a) => nextMonth(a))}
              style={styles.arrow}
              accessibilityRole="button"
            >
              <ChevronRightIcon size={14} color={C.darkInk3} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.weekdays}>
            {weekdaysShort.map((w, i) => (
              <Text key={w} style={[styles.weekday, i > 4 && { color: C.inkIcon }]}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((c) => {
              const selected = isSameDay(c.date, value);
              const off = blocked(c.date);
              return (
                <Pressable
                  key={c.date.toISOString()}
                  onPress={() => !off && onPick(stripTime(c.date))}
                  disabled={off}
                  style={[
                    styles.cell,
                    selected && { backgroundColor: C.accent },
                    !selected && c.isToday && { backgroundColor: C.tintToday },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: off }}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: selected ? '#FFFFFF' : c.outside ? C.inkOut : off ? C.ink4 : C.ink },
                      (selected || c.isToday) && { fontFamily: font.bold },
                      off && { opacity: 0.4 },
                    ]}
                  >
                    {c.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => onPick(stripTime(new Date()))}
            style={styles.todayBtn}
            accessibilityRole="button"
          >
            <Text style={styles.todayText}>Бүгін</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: R.field,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  fieldLabel: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 1.17,
    textTransform: 'uppercase',
    color: C.ink3,
  },
  fieldValue: { fontFamily: font.bold, fontSize: 13.5, color: C.ink, marginTop: 3 },
  fieldHint: { fontFamily: font.body, fontSize: 10.5, color: C.inkMuted, flexShrink: 0 },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,32,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: C.card,
    borderRadius: R.cardLg,
    padding: 18,
    shadowColor: '#14142D',
    shadowOpacity: 0.22,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: font.bold, fontSize: 15, letterSpacing: -0.3, color: C.ink },
  close: {
    width: 28,
    height: 28,
    borderRadius: R.pill,
    backgroundColor: C.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: R.boxSm,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.lineField,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthName: { fontFamily: font.bold, fontSize: 14, color: C.ink },

  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flexGrow: 1,
    flexBasis: 0,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.48,
    color: C.ink3,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / COLS}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.box,
  },
  cellText: { fontFamily: font.body, fontSize: 13 },

  todayBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: R.sm,
    backgroundColor: C.tintSoft,
    borderWidth: 1,
    borderColor: C.tintLine,
  },
  todayText: { fontFamily: font.bold, fontSize: 12.5, color: C.accentDeep },
});
