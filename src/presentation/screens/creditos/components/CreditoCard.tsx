// src/presentation/screens/creditos/components/CreditoCard.tsx

import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { ResumenCredito } from "../../../../domain/entities/Credito";
import { useTheme } from "../../../../theme";
import { AppCard } from "../../../components/ui/AppCard";
import { AppText } from "../../../components/ui/AppText";

interface Props {
  resumen: ResumenCredito;
  onPress: (clienteId: string) => void;
}

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

export const CreditoCard = ({ resumen, onPress }: Props) => {
  const { colors, spacing, sizes, radius } = useTheme();

  return (
    <AppCard
      onPress={() => onPress(resumen.clienteId)}
      style={{ marginBottom: spacing.md, minHeight: 100 }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        {/* Avatar */}
        <View
          style={{
            width: sizes.avatarMd,
            height: sizes.avatarMd,
            borderRadius: sizes.avatarMd / 2,
            backgroundColor: colors.dangerLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="h3" color={colors.danger}>
            {/* Aquí sí está bien usar substring para sacar las 2 primeras letras */}
            {resumen.nombreCliente.substring(0, 2).toUpperCase()}
          </AppText>
        </View>

        {/* Info principal (Flex 1 permite que ocupe el espacio sin empujar el precio) */}
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" numberOfLines={1}>
            {resumen.nombreCliente}
          </AppText>

          {resumen.telefono && (
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
                color={colors.grayText}
              />
              <AppText variant="caption" color={colors.grayText}>
                {resumen.telefono}
              </AppText>
            </View>
          )}

          {resumen.direccion && (
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
              {/* numberOfLines={1} se encarga de los puntos suspensivos si es muy largo */}
              <AppText
                variant="caption"
                numberOfLines={1}
                color={colors.grayText}
              >
                {resumen.direccion}
              </AppText>
            </View>
          )}
        </View>

        {/* Saldo */}
        <View style={{ alignItems: "flex-end", gap: spacing.xxs }}>
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xxs,
              borderRadius: radius.full,
              backgroundColor: colors.dangerLight,
            }}
          >
            <AppText variant="captionBold" color={colors.danger}>
              En mora
            </AppText>
          </View>
          <AppText variant="captionBold" color={colors.danger}>
            {fmt(resumen.saldoActual)}
          </AppText>
        </View>

        {/* Icono de chevron (Opcional, pero da feedback visual de que es clicable) */}
        <MaterialIcons
          name="chevron-right"
          size={sizes.iconMd}
          color={colors.grayText}
        />
      </View>
    </AppCard>
  );
};
