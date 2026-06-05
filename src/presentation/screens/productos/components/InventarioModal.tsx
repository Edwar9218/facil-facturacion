// src/presentation/screens/productos/components/InventarioModal.tsx

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Switch, TextInput, TouchableOpacity, View } from "react-native";
import { Producto } from "../../../../domain/entities/Producto";
import { useTheme } from "../../../../theme";
import { AppText } from "../../../components/ui/AppText";
import { SlideModal } from "../../../components/ui/SlideModal";
import { SlideModalType } from "../../../hooks/useSlideModal";

interface Props {
  modal: SlideModalType;
  producto: Producto | null;
  onGuardar: (
    productoId: string,
    controlStock: boolean,
    stock: number,
    stockMinimo: number,
  ) => Promise<void>;
}

export const InventarioModal = ({ modal, producto, onGuardar }: Props) => {
  const { colors, spacing, radius, typography } = useTheme();

  const [controlStock, setControlStock] = React.useState(false);
  const [cantidad, setCantidad] = React.useState("");
  const [minimo, setMinimo] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);

  // Cargar valores del producto cuando abre el modal
  React.useEffect(() => {
    if (producto && modal.visible) {
      setControlStock(producto.controlStock ?? false);
      setCantidad(String(producto.stock ?? 0));
      setMinimo(String(producto.stockMinimo ?? 0));
    }
  }, [producto, modal.visible]);

  const handleGuardar = async () => {
    if (!producto) return;
    setGuardando(true);
    await onGuardar(
      producto.id,
      controlStock,
      Number(cantidad) || 0,
      Number(minimo) || 0,
    );
    setGuardando(false);
    modal.cerrar();
  };

  if (!producto) return null;

  return (
    <SlideModal modal={modal}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="h3">Inventario</AppText>
          <AppText variant="caption" style={{ marginTop: spacing.xxs }}>
            {producto.nombre}
          </AppText>
        </View>
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.full,
            backgroundColor: colors.grayText,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => modal.cerrar()}
        >
          <Feather name="x" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Toggle principal ───────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: controlStock ? "#F0FDF4" : "#F9FAFB",
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: controlStock ? "#BBF7D0" : colors.grayBorder,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          marginBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: controlStock ? "#DCFCE7" : colors.grayBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={26}
            color={controlStock ? "#16A34A" : colors.grayText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppText
            variant="bodyBold"
            color={controlStock ? "#16A34A" : colors.ink}
          >
            {controlStock ? "Llevando el control" : "¿Llevas el control?"}
          </AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {controlStock
              ? "El sistema descuenta al vender"
              : "Activa para controlar cuánto tienes"}
          </AppText>
        </View>
        <Switch
          value={controlStock}
          onValueChange={setControlStock}
          trackColor={{ false: "#E5E7EB", true: "#16A34A" }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* ── Campos (solo si control activo) ────────────────────────────── */}
      {controlStock && (
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          {/* Cantidad actual */}
          <View>
            <AppText variant="label" style={{ marginBottom: spacing.xs }}>
              ¿Cuántos tienes ahora?
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.grayBg,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.grayBorder,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                gap: spacing.xs,
              }}
            >
              <MaterialCommunityIcons
                name="counter"
                size={20}
                color={colors.grayText}
              />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: typography.size.lg,
                  fontWeight: "700",
                  color: colors.ink,
                  paddingVertical: spacing.xs,
                }}
                placeholder="0"
                placeholderTextColor={colors.grayText}
                keyboardType="numeric"
                value={cantidad}
                onChangeText={(t) => setCantidad(t.replace(/\D/g, ""))}
              />
            </View>
          </View>

          {/* Stock mínimo */}
          <View>
            <AppText variant="label" style={{ marginBottom: spacing.xs }}>
              Avisarme cuando queden menos de...
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.grayBg,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.grayBorder,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                gap: spacing.xs,
              }}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={colors.grayText}
              />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: typography.size.lg,
                  fontWeight: "700",
                  color: colors.ink,
                  paddingVertical: spacing.xs,
                }}
                placeholder="0"
                placeholderTextColor={colors.grayText}
                keyboardType="numeric"
                value={minimo}
                onChangeText={(t) => setMinimo(t.replace(/\D/g, ""))}
              />
            </View>
            <AppText
              variant="caption"
              style={{ marginTop: spacing.xxs, color: colors.grayText }}
            >
              Ejemplo: si pones 5, te avisamos cuando queden 4 o menos
            </AppText>
          </View>
        </View>
      )}

      {/* ── Botón guardar ──────────────────────────────────────────────── */}
      <TouchableOpacity
        style={{
          backgroundColor: guardando ? colors.grayText : colors.primary,
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          alignItems: "center",
          marginTop: controlStock ? 0 : spacing.lg,
        }}
        onPress={handleGuardar}
        disabled={guardando}
        activeOpacity={0.8}
      >
        <AppText variant="bodyBold" color={colors.white}>
          {guardando ? "Guardando..." : "Guardar"}
        </AppText>
      </TouchableOpacity>
    </SlideModal>
  );
};
