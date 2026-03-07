const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 40,
  8: 48,
  9: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  section: 48,
  compactCard: 16,
  standardCard: 24,
  controlGapTight: 12,
  controlGapDefault: 16,
};

export const space = (token) => `${spacing[token]}px`;

export default spacing;
