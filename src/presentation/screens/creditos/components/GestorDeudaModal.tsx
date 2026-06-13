// src/presentation/screens/creditos/components/GestorDeudaModal.tsx

import { Feather } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type MetodoPagoFiltro = "Todos" | "Efectivo" | "Transferencia";
type EstadoFiltro = "Todos" | "activo" | "anulado";
type OrdenFiltro = "reciente" | "antiguo" | "mayor" | "menor";

interface Props {
  modal: SlideModalType;
  detalle: DetalleCredito | null;
  cargando: boolean;
  montoAbono: string;
  onChangeMonto: (v: string) => void;
  metodoPago: "Efectivo" | "Transferencia";
  onChangeMetodoPago: (v: "Efectivo" | "Transferencia") => void;
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
  metodoPago,
  onChangeMetodoPago,
  onRegistrarAbono,
  vistaActiva,
  setVistaActiva,
  onAbrirModalAnulacion,
}: Props) => {
  const { colors, spacing, radius, sizes, typography } = useTheme();

  // ── Estado filtros del historial ─────────────────────────────────────────
  // Valores del panel (pendientes de aplicar)
  const [filtroMetodo, setFiltroMetodo] = useState<MetodoPagoFiltro>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("Todos");
  const [filtroOrden, setFiltroOrden] = useState<OrdenFiltro>("reciente");
  // Valores aplicados (los que realmente filtran la lista)
  const [metodoActivo, setMetodoActivo] = useState<MetodoPagoFiltro>("Todos");
  const [estadoActivo, setEstadoActivo] = useState<EstadoFiltro>("Todos");
  const [ordenActivo, setOrdenActivo] = useState<OrdenFiltro>("reciente");
  // UI
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [ordenModalVisible, setOrdenModalVisible] = useState(false);

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

  // ── Helpers de filtros ────────────────────────────────────────────────────
  const parseFecha = (s: string): Date => {
    try {
      const m = s.match(
        /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)/i,
      );
      if (m) {
        let h = parseInt(m[4], 10);
        if (/p\.m\./i.test(m[6]) && h !== 12) h += 12;
        if (/a\.m\./i.test(m[6]) && h === 12) h = 0;
        return new Date(+m[3], +m[2] - 1, +m[1], h, +m[5]);
      }
      return new Date(s);
    } catch {
      return new Date(0);
    }
  };

  const todosLosAbonos = detalle?.abonos ?? [];
  const abonosActivos = todosLosAbonos.filter(
    (a) => a.estado === "activo" || !a.estado,
  );
  const abonosAnulados = todosLosAbonos.filter((a) => a.estado === "anulado");
  const totalAbonado = abonosActivos.reduce((s, a) => s + a.monto, 0);

  const hayFiltrosActivos =
    metodoActivo !== "Todos" ||
    estadoActivo !== "Todos" ||
    ordenActivo !== "reciente";

  const abonosFiltrados = useMemo(() => {
    let lista = [...todosLosAbonos];
    if (metodoActivo !== "Todos")
      lista = lista.filter((a) => a.metodoPago === metodoActivo);
    if (estadoActivo !== "Todos")
      lista = lista.filter((a) =>
        estadoActivo === "activo"
          ? a.estado === "activo" || !a.estado
          : a.estado === "anulado",
      );
    lista.sort((a, b) => {
      const da = parseFecha(a.fecha),
        db = parseFecha(b.fecha);
      if (ordenActivo === "reciente") return db.getTime() - da.getTime();
      if (ordenActivo === "antiguo") return da.getTime() - db.getTime();
      if (ordenActivo === "mayor") return b.monto - a.monto;
      return a.monto - b.monto;
    });
    return lista;
  }, [todosLosAbonos, metodoActivo, estadoActivo, ordenActivo]);

  const totalFiltrado = abonosFiltrados
    .filter((a) => a.estado === "activo" || !a.estado)
    .reduce((s, a) => s + a.monto, 0);

  const aplicarFiltros = useCallback(() => {
    setMetodoActivo(filtroMetodo);
    setEstadoActivo(filtroEstado);
    setOrdenActivo(filtroOrden);
    setFiltrosVisibles(false);
  }, [filtroMetodo, filtroEstado, filtroOrden]);

  const limpiarFiltros = useCallback(() => {
    setFiltroMetodo("Todos");
    setFiltroEstado("Todos");
    setFiltroOrden("reciente");
    setMetodoActivo("Todos");
    setEstadoActivo("Todos");
    setOrdenActivo("reciente");
    setFiltrosVisibles(false);
  }, []);

  const ordenLabels: Record<OrdenFiltro, string> = {
    reciente: "Más reciente",
    antiguo: "Más antiguo",
    mayor: "Mayor monto",
    menor: "Menor monto",
  };

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
                {/* Cards de resumen */}
                <View style={[styles.statsRow, { marginBottom: spacing.md }]}>
                  {/* Total abonado */}
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: colors.grayBg,
                        borderRadius: radius.lg,
                        padding: spacing.sm,
                        flex: 1.4,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={colors.grayText}
                      style={{ fontSize: 14, marginBottom: 4 }}
                    >
                      Total abonado
                    </AppText>
                    <AppText
                      variant="bodyBold"
                      color={colors.primary}
                      style={{ fontSize: 20 }}
                    >
                      {fmt(totalAbonado)}
                    </AppText>
                  </View>

                  {/* Abonos activos */}
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: colors.grayBg,
                        borderRadius: radius.lg,
                        padding: spacing.sm,
                        flex: 1,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={colors.grayText}
                      style={{ fontSize: 14, marginBottom: 4 }}
                    >
                      Abonos
                    </AppText>
                    <AppText
                      variant="bodyBold"
                      color={colors.success}
                      style={{ fontSize: 20 }}
                    >
                      {abonosActivos.length}
                    </AppText>
                  </View>

                  {/* Anulados */}
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: colors.grayBg,
                        borderRadius: radius.lg,
                        padding: spacing.sm,
                        flex: 1,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={colors.grayText}
                      style={{ fontSize: 14, marginBottom: 4 }}
                    >
                      Anulados
                    </AppText>
                    <AppText
                      variant="bodyBold"
                      color={colors.danger}
                      style={{ fontSize: 20 }}
                    >
                      {abonosAnulados.length}
                    </AppText>
                  </View>
                </View>

                {/* Panel de filtros colapsable */}
                <View
                  style={[
                    styles.filtrosPanel,
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.lg,
                      marginBottom: spacing.md,
                      overflow: "hidden",
                    },
                  ]}
                >
                  {/* Header del panel — siempre visible */}
                  <TouchableOpacity
                    style={[styles.filtrosHeader, { padding: spacing.sm }]}
                    onPress={() => setFiltrosVisibles((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rowCenter, { gap: spacing.xs }]}>
                      <Feather
                        name="filter"
                        size={15}
                        color={hayFiltrosActivos ? colors.primary : colors.ink}
                      />
                      <AppText
                        variant="captionBold"
                        color={hayFiltrosActivos ? colors.primary : colors.ink}
                        style={{ fontSize: 16 }}
                      >
                        Filtros
                      </AppText>
                      {hayFiltrosActivos && (
                        <View
                          style={[
                            styles.filtrosBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <AppText
                            variant="caption"
                            color={colors.white}
                            style={{ fontSize: 10 }}
                          >
                            Activos
                          </AppText>
                        </View>
                      )}
                    </View>
                    <Feather
                      name={filtrosVisibles ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.grayText}
                    />
                  </TouchableOpacity>

                  {/* Contenido del panel */}
                  {filtrosVisibles && (
                    <View style={{ padding: spacing.sm, paddingTop: 0 }}>
                      {/* Método de pago */}
                      <AppText
                        variant="label"
                        color={colors.grayText}
                        style={{ marginBottom: spacing.xs, fontSize: 15 }}
                      >
                        Método de pago
                      </AppText>
                      <View
                        style={[
                          styles.selectorRow,
                          {
                            backgroundColor: colors.white,
                            borderRadius: radius.md,
                            marginBottom: spacing.sm,
                            padding: 3,
                          },
                        ]}
                      >
                        {(
                          [
                            "Todos",
                            "Efectivo",
                            "Transferencia",
                          ] as MetodoPagoFiltro[]
                        ).map((op) => (
                          <TouchableOpacity
                            key={op}
                            style={[
                              styles.selectorOp,
                              {
                                borderRadius: radius.md - 2,
                                backgroundColor:
                                  filtroMetodo === op
                                    ? colors.primary
                                    : "transparent",
                              },
                            ]}
                            onPress={() => setFiltroMetodo(op)}
                            activeOpacity={0.8}
                          >
                            <AppText
                              variant="caption"
                              color={
                                filtroMetodo === op
                                  ? colors.white
                                  : colors.grayText
                              }
                              style={{ fontSize: 15, fontWeight: "600" }}
                            >
                              {op}
                            </AppText>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Estado */}
                      <AppText
                        variant="label"
                        style={{ fontSize: 15 }}
                        color={colors.grayText}
                        style={{ marginBottom: spacing.xs, fontSize: 15 }}
                      >
                        Estado del abono
                      </AppText>
                      <View
                        style={[
                          styles.selectorRow,
                          {
                            backgroundColor: colors.white,
                            borderRadius: radius.md,
                            marginBottom: spacing.sm,
                            padding: 3,
                          },
                        ]}
                      >
                        {(
                          [
                            ["Todos", "Todos"],
                            ["activo", "Completado"],
                            ["anulado", "Anulado"],
                          ] as [EstadoFiltro, string][]
                        ).map(([val, label]) => (
                          <TouchableOpacity
                            key={val}
                            style={[
                              styles.selectorOp,
                              {
                                borderRadius: radius.md - 2,
                                backgroundColor:
                                  filtroEstado === val
                                    ? colors.primary
                                    : "transparent",
                              },
                            ]}
                            onPress={() => setFiltroEstado(val)}
                            activeOpacity={0.8}
                          >
                            <AppText
                              variant="caption"
                              color={
                                filtroEstado === val
                                  ? colors.white
                                  : colors.grayText
                              }
                            >
                              {label}
                            </AppText>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Botones */}
                      <View style={[styles.rowCenter, { gap: spacing.sm }]}>
                        <TouchableOpacity
                          style={[
                            styles.btnSecundario,
                            {
                              borderColor: colors.grayBorder,
                              borderRadius: radius.lg,
                              flex: 1,
                              padding: spacing.sm,
                            },
                          ]}
                          onPress={limpiarFiltros}
                          activeOpacity={0.8}
                        >
                          <Feather
                            name="refresh-ccw"
                            size={13}
                            color={colors.ink}
                            style={{ marginRight: 5 }}
                          />
                          <AppText variant="captionBold">
                            Limpiar filtros
                          </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.btnPrimario,
                            {
                              backgroundColor: colors.primary,
                              borderRadius: radius.lg,
                              flex: 1,
                              padding: spacing.sm,
                            },
                          ]}
                          onPress={aplicarFiltros}
                          activeOpacity={0.8}
                        >
                          <Feather
                            name="search"
                            size={13}
                            color={colors.white}
                            style={{ marginRight: 5 }}
                          />
                          <AppText variant="captionBold" color={colors.white}>
                            Aplicar filtros
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Encabezado lista + ordenamiento */}
                <View
                  style={[
                    styles.rowSpace,
                    { alignItems: "center", marginBottom: spacing.sm },
                  ]}
                >
                  <AppText variant="captionBold">Lista de abonos</AppText>
                  <TouchableOpacity
                    style={[styles.rowCenter, { gap: 4 }]}
                    onPress={() => setOrdenModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="chevrons-up"
                      size={13}
                      color={colors.grayText}
                    />
                    <AppText variant="caption" color={colors.grayText}>
                      {ordenLabels[ordenActivo]}
                    </AppText>
                    <Feather
                      name="chevron-down"
                      size={12}
                      color={colors.grayText}
                    />
                  </TouchableOpacity>
                </View>

                {/* Lista de abonos filtrada */}
                {abonosFiltrados.length === 0 ? (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: spacing.xxxl,
                    }}
                  >
                    <Feather name="inbox" size={32} color={colors.grayBorder} />
                    <AppText
                      variant="body"
                      color={colors.grayText}
                      style={{ marginTop: spacing.sm }}
                    >
                      Sin abonos para mostrar
                    </AppText>
                  </View>
                ) : (
                  abonosFiltrados.map((item) => {
                    const esAnulado = item.estado === "anulado";
                    return (
                      <AppCard
                        key={item.id}
                        style={[
                          { marginBottom: spacing.sm },
                          esAnulado && {
                            opacity: 0.75,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.danger,
                          },
                        ]}
                      >
                        <View style={styles.rowCenter}>
                          {/* Ícono */}
                          <View
                            style={[
                              styles.iconContainer,
                              {
                                backgroundColor: esAnulado
                                  ? (colors.dangerLight ?? "#FEE2E2")
                                  : colors.successLight,
                              },
                            ]}
                          >
                            <Feather
                              name={esAnulado ? "x" : "check"}
                              size={sizes.iconSm}
                              color={esAnulado ? colors.danger : colors.success}
                            />
                          </View>

                          {/* Info */}
                          <View style={[styles.abonoInfo, { gap: 3 }]}>
                            <AppText
                              variant="body"
                              style={[
                                { fontSize: 18, fontWeight: "700" },
                                esAnulado
                                  ? {
                                      textDecorationLine: "line-through",
                                      color: colors.grayText,
                                    }
                                  : {},
                              ]}
                            >
                              {fmt(item.monto)}
                            </AppText>
                            <AppText
                              variant="caption"
                              color={colors.grayText}
                              style={{ fontSize: 13 }}
                            >
                              {item.fecha}
                            </AppText>
                            {item.metodoPago && (
                              <AppText
                                variant="caption"
                                color={colors.primary}
                                style={{ fontSize: 13, fontWeight: "600" }}
                              >
                                {item.metodoPago}
                              </AppText>
                            )}
                            {esAnulado && item.motivoAnulacion && (
                              <AppText
                                variant="caption"
                                color={colors.danger}
                                style={{ fontSize: 13 }}
                              >
                                Motivo: {item.motivoAnulacion}
                              </AppText>
                            )}
                          </View>

                          {/* Badge + botón anular */}
                          <View
                            style={{
                              alignItems: "flex-end",
                              justifyContent: "space-between",
                              alignSelf: "stretch",
                              gap: spacing.xs,
                            }}
                          >
                            <View
                              style={[
                                styles.badge,
                                {
                                  backgroundColor: esAnulado
                                    ? (colors.dangerLight ?? "#FEE2E2")
                                    : colors.successLight,
                                },
                              ]}
                            >
                              <AppText
                                variant="caption"
                                color={
                                  esAnulado ? colors.danger : colors.success
                                }
                                style={{ fontSize: 12, fontWeight: "600" }}
                              >
                                {esAnulado ? "Anulado" : "Completado"}
                              </AppText>
                            </View>
                            {!esAnulado && (
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
                            )}
                          </View>
                        </View>
                      </AppCard>
                    );
                  })
                )}

                {/* Resumen inferior */}
                {abonosFiltrados.length > 0 && (
                  <View
                    style={[
                      styles.rowSpace,
                      {
                        paddingTop: spacing.sm,
                        borderTopWidth: 1,
                        borderTopColor: colors.grayBorder,
                        marginTop: spacing.xs,
                        marginBottom: spacing.sm,
                      },
                    ]}
                  >
                    <AppText variant="caption" color={colors.grayText}>
                      {abonosFiltrados.length}{" "}
                      {abonosFiltrados.length === 1
                        ? "abono encontrado"
                        : "abonos encontrados"}
                    </AppText>
                    <View style={styles.rowCenter}>
                      <AppText variant="captionBold">Total: </AppText>
                      <AppText variant="captionBold" color={colors.primary}>
                        {fmt(totalFiltrado)}
                      </AppText>
                    </View>
                  </View>
                )}

                {/* Modal de ordenamiento */}
                <Modal
                  visible={ordenModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setOrdenModalVisible(false)}
                >
                  <Pressable
                    style={styles.ordenOverlay}
                    onPress={() => setOrdenModalVisible(false)}
                  >
                    <View
                      style={[
                        styles.ordenPanel,
                        {
                          backgroundColor: colors.white,
                          borderRadius: radius.xl,
                          padding: spacing.md,
                          marginHorizontal: spacing.xl,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodyBold"
                        style={{ marginBottom: spacing.sm }}
                      >
                        Ordenar por
                      </AppText>
                      {(
                        Object.entries(ordenLabels) as [OrdenFiltro, string][]
                      ).map(([key, label]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.ordenOp,
                            {
                              backgroundColor:
                                ordenActivo === key
                                  ? (colors.primaryLight ?? "#EEF2FF")
                                  : "transparent",
                              borderRadius: radius.md,
                              paddingVertical: spacing.sm,
                              paddingHorizontal: spacing.sm,
                            },
                          ]}
                          onPress={() => {
                            setFiltroOrden(key);
                            setOrdenActivo(key);
                            setOrdenModalVisible(false);
                          }}
                          activeOpacity={0.8}
                        >
                          <AppText
                            variant="body"
                            color={
                              ordenActivo === key ? colors.primary : colors.ink
                            }
                          >
                            {label}
                          </AppText>
                          {ordenActivo === key && (
                            <Feather
                              name="check"
                              size={15}
                              color={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Pressable>
                </Modal>
              </>
            )}

            {/* ── Vista: Abono ───────────────────────────────────────────── */}
            {vistaActiva === "abono" && (
              <>
                {/* Selector método de pago */}
                <AppText variant="label" style={{ marginBottom: spacing.sm }}>
                  Método de pago
                </AppText>
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
                          metodoPago === "Efectivo"
                            ? colors.primary
                            : "transparent",
                      },
                    ]}
                    onPress={() => onChangeMetodoPago("Efectivo")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rowCenter, { gap: spacing.xxs }]}>
                      <Feather
                        name="dollar-sign"
                        size={14}
                        color={
                          metodoPago === "Efectivo"
                            ? colors.white
                            : colors.grayText
                        }
                      />
                      <AppText
                        variant="captionBold"
                        color={
                          metodoPago === "Efectivo"
                            ? colors.white
                            : colors.grayText
                        }
                      >
                        Efectivo
                      </AppText>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      {
                        borderRadius: radius.md,
                        backgroundColor:
                          metodoPago === "Transferencia"
                            ? colors.primary
                            : "transparent",
                      },
                    ]}
                    onPress={() => onChangeMetodoPago("Transferencia")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rowCenter, { gap: spacing.xxs }]}>
                      <Feather
                        name="smartphone"
                        size={14}
                        color={
                          metodoPago === "Transferencia"
                            ? colors.white
                            : colors.grayText
                        }
                      />
                      <AppText
                        variant="captionBold"
                        color={
                          metodoPago === "Transferencia"
                            ? colors.white
                            : colors.grayText
                        }
                      >
                        Transferencia
                      </AppText>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Input monto */}
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

                {/* Botón dentro del scroll — sube con el teclado */}
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
            {/* Vista abono: el botón vive dentro del ScrollView para subir con el teclado */}
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
              keyboardVerticalOffset={-34}
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
  // ── Estilos del nuevo historial ───────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statCard: {
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  filtrosPanel: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  filtrosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filtrosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectorRow: {
    flexDirection: "row",
  },
  selectorOp: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  btnSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ordenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
  },
  ordenPanel: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  ordenOp: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
