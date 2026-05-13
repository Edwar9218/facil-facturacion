import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme";
import { AppText } from "./AppText";

type TipoInput = "texto" | "numero" | "precio" | "selector" | "telefono";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  tipo?: TipoInput;
  prefix?: string;
  onPressSelector?: () => void;
  valorSelector?: string;
}

export const AppInput = ({
  label,
  error,
  tipo = "texto",
  prefix,
  onPressSelector,
  valorSelector,
  style,
  ...props
}: Props) => {
  const { colors, typography, spacing, radius, sizes } = useTheme();

  const containerStyle = {
    backgroundColor: colors.grayBg,
    borderWidth: 1,
    borderColor: error ? colors.danger : colors.grayBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  };

  const inputStyle = {
    fontSize: typography.size.md,
    color: colors.ink,
    paddingVertical: spacing.sm,
  };

  // ── Selector (dropdown) ──────────────────────────────────────────────────
  if (tipo === "selector") {
    return (
      <View style={{ marginBottom: spacing.md }}>
        {label && (
          <AppText
            variant="label"
            color={colors.ink}
            style={{ marginBottom: spacing.xs }}
          >
            {label}
          </AppText>
        )}
        <TouchableOpacity
          style={{
            backgroundColor: colors.grayBg,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.grayBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm, // ← mismo padding que los otros inputs
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: sizes.inputHeightMd, // ← misma altura que los otros
          }}
          onPress={onPressSelector}
          activeOpacity={0.7}
        >
          <AppText
            variant="body"
            color={valorSelector ? colors.ink : colors.grayText}
          >
            {valorSelector ?? "Selecciona..."}
          </AppText>
          <Feather
            name="chevron-down"
            size={sizes.iconSm}
            color={colors.grayText}
          />
        </TouchableOpacity>
        {error && (
          <AppText
            variant="caption"
            color={colors.danger}
            style={{ marginTop: spacing.xxs }}
          >
            {error}
          </AppText>
        )}
      </View>
    );
  }

  // ── Precio ───────────────────────────────────────────────────────────────
  if (tipo === "precio") {
    return (
      <View style={{ marginBottom: spacing.md }}>
        {label && (
          <AppText
            variant="label"
            color={colors.ink}
            style={{ marginBottom: spacing.xs }}
          >
            {label}
          </AppText>
        )}
        <View
          style={{
            ...containerStyle,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 0,
          }}
        >
          <AppText
            variant="h3"
            color={colors.grayText}
            style={{ marginRight: spacing.xs }}
          >
            $
          </AppText>
          <TextInput
            style={[{ flex: 1, ...inputStyle }, style]}
            placeholderTextColor={colors.grayText}
            keyboardType="numeric"
            {...props}
          />
        </View>
        {error && (
          <AppText
            variant="caption"
            color={colors.danger}
            style={{ marginTop: spacing.xxs }}
          >
            {error}
          </AppText>
        )}
      </View>
    );
  }

  // ── Texto / Número / Teléfono ─────────────────────────────────────────────
  const keyboardTypes = {
    texto: "default" as const,
    numero: "numeric" as const,
    telefono: "phone-pad" as const,
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <AppText
          variant="label"
          color={colors.ink}
          style={{ marginBottom: spacing.xs }}
        >
          {label}
        </AppText>
      )}
      <View style={{ ...containerStyle, marginBottom: 0 }}>
        {prefix && (
          <AppText
            variant="h3"
            color={colors.grayText}
            style={{ marginRight: spacing.xs }}
          >
            {prefix}
          </AppText>
        )}
        <TextInput
          style={[inputStyle, style]}
          placeholderTextColor={colors.grayText}
          keyboardType={
            keyboardTypes[tipo as keyof typeof keyboardTypes] ?? "default"
          }
          {...props}
        />
      </View>
      {error && (
        <AppText
          variant="caption"
          color={colors.danger}
          style={{ marginTop: spacing.xxs }}
        >
          {error}
        </AppText>
      )}
    </View>
  );
};
