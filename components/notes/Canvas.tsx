/**
 * Сурет салатын алаң.
 *
 * ⚠ Skia қолданылмайды: react-native-svg жеткілікті, әрі ол веб пен
 * телефонда бірдей жүреді. Жаңа нативті кітапхана тарту — құрастыруды
 * қиындатады, ал мұндағы сурет — сызық қана.
 *
 * Өшіргіш нүктені емес, СЫЗЫҚТЫ өшіреді: саусақ тиген сызық толық
 * жойылады. Сызықтың ортасын үзу қолмен салынған суретте бәрібір
 * ұқыпсыз көрінеді.
 */
import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { color as C, radius as R } from '../../theme/tokens';
import type { Stroke } from '../../lib/notes';

export type Tool = 'pen' | 'marker' | 'eraser';

/** Құралдың қалыңдығы мен мөлдірлігі */
const SPEC: Record<'pen' | 'marker', { width: number; opacity: number }> = {
  pen: { width: 2.4, opacity: 1 },
  marker: { width: 14, opacity: 0.28 },
};

/** Саусақ сызықтан осыдан жақын өтсе — өшеді */
const ERASE_RADIUS = 14;

function toPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const [x, y] = points[0]!;
    // Бір нүкте де көрінуі керек — қысқа кесінді салып қоямыз
    return `M${x} ${y}L${x + 0.1} ${y}`;
  }
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('');
}

function near(stroke: Stroke, x: number, y: number): boolean {
  return stroke.points.some(([px, py]) => Math.hypot(px - x, py - y) <= ERASE_RADIUS);
}

export function Canvas({
  strokes,
  onChange,
  tool,
  color,
  height = 240,
}: {
  strokes: Stroke[];
  onChange: (next: Stroke[]) => void;
  tool: Tool;
  color: string;
  height?: number;
}) {
  const [size, setSize] = useState({ w: 0, h: height });
  const [live, setLive] = useState<Stroke | null>(null);

  // PanResponder қайта жасалмауы үшін ағымдағы күй ref-те тұрады
  const state = useRef({ strokes, tool, color });
  state.current = { strokes, tool, color };

  const drawing = useRef<Stroke | null>(null);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const s = state.current;

        if (s.tool === 'eraser') {
          onChange(s.strokes.filter((k) => !near(k, x, y)));
          return;
        }

        const spec = SPEC[s.tool];
        drawing.current = {
          tool: s.tool,
          color: s.color,
          width: spec.width,
          opacity: spec.opacity,
          points: [[x, y]],
        };
        setLive(drawing.current);
      },

      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const s = state.current;

        if (s.tool === 'eraser') {
          onChange(s.strokes.filter((k) => !near(k, x, y)));
          return;
        }

        const cur = drawing.current;
        if (!cur) return;

        const last = cur.points[cur.points.length - 1];
        // Тым жиі нүкте жинамаймыз — файл да, сызу да ауырлайды
        if (last && Math.hypot(last[0] - x, last[1] - y) < 1.5) return;

        cur.points.push([x, y]);
        setLive({ ...cur, points: [...cur.points] });
      },

      onPanResponderRelease: () => {
        const cur = drawing.current;
        drawing.current = null;
        setLive(null);
        if (cur && cur.points.length > 0) {
          onChange([...state.current.strokes, cur]);
        }
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setSize({ w: width, h });
  };

  const all = live ? [...strokes, live] : strokes;

  return (
    <View
      style={[styles.root, { height }]}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          {all.map((s, i) => (
            <Path
              key={i}
              d={toPath(s.points)}
              stroke={s.color}
              strokeWidth={s.width}
              strokeOpacity={s.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: R.cardXs,
    backgroundColor: C.cardSoft,
    borderWidth: 1,
    borderColor: C.lineSoft,
    overflow: 'hidden',
  },
});
