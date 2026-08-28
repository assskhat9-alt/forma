/**
 * УАҚЫТ ЕСЕБІ — жалпы көрініс (design/Uaqyt.dc.html).
 *
 * Ең бірінші тұратыны — БАРЛЫҚ мақсатқа кеткен жалпы уақыт. Астында
 * мақсаттар тізімі: әрқайсысының үлесі көрініп тұрады, үстінен
 * бассаңыз сол мақсаттың жеке есебі ашылады.
 *
 * ⚠ Бұл уақыт мақсаттың пайызына кірмейді: пайыз орындалған әрекеттен
 * есептеледі, отырған сағаттан емес (CLAUDE.md §1).
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { color as C, radius as R, font, gutter, centered } from '../theme/tokens';
import { kk } from '../i18n/kk';
import { goBack } from '../lib/nav';
import { errorText } from '../lib/errors';
import { useBreakpoint } from '../lib/breakpoints';
import { useTimeOverview, fmtMinutes, OTHER } from '../lib/report';
import { Card, DarkCard, SectionLabel } from '../components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';

export default function TimeScreen() {
  const insets = useSafeAreaInsets();
  const wide = useBreakpoint() !== 'phone';
  const now = new Date();

  /**
   * ⚠ Кезең ауыстырғышы ЖОҚ. Бұл беттің жалғыз сұрағы — «мақсаттарға
   * жалпы қанша уақыт кетті». Кезеңмен жұмыс мақсаттың өз бетінде:
   * ол жерде апта бойынша артқа қайтуға болады.
   */
  const rep = useTimeOverview(now);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        ...centered,
        paddingTop: insets.top + (wide ? 18 : 12),
        paddingBottom: insets.bottom + 28,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => goBack('/')} hitSlop={10} accessibilityRole="button">
          <ChevronLeftIcon size={20} color={C.ink} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{kk.time.title}</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.body}>
        {rep.isError ? (
          <Card style={styles.pad}>
            <Text style={styles.error}>{errorText(rep.error)}</Text>
          </Card>
        ) : rep.isLoading ? (
          <Card style={styles.pad}>
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          </Card>
        ) : (
          <>
            {/*
              Жалпы уақыт — қара карточкада. Бұл мақсаттың пайызы емес,
              сондықтан ақ карточкада тұрмауы керек (CLAUDE.md §3).
            */}
            <DarkCard style={styles.hero}>
              <Text style={styles.heroLabel}>{kk.time.totalLabel}</Text>
              <Text style={styles.heroValue}>
                {rep.total > 0 ? fmtMinutes(rep.total) : '—'}
              </Text>
              <Text style={styles.heroSub}>
                {kk.time.allTime}
                {rep.sessions > 0 ? ` · ${rep.sessions} ${kk.time.sessionsWord}` : ''}
              </Text>
            </DarkCard>

            <SectionLabel style={{ paddingLeft: 4 }}>{kk.time.byGoal}</SectionLabel>

            {rep.goals.length === 0 ? (
              <Card style={styles.pad}>
                <Text style={styles.empty}>{kk.time.empty}</Text>
              </Card>
            ) : (
              rep.goals.map((g) => {
                // Жеке шаруаның мақсаты жоқ — ашатын беті де жоқ
                const openable = g.id !== OTHER.id;

                return (
                  <Pressable
                    key={g.id}
                    onPress={openable ? () => router.push(`/time/${g.id}` as never) : undefined}
                    accessibilityRole={openable ? 'link' : undefined}
                  >
                    <Card level="cardSm" radius={R.cardSm} style={styles.goal}>
                      <View style={styles.goalHead}>
                        <View style={[styles.dot, { backgroundColor: g.color }]} />
                        <Text style={styles.goalName} numberOfLines={1}>
                          {g.title}
                        </Text>
                        <Text style={styles.goalTime}>{fmtMinutes(g.minutes)}</Text>
                        {openable && (
                          <ChevronRightIcon size={13} color={C.ink4} strokeWidth={2.4} />
                        )}
                      </View>

                      <View style={styles.barRow}>
                        <View style={styles.track}>
                          <View
                            style={{
                              height: 5,
                              borderRadius: 999,
                              backgroundColor: g.color,
                              width: `${g.pct}%`,
                            }}
                          />
                        </View>
                        <Text style={styles.pct}>{g.pct}%</Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            )}

            <Text style={styles.footer}>{kk.time.notCounted}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: gutter, paddingBottom: 10,
  },
  headerTitle: {
    fontFamily: font.display, fontSize: 13, letterSpacing: 2.08, color: C.ink,
  },

  body: { paddingHorizontal: gutter, gap: 10 },
  pad: { padding: 17 },
  center: { paddingVertical: 30, alignItems: 'center' },
  error: { fontFamily: font.prose, fontSize: 13, color: C.inkProse },
  empty: { fontFamily: font.prose, fontSize: 12.5, lineHeight: 19, color: C.ink4 },

  hero: { padding: 18 },
  heroLabel: {
    fontFamily: font.bold, fontSize: 10, letterSpacing: 1.3,
    textTransform: 'uppercase', color: C.accent2,
  },
  heroValue: {
    fontFamily: font.display, fontSize: 32, letterSpacing: -1.4,
    color: '#FFFFFF', marginTop: 8,
  },
  heroSub: { fontFamily: font.prose, fontSize: 11.5, color: C.darkInk2, marginTop: 7 },

  goal: { paddingHorizontal: 15, paddingVertical: 14 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 999, flexShrink: 0 },
  goalName: {
    fontFamily: font.title, fontSize: 13, color: C.ink,
    flexGrow: 1, flexShrink: 1,
  },
  goalTime: { fontFamily: font.bold, fontSize: 13, color: C.ink, flexShrink: 0 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  track: {
    flexGrow: 1, height: 5, borderRadius: 999,
    backgroundColor: C.tintBar, overflow: 'hidden',
  },
  pct: {
    fontFamily: font.bold, fontSize: 10.5, color: C.inkMuted,
    width: 32, textAlign: 'right',
  },

  footer: {
    fontFamily: font.prose, fontSize: 11, lineHeight: 16,
    color: C.ink4, textAlign: 'center', marginTop: 4, paddingHorizontal: 10,
  },
});
