// src/presentation/screens/gastos/components/GastoCard.tsx

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Gasto } from "../../../../domain/entities/Gasto";
import { useTheme } from "../../../../theme";
import { AppText } from "../../../components/ui/AppText";

const fmt = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

interface Props {
  gasto: Gasto;
  onAnular: (gasto: Gasto) => void;
}

export function GastoCard({ gasto, onAnular }: Props) {
  const { colors, spacing, radius, shadows, typography } = useTheme();
  const [fotoExpandida, setFotoExpandida] = React.useState(false);

  const esEfectivo = gasto.metodoPago === "efectivo";
  const esAnulado = (gasto.estado ?? "activo") === "anulado";

  return (
    <View
      style={{
        backgroundColor: esAnulado ? "#FFF5F5" : colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: esAnulado ? "#FECACA" : colors.grayBorder,
        marginBottom: spacing.sm,
        overflow: "hidden",
        opacity: esAnulado ? 0.85 : 1,
        ...shadows.card,
      }}
    >
      {/* ── Franja lateral de método de pago ── */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: esAnulado
            ? "#EF4444"
            : esEfectivo
              ? "#2EAA6E"
              : "#7C3AED",
        }}
      />

      <View style={{ padding: spacing.md, paddingLeft: spacing.md + 8 }}>
        {/* ── Badge anulado ── */}
        {esAnulado && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#FEE2E2",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.md,
              marginBottom: spacing.sm,
              alignSelf: "flex-start",
            }}
          >
            <MaterialCommunityIcons name="cancel" size={14} color="#DC2626" />
            <AppText
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: "#DC2626",
              }}
            >
              ANULADO
            </AppText>
          </View>
        )}

        {/* ── Fila principal ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          {/* Icono categoría */}
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: radius.md,
              backgroundColor: esAnulado
                ? "#FEE2E2"
                : esEfectivo
                  ? "#E6F7EF"
                  : "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name={
                esAnulado ? "cancel" : esEfectivo ? "cash" : "bank-transfer"
              }
              size={22}
              color={esAnulado ? "#DC2626" : esEfectivo ? "#2EAA6E" : "#7C3AED"}
            />
          </View>

          {/* Descripción y categoría */}
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: typography.weight.bold,
                color: esAnulado ? "#6B7280" : colors.ink,
                textDecorationLine: esAnulado ? "line-through" : "none",
              }}
              numberOfLines={1}
            >
              {gasto.descripcion}
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.grayLight,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 20,
                }}
              >
                <AppText
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semiBold,
                    color: colors.grayText,
                  }}
                >
                  {gasto.categoria}
                </AppText>
              </View>
              {!esAnulado && (
                <AppText
                  style={{
                    fontSize: typography.size.xs,
                    color: esEfectivo ? "#2EAA6E" : "#7C3AED",
                    fontWeight: typography.weight.semiBold,
                  }}
                >
                  {esEfectivo ? "Efectivo" : "Transferencia"}
                </AppText>
              )}
            </View>
          </View>

          {/* Monto y botón anular */}
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <AppText
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.black,
                color: esAnulado ? "#9CA3AF" : "#E03E3E",
                textDecorationLine: esAnulado ? "line-through" : "none",
              }}
            >
              -{fmt(gasto.monto)}
            </AppText>

            {/* Botón anular — solo si el gasto está activo */}
            {!esAnulado && (
              <TouchableOpacity
                onPress={() => onAnular(gasto)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: radius.md,
                  backgroundColor: "#FEF3C7",
                  borderWidth: 1,
                  borderColor: "#FCD34D",
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="cancel"
                  size={16}
                  color="#D97706"
                />
                <AppText
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.bold,
                    color: "#D97706",
                  }}
                >
                  Anular
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Motivo anulación ── */}
        {esAnulado && gasto.motivoAnulacion && (
          <View
            style={{
              marginTop: spacing.sm,
              backgroundColor: "#FEF2F2",
              borderRadius: radius.md,
              padding: spacing.sm,
              flexDirection: "row",
              gap: 6,
              alignItems: "flex-start",
            }}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color="#DC2626"
              style={{ marginTop: 1 }}
            />
            <AppText
              style={{
                flex: 1,
                fontSize: typography.size.xs,
                color: "#7F1D1D",
                fontStyle: "italic",
              }}
            >
              Motivo: {gasto.motivoAnulacion}
            </AppText>
          </View>
        )}

        {/* ── Foto (si existe) ── */}
        {gasto.foto ? (
          <TouchableOpacity
            onPress={() => setFotoExpandida((v) => !v)}
            activeOpacity={0.8}
            style={{ marginTop: spacing.sm }}
          >
            <Image
              source={{ uri: gasto.foto }}
              style={{
                width: "100%",
                height: fotoExpandida ? 200 : 60,
                borderRadius: radius.md,
                backgroundColor: colors.grayLight,
              }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <AppText
                style={{
                  color: "#fff",
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semiBold,
                }}
              >
                {fotoExpandida ? "Ver menos" : "Ver foto"}
              </AppText>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
