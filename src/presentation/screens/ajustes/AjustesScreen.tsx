import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

export const AjustesScreen = () => {
  const { spacing, colors, radius } = useTheme();

  const descargarDB = async () => {
    try {
      const origen = FileSystem.documentDirectory + "SQLite/facil.db";

      const destino = FileSystem.documentDirectory + "facil-export.db";

      await FileSystem.copyAsync({
        from: origen,
        to: destino,
      });

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
      console.log(error);

      Alert.alert("Error", "No se pudo exportar la base de datos.");
    }
  };

  return (
    <ScreenWrapper showBtnB={false} title="Ajustes">
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
          },
        ]}
      >
        {/* TARJETA 1 */}
        <Pressable
          onPress={descargarDB}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: pressed ? colors.gray100 : colors.white,

              borderRadius: radius.lg,

              marginBottom: spacing.lg,

              transform: [
                {
                  scale: pressed ? 0.98 : 1,
                },
              ],

              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="database-arrow-down"
            size={42}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />

          <View style={{ flex: 1 }}>
            <AppText
              style={[
                styles.cardTitle,
                {
                  color: colors.ink,
                },
              ]}
            >
              Descargar base de datos
            </AppText>

            <AppText
              style={[
                styles.cardSubtitle,
                {
                  color: colors.gray500,
                },
              ]}
            >
              Exporta y guarda una copia local de la base de datos.
            </AppText>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={colors.gray400}
          />
        </Pressable>

        {/* TARJETA 2 */}
        <Pressable
          onPress={() => console.log("Navegar a soporte")}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: pressed ? colors.gray100 : colors.white,

              borderRadius: radius.lg,

              transform: [
                {
                  scale: pressed ? 0.98 : 1,
                },
              ],

              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="chat-question"
            size={42}
            color={colors.primary}
            style={{ marginRight: spacing.lg }}
          />

          <View style={{ flex: 1 }}>
            <AppText
              style={[
                styles.cardTitle,
                {
                  color: colors.ink,
                },
              ]}
            >
              Ayuda y soporte
            </AppText>

            <AppText
              style={[
                styles.cardSubtitle,
                {
                  color: colors.gray500,
                },
              ]}
            >
              Resuelve dudas o contacta con soporte técnico.
            </AppText>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={colors.gray400}
          />
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 110,
    paddingHorizontal: 20,
    paddingVertical: 22,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 4,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
