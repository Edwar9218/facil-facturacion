import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, View } from "react-native";
import {
  EstadoStock,
  Producto,
  getEstadoStock,
} from "../../../../domain/entities/Producto";
import { useTheme } from "../../../../theme";
import { AppCard } from "../../../components/ui/AppCard";
import { AppText } from "../../../components/ui/AppText";

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

// ── Colores y textos por estado de stock ──────────────────────────────────────
const STOCK_CONFIG: Record<
  EstadoStock,
  { color: string; bg: string; label: string } | null
> = {
  "sin-control": null, // no mostrar nada
  ok: { color: "#16A34A", bg: "#DCFCE7", label: "En stock" },
  bajo: { color: "#D97706", bg: "#FEF3C7", label: "Stock bajo" },
  agotado: { color: "#DC2626", bg: "#FEE2E2", label: "Agotado" },
};

interface Props {
  producto: Producto;
  onPress: (producto: Producto) => void;
  mostrarStock?: boolean; // viene de AjustesScreen (toggle global)
}

export const ProductoCard = ({
  producto,
  onPress,
  mostrarStock = false,
}: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

  const estadoStock = getEstadoStock(producto);
  const stockConfig = STOCK_CONFIG[estadoStock];

  return (
    <AppCard
      onPress={() => onPress(producto)}
      style={{ marginBottom: spacing.md }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        {/* Imagen o ícono */}
        {producto.imagen ? (
          <Image
            source={{ uri: producto.imagen }}
            style={{
              width: sizes.productImageMd,
              height: sizes.productImageMd,
              borderRadius: radius.md,
            }}
          />
        ) : (
          <View
            style={{
              width: sizes.productImageMd,
              height: sizes.productImageMd,
              borderRadius: radius.md,
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name="inventory-2"
              size={sizes.iconLg}
              color={colors.primary}
            />
          </View>
        )}

        {/* Info */}
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold">{producto.nombre}</AppText>

          {/* Badge de estado de stock (solo si inventario global activo y hay config) */}
          {mostrarStock && stockConfig && (
            <View
              style={{
                backgroundColor: stockConfig.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                marginRight: spacing.sm,
              }}
            >
              <AppText
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: stockConfig.color,
                }}
              >
                {stockConfig.label}
              </AppText>
            </View>
          )}

          <AppText variant="caption" style={{ marginTop: spacing.xxs }}>
            📦 {producto.stock ?? 0} {producto.unidad} disponibles
          </AppText>

          <AppText
            variant="bodyBold"
            color={colors.primary}
            style={{ marginTop: spacing.xxs }}
          >
            {fmt(producto.precio)}
          </AppText>
        </View>

        {/* 3 puntos visual */}
        <MaterialIcons
          name="more-vert"
          size={sizes.iconLg}
          color={colors.grayText}
        />
      </View>
    </AppCard>
  );
};
