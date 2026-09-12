/**
 * Forma иконкалары.
 *
 * Барлық path деректері design/*.dc.html макеттерінен ДӘЛ көшірілген.
 * Ойдан иконка сызбаңыз — макетте жоқ болса, алдымен дизайнға қосылсын.
 *
 * Ереже (CLAUDE.md §3): эмодзи ЖОҚ, бәрі react-native-svg, stroke-based,
 * strokeWidth 2–2.4, strokeLinecap="round".
 */
import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { color as C } from '../../theme/tokens';

export type IconProps = {
  size?: number;
  color?: string;
  /** Макетте иконка сайын әртүрлі — сондықтан токен емес, проп */
  strokeWidth?: number;
};

type BaseProps = IconProps & { children: React.ReactNode; sw: number };

/** Барлық stroke иконкаға ортақ қаптама */
function Base({ size = 22, color = C.ink, strokeWidth, sw, children }: BaseProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth ?? sw}
      strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
}

/** Толтырылған (fill) иконкаларға арналған қаптама */
function Filled({ size = 22, color = C.ink, children }: Omit<IconProps, 'strokeWidth'> & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      {children}
    </Svg>
  );
}

// ── Навигация ────────────────────────────────────────────────────

export const HomeIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M3 10.5L12 3l9 7.5" />
    <Path d="M5.5 9.5V20h13V9.5" />
  </Base>
);

export const CalendarIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <Path d="M8 2.5v5M16 2.5v5M3.5 10.5h17" />
  </Base>
);

/** Күн белгісінің чипіндегі кіші нұсқа — тісшесіз */
export const CalendarChipIcon = (p: IconProps) => (
  <Base {...p} sw={2.6}>
    <Rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <Path d="M3.5 10.5h17" />
  </Base>
);

/** Ортаңғы FAB — Forma логотипі */
export const DiamondIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M12 2.6l8.4 9.4L12 21.4 3.6 12z" />
  </Base>
);

export const BarChartIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M4 20V11M10 20V5M16 20v-6M22 20H2" />
  </Base>
);

export const BookmarkIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M4 3.5h16v17l-8-4-8 4z" />
  </Base>
);

export const UserIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4.5 20.5c1.5-4 4.2-5.5 7.5-5.5s6 1.5 7.5 5.5" />
  </Base>
);

// ── Хедер және басқару ───────────────────────────────────────────

export const MenuIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M4 7h16M4 12h16M4 17h10" />
  </Base>
);

/** Сүзгі / реттеу — хедердің оң жағы */
export const FilterIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M4 6h16M7 12h10M10 18h4" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p} sw={1.8}>
    <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
    <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Circle cx="11" cy="11" r="7" />
    <Path d="M16.5 16.5L21 21" />
  </Base>
);

export const DotsIcon = (p: IconProps) => {
  const { size = 22, color = C.ink } = p;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="5" r="1.6" />
      <Circle cx="12" cy="12" r="1.6" />
      <Circle cx="12" cy="19" r="1.6" />
    </Svg>
  );
};

export const PlusIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p} sw={2.8}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

// ── Бағыттауыштар ────────────────────────────────────────────────

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M15 5l-7 7 7 7" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p} sw={2.4}>
    <Path d="M9 5l7 7-7 7" />
  </Base>
);

/** Жиналмалы период ауыстырғышы — 180° бұрылады */
export const ChevronUpIcon = (p: IconProps) => (
  <Base {...p} sw={2.6}>
    <Path d="M5 15l7-7 7 7" />
  </Base>
);

// ── Күй және мазмұн ──────────────────────────────────────────────

export const CheckIcon = (p: IconProps) => (
  <Base {...p} sw={3.6}>
    <Path d="M4 12.5l5 5L20 6.5" />
  </Base>
);

/** Рефлексия жазылған тапсырманың белгісі */
export const ChatIcon = (p: IconProps) => (
  <Base {...p} sw={1.9}>
    <Path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4.2-1L3 20l1.2-4.6A8.4 8.4 0 0 1 21 11.5z" />
  </Base>
);

/** Серия (streak) белгісі */
export const StarIcon = (p: IconProps) => (
  <Base {...p} sw={2.4}>
    <Path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />
  </Base>
);

export const PencilIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M16.5 3.5l4 4L8 20H4v-4z" />
  </Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10.5 10v6M13.5 10v6" />
  </Base>
);

export const InfoIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 11v5.5M12 7.8v.2" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p} sw={2.6}>
    <Circle cx="12" cy="12" r="8.5" />
    <Path d="M12 7.5V12l3 2" />
  </Base>
);

export const MailIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Rect x="2.5" y="4.5" width="19" height="15" rx="3" />
    <Path d="M3.5 7l8.5 6 8.5-6" />
  </Base>
);

export const PhoneIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M17 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-15a2 2 0 0 0-2-2z" />
    <Path d="M11 18.5h2" />
  </Base>
);

// ── Панель тұрақты сілтемелері ───────────────────────────────────

/** Баптау — тісті доңғалақ */
export const SettingsIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Circle cx="12" cy="12" r="3.1" />
    <Path d="M19.1 14.6a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V21a2 2 0 0 1-4 0v-.09a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3a2 2 0 0 1 0-4h.09a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 .97-1.47V3a2 2 0 0 1 4 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47.97H21a2 2 0 0 1 0 4h-.09a1.6 1.6 0 0 0-1.47.97z" />
  </Base>
);

