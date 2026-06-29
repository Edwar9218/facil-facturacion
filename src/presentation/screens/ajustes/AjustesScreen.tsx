import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";

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

  const descargarDB = async () => {
    try {
      const origen = FileSystem.documentDirectory + "SQLite/facil.db";
      const destino = FileSystem.documentDirectory + "facil-export.db";
      await FileSystem.copyAsync({ from: origen, to: destino });
      const disponible = await Sharing.isAvailableAsync();
      if (!disponible) {
        Alert.alert("Error", "La función compartir no está disponible.");
        return;
      }
      await Sharing.shareAsync(destino, {
        mimeType: "application/octet-stream",
        dialogTitle: "Exportar Base de Datos",
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar la base de datos.");
    }
  };

  return (
    <ScreenWrapper showBtnB={false} title="Ajustes">
      <View
        style={[
          s.container,
          { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
        ]}
      >
        {/* ── TAMAÑO DE LETRA ─────────────────────────────────────────────── */}
        {/* 
        <View
          style={[
            s.section,
            {
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              s.sectionHeader,
              {
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.sm,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="format-size"
              size={28}
              color={colors.primary}
            />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText
                style={{
                  fontSize: typography.size.md,
                  fontWeight: "700",
                  color: colors.ink,
                }}
              >
                Tamaño de letra
              </AppText>
              <AppText
                style={{
                  fontSize: typography.size.sm,
                  color: colors.grayText,
                  marginTop: 2,
                }}
              >
                Ajusta el texto de toda la aplicación
              </AppText>
            </View>
          </View>

          {/* Selector de escala */}
        {/*
          <View
            style={[
              s.escalaRow,
              {
                paddingHorizontal: spacing.md,
                paddingBottom: spacing.lg,
                gap: spacing.xs,
              },
            ]}
          >
            {ESCALAS.map((escala, i) => {
              const activo = fontScale === escala.key;
              const tamLetra = 13 + i * 4;
              return (
                <TouchableOpacity
                  key={escala.key}
                  onPress={() => setFontScale(escala.key)}
                  activeOpacity={0.8}
                  style={[
                    s.escalaBtn,
                    {
                      borderRadius: radius.lg,
                      borderColor: activo ? colors.primary : colors.grayBorder,
                      backgroundColor: activo
                        ? colors.primaryLight
                        : colors.grayBg,
                      borderWidth: activo ? 2 : 1,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      fontSize: tamLetra,
                      fontWeight: "700",
                      color: activo ? colors.primary : colors.inkSoft,
                    }}
                  >
                    {escala.desc}
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 12,
                      color: activo ? colors.primary : colors.grayText,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    {escala.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Vista previa */}
        {/*
          <View
            style={[
              s.preview,
              {
                marginHorizontal: spacing.lg,
                marginBottom: spacing.lg,
                backgroundColor: colors.grayBg,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            <AppText
              style={{ fontSize: typography.size.xs, color: colors.grayText }}
            >
              Vista previa
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.lg,
                fontWeight: "700",
                color: colors.ink,
                marginTop: 4,
              }}
            >
              Venta del día
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.md,
                color: colors.inkSoft,
                marginTop: 2,
              }}
            >
              Total efectivo: $ 150.000
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                marginTop: 2,
              }}
            >
              Factura N° 2026-001
            </AppText>
          </View>
        </View> 
        */}

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

        {/* ── DESCARGAR BD ────────────────────────────────────────────────── */}
        <Pressable
          onPress={descargarDB}
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
            name="database-arrow-down"
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
              Descargar base de datos
            </AppText>
            <AppText
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                lineHeight: 20,
              }}
            >
              Exporta y guarda una copia local de la base de datos.
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
  section: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  escalaRow: { flexDirection: "row" },
  escalaBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  preview: {},
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
