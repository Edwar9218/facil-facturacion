import { colors, colorsDark } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { sizes } from "./sizes";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const lightTheme = {
  colors,
  typography,
  spacing,
  radius,
  sizes,
  shadows,
  isDark: false,
} as const;

export const darkTheme = {
  colors: colorsDark,
  typography,
  spacing,
  radius,
  sizes,
  shadows,
  isDark: true,
} as const;

export type Theme = typeof lightTheme;
