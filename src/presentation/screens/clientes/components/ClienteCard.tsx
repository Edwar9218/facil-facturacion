import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Cliente } from "../../../../domain/entities/Cliente";
import { useTheme } from "../../../../theme";
import { AppCard } from "../../../components/ui/AppCard";
import { AppText } from "../../../components/ui/AppText";

interface Props {
  cliente: Cliente;
  enMora: boolean;
  totalDeuda: number;
  onPress: (cliente: Cliente) => void;
}

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

export const ClienteCard = ({
  cliente,
  enMora,
  totalDeuda,
  onPress,
}: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

  return (
    <AppCard
      onPress={() => onPress(cliente)}
      style={{ marginBottom: spacing.md, minHeight: 100 }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        {/* Avatar inicial */}
        <View
          style={{
            width: sizes.avatarMd,
            height: sizes.avatarMd,
            borderRadius: sizes.avatarMd / 2,
            backgroundColor: enMora ? colors.dangerLight : colors.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="h3" color={enMora ? colors.danger : colors.primary}>
            {cliente.nombre.charAt(0).toUpperCase()}
          </AppText>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" numberOfLines={1}>
            {cliente.nombre.length > 20
              ? cliente.nombre.substring(0, 20) + "…"
              : cliente.nombre}
          </AppText>

          {/* Teléfono */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xxs,
              marginTop: spacing.xxs,
            }}
          >
            <MaterialIcons
              name="phone"
              size={sizes.iconXs}
              color={colors.primary}
            />
            <AppText variant="caption" color={colors.primary}>
              {cliente.telefono}
            </AppText>
          </View>

          {/* Dirección */}
          {cliente.direccion && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xxs,
                marginTop: spacing.xxs,
              }}
            >
              <MaterialIcons
                name="location-on"
                size={sizes.iconXs}
                color={colors.grayText}
              />
              <AppText variant="caption" numberOfLines={1}>
                {cliente.direccion.length > 24
                  ? cliente.direccion.substring(0, 24) + "…"
                  : cliente.direccion}
              </AppText>
            </View>
          )}
        </View>

        {/* Lado derecho */}
        <View style={{ alignItems: "flex-end", gap: spacing.xxs }}>
          {/* Badge mora / al día */}
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
              borderRadius: radius.full,
              backgroundColor: enMora
                ? colors.dangerLight
                : colors.successLight,
            }}
          >
            <AppText
              variant="captionBold"
              color={enMora ? colors.danger : colors.success}
            >
              {enMora ? "En mora" : "Al día"}
            </AppText>
          </View>

          {/* Deuda si está en mora */}
          {enMora && (
            <AppText variant="captionBold" color={colors.danger}>
              {fmt(totalDeuda)}
            </AppText>
          )}

          {/* 3 puntos visual */}
          <MaterialIcons
            name="more-vert"
            size={sizes.iconMd}
            color={colors.grayText}
          />
        </View>
      </View>
    </AppCard>
  );
};
