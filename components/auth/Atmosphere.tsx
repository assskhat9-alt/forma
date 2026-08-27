/**
 * Кіру экранының атмосферасы — екі жұмсақ күлгін дақ.
 * Kiru.dc.html-де бұл `radial-gradient` + `filter: blur()` еді;
 * RN-де blur жоқ, сондықтан градиенттің өзі жұмсақ жасалған.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { color as C } from '../../theme/tokens';

function Blob({
  size,
  from,
  top,
  left,
  right,
}: {
  size: number;
  from: string;
  top: number;
  left?: number;
  right?: number;
}) {
  const id = `g${from.slice(1)}${size}`;
  return (
    <View style={{ position: 'absolute', top, left, right, width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={from} stopOpacity="1" />
            <Stop offset="0.45" stopColor={from} stopOpacity="0.55" />
            <Stop offset="0.7" stopColor={from} stopOpacity="0.12" />
            <Stop offset="1" stopColor={from} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export function Atmosphere() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Blob size={380} from={C.accentGlow} top={-120} left={-80} />
      <Blob size={320} from={C.accentLine} top={60} right={-130} />
    </View>
  );
}
