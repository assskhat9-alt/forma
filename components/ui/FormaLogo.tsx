/**
 * FORMA ресми логотипі (Image 2 бойынша).
 *
 * `full` — қос қанатты «F» эмблемасы + геометриялық FORMA сөзбелгісі.
 * `mark` — тек қос қанатты «F» эмблемасы.
 * `color` — 'dark' (қара) немесе 'white' (ақ).
 */
import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const logoDark = require('../../assets/forma-logo.png');
const logoWhite = require('../../assets/forma-logo-white.png');
const markDark = require('../../assets/forma-mark.png');
const markWhite = require('../../assets/forma-mark-white.png');

type Props = {
  variant?: 'full' | 'mark';
  color?: 'dark' | 'white';
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function FormaLogo({
  variant = 'full',
  color = 'dark',
  height = 24,
  style,
}: Props) {
  const isMark = variant === 'mark';
  const isWhite = color === 'white';
  const source = isMark
    ? isWhite
      ? markWhite
      : markDark
    : isWhite
    ? logoWhite
    : logoDark;

  // Aspect ratio: full is 735 / 131 ~= 5.61; mark is 126 / 131 ~= 0.96
  const aspectRatio = isMark ? 126 / 131 : 735 / 131;
  const width = Math.round(height * aspectRatio);

  return (
    <Image
      source={source}
      style={[{ width, height, resizeMode: 'contain' }, style]}
      accessibilityLabel="FORMA"
    />
  );
}
