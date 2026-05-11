import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuButton } from "../src/presentation/components/MenuButton";

const COLORS = {
  BLUE: "#2B8EF0",
  GRAY_BG: "#F0F4FA",
  GRAY_BORDER: "#DDE3EE",
  GRAY_TEXT: "#8492A6",
  WHITE: "#FFFFFF",
  INK: "#0F172A",
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Detecta el tamaño real del notch/barra de estado

  return (
    <View style={styles.mainWrapper}>
      {/* StatusBar configurada para Android e iOS */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.WHITE}
        translucent
      />

      {/* HEADER: El padding superior se ajusta dinámicamente al dispositivo */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.dateText}>lun 20 oct | 10:10 am</Text>

        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="receipt-text-check-outline"
              size={50} // Ajustado un poco para mejor balance
              color={COLORS.BLUE}
            />
            <Text style={styles.logoText}>Fácil</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.7}
            onPress={() => console.log("Ajustes")}
          >
            <Feather name="sliders" size={30} color={COLORS.INK} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* CONTENIDO: Con fondo gris y scroll suave */}
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greeting}>Hola, 👋</Text>

          <View style={styles.menuGrid}>
            <MenuButton
              title="Productos"
              icon="package-variant-closed"
              onPress={() => router.push("/productos")}
            />
            <MenuButton
              title="Clientes"
              icon="account-group"
              onPress={() => router.push("/clientes")}
            />
            <MenuButton
              title="Nueva venta"
              icon="cart-plus"
              color="#2ecc71"
              onPress={() => router.push("/nueva-venta")}
            />
            <MenuButton
              title="Venta del día"
              icon="calendar-check"
              onPress={() => router.push("/venta-dia")}
            />
            <MenuButton
              title="Historial"
              icon="chart-line"
              onPress={() => router.push("/historial")}
            />
            <MenuButton
              title="Fiados"
              icon="hand-coin"
              color="#e74c3c"
              onPress={() => router.push("/fiados")}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.WHITE, // Fondo base para evitar parpadeos blancos
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  dateText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.GRAY_TEXT,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontSize: 50, // Reducido de 70 para evitar que "empuje" otros elementos
    fontWeight: "900",
    color: COLORS.BLUE,
    letterSpacing: -1,
  },
  settingsBtn: {
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY_BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.WHITE,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.GRAY_BORDER,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.GRAY_BG, // Fondo gris solo para el área de botones
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.INK,
    marginTop: 15,
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
});
