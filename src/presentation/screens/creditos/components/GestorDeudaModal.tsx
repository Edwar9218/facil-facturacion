// src/presentation/screens/creditos/components/GestorDeudaModal.tsx

import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Abono } from "../../../../domain/entities/Abono";
import { DetalleCredito } from "../../../../domain/entities/Credito";
import { useTheme } from "../../../../theme";
import { AppCard } from "../../../components/ui/AppCard";
import { AppText } from "../../../components/ui/AppText";
import { SlideModalType } from "../../../hooks/useSlideModal";

export type VistaGestor = "detalle" | "historial" | "abono";

interface Props {
  modal: SlideModalType;
  detalle: DetalleCredito | null;
  cargando: boolean;
  montoAbono: string;
  onChangeMonto: (v: string) => void;
  onRegistrarAbono: () => void;
  vistaActiva: VistaGestor;
  setVistaActiva: (vista: VistaGestor) => void;
  onAbrirModalAnulacion: (abono: Abono) => void;
}

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

const MAX_MOTIVO = 250;

export const GestorDeudaModal = ({
  modal,
  detalle,
  cargando,
  montoAbono,
  onChangeMonto,
  onRegistrarAbono,
  vistaActiva,
  setVistaActiva,
  onAbrirModalAnulacion,
}: Props) => {
  const { colors, spacing, radius, sizes, typography } = useTheme();

  // ── Tab activo en historial: "activos" | "anulados" ─────────────────────
  const [tabHistorial, setTabHistorial] = useState<"activos" | "anulados">(
    "activos",
  );

  // ── Android: animar modal con teclado ────────────────────────────────────
  const androidBottom = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.timing(androidBottom, {
        toValue: e.endCoordinates.height,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(androidBottom, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleTextChange = (text: string) => {
    const clean = text.replace(/\D/g, "");
    if (clean === "") return onChangeMonto("");
    onChangeMonto(clean.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const titulos: Record<VistaGestor, string> = {
    detalle: "Detalle de la deuda",
    historial: "Historial de Abonos",
    abono: "Nuevo Abono/Pago",
  };

  const isVisible = modal?.visible ?? false;
  const closeModal = () => {
    modal?.cerrar();
  };

  // ── Separar abonos activos / anulados ────────────────────────────────────
  const abonosActivos =
    detalle?.abonos.filter((a) => a.estado === "activo" || !a.estado) ?? [];
  const abonosAnulados =
    detalle?.abonos.filter((a) => a.estado === "anulado") ?? [];

  // ── Contenido principal del modal ────────────────────────────────────────
  const modalInner = (
    <View
      style={[
        styles.modalContent,
        {
          backgroundColor: colors.white,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ width: 32 }} />
        <View
          style={[styles.dragIndicator, { backgroundColor: colors.grayBorder }]}
        />
        <TouchableOpacity
          onPress={closeModal}
          style={[styles.closeButton, { backgroundColor: colors.grayBg }]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={18} color={colors.grayText} />
        </TouchableOpacity>
      </View>

      {cargando || !detalle ? (
        <View style={styles.loadingContainer}>
          <AppText color={colors.grayText}>Cargando...</AppText>
        </View>
      ) : (
        <View style={styles.flexContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.md }}
            style={styles.scrollView}
          >
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>
              {titulos[vistaActiva]}
            </AppText>

            {/* Cliente */}
            <View
              style={[
                styles.rowCenter,
                { gap: spacing.sm, marginBottom: spacing.md },
              ]}
            >
              <Feather
                name="user"
                size={sizes.iconMd}
                color={colors.grayText}
              />
              <AppText variant="bodyBold">{detalle.nombreCliente}</AppText>
            </View>

            {/* Resumen financiero */}
            <AppCard style={{ marginBottom: spacing.md }}>
              <View style={[styles.rowSpace, { marginBottom: spacing.xs }]}>
                <AppText variant="body" color={colors.grayText}>
                  Deuda total:
                </AppText>
                <AppText variant="bodyBold">{fmt(detalle.deudaTotal)}</AppText>
              </View>
              <View style={[styles.rowSpace, { marginBottom: spacing.xs }]}>
                <AppText variant="body" color={colors.grayText}>
                  Total abono:
                </AppText>
                <AppText variant="bodyBold" color={colors.success}>
                  {fmt(detalle.totalAbonos)}
                </AppText>
              </View>
              <View style={styles.rowSpace}>
                <AppText variant="body" color={colors.grayText}>
                  Saldo actual:
                </AppText>
                <AppText variant="bodyBold" color={colors.danger}>
                  {fmt(detalle.saldoActual)}
                </AppText>
              </View>
            </AppCard>

            {/* ── Vista: Detalle ─────────────────────────────────────────── */}
            {vistaActiva === "detalle" &&
              (detalle.ventas.length === 0 ? (
                <View
                  style={{ alignItems: "center", paddingVertical: spacing.lg }}
                >
                  <AppText variant="body" color={colors.grayText}>
                    Sin compras registradas
                  </AppText>
                </View>
              ) : (
                detalle.ventas.map((venta) => (
                  <AppCard key={venta.id} style={{ marginBottom: spacing.sm }}>
                    <AppText variant="caption" color={colors.grayText}>
                      Compra del {venta.fecha}
                    </AppText>
                    <View style={[styles.rowSpace, { marginTop: spacing.xxs }]}>
                      <AppText variant="captionBold">
                        Factura N°: {venta.numeroFactura}
                      </AppText>
                      <AppText variant="captionBold">
                        Total: {fmt(venta.total)}
                      </AppText>
                    </View>
                  </AppCard>
                ))
              ))}

            {/* ── Vista: Historial ───────────────────────────────────────── */}
            {vistaActiva === "historial" && (
              <>
                {/* Tabs Activos / Anulados */}
                <View
                  style={[
                    styles.tabContainer,
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.lg,
                      marginBottom: spacing.md,
                      padding: 4,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      {
                        borderRadius: radius.md,
                        backgroundColor:
                          tabHistorial === "activos"
                            ? colors.primary
                            : "transparent",
                      },
                    ]}
                    onPress={() => setTabHistorial("activos")}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color={
                        tabHistorial === "activos"
                          ? colors.white
                          : colors.grayText
                      }
                    >
                      Activos {abonosActivos.length}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      {
                        borderRadius: radius.md,
                        backgroundColor:
                          tabHistorial === "anulados"
                            ? colors.grayText
                            : "transparent",
                      },
                    ]}
                    onPress={() => setTabHistorial("anulados")}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color={
                        tabHistorial === "anulados"
                          ? colors.white
                          : colors.grayText
                      }
                    >
                      Anulados {abonosAnulados.length}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {/* Pagos activos */}
                {tabHistorial === "activos" && (
                  <>
                    {abonosActivos.length === 0 ? (
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: spacing.xxxl,
                        }}
                      >
                        <AppText variant="body" color={colors.grayText}>
                          Sin abonos activos
                        </AppText>
                      </View>
                    ) : (
                      <>
                        <AppText
                          variant="label"
                          style={{ marginBottom: spacing.sm }}
                        >
                          Pagos activos
                        </AppText>
                        {abonosActivos.map((item) => (
                          <View key={item.id} style={{ position: "relative" }}>
                            <AppCard style={{ marginBottom: spacing.sm }}>
                              <View style={styles.rowCenter}>
                                {/* Ícono check */}
                                <View
                                  style={[
                                    styles.iconContainer,
                                    { backgroundColor: colors.successLight },
                                  ]}
                                >
                                  <Feather
                                    name="check"
                                    size={sizes.iconSm}
                                    color={colors.success}
                                  />
                                </View>

                                {/* Info del abono */}
                                <View style={[styles.abonoInfo, { gap: 2 }]}>
                                  <AppText variant="captionBold">
                                    {fmt(item.monto)}
                                  </AppText>
                                  <AppText
                                    variant="caption"
                                    color={colors.grayText}
                                  >
                                    {item.fecha}
                                  </AppText>
                                  {item.metodoPago && (
                                    <View style={styles.rowCenter}>
                                      <Feather
                                        name="credit-card"
                                        size={11}
                                        color={colors.primary}
                                        style={{ marginRight: 4 }}
                                      />
                                      <AppText
                                        variant="caption"
                                        color={colors.primary}
                                      >
                                        {item.metodoPago}
                                      </AppText>
                                    </View>
                                  )}
                                </View>

                                {/* Botón anular directo */}
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    onAbrirModalAnulacion(item);
                                  }}
                                  hitSlop={{
                                    top: 8,
                                    bottom: 8,
                                    left: 8,
                                    right: 8,
                                  }}
                                  style={[
                                    styles.anularBtn,
                                    {
                                      backgroundColor:
                                        colors.dangerLight ?? "#FEE2E2",
                                    },
                                  ]}
                                >
                                  <Feather
                                    name="trash-2"
                                    size={15}
                                    color={colors.danger}
                                  />
                                </TouchableOpacity>
                              </View>
                            </AppCard>
                          </View>
                        ))}
                      </>
                    )}
                  </>
                )}

                {/* Abonos anulados */}
                {tabHistorial === "anulados" && (
                  <>
                    {abonosAnulados.length === 0 ? (
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: spacing.xxxl,
                        }}
                      >
                        <AppText variant="body" color={colors.grayText}>
                          Sin abonos anulados
                        </AppText>
                      </View>
                    ) : (
                      abonosAnulados.map((item) => (
                        <AppCard
                          key={item.id}
                          style={{
                            marginBottom: spacing.sm,
                            opacity: 0.7,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.danger,
                          }}
                        >
                          <View style={styles.rowCenter}>
                            <View
                              style={[
                                styles.iconContainer,
                                {
                                  backgroundColor:
                                    colors.dangerLight ?? "#FEE2E2",
                                },
                              ]}
                            >
                              <Feather
                                name="x"
                                size={sizes.iconSm}
                                color={colors.danger}
                              />
                            </View>
                            <View style={[styles.abonoInfo, { gap: 2 }]}>
                              <AppText
                                variant="captionBold"
                                color={colors.grayText}
                                style={{ textDecorationLine: "line-through" }}
                              >
                                {fmt(item.monto)}
                              </AppText>
                              <AppText
                                variant="caption"
                                color={colors.grayText}
                              >
                                {item.fecha}
                              </AppText>
                              {item.motivoAnulacion && (
                                <AppText
                                  variant="caption"
                                  color={colors.danger}
                                  numberOfLines={2}
                                >
                                  Motivo: {item.motivoAnulacion}
                                </AppText>
                              )}
                              {item.fechaAnulacion && (
                                <AppText
                                  variant="caption"
                                  color={colors.grayText}
                                >
                                  Anulado: {item.fechaAnulacion}
                                </AppText>
                              )}
                            </View>
                          </View>
                        </AppCard>
                      ))
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Vista: Abono ───────────────────────────────────────────── */}
            {vistaActiva === "abono" && (
              <>
                <AppText variant="label" style={{ marginBottom: spacing.sm }}>
                  Monto a Pagar
                </AppText>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.md,
                      borderColor: colors.grayBorder,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      gap: spacing.xs,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <Feather
                    name="dollar-sign"
                    size={sizes.iconSm}
                    color={colors.grayText}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: typography.size.lg,
                      color: colors.ink,
                      paddingVertical: spacing.xs,
                    }}
                    placeholder="0"
                    placeholderTextColor={colors.grayText}
                    keyboardType="numeric"
                    value={montoAbono}
                    onChangeText={handleTextChange}
                    autoFocus
                  />
                  {montoAbono.length > 0 && (
                    <TouchableOpacity onPress={() => onChangeMonto("")}>
                      <Feather
                        name="x"
                        size={sizes.iconSm}
                        color={colors.grayText}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer con botones */}
          <View
            style={[
              styles.fixedFooter,
              { borderTopColor: colors.grayBorder, paddingTop: spacing.md },
            ]}
          >
            {vistaActiva === "detalle" && (
              <View style={{ gap: spacing.sm }}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.success,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                    },
                  ]}
                  onPress={() => {
                    setTabHistorial("activos");
                    setVistaActiva("historial");
                  }}
                  activeOpacity={0.8}
                >
                  <AppText variant="bodyBold" color={colors.white}>
                    Ver Historial de Pagos
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                    },
                  ]}
                  onPress={() => setVistaActiva("abono")}
                  activeOpacity={0.8}
                >
                  <AppText variant="bodyBold" color={colors.white}>
                    Registrar Abono/Pago ($)
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
            {vistaActiva === "historial" && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                ]}
                onPress={() => setVistaActiva("detalle")}
                activeOpacity={0.8}
              >
                <AppText variant="bodyBold" color={colors.white}>
                  Volver al detalle
                </AppText>
              </TouchableOpacity>
            )}
            {vistaActiva === "abono" && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                  },
                ]}
                onPress={onRegistrarAbono}
                activeOpacity={0.8}
              >
                <AppText variant="bodyBold" color={colors.white}>
                  Finalizar Abono
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <>
      {/* ── Modal principal ───────────────────────────────────────────────── */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeModal} />
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.keyboardView}
              keyboardVerticalOffset={0}
            >
              {modalInner}
            </KeyboardAvoidingView>
          ) : (
            <Animated.View
              style={[styles.keyboardView, { marginBottom: androidBottom }]}
            >
              {modalInner}
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  keyboardView: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  modalContent: {
    flex: 1,
    width: "100%",
  },
  flexContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  fixedFooter: {
    width: "100%",
    borderTopWidth: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  loadingContainer: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  abonoInfo: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  button: {
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  anularBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  anulacionSheet: {
    width: "100%",
  },
  textAreaContainer: {
    borderWidth: 1,
    minHeight: 100,
  },
  textArea: {
    minHeight: 80,
  },
});
