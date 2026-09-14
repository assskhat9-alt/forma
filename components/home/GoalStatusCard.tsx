/**
 * Dropify 'Order Info' стиліндегі негізгі мақсат карточкасы.
 * Жоғарғы күлгін визитка + 4 сатылы қадамдық таймлайн + аяқталу пайызы.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Card } from '../ui';
import { ChevronRightIcon, CheckIcon, ChevronUpIcon } from '../icons';

export type GoalStage = {
  label: string;
  time?: string;
  status: 'done' | 'active' | 'pending';
};

export function GoalStatusCard({
  title = 'Ағымдағы кезең',
  code = '#GOAL-2026',
  origin = '2026 ЖЫЛ',
  destination = 'Q3 КЕЗЕҢ',
  pct = 60,
  stages,
  onViewMore,
}: {
  title?: string;
  code?: string;
  origin?: string;
  destination?: string;
  pct?: number;
  stages?: GoalStage[];
  onViewMore?: () => void;
}) {
  const defaultStages: GoalStage[] = stages ?? [
    { label: 'Жоспарлау', time: '10:00', status: 'done' },
    { label: 'Бастау', time: '13:18', status: 'done' },
    { label: 'Орындалуда', time: '14:33', status: 'active' },
    { label: 'Аяқтау', time: '18:00', status: 'pending' },
  ];

  return (
    <Card radius={22} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {onViewMore ? (
          <Pressable onPress={onViewMore} style={styles.moreBtn}>
            <Text style={styles.moreText}>Толығырақ</Text>
            <ChevronRightIcon size={12} color={C.ink3} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {/* ── Жоғарғы күлгін баннер ── */}
      <View style={styles.banner}>
        <View style={styles.bannerPoints}>
          <Text style={styles.bannerCity}>{origin}</Text>
          <View style={styles.bannerArrow}>
            <View style={styles.bannerArrowLine} />
            <Text style={styles.bannerArrowText}>1 : 40</Text>
          </View>
          <Text style={styles.bannerCity}>{destination}</Text>
        </View>

        <View style={styles.bannerFoot}>
          <Text style={styles.bannerSub}>14:33 басталу</Text>
          <Text style={styles.bannerSub}>18:13 мерзімі</Text>
        </View>
      </View>

      {/* ── Код пен сатылар ── */}
      <View style={styles.body}>
        <Text style={styles.codeText}>{code}</Text>

        <View style={styles.stepper}>
          {defaultStages.map((st, i) => {
            const isDone = st.status === 'done';
            const isActive = st.status === 'active';
            return (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  {isDone ? (
                    <View style={styles.doneCircle}>
                      <CheckIcon size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : isActive ? (
                    <View style={styles.activeOuter}>
                      <View style={styles.activeInner} />
                    </View>
                  ) : (
                    <View style={styles.pendingCircle} />
                  )}
                  {i < defaultStages.length - 1 ? (
                    <View
                      style={[
                        styles.stepLine,
                        isDone && { backgroundColor: C.accent },
                      ]}
                    />
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isDone && styles.stepLabelDone,
                  ]}
                >
                  {st.label}
                </Text>

                <Text style={styles.stepTime}>{st.time}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Төменгі прогресс капсуласы (60% Completed) ── */}
      <Pressable onPress={onViewMore} style={styles.progressPill} accessibilityRole="button">
        <View style={styles.progressRingMini}>
          <View style={[styles.progressRingFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressText}>{pct}% Орындалды</Text>
        <View style={{ flexGrow: 1 }} />
        <Text style={styles.deliveriesText}>Тапсырмалар</Text>
        <ChevronRightIcon size={14} color={C.ink3} strokeWidth={2} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: font.title,
    fontSize: 14,
    color: C.ink,
  },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  moreText: { fontFamily: font.body, fontSize: 11.5, color: C.ink3 },

  banner: { backgroundColor: '#9A8DF5', borderRadius: 16, padding: 14, marginBottom: 14 },
  bannerPoints: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerCity: { fontFamily: font.display, fontSize: 15, letterSpacing: 0.5, color: '#FFFFFF' },
  bannerArrow: { alignItems: 'center', gap: 2, flexGrow: 1, paddingHorizontal: 12 },
  bannerArrowLine: { width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 },
  bannerArrowText: { fontFamily: font.bold, fontSize: 9.5, color: '#FFFFFF' },
  bannerFoot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 6,
  },
  bannerSub: { fontFamily: font.body, fontSize: 10, color: 'rgba(255,255,255,0.85)' },

  body: { marginBottom: 14 },
  codeText: { fontFamily: font.bold, fontSize: 14, letterSpacing: 0.5, color: C.ink, marginBottom: 10 },

  stepper: { gap: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepIndicator: { width: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  doneCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  activeOuter: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  activeInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  pendingCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1' },
  stepLine: { position: 'absolute', top: 14, width: 2, height: 10, backgroundColor: '#E2E8F0' },

  stepLabel: { flexGrow: 1, fontFamily: font.body, fontSize: 12, color: C.ink3 },
  stepLabelActive: { fontFamily: font.bold, color: C.ink },
  stepLabelDone: { color: C.ink2 },
  stepTime: { fontFamily: font.body, fontSize: 11, color: C.ink3 },

  progressPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8F9FD', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9,
  },
  progressRingMini: { width: 32, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressRingFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  progressText: { fontFamily: font.bold, fontSize: 11.5, color: C.ink },
  deliveriesText: { fontFamily: font.body, fontSize: 11, color: C.ink3 },
});
