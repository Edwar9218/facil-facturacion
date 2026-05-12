import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "../../../theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: "sm" | "md" | "lg";
}

export const AppCard = ({ children, style, padding = "md" }: Props) => {
  const { colors, radius, shadows, spacing } = useTheme();

  const paddings = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.grayBorder,
          padding: paddings[padding],
          ...shadows.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
