import React from "react";
import {
    Text,
    TextInput,
    TextInputProps,
    View
} from "react-native";
import { useTheme } from "../../../theme";

interface Props extends TextInputProps {
  label?: string;
  prefix?: string;
  error?: string;
}

export const AppInput = ({ label, prefix, error, style, ...props }: Props) => {
  const { colors, typography, spacing, radius, sizes } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.ink,
            marginBottom: spacing.xs,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.grayBg,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.grayBorder,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          minHeight: sizes.inputHeightMd,
        }}
      >
        {prefix && (
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: colors.grayText,
              marginRight: spacing.xs,
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          style={[
            {
              flex: 1,
              fontSize: typography.size.md,
              color: colors.ink,
              paddingVertical: spacing.sm,
            },
            style,
          ]}
          placeholderTextColor={colors.grayText}
          {...props}
        />
      </View>

      {error && (
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.danger,
            marginTop: spacing.xxs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
