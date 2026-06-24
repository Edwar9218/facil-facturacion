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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();

  // ── Filtros historial ────────────────────────────────────────────────────
  const [filtroMetodo, setFiltroMetodo] = useState<MetodoPagoFiltro>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("Todos");
  const [filtroOrden, setFiltroOrden] = useState<OrdenFiltro>("reciente");
  const [metodoActivo, setMetodoActivo] = useState<MetodoPagoFiltro>("Todos");
  const [estadoActivo, setEstadoActivo] = useState<EstadoFiltro>("Todos");
  const [ordenActivo, setOrdenActivo] = useState<OrdenFiltro>("reciente");
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);
  const [ordenModalVisible, setOrdenModalVisible] = useState(false);

  // ── Venta seleccionada (mini modal detalle) ──────────────────────────────
  const [ventaSeleccionada, setVentaSeleccionada] = useState<
    import("../../../../domain/entities/Venta").Venta | null
  >(null);
  const androidBottom = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.timing(androidBottom, {
        toValue: e.endCoordinates.height,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(androidBottom, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleTextChange = (text: string) => {
    const clean = text.replace(/\D/g, "");
    if (clean === "") return onChangeMonto("");
    onChangeMonto(clean.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const isVisible = modal?.visible ?? false;
  const closeModal = () => modal?.cerrar();

  // ── Cálculos ─────────────────────────────────────────────────────────────
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

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabs: { id: VistaGestor; label: string; icon: string }[] = [
    { id: "detalle", label: "Detalle", icon: "file-text" },
    { id: "historial", label: "Historial", icon: "clock" },
    { id: "abono", label: "Abonar", icon: "plus-circle" },
  ];

  // ── Contenido del modal ──────────────────────────────────────────────────
  const modalInner = (
    <View
      style={[
        s.sheet,
        {
          backgroundColor: colors.white,
          borderTopLeftRadius: radius.xxl,
          borderTopRightRadius: radius.xxl,
        },
      ]}
    >
      {/* Drag handle */}
      <View style={s.dragWrap}>
        <View style={[s.drag, { backgroundColor: colors.grayBorder }]} />
      </View>

      {cargando || !detalle ? (
        <View style={s.loading}>
          <AppText color={colors.grayText}>Cargando...</AppText>
        </View>
      ) : (
        <>
          {/* ── HEADER FIJO: cliente + saldo ─────────────────────────────── */}
          <View
            style={[
              s.headerFijo,
              {
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.md,
                borderBottomColor: colors.grayBorder,
              },
            ]}
          >
            <View style={s.clienteRow}>
              <View
                style={[
                  s.avatarCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Feather name="user" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText
                  style={{ fontSize: 19, fontWeight: "700", color: colors.ink }}
                >
                  {detalle.nombreCliente}
                </AppText>
                <AppText
                  style={{ fontSize: 15, color: colors.grayText, marginTop: 1 }}
                >
                  Deuda total: {fmt(detalle.deudaTotal)}
                </AppText>
              </View>
              <View
                style={[s.saldoBadge, { backgroundColor: colors.dangerLight }]}
              >
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.danger,
                  }}
                >
                  {fmt(detalle.saldoActual)}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                style={[s.closeBtn, { backgroundColor: colors.grayBg }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={16} color={colors.grayText} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View
              style={[
                s.tabsRow,
                {
                  backgroundColor: colors.grayBg,
                  borderRadius: radius.lg,
                  marginTop: spacing.md,
                  padding: 3,
                },
              ]}
            >
              {tabs.map((tab) => {
                const activo = vistaActiva === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      s.tab,
                      {
                        borderRadius: radius.md,
                        backgroundColor: activo ? colors.white : "transparent",
                      },
                    ]}
                    onPress={() => setVistaActiva(tab.id)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={tab.icon as any}
                      size={13}
                      color={activo ? colors.primary : colors.grayText}
                    />
                    <AppText
                      style={{
                        fontSize: 15,
                        fontWeight: activo ? "700" : "400",
                        color: activo ? colors.primary : colors.grayText,
                        marginLeft: 4,
                      }}
                    >
                      {tab.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SCROLL CONTENT ───────────────────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing.xxl,
            }}
          >
            {/* ── DETALLE ──────────────────────────────────────────────── */}
            {vistaActiva === "detalle" && (
              <>
                {/* Resumen financiero */}
                <View style={[s.resumenRow, { marginBottom: spacing.md }]}>
                  <View
                    style={[
                      s.resumenCard,
                      {
                        backgroundColor: colors.primaryLight,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Abonado
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: colors.primary,
                        marginTop: 2,
                      }}
                    >
                      {fmt(detalle.totalAbonos)}
                    </AppText>
                  </View>
                  <View
                    style={[
                      s.resumenCard,
                      {
                        backgroundColor: colors.dangerLight,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.danger,
                        fontWeight: "600",
                      }}
                    >
                      Saldo
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: colors.danger,
                        marginTop: 2,
                      }}
                    >
                      {fmt(detalle.saldoActual)}
                    </AppText>
                  </View>
                </View>

                {/* Lista de compras */}
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.grayText,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: spacing.sm,
                  }}
                >
                  Compras
                </AppText>
                {detalle.ventas.length === 0 ? (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: spacing.xxl,
                    }}
                  >
                    <Feather
                      name="shopping-bag"
                      size={32}
                      color={colors.grayBorder}
                    />
                    <AppText
                      style={{ color: colors.grayText, marginTop: spacing.sm }}
                    >
                      Sin compras registradas
                    </AppText>
                  </View>
                ) : (
                  detalle.ventas.map((venta) => (
                    <AppCard
                      key={venta.id}
                      style={{ marginBottom: spacing.sm }}
                      onPress={() => setVentaSeleccionada(venta)}
                    >
                      <View style={s.rowSpace}>
                        <View style={{ flex: 1 }}>
                          <AppText
                            style={{ fontSize: 15, color: colors.grayText }}
                          >
                            Factura N° {venta.numeroFactura}
                          </AppText>
                          <AppText
                            style={{
                              fontSize: 13,
                              color: colors.grayText,
                              marginTop: 2,
                            }}
                          >
                            {venta.fecha}
                          </AppText>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 6 }}>
                          <AppText
                            style={{
                              fontSize: 17,
                              fontWeight: "700",
                              color: colors.ink,
                            }}
                          >
                            {fmt(venta.total)}
                          </AppText>
                          <View style={[s.rowCenter, { gap: 3 }]}>
                            <Feather
                              name="eye"
                              size={12}
                              color={colors.primary}
                            />
                            <AppText
                              style={{
                                fontSize: 12,
                                color: colors.primary,
                                fontWeight: "600",
                              }}
                            >
                              Ver detalle
                            </AppText>
                          </View>
                        </View>
                      </View>
                    </AppCard>
                  ))
                )}
              </>
            )}

            {/* ── HISTORIAL ────────────────────────────────────────────── */}
            {vistaActiva === "historial" && (
              <>
                {/* Stats */}
                <View style={[s.statsRow, { marginBottom: spacing.md }]}>
                  <View
                    style={[
                      s.statCard,
                      {
                        backgroundColor: colors.primaryLight,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Total abonado
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: colors.primary,
                        marginTop: 2,
                      }}
                    >
                      {fmt(totalAbonado)}
                    </AppText>
                  </View>
                  <View
                    style={[
                      s.statCardSm,
                      {
                        backgroundColor: colors.successLight,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.success,
                        fontWeight: "600",
                      }}
                    >
                      Abonos
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: colors.success,
                        marginTop: 2,
                      }}
                    >
                      {abonosActivos.length}
                    </AppText>
                  </View>
                  <View
                    style={[
                      s.statCardSm,
                      {
                        backgroundColor: colors.dangerLight,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.danger,
                        fontWeight: "600",
                      }}
                    >
                      Anulados
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: colors.danger,
                        marginTop: 2,
                      }}
                    >
                      {abonosAnulados.length}
                    </AppText>
                  </View>
                </View>

                {/* Filtros colapsables */}
                <View
                  style={[
                    s.filtrosPanel,
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.lg,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[s.filtrosHeader, { padding: spacing.sm }]}
                    onPress={() => setFiltrosVisibles((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <View style={s.rowCenter}>
                      <Feather
                        name="filter"
                        size={14}
                        color={
                          hayFiltrosActivos ? colors.primary : colors.grayText
                        }
                      />
                      <AppText
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: hayFiltrosActivos
                            ? colors.primary
                            : colors.ink,
                          marginLeft: 6,
                        }}
                      >
                        Filtros
                      </AppText>
                      {hayFiltrosActivos && (
                        <View
                          style={[
                            s.badge,
                            { backgroundColor: colors.primary, marginLeft: 6 },
                          ]}
                        >
                          <AppText
                            style={{
                              fontSize: 12,
                              color: colors.white,
                              fontWeight: "700",
                            }}
                          >
                            Activos
                          </AppText>
                        </View>
                      )}
                    </View>
                    <Feather
                      name={filtrosVisibles ? "chevron-up" : "chevron-down"}
                      size={15}
                      color={colors.grayText}
                    />
                  </TouchableOpacity>

                  {filtrosVisibles && (
                    <View
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingBottom: spacing.sm,
                      }}
                    >
                      {/* Método */}
                      <AppText
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: colors.grayText,
                          marginBottom: spacing.xs,
                        }}
                      >
                        Método de pago
                      </AppText>
                      <View
                        style={[
                          s.selector,
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
                              s.selectorOp,
                              {
                                borderRadius: radius.sm,
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
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color:
                                  filtroMetodo === op
                                    ? colors.white
                                    : colors.grayText,
                              }}
                            >
                              {op}
                            </AppText>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Estado */}
                      <AppText
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: colors.grayText,
                          marginBottom: spacing.xs,
                        }}
                      >
                        Estado
                      </AppText>
                      <View
                        style={[
                          s.selector,
                          {
                            backgroundColor: colors.white,
                            borderRadius: radius.md,
                            marginBottom: spacing.md,
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
                              s.selectorOp,
                              {
                                borderRadius: radius.sm,
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
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color:
                                  filtroEstado === val
                                    ? colors.white
                                    : colors.grayText,
                              }}
                            >
                              {label}
                            </AppText>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Botones filtro */}
                      <View style={[s.rowCenter, { gap: spacing.sm }]}>
                        <TouchableOpacity
                          style={[
                            s.btnSecundario,
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
                          />
                          <AppText
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              marginLeft: 5,
                            }}
                          >
                            Limpiar
                          </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            s.btnPrimario,
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
                            name="check"
                            size={13}
                            color={colors.white}
                          />
                          <AppText
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: colors.white,
                              marginLeft: 5,
                            }}
                          >
                            Aplicar
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Encabezado lista + orden */}
                <View
                  style={[
                    s.rowSpace,
                    { alignItems: "center", marginBottom: spacing.sm },
                  ]}
                >
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.grayText,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Lista de abonos
                  </AppText>
                  <TouchableOpacity
                    style={s.rowCenter}
                    onPress={() => setOrdenModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name="chevrons-up"
                      size={13}
                      color={colors.grayText}
                    />
                    <AppText
                      style={{
                        fontSize: 15,
                        color: colors.grayText,
                        marginHorizontal: 3,
                      }}
                    >
                      {ordenLabels[ordenActivo]}
                    </AppText>
                    <Feather
                      name="chevron-down"
                      size={13}
                      color={colors.grayText}
                    />
                  </TouchableOpacity>
                </View>

                {/* Lista */}
                {abonosFiltrados.length === 0 ? (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: spacing.xxxl,
                    }}
                  >
                    <Feather name="inbox" size={32} color={colors.grayBorder} />
                    <AppText
                      style={{ color: colors.grayText, marginTop: spacing.sm }}
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
                            opacity: 0.7,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.danger,
                          },
                        ]}
                      >
                        <View style={s.rowCenter}>
                          <View
                            style={[
                              s.iconCircle,
                              {
                                backgroundColor: esAnulado
                                  ? colors.dangerLight
                                  : colors.successLight,
                              },
                            ]}
                          >
                            <Feather
                              name={esAnulado ? "x" : "check"}
                              size={14}
                              color={esAnulado ? colors.danger : colors.success}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText
                              style={[
                                {
                                  fontSize: 19,
                                  fontWeight: "700",
                                  color: colors.ink,
                                },
                                esAnulado && {
                                  textDecorationLine: "line-through",
                                  color: colors.grayText,
                                },
                              ]}
                            >
                              {fmt(item.monto)}
                            </AppText>
                            <AppText
                              style={{
                                fontSize: 15,
                                color: colors.grayText,
                                marginTop: 2,
                              }}
                            >
                              {item.fecha}
                            </AppText>
                            {item.metodoPago && (
                              <AppText
                                style={{
                                  fontSize: 14,
                                  color: colors.primary,
                                  fontWeight: "600",
                                  marginTop: 2,
                                }}
                              >
                                {item.metodoPago}
                              </AppText>
                            )}
                            {esAnulado && item.motivoAnulacion && (
                              <AppText
                                style={{
                                  fontSize: 14,
                                  color: colors.danger,
                                  marginTop: 2,
                                }}
                              >
                                Motivo: {item.motivoAnulacion}
                              </AppText>
                            )}
                          </View>
                          <View style={{ alignItems: "flex-end", gap: 8 }}>
                            <View
                              style={[
                                s.badge,
                                {
                                  backgroundColor: esAnulado
                                    ? colors.dangerLight
                                    : colors.successLight,
                                },
                              ]}
                            >
                              <AppText
                                style={{
                                  fontSize: 13,
                                  fontWeight: "700",
                                  color: esAnulado
                                    ? colors.danger
                                    : colors.success,
                                }}
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
                                  s.anularBtn,
                                  { backgroundColor: colors.dangerLight },
                                ]}
                              >
                                <Feather
                                  name="trash-2"
                                  size={14}
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
                      s.rowSpace,
                      {
                        paddingTop: spacing.sm,
                        borderTopWidth: 1,
                        borderTopColor: colors.grayBorder,
                        marginTop: spacing.xs,
                      },
                    ]}
                  >
                    <AppText style={{ fontSize: 15, color: colors.grayText }}>
                      {abonosFiltrados.length}{" "}
                      {abonosFiltrados.length === 1 ? "abono" : "abonos"}
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.primary,
                      }}
                    >
                      Total: {fmt(totalFiltrado)}
                    </AppText>
                  </View>
                )}

                {/* Modal orden */}
                <Modal
                  visible={ordenModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setOrdenModalVisible(false)}
                >
                  <Pressable
                    style={s.ordenOverlay}
                    onPress={() => setOrdenModalVisible(false)}
                  >
                    <View
                      style={[
                        s.ordenPanel,
                        {
                          backgroundColor: colors.white,
                          borderRadius: radius.xl,
                          padding: spacing.md,
                          marginHorizontal: spacing.xl,
                        },
                      ]}
                    >
                      <AppText
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: colors.ink,
                          marginBottom: spacing.sm,
                        }}
                      >
                        Ordenar por
                      </AppText>
                      {(
                        Object.entries(ordenLabels) as [OrdenFiltro, string][]
                      ).map(([key, label]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            s.ordenOp,
                            {
                              backgroundColor:
                                ordenActivo === key
                                  ? colors.primaryLight
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
                            style={{
                              fontSize: 17,
                              color:
                                ordenActivo === key
                                  ? colors.primary
                                  : colors.ink,
                            }}
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

            {/* ── ABONO ────────────────────────────────────────────────── */}
            {vistaActiva === "abono" && (
              <>
                {/* Saldo pendiente */}
                <View
                  style={[
                    s.saldoCard,
                    {
                      backgroundColor: colors.dangerLight,
                      borderRadius: radius.lg,
                      marginBottom: spacing.lg,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Feather
                      name="alert-circle"
                      size={16}
                      color={colors.danger}
                    />
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.danger,
                        fontWeight: "600",
                      }}
                    >
                      Saldo pendiente
                    </AppText>
                  </View>
                  <AppText
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: colors.danger,
                    }}
                  >
                    {fmt(detalle.saldoActual)}
                  </AppText>
                </View>

                {/* Método de pago */}
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.grayText,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: spacing.sm,
                  }}
                >
                  Método de pago
                </AppText>
                <View
                  style={[
                    s.tabsRow,
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.lg,
                      marginBottom: spacing.lg,
                      padding: 3,
                    },
                  ]}
                >
                  {(["Efectivo", "Transferencia"] as const).map((op) => {
                    const activo = metodoPago === op;
                    return (
                      <TouchableOpacity
                        key={op}
                        style={[
                          s.tab,
                          {
                            borderRadius: radius.md,
                            backgroundColor: activo
                              ? colors.primary
                              : "transparent",
                          },
                        ]}
                        onPress={() => onChangeMetodoPago(op)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={
                            op === "Efectivo" ? "dollar-sign" : "smartphone"
                          }
                          size={14}
                          color={activo ? colors.white : colors.grayText}
                        />
                        <AppText
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: activo ? colors.white : colors.grayText,
                            marginLeft: 4,
                          }}
                        >
                          {op}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Input monto */}
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.grayText,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: spacing.sm,
                  }}
                >
                  Monto a pagar
                </AppText>
                <View
                  style={[
                    s.inputWrap,
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.md,
                      borderColor: colors.grayBorder,
                      marginBottom: spacing.lg,
                    },
                  ]}
                >
                  <Feather
                    name="dollar-sign"
                    size={18}
                    color={colors.grayText}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 22,
                      fontWeight: "700",
                      color: colors.ink,
                      paddingVertical: spacing.xs,
                      marginLeft: spacing.xs,
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
                      <Feather name="x" size={18} color={colors.grayText} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Botón registrar */}
                <TouchableOpacity
                  style={[
                    s.btnPrimario,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                    },
                  ]}
                  onPress={onRegistrarAbono}
                  activeOpacity={0.8}
                >
                  <Feather name="check-circle" size={18} color={colors.white} />
                  <AppText
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: colors.white,
                      marginLeft: spacing.xs,
                    }}
                  >
                    Finalizar abono
                  </AppText>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <View style={[s.overlay, { paddingTop: insets.top }]}>
        <Pressable style={s.backdrop} onPress={closeModal} />
        {Platform.OS === "ios" ? (
          <KeyboardAvoidingView
            behavior="padding"
            style={s.kav}
            keyboardVerticalOffset={-34}
          >
            {modalInner}
          </KeyboardAvoidingView>
        ) : (
          <Animated.View style={[s.kav, { marginBottom: androidBottom }]}>
            {modalInner}
          </Animated.View>
        )}
      </View>
      {/* ── MINI MODAL: detalle de compra ─────────────────────────────── */}
      <Modal
        visible={!!ventaSeleccionada}
        transparent
        animationType="fade"
        onRequestClose={() => setVentaSeleccionada(null)}
      >
        <Pressable
          style={s.ordenOverlay}
          onPress={() => setVentaSeleccionada(null)}
        >
          <Pressable
            style={[
              s.ventaModal,
              {
                backgroundColor: colors.white,
                borderRadius: radius.xl,
                margin: spacing.lg,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {ventaSeleccionada && (
              <>
                {/* Header mini modal */}
                <View style={[s.rowSpace, { marginBottom: spacing.md }]}>
                  <View>
                    <AppText
                      style={{
                        fontSize: 17,
                        fontWeight: "800",
                        color: colors.ink,
                      }}
                    >
                      Factura N° {ventaSeleccionada.numeroFactura}
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 14,
                        color: colors.grayText,
                        marginTop: 2,
                      }}
                    >
                      {ventaSeleccionada.fecha}
                    </AppText>
                  </View>
                  <TouchableOpacity
                    onPress={() => setVentaSeleccionada(null)}
                    style={[s.closeBtn, { backgroundColor: colors.grayBg }]}
                  >
                    <Feather name="x" size={16} color={colors.grayText} />
                  </TouchableOpacity>
                </View>

                {/* Lista de productos */}
                <View
                  style={[
                    {
                      backgroundColor: colors.grayBg,
                      borderRadius: radius.lg,
                      padding: spacing.sm,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.rowSpace,
                      {
                        paddingHorizontal: spacing.xs,
                        paddingBottom: spacing.xs,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.grayBorder,
                        marginBottom: spacing.xs,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.grayText,
                        flex: 2,
                      }}
                    >
                      Producto
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.grayText,
                        textAlign: "center",
                        flex: 1,
                      }}
                    >
                      Cant.
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.grayText,
                        textAlign: "right",
                        flex: 1,
                      }}
                    >
                      Subtotal
                    </AppText>
                  </View>
                  {!ventaSeleccionada.items ||
                  ventaSeleccionada.items.length === 0 ? (
                    <View
                      style={{
                        alignItems: "center",
                        paddingVertical: spacing.md,
                      }}
                    >
                      <Feather
                        name="package"
                        size={24}
                        color={colors.grayBorder}
                      />
                      <AppText
                        style={{
                          fontSize: 14,
                          color: colors.grayText,
                          marginTop: spacing.xs,
                        }}
                      >
                        Sin productos registrados
                      </AppText>
                    </View>
                  ) : (
                    (Array.isArray(ventaSeleccionada.items)
                      ? ventaSeleccionada.items
                      : JSON.parse(ventaSeleccionada.items as any)
                    ).map(
                      (
                        item: import("../../../../domain/entities/Venta").ItemVenta,
                        i: number,
                      ) => (
                        <View
                          key={i}
                          style={[
                            s.rowSpace,
                            {
                              paddingVertical: spacing.xs,
                              paddingHorizontal: spacing.xs,
                              borderBottomWidth:
                                i < ventaSeleccionada.items.length - 1 ? 1 : 0,
                              borderBottomColor: colors.grayBorder,
                            },
                          ]}
                        >
                          <View style={{ flex: 2 }}>
                            <AppText
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: colors.ink,
                              }}
                            >
                              {item.nombreProducto}
                            </AppText>
                            <AppText
                              style={{ fontSize: 13, color: colors.grayText }}
                            >
                              {fmt(item.precioUnitario)} c/u
                            </AppText>
                          </View>
                          <AppText
                            style={{
                              fontSize: 15,
                              color: colors.inkSoft,
                              textAlign: "center",
                              flex: 1,
                            }}
                          >
                            {item.cantidad} {item.unidad}
                          </AppText>
                          <AppText
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: colors.ink,
                              textAlign: "right",
                              flex: 1,
                            }}
                          >
                            {fmt(item.subtotal)}
                          </AppText>
                        </View>
                      ),
                    )
                  )}
                </View>

                {/* Total */}
                <View
                  style={[
                    s.rowSpace,
                    {
                      backgroundColor: colors.primaryLight,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: colors.primary,
                    }}
                  >
                    Total
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color: colors.primary,
                    }}
                  >
                    {fmt(ventaSeleccionada.total)}
                  </AppText>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  kav: { flex: 1, width: "100%", justifyContent: "flex-end" },
  sheet: { flex: 1, width: "100%" },
  dragWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  drag: { width: 40, height: 5, borderRadius: 3 },
  loading: { minHeight: 200, alignItems: "center", justifyContent: "center" },

  // Header fijo
  headerFijo: { borderBottomWidth: 1 },
  clienteRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saldoBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tabs
  tabsRow: { flexDirection: "row" },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  // Layout helpers
  rowCenter: { flexDirection: "row", alignItems: "center" },
  rowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Resumen cards
  resumenRow: { flexDirection: "row", gap: 8 },
  resumenCard: { flex: 1, padding: 14 },
  statsRow: { flexDirection: "row", gap: 6 },
  statCard: { flex: 1.4, padding: 12 },
  statCardSm: { flex: 1, padding: 12 },
  saldoCard: { padding: 16 },

  // Filtros
  filtrosPanel: { overflow: "hidden" },
  filtrosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selector: { flexDirection: "row" },
  selectorOp: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },

  // Abonos
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  anularBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Input
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  // Botones
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

  // Orden modal
  ordenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
  },
  ordenPanel: {
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  ordenOp: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ventaModal: {
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
});
