/**
 * Dropify 'Wheeled Robot Trailer' стиліндегі басты назардағы жоба баннері.
 * Футуристік күлгін элементтер, сипаттамалар мен басқару көрсеткіштері.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { color as C, radius as R, font } from '../../theme/tokens';
import { Card } from '../ui';
import { ChevronUpIcon, ChevronRightIcon } from '../icons';

export function FocusFeatureCard({
  title = 'Forma Focus Pro',
  subtitle = 'Басты назардағы кезең',
  spec1 = { val: '25 сағ', lbl: 'Жалпы жоспар' },
  spec2 = { val: '72%', lbl: 'Нәтиже' },
  spec3 = { val: '18 күн', lbl: 'Тұрақтылық' },
  onPress,
}: {
  title?: string;
  subtitle?: string;
  spec1?: { val: string; lbl: string };
  spec2?: { val: string; lbl: string };
  spec3?: { val: string; lbl: string };
  onPress?: () => void;
}) {
  return (
    <Card radius={22} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* 3 спецификация ұяшығы */}
          <View style={styles.specsRow}>
            <View style={styles.spec}>
              <Text style={styles.specVal}>{spec1.val}</Text>
              <Text style={styles.specLbl}>{spec1.lbl}</Text>
            </View>
            <View style={styles.spec}>
              <Text style={styles.specVal}>{spec2.val}</Text>
              <Text style={styles.specLbl}>{spec2.lbl}</Text>
            </View>
            <View style={styles.spec}>
              <Text style={styles.specVal}>{spec3.val}</Text>
              <Text style={styles.specLbl}>{spec3.lbl}</Text>
            </View>
          </View>
        </View>

        {/* ── Оң жақтағы футуристік визуал (Dropify Trailer стилі) ── */}
        <View style={styles.graphicBox}>
          <Svg width={110} height={85} viewBox="0 0 110 85">
            {/* Футуристік капсула пішіні */}
            <Rect x="15" y="10" width="80" height="55" rx="20" fill="#EDE9FE" />
            <Rect x="25" y="18" width="60" height="35" rx="14" fill={C.accent} />
            <Path d="M35 30 Q 55 20, 75 30" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Circle cx="32" cy="65" r="10" fill="#1A1D26" />
            <Circle cx="32" cy="65" r="5" fill={C.accent} />
            <Circle cx="78" cy="65" r="10" fill="#1A1D26" />
            <Circle cx="78" cy="65" r="5" fill={C.accent} />
          </Svg>

          <View style={styles.actionPill}>
            <ChevronUpIcon size={12} color={C.ink2} strokeWidth={2.4} />
          </View>
        </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    letterSpacing: -0.3,
    color: C.ink,
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 11,
    color: C.ink3,
    marginTop: 2,
    marginBottom: 12,
  },

  specsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  spec: {
    gap: 2,
  },
  specVal: {
    fontFamily: font.bold,
    fontSize: 12,
    color: C.ink,
  },
  specLbl: {
    fontFamily: font.body,
    fontSize: 9.5,
    color: C.ink3,
  },

  graphicBox: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionPill: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
