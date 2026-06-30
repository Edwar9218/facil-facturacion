import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { ConfiguracionRepositoryImpl } from "../../../data/repositories/ConfiguracionRepositoryImpl";
import { CONFIG_KEYS } from "../../../domain/entities/Configuracion";
import { useTheme } from "../../../theme";
import { FontScale } from "../../../theme/typography";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

const configRepo = new ConfiguracionRepositoryImpl();

const ESCALAS: { key: FontScale; label: string; desc: string }[] = [
  { key: "pequeño", label: "Pequeño", desc: "A" },
  { key: "normal", label: "Normal", desc: "A" },
  { key: "grande", label: "Grande", desc: "A" },
  { key: "extraGrande", label: "Extra grande", desc: "A" },
];

export const AjustesScreen = () => {
  const router = useRouter();
  const { spacing, colors, radius, typography, fontScale, setFontScale } =
    useTheme();

  const [inventarioActivo, setInventarioActivo] = React.useState(false);
  const [cargandoConfig, setCargandoConfig] = React.useState(true);

  React.useEffect(() => {
    const cargar = async () => {
      const valor = await configRepo.get(CONFIG_KEYS.INVENTARIO_ACTIVO);
      setInventarioActivo(valor === "1");
      setCargandoConfig(false);
    };
    cargar();
  }, []);

  const toggleInventario = async (nuevoValor: boolean) => {
    setInventarioActivo(nuevoValor);
    await configRepo.set(CONFIG_KEYS.INVENTARIO_ACTIVO, nuevoValor ? "1" : "0");
  };

  return (
    <ScreenWrapper showBtnB={false} title="Ajustes">
      <View
        style={[
          s.container,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
        ]}
      >
        {/* ── TOGGLE INVENTARIO ───────────────────────────────────────────── */}
        <View
          style={[
            s.card,
            {
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="package-variant"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Control de inventario
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              {inventarioActivo
                ? "Activo · El stock se descuenta al vender"
                : "Inactivo · Las ventas no afectan el stock"}
            </AppText>
          </View>
          <Switch
            value={inventarioActivo}
            onValueChange={toggleInventario}
            disabled={cargandoConfig}
            trackColor={{ false: colors.grayBorder, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {/* ── GESTIÓN DE DATOS ─────────────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push("/gestion-datos")}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="database-cog-outline"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Gestión de datos
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Respaldos, restauración y restablecimiento de fábrica.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.grayText}
          />
        </Pressable>

        {/* ── AYUDA ───────────────────────────────────────────────────────── */}
        <Pressable
          onPress={() => router.push("/ayuda")}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: pressed ? colors.grayBg : colors.white,
              borderRadius: radius.lg,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chat-question"
            size={38}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: typography.size.md,
                fontWeight: "700",
                color: colors.ink,
                marginBottom: 4,
              }}
            >
              Ayuda y soporte
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Resuelve dudas o contacta con soporte técnico.
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.grayText}
          />
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 100,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
});
