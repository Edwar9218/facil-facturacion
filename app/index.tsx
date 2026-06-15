import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../src/theme";

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN GLOBAL DEL MENÚ
// ─────────────────────────────────────────────────────────────

const MENU_STYLES = {
  cardRadius: 26,
  cardPadding: 18,
  cardMinHeight: 190,

  iconContainerSize: 72,
  iconSize: 34,
  iconRadius: 22,

  arrowSize: 34,
  arrowIconSize: 18,

  titleSize: 20,
  titleWeight: "800" as const,

  descriptionSize: 14,
  descriptionLineHeight: 21,

  borderBottomWidth: 3,

  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 4,
};

// ─────────────────────────────────────────────────────────────
// ITEMS DEL MENÚ
// ─────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  {
    title: "Productos",
    description: "Gestiona tu inventario de productos",
    icon: "package-variant-closed",
    route: "/productos",
    color: "#2F80FF",
    light: "#EEF4FF",
  },
  {
    title: "Clientes",
    description: "Administra tus clientes y contactos",
    icon: "account-group",
    route: "/clientes",
    color: "#27C56D",
    light: "#ECFFF4",
  },
  {
    title: "Nueva Venta",
    description: "Crea una nueva venta rápidamente",
    icon: "cart-plus",
    route: "/nueva-venta",
    color: "#8B5CF6",
    light: "#F5EFFF",
  },
  {
    title: "Venta del día",
    description: "Consulta el resumen de ventas",
    icon: "calendar-check",
    route: "/venta-del-dia",
    color: "#F59E0B",
    light: "#FFF7EA",
  },
  {
    title: "Historial",
    description: "Revisa ventas anteriores y reportes",
    icon: "chart-line",
    route: "/historial-venta",
    color: "#14B8A6",
    light: "#E9FFFC",
  },
  {
    title: "Creditos",
    description: "Gestiona pagos pendientes y créditos",
    icon: "hand-coin",
    route: "/creditos",
    color: "#FF4D8D",
    light: "#FFF0F6",
  },
  {
    title: "Gastos",
    description: "Registra y controla tus gastos diarios",
    icon: "cash-minus",
    route: "/gastos",
    color: "#EF4444",
    light: "#FEF2F2",
  },
  {
    title: "Historial Caja",
    description: "Revisa aperturas, cierres y cuadres de caja",
    icon: "cash-register",
    route: "/historial-caja",
    color: "#6366F1",
    light: "#EEF2FF",
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { colors, typography, spacing, radius, sizes } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
        translucent
      />

      {/* HEADER */}
      <View
        style={{
          backgroundColor: colors.white,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          paddingTop: insets.top + 10,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontSize: typography.size.xs,
            fontWeight: typography.weight.medium,
            color: colors.grayText,
            letterSpacing: 0.5,
            marginBottom: spacing.xs,
          }}
        >
          lun 20 oct | 10:10 am
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <MaterialCommunityIcons
              name="receipt-text-check-outline"
              size={sizes.iconXxl}
              color={colors.primary}
            />

            <Text
              style={{
                fontSize: typography.size.hero,
                fontWeight: typography.weight.black,
                color: colors.primary,
                letterSpacing: typography.letterSpacing.tight,
              }}
            >
              Fácil
            </Text>
          </View>

          {/* AJUSTES */}
          <TouchableOpacity
            onPress={() => router.push("/ajustes")}
            style={{
              width: 55,
              height: 55,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colors.grayBorder,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.white,
            }}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={sizes.iconLg} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* DIVIDER */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.grayBorder,
        }}
      />

      {/* CONTENIDO */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#F6F8FC",
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          }}
        >
          {/* SALUDO */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: 18,
                color: colors.grayText,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              ¡Bienvenido!
            </Text>

            <Text
              style={{
                fontSize: 30,
                fontWeight: "900",
                color: colors.ink,
              }}
            >
              Hola, 👋
            </Text>
          </View>

          {/* GRID */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: spacing.lg,
            }}
          >
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.9}
                onPress={() => router.push(item.route as any)}
                style={{
                  width: "48%",
                  backgroundColor: colors.white,
                  borderRadius: MENU_STYLES.cardRadius,
                  padding: MENU_STYLES.cardPadding,
                  minHeight: MENU_STYLES.cardMinHeight,
                  justifyContent: "space-between",
                  borderBottomWidth: MENU_STYLES.borderBottomWidth,
                  borderBottomColor: item.color,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 6,
                  },
                  shadowOpacity: MENU_STYLES.shadowOpacity,
                  shadowRadius: MENU_STYLES.shadowRadius,
                  elevation: MENU_STYLES.elevation,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: 18,
                    right: 18,
                    width: MENU_STYLES.arrowSize,
                    height: MENU_STYLES.arrowSize,
                    borderRadius: MENU_STYLES.arrowSize / 2,
                    backgroundColor: item.light,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name="chevron-right"
                    size={MENU_STYLES.arrowIconSize}
                    color={item.color}
                  />
                </View>

                <View
                  style={{
                    width: MENU_STYLES.iconContainerSize,
                    height: MENU_STYLES.iconContainerSize,
                    borderRadius: MENU_STYLES.iconRadius,
                    backgroundColor: item.color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={MENU_STYLES.iconSize}
                    color="#fff"
                  />
                </View>

                <View style={{ marginTop: spacing.md }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: MENU_STYLES.titleSize,
                      fontWeight: MENU_STYLES.titleWeight,
                      color: colors.ink,
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: MENU_STYLES.descriptionSize,
                      lineHeight: MENU_STYLES.descriptionLineHeight,
                      color: colors.grayText,
                      fontWeight: "500",
                    }}
                  >
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
