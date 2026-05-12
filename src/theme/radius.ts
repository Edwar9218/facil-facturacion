export const radius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  full: 999,
} as const;

export type Radius = typeof radius;
