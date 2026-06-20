import { colors, colorsDark } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { sizes } from "./sizes";
import { spacing } from "./spacing";
import { buildTypography } from "./typography";

export const lightTheme = {
  colors,
  typography: buildTypography("normal"),
  spacing,
  radius,
  sizes,
  shadows,
  isDark: false,
};

export const darkTheme = {
  colors: colorsDark,
  typography: buildTypography("normal"),
  spacing,
  radius,
  sizes,
  shadows,
  isDark: true,
};

export type Theme = typeof lightTheme;
