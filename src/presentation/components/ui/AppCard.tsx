import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "../../../theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: "sm" | "md" | "lg";
  onPress?: () => void;
  activeOpacity?: number;
}

export const AppCard = ({
  children,
  style,
  padding = "md",
  onPress,
  activeOpacity = 0.7,
}: Props) => {
  const { colors, radius, shadows, spacing } = useTheme();

  const paddings = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    padding: paddings[padding],
    ...shadows.md,
  };

  // Si tiene onPress es tocable
  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Si no tiene onPress es solo visual
  return <View style={[cardStyle, style]}>{children}</View>;
};
