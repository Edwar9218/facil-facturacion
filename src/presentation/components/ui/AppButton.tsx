import { Feather } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { AppText } from "./AppText";

type Variant = "primary" | "outline" | "danger" | "success" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  iconLeft?: keyof typeof Feather.glyphMap;
  iconRight?: keyof typeof Feather.glyphMap;
}

export const AppButton = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  iconLeft,
  iconRight,
}: Props) => {
  const { colors, sizes, radius, shadows, typography, spacing } = useTheme();

  const heights: Record<Size, number> = {
    sm: sizes.btnHeightSm,
    md: sizes.btnHeightMd,
    lg: sizes.btnHeightLg,
  };

  const fontSizes: Record<Size, number> = {
    sm: typography.size.sm,
    md: typography.size.md,
    lg: typography.size.lg,
  };

  const iconSizes: Record<Size, number> = {
    sm: sizes.iconXs,
    md: sizes.iconSm,
    lg: sizes.iconMd,
  };

  const bgColors: Record<Variant, string> = {
    primary: colors.primary,
    outline: "transparent",
    danger: colors.danger,
    success: colors.success,
    ghost: "transparent",
  };

  const textColors: Record<Variant, string> = {
    primary: colors.white,
    outline: colors.primary,
    danger: colors.white,
    success: colors.white,
    ghost: colors.primary,
  };

  const borderColors: Record<Variant, string> = {
    primary: colors.primary,
    outline: colors.primary,
    danger: colors.danger,
    success: colors.success,
    ghost: "transparent",
  };

  const shadowStyles: Record<Variant, object> = {
    primary: shadows.primary,
    outline: shadows.none,
    danger: shadows.none,
    success: shadows.success,
    ghost: shadows.none,
  };

  const resolvedBg = disabled ? "#C4CBD8" : bgColors[variant];
  const resolvedText = disabled ? colors.white : textColors[variant];
  const resolvedShadow = disabled ? shadows.none : shadowStyles[variant];

  return (
    <TouchableOpacity
      style={[
        {
          height: heights[size],
          backgroundColor: resolvedBg,
          borderRadius: radius.lg,
          borderWidth: variant === "outline" || variant === "ghost" ? 1.5 : 0,
          borderColor: borderColors[variant],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.lg,
          ...resolvedShadow,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.75}
      disabled={disabled}
    >
      {iconLeft && (
        <Feather name={iconLeft} size={iconSizes[size]} color={resolvedText} />
      )}

      <AppText
        variant="bodyBold"
        color={resolvedText}
        style={{ fontSize: fontSizes[size] }}
      >
        {label}
      </AppText>

      {iconRight && (
        <Feather name={iconRight} size={iconSizes[size]} color={resolvedText} />
      )}
    </TouchableOpacity>
  );
};
