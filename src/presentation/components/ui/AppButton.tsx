import React from "react";
import { Text, TouchableOpacity, ViewStyle } from "react-native";
import { useTheme } from "../../../theme";

type Variant = "primary" | "outline" | "danger" | "success" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const AppButton = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  icon,
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

  return (
    <TouchableOpacity
      style={[
        {
          height: heights[size],
          backgroundColor: disabled ? "#C4CBD8" : bgColors[variant],
          borderRadius: radius.lg,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: borderColors[variant],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.lg,
          ...(disabled ? {} : variant === "primary" ? shadows.primary : {}),
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.75}
      disabled={disabled}
    >
      {icon}
      <Text
        style={{
          fontSize: fontSizes[size],
          fontWeight: typography.weight.bold,
          color: disabled ? colors.white : textColors[variant],
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};
