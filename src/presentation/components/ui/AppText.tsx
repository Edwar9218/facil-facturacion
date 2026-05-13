import React from "react";
import { Text, TextStyle } from "react-native";
import { useTheme } from "../../../theme";

type Variant =
  | "hero"
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyBold"
  | "label"
  | "caption"
  | "captionBold";

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  align?: "left" | "center" | "right";
}

export const AppText = ({
  children,
  variant = "body",
  color,
  style,
  numberOfLines,
  align = "left",
}: Props) => {
  const { typography, colors } = useTheme();

  const variantStyles: Record<Variant, TextStyle> = {
    hero: {
      fontSize: typography.size.hero,
      fontWeight: typography.weight.black,
      color: colors.primary,
      letterSpacing: typography.letterSpacing.tight,
    },
    display: {
      fontSize: typography.size.display,
      fontWeight: typography.weight.black,
      color: colors.primary,
      letterSpacing: typography.letterSpacing.tight,
    },
    h1: {
      fontSize: typography.size.xxxl,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    h2: {
      fontSize: typography.size.xxl,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    h3: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    body: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.regular,
      color: colors.inkSoft,
    },
    bodyBold: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    label: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.bold,
      color: colors.grayText,
    },
    caption: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.regular,
      color: colors.grayText,
    },
    captionBold: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.bold,
      color: colors.grayText,
    },
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        variantStyles[variant],
        { textAlign: align },
        color ? { color } : {},
        style,
      ]}
    >
      {children}
    </Text>
  );
};
