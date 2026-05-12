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
import { MenuButton } from "../src/presentation/components/MenuButton";
import { useTheme } from "../src/theme";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, spacing, radius, shadows, sizes } = useTheme();

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
        {/* Fecha */}
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

        {/* Logo + Ajustes */}
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

          <TouchableOpacity
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
            activeOpacity={0.7}
            onPress={() => console.log("Ajustes")}
          >
            <Feather name="sliders" size={sizes.iconLg} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.grayBorder,
        }}
      />

      {/* CONTENIDO */}
      <View style={{ flex: 1, backgroundColor: colors.grayBg }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xs,
            paddingBottom: insets.bottom + spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: typography.size.xxxl,
              fontWeight: typography.weight.bold,
              color: colors.ink,
              marginTop: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            Hola, 👋
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: spacing.md,
            }}
          >
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
              title="Nueva Venta"
              icon="plus-circle"
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
              onPress={() => router.push("/fiados")}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
