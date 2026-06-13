// src/presentation/screens/creditos/CreditosScreen.tsx

import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppCard } from "../../components/ui/AppCard";
import { AppText } from "../../components/ui/AppText";
import { CreditoCard } from "./components/CreditoCard";
import { GestorDeudaModal } from "./components/GestorDeudaModal";
import { useCreditos } from "./hooks/useCreditos";

const MAX_MOTIVO = 250;
const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

export const CreditosScreen = () => {
  const { colors, typography, spacing, radius, sizes } = useTheme();

  const {
    resumenesFiltrados,
    cargando,
    cargandoDetalle,
    busqueda,
    setBusqueda,
    detalle,
    montoAbono,
    setMontoAbono,
    metodoPagoAbono,
    setMetodoPagoAbono,
    modalGestor,
    vistaModal,
    setVistaModal,
    abrirDetalle,
    registrarAbono,
    // Anulación
    abonoAAnular,
    motivoAnulacion,
    setMotivoAnulacion,
    modalAnulacionVisible,
    anulacionSlide,
    anulando,
    abrirModalAnulacion,
    cerrarModalAnulacion,
    confirmarAnulacion,
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

      {/* Modal Gestor de deuda */}
      <GestorDeudaModal
        modal={modalGestor}
        detalle={detalle}
        cargando={cargandoDetalle}
        vistaActiva={vistaModal}
        setVistaActiva={setVistaModal}
        montoAbono={montoAbono}
        onChangeMonto={setMontoAbono}
        metodoPago={metodoPagoAbono}
        onChangeMetodoPago={setMetodoPagoAbono}
        onRegistrarAbono={registrarAbono}
        onAbrirModalAnulacion={abrirModalAnulacion}
      />

      {/* ── Modal de confirmación de anulación ─────────────────────────────── */}
      {/* Renderizado AQUÍ (fuera del GestorDeudaModal) para evitar el problema
          de Modal anidado en iOS que bloquea la interacción */}
      <Modal
        visible={modalAnulacionVisible}
        animationType="none"
        transparent={true}
        onRequestClose={cerrarModalAnulacion}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.overlay}>
            <Pressable style={s.backdrop} onPress={cerrarModalAnulacion} />
            <Animated.View
              style={[
                s.anulacionSheet,
                {
                  transform: [{ translateY: anulacionSlide }],
                  backgroundColor: colors.white,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  padding: spacing.lg,
                },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  s.rowCenter,
                  { marginBottom: spacing.md, gap: spacing.sm },
                ]}
              >
                <Feather name="x-circle" size={22} color={colors.danger} />
                <AppText variant="h3" color={colors.danger}>
                  Anular abono
                </AppText>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={cerrarModalAnulacion}
                  style={[s.closeButton, { backgroundColor: colors.grayBg }]}
                >
                  <Feather name="x" size={18} color={colors.grayText} />
                </TouchableOpacity>
              </View>

              <AppText
                variant="body"
                color={colors.grayText}
                style={{ marginBottom: spacing.md }}
              >
                Estás a punto de anular este abono
              </AppText>

              {/* Detalle del abono a anular */}
              {abonoAAnular && (
                <AppCard
                  style={{
                    marginBottom: spacing.md,
                    backgroundColor: colors.grayBg,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.primary,
                  }}
                >
                  <View
                    style={[
                      s.rowCenter,
                      { gap: spacing.xs, marginBottom: spacing.xxs },
                    ]}
                  >
                    <Feather
                      name="credit-card"
                      size={13}
                      color={colors.primary}
                    />
                    <AppText variant="captionBold" color={colors.primary}>
                      Detalles del abono
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.grayText}>
                    Monto: {fmt(abonoAAnular.monto)} • Fecha:{" "}
                    {abonoAAnular.fecha}
                    {abonoAAnular.metodoPago
                      ? ` • Método: ${abonoAAnular.metodoPago}`
                      : ""}
                  </AppText>
                </AppCard>
              )}

              {/* Motivo */}
              <AppText variant="label" style={{ marginBottom: spacing.sm }}>
                Motivo de la anulación{" "}
                <AppText variant="label" color={colors.danger}>
                  *
                </AppText>
              </AppText>
              <View
                style={[
                  s.textAreaContainer,
                  {
                    borderColor: colors.grayBorder,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginBottom: spacing.xs,
                    backgroundColor: colors.grayBg,
                  },
                ]}
              >
                <TextInput
                  style={[
                    s.textArea,
                    { color: colors.ink, fontSize: typography.size.sm },
                  ]}
                  placeholder="Escribe el motivo por el cual anulas este abono..."
                  placeholderTextColor={colors.grayText}
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_MOTIVO}
                  value={motivoAnulacion}
                  onChangeText={setMotivoAnulacion}
                  textAlignVertical="top"
                />
              </View>
              <AppText
                variant="caption"
                color={colors.grayText}
                style={{ textAlign: "right", marginBottom: spacing.lg }}
              >
                {motivoAnulacion.length}/{MAX_MOTIVO}
              </AppText>

              {/* Botones */}
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TouchableOpacity
                  style={[
                    s.button,
                    {
                      flex: 1,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      borderWidth: 1,
                      borderColor: colors.grayBorder,
                    },
                  ]}
                  onPress={cerrarModalAnulacion}
                  activeOpacity={0.8}
                  disabled={anulando}
                >
                  <AppText variant="bodyBold" color={colors.ink}>
                    Cancelar
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.button,
                    {
                      flex: 2,
                      backgroundColor: anulando
                        ? colors.grayBorder
                        : colors.danger,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                    },
                  ]}
                  onPress={confirmarAnulacion}
                  activeOpacity={0.8}
                  disabled={anulando}
                >
                  <View style={[s.rowCenter, { gap: spacing.xs }]}>
                    <Feather name="x-circle" size={16} color={colors.white} />
                    <AppText variant="bodyBold" color={colors.white}>
                      {anulando ? "Anulando..." : "Confirmar anulación"}
                    </AppText>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  anulacionSheet: {
    width: "100%",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  textAreaContainer: {
    borderWidth: 1,
    minHeight: 100,
  },
  textArea: {
    minHeight: 80,
  },
});