/** Шығу */
export const LogOutIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 16.5l4.5-4.5L16 7.5" />
    <Path d="M20.5 12h-11" />
  </Base>
);

/** Хабарлама — панельдегі көмек бөлімі */
export const HeadsetIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <Path d="M20 15.5a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z" />
    <Path d="M4 15.5a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2z" />
    <Path d="M20 17.5v.5a3 3 0 0 1-3 3h-2.5" />
  </Base>
);

// ── Фокус таймері ────────────────────────────────────────────────

export const PlayIcon = (p: Omit<IconProps, 'strokeWidth'>) => (
  <Filled {...p}>
    <Path d="M7.5 4.8v14.4c0 1 1.1 1.6 1.9 1.1l11.1-7.2c.8-.5.8-1.7 0-2.2L9.4 3.7c-.8-.5-1.9.1-1.9 1.1z" />
  </Filled>
);

export const PauseIcon = (p: Omit<IconProps, 'strokeWidth'>) => (
  <Filled {...p}>
    <Rect x="6.5" y="4.5" width="4.4" height="15" rx="1.6" />
    <Rect x="13.1" y="4.5" width="4.4" height="15" rx="1.6" />
  </Filled>
);

export const ResetIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <Path d="M3.5 4.5V10h5.5" />
  </Base>
);

/** Фокус баптауы — екі жүгірткі */
export const SlidersIcon = ({ size = 22, color = C.ink, bg = C.darkBg0 }: IconProps & { bg?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Path d="M4 8h16M4 16h16" />
    <Circle cx="9" cy="8" r="2.4" fill={bg} />
    <Circle cx="15" cy="16" r="2.4" fill={bg} />
  </Svg>
);

// ── Мотивация ────────────────────────────────────────────────────

/** Тырнақша — мотивация карточкасы. Тек fill, stroke жоқ. */
export const QuoteIcon = (p: Omit<IconProps, 'strokeWidth'>) => (
  <Filled {...p}>
    <Path d="M9.5 5.5c-3 1.4-5 4.3-5 7.6V19h6.4v-6.4H7.3c0-2 1-3.6 2.9-4.6zm9.5 0c-3 1.4-5 4.3-5 7.6V19h6.4v-6.4h-3.6c0-2 1-3.6 2.9-4.6z" />
  </Filled>
);

// ── Apple ID ─────────────────────────────────────────────────────

export const AppleIcon = ({ size = 17, color = '#FFFFFF' }: Omit<IconProps, 'strokeWidth'>) => (
  <Filled size={size} color={color}>
    <Path d="M17.05 12.54c-.02-2.2 1.79-3.25 1.87-3.3-1.02-1.49-2.6-1.7-3.17-1.72-1.35-.14-2.63.79-3.31.79-.68 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.58 2.16-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.74 2.19 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.48zM14.9 5.6c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.3-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.21z" />
  </Filled>
);

// ── «Менің ойларым» тулбары (4-фаза) ─────────────────────────────

export const TextToolIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M5 6.5V4.5h14v2M12 4.5V20M9 20h6" />
  </Base>
);

export const PenToolIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M16.5 3.5l4 4L8 20H4v-4z" />
    <Path d="M13.5 6.5l4 4" />
  </Base>
);

export const MarkerToolIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M9 14l-3.5 3.5V21h4l3-3" />
    <Path d="M12.5 18.5L20 11a2.8 2.8 0 0 0 0-4l-3-3a2.8 2.8 0 0 0-4 0L5.5 11.5z" />
  </Base>
);

export const EraserToolIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M8 20H20" />
    <Path d="M14.5 3.5l6 6-9 9h-5l-3-3z" />
  </Base>
);

export const UndoIcon = (p: IconProps) => (
  <Base {...p} sw={2.2}>
    <Path d="M4 9h11a5 5 0 0 1 0 10h-6" />
    <Path d="M8 5L4 9l4 4" />
  </Base>
);

// ── Кіру экранының сақиналы белгісі ──────────────────────────────

/** Үш қабатты каскад сақинасы — тек Kiru экраны */
export const CascadeMark = ({ size = 240 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
    <G>
      <Circle cx="120" cy="120" r="104" stroke={C.accentLine} strokeWidth={1.5} strokeDasharray="3 6" />
      <Circle cx="120" cy="120" r="104" stroke={C.accent} strokeWidth={4} strokeLinecap="round"
        strokeDasharray="653.45" strokeDashoffset={379} transform="rotate(-90 120 120)" />
      <Circle cx="120" cy="120" r="78" stroke={C.accentLine3} strokeWidth={4} />
      <Circle cx="120" cy="120" r="78" stroke={C.accent3} strokeWidth={4} strokeLinecap="round"
        strokeDasharray="490.09" strokeDashoffset={186} transform="rotate(-90 120 120)" />
      <Circle cx="120" cy="120" r="54" stroke={C.tintChip} strokeWidth={4} />
      <Circle cx="120" cy="120" r="54" stroke={C.accent5} strokeWidth={4} strokeLinecap="round"
        strokeDasharray="339.29" strokeDashoffset={129} transform="rotate(-90 120 120)" />
      <Path d="M120 92l24.2 27.1L120 146.2 95.8 119.1z" fill="#FFFFFF" stroke={C.accent} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx="120" cy="119" r="6" fill={C.accent} />
    </G>
  </Svg>
);

/** Әкімші қалқаны */
export const ShieldIcon = (p: IconProps) => (
  <Base {...p} sw={2}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Base>
);

