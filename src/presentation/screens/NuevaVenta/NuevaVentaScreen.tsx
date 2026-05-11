import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";

export const NuevaVentaScreen = () => {
  const router = useRouter();

  return (
    <ScreenWrapper
      labelBtnA="volver"
      labelBtnB="continuar"
      showBtnB
      onPressBtnA={() => router.back()}
      onPressBtnB={() => console.log("ir al paso 2")}
    >
      {/* TÍTULO */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Agregar producto</Text>
      </View>

      {/* CONTENIDO */}
      <View style={styles.container}>
        <Text>Aquí va la lógica de nueva venta</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  titleSection: {
    backgroundColor: "#f1eeee",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  container: {
    padding: 20,
  },
});
