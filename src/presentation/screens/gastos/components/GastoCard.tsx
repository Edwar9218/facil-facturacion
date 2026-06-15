// src/presentation/screens/gastos/components/GastoCard.tsx

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Gasto } from "../../../../domain/entities/Gasto";
import { useTheme } from "../../../../theme";

const fmt = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

interface Props {
  gasto: Gasto;
  onEliminar: (gasto: Gasto) => void;
}

export function GastoCard({ gasto, onEliminar }: Props) {
  const { colors, spacing, radius, shadows, typography } = useTheme();
  const [fotoExpandida, setFotoExpandida] = React.useState(false);

  const esEfectivo = gasto.metodoPago === "efectivo";

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.grayBorder,
        marginBottom: spacing.sm,
        overflow: "hidden",
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
          backgroundColor: esEfectivo ? "#2EAA6E" : "#7C3AED",
        }}
      />

      <View style={{ padding: spacing.md, paddingLeft: spacing.md + 8 }}>
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
              backgroundColor: esEfectivo ? "#E6F7EF" : "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons
              name={esEfectivo ? "cash" : "bank-transfer"}
              size={22}
              color={esEfectivo ? "#2EAA6E" : "#7C3AED"}
            />
          </View>

          {/* Descripción y categoría */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: typography.size.md,
                fontWeight: typography.weight.bold,
                color: colors.ink,
              }}
              numberOfLines={1}
            >
              {gasto.descripcion}
            </Text>
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
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semiBold,
                    color: colors.grayText,
                  }}
                >
                  {gasto.categoria}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: esEfectivo ? "#2EAA6E" : "#7C3AED",
                  fontWeight: typography.weight.semiBold,
                }}
              >
                {esEfectivo ? "Efectivo" : "Transferencia"}
              </Text>
            </View>
          </View>

          {/* Monto y eliminar */}
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.black,
                color: "#E03E3E",
              }}
            >
              -{fmt(gasto.monto)}
            </Text>
            <TouchableOpacity
              onPress={() => onEliminar(gasto)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "#FDEAEA",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={16} color="#E03E3E" />
            </TouchableOpacity>
          </View>
        </View>

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
              <Text
                style={{
                  color: "#fff",
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semiBold,
                }}
              >
                {fotoExpandida ? "Ver menos" : "Ver foto"}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
