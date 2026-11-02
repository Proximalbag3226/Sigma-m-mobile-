import { TextStyle } from 'react-native';

export const colors = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  ink: '#111111',
  text: '#262626',
  muted: '#737373',
  faint: '#A3A3A3',
  line: '#E7E5E4',
  ok: '#3F6B4F',
  okBg: '#EFF4F0',
  bad: '#8F3B3B',
  badBg: '#F7EFEF',
  warn: '#7A5F1C',
  warnBg: '#F8F3E6',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16 };

export const type = {
  title: { fontSize: 30, fontWeight: '600', letterSpacing: -0.6, color: colors.ink } as TextStyle,
  heading: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, color: colors.ink } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, color: colors.text } as TextStyle,
  small: { fontSize: 13, lineHeight: 18, color: colors.muted } as TextStyle,
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muted,
  } as TextStyle,
  mono: { fontVariant: ['tabular-nums'], letterSpacing: 1 } as TextStyle,
};
