// Base 4px — escala 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  max: 64,
} as const;

export type Spacing = typeof spacing;
