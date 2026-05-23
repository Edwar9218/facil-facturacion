// src/presentation/screens/creditos/CreditosScreen.tsx

import { Feather } from "@expo/vector-icons";
import React from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import { CreditoCard } from "./components/CreditoCard";
import { GestorDeudaModal } from "./components/GestorDeudaModal"; // <-- Importamos solo el modal unificado
import { useCreditos } from "./hooks/useCreditos";

export const CreditosScreen = () => {
  const { colors, typography, spacing, radius, sizes } = useTheme();

  // Actualizamos lo que extraemos del hook
  const {
    resumenesFiltrados,
    cargando,
    cargandoDetalle,
    busqueda,
    setBusqueda,
    detalle,
    montoAbono,
    setMontoAbono,
    modalGestor, // Modal unificado
    vistaModal, // Estado de la vista actual (detalle | historial | abono)
    setVistaModal, // Función para cambiar de vista
    abrirDetalle,
    registrarAbono,
  } = useCreditos();

  return (
    <>
      <ScreenWrapper showBtnB={false} title="Créditos">
        {/* Buscador */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            marginBottom: spacing.xxs,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.grayBorder,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginBottom: spacing.sm,
              gap: spacing.xs,
            }}
          >
            <Feather
              name="search"
              size={sizes.iconSm}
              color={colors.grayText}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: typography.size.md,
                color: colors.ink,
              }}
              placeholder="Buscar cliente..."
              placeholderTextColor={colors.grayText}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda("")}>
                <Feather name="x" size={sizes.iconSm} color={colors.grayText} />
              </TouchableOpacity>
            )}
          </View>

          <AppText variant="label" style={{ marginBottom: spacing.xs }}>
            {resumenesFiltrados.length} cliente
            {resumenesFiltrados.length !== 1 ? "s" : ""} con saldo pendiente
          </AppText>
        </View>

        {/* Lista */}
        <FlatList
          data={resumenesFiltrados}
          keyExtractor={(item) => item.clienteId}
          renderItem={({ item }) => (
            <CreditoCard resumen={item} onPress={abrirDetalle} />
          )}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 100,
          }}
          ListEmptyComponent={
            !cargando ? (
              <View
                style={{ alignItems: "center", paddingVertical: spacing.xxxl }}
              >
                <AppText style={{ fontSize: 40, marginBottom: spacing.xs }}>
                  🎉
                </AppText>
                <AppText variant="body" color={colors.grayText}>
                  Sin clientes en mora
                </AppText>
              </View>
            ) : null
          }
        />
      </ScreenWrapper>

      {/* Modal Unificado */}
      <GestorDeudaModal
        modal={modalGestor}
        detalle={detalle}
        cargando={cargandoDetalle}
        vistaActiva={vistaModal}
        setVistaActiva={setVistaModal}
        montoAbono={montoAbono}
        onChangeMonto={setMontoAbono}
        onRegistrarAbono={registrarAbono}
      />
    </>
  );
};
