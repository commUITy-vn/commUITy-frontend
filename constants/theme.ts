import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    // Backgrounds
    appBG: '#F3F4F6',
    componentBG: '#FFFFFF',
    highlightBG: '#F9FAFB',
    splashBG: '#F97316',

    // Borders
    border: '#E5E7EB',
    borderLighter: '#F3F4F6',
    bordersBold: '#D1D5DB',
    borderFocus: '#F97316',

    // Text
    text: '#0F172A',
    textSupporting: '#64748B',
    textLight: '#FFFFFF',
    textDark: '#0F172A',
    textReversed: '#FFFFFF',
    textMutedReversed: '#94A3B8',

    // Icons
    icon: '#64748B',
    iconHovered: '#0F172A',
    iconSuccessFill: '#10B981',
    iconDangerFill: '#EF4444',
    iconReversed: '#FFFFFF',

    // Buttons
    buttonDefaultBG: '#F8FAFC',
    buttonHoveredBG: '#F1F5F9',
    buttonPressedBG: '#E2E8F0',
    buttonSuccessText: '#FFFFFF',

    // States (Expensify-aligned success green)
    success: '#03D47C',
    successHover: '#00C271',
    successPressed: '#35DD96',
    danger: '#EF4444',
    dangerHover: '#DC2626',
    dangerPressed: '#B91C1C',
    warning: '#F59E0B',

    // Links
    link: '#F97316',
    linkHover: '#EA580C',

    // Primary (Brand Orange)
    primary: '#F97316',
    primaryHover: '#EA580C',
    primaryPressed: '#C2410C',

    // Highlights
    hoverComponentBG: '#F8FAFC',
    activeComponentBG: '#F1F5F9',

    // Form
    placeholderText: '#94A3B8',

    // Other
    overlay: 'rgba(15, 23, 42, 0.5)',
    inverse: '#0F172A',
    spinner: '#F97316',
    offline: '#64748B',
    error: '#EF4444',
    tintColor: '#F97316',
  },
  dark: {
    // Backgrounds
    appBG: '#0F172A',
    componentBG: '#1E293B',
    highlightBG: '#1E293B',
    splashBG: '#F97316',

    // Borders
    border: '#334155',
    borderLighter: '#1E293B',
    bordersBold: '#475569',
    borderFocus: '#F97316',

    // Text
    text: '#F8FAFC',
    textSupporting: '#94A3B8',
    textLight: '#FFFFFF',
    textDark: '#F8FAFC',
    textReversed: '#0F172A',
    textMutedReversed: '#64748B',

    // Icons
    icon: '#94A3B8',
    iconHovered: '#F8FAFC',
    iconSuccessFill: '#10B981',
    iconDangerFill: '#EF4444',
    iconReversed: '#1E293B',

    // Buttons
    buttonDefaultBG: '#334155',
    buttonHoveredBG: '#475569',
    buttonPressedBG: '#64748B',
    buttonSuccessText: '#FFFFFF',

    // States (Expensify-aligned success green)
    success: '#03D47C',
    successHover: '#00C271',
    successPressed: '#35DD96',
    danger: '#EF4444',
    dangerHover: '#DC2626',
    dangerPressed: '#B91C1C',
    warning: '#FBBF24',

    // Links
    link: '#F97316',
    linkHover: '#FB923C',

    // Primary (Brand Orange)
    primary: '#F97316',
    primaryHover: '#FB923C',
    primaryPressed: '#FDBA74',

    // Highlights
    hoverComponentBG: '#334155',
    activeComponentBG: '#475569',

    // Form
    placeholderText: '#64748B',

    // Other
    overlay: 'rgba(0, 0, 0, 0.7)',
    inverse: '#F8FAFC',
    spinner: '#F97316',
    offline: '#94A3B8',
    error: '#EF4444',
    tintColor: '#F97316',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  base: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Expensify-style spacing utility styles
export const spacing = {
  // Padding
  p0: { padding: 0 },
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 12 },
  p4: { padding: 16 },
  p5: { padding: 20 },
  p6: { padding: 24 },
  p10: { padding: 40 },

  // Margin
  m0: { margin: 0 },
  m1: { margin: 4 },
  m2: { margin: 8 },
  m3: { margin: 12 },
  m4: { margin: 16 },
  m5: { margin: 20 },
  m6: { margin: 24 },

  // Margin Top
  mt0: { marginTop: 0 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
  mt4: { marginTop: 16 },
  mt5: { marginTop: 20 },
  mt6: { marginTop: 24 },

  // Margin Right
  mr0: { marginRight: 0 },
  mr1: { marginRight: 4 },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 12 },
  mr4: { marginRight: 16 },
  mr5: { marginRight: 20 },

  // Margin Bottom
  mb0: { marginBottom: 0 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mb4: { marginBottom: 16 },
  mb5: { marginBottom: 20 },
  mb6: { marginBottom: 24 },

  // Margin Left
  ml0: { marginLeft: 0 },
  ml1: { marginLeft: 4 },
  ml2: { marginLeft: 8 },
  ml3: { marginLeft: 12 },
  ml4: { marginLeft: 16 },
  ml5: { marginLeft: 20 },

  // Margin Horizontal
  mx0: { marginHorizontal: 0 },
  mx1: { marginHorizontal: 4 },
  mx2: { marginHorizontal: 8 },
  mx3: { marginHorizontal: 12 },
  mx4: { marginHorizontal: 16 },
  mx5: { marginHorizontal: 20 },

  // Margin Vertical
  my0: { marginVertical: 0 },
  my1: { marginVertical: 4 },
  my2: { marginVertical: 8 },
  my3: { marginVertical: 12 },
  my4: { marginVertical: 16 },
  my5: { marginVertical: 20 },

  // Padding Top
  pt0: { paddingTop: 0 },
  pt1: { paddingTop: 4 },
  pt2: { paddingTop: 8 },
  pt3: { paddingTop: 12 },
  pt4: { paddingTop: 16 },
  pt5: { paddingTop: 20 },

  // Padding Bottom
  pb0: { paddingBottom: 0 },
  pb1: { paddingBottom: 4 },
  pb2: { paddingBottom: 8 },
  pb3: { paddingBottom: 12 },
  pb4: { paddingBottom: 16 },
  pb5: { paddingBottom: 20 },

  // Padding Horizontal
  ph0: { paddingHorizontal: 0 },
  ph1: { paddingHorizontal: 4 },
  ph2: { paddingHorizontal: 8 },
  ph3: { paddingHorizontal: 12 },
  ph4: { paddingHorizontal: 16 },
  ph5: { paddingHorizontal: 20 },

  // Padding Vertical
  pv0: { paddingVertical: 0 },
  pv1: { paddingVertical: 4 },
  pv2: { paddingVertical: 8 },
  pv3: { paddingVertical: 12 },
  pv4: { paddingVertical: 16 },
  pv5: { paddingVertical: 20 },

  // Gap
  gap1: { gap: 4 },
  gap2: { gap: 8 },
  gap3: { gap: 12 },
  gap4: { gap: 16 },
  gap5: { gap: 20 },
};
