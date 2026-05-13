import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, View } from "react-native";
import { Producto } from "../../../../domain/entities/Producto";
import { useTheme } from "../../../../theme";
import { AppCard } from "../../../components/ui/AppCard";
import { AppText } from "../../../components/ui/AppText";

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

interface Props {
  producto: Producto;
  onPress: (producto: Producto) => void;
}

export const ProductoCard = ({ producto, onPress }: Props) => {
  const { colors, spacing, radius, sizes } = useTheme();

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
          <AppText variant="caption" style={{ marginTop: spacing.xxs }}>
            {producto.unidad} · Stock: {producto.disponible}
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
