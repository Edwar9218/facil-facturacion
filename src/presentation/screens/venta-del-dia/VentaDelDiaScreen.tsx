import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as XLSX from "xlsx";
import { CajaRepositoryImpl } from "../../../data/repositories/CajaRepositoryImpl";
import { CreditoRepositoryImpl } from "../../../data/repositories/CreditoRepositoryImpl";
import { GastoRepositoryImpl } from "../../../data/repositories/GastoRepositoryImpl";
import { VentaRepositoryImpl } from "../../../data/repositories/VentaRepositoryImpl";
import { ResumenCredito } from "../../../domain/entities/Credito";
import { Gasto } from "../../../domain/entities/Gasto";
import { ItemVenta, Venta } from "../../../domain/entities/Venta";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import { CajaWidget } from "./components/CajaWidget";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

const fechaHoy = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

const esHoy = (fecha: string) => fecha.startsWith(fechaHoy());

const horaDeVenta = (fecha: string) => {
  const d = new Date(fecha);
  return d.toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fechaLarga = (fecha: string) => {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Repos ─────────────────────────────────────────────────────────────────────
const ventaRepo = new VentaRepositoryImpl();
const creditoRepo = new CreditoRepositoryImpl();
const gastoRepo = new GastoRepositoryImpl();
const cajaRepo = new CajaRepositoryImpl();

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoEstado = "todas" | "pazysalvo" | "debe" | "anulada";

interface Abono {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  fecha: string;
  estado?: string;
}

const AVATAR_COLORS = [
  { bg: "#EBF3FF", fg: "#2563EB" },
  { bg: "#FEF3C7", fg: "#D97706" },
  { bg: "#EBF7EE", fg: "#16A34A" },
  { bg: "#F3E8FF", fg: "#9333EA" },
  { bg: "#FCE4EC", fg: "#E91E63" },
];

// ── Modal Factura ─────────────────────────────────────────────────────────────
const ModalFactura = ({
  venta,
  visible,
  onClose,
  evaluarFacturaPagada,
  onAnular,
}: {
  venta: Venta | null;
  visible: boolean;
  onClose: () => void;
  evaluarFacturaPagada: (v: Venta) => boolean;
  onAnular: (v: Venta) => void;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!venta) return null;

  const esAnulada = venta.estado === "anulada";
  const esPazYSalvo = !esAnulada && evaluarFacturaPagada(venta);
  const GREEN = "#16A34A";
  const AMBER = "#D97706";
  const RED = "#DC2626";
  const GRAY = "#7B8499";
  const INK = "#111827";

  const badgeBg = esAnulada ? "#FEE2E2" : esPazYSalvo ? "#DCFCE7" : "#FEF3C7";
  const badgeColor = esAnulada ? RED : esPazYSalvo ? GREEN : AMBER;
  const badgeIcon = esAnulada
    ? "cancel"
    : esPazYSalvo
      ? "check-circle"
      : "clock-outline";
  const badgeLabel = esAnulada ? "Anulada" : esPazYSalvo ? "Al día" : "En mora";

  const metodoRaw = String(
    venta.metodoPago || (venta as any).metodoCuotaInicial || "",
  ).toLowerCase();
  const esTransferencia = metodoRaw.includes("transferencia");
  const tieneMetodo = !esAnulada && metodoRaw.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={ms.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={ms.handle} />
        <View style={ms.header}>
          <View style={{ flex: 1 }}>
            <AppText style={ms.headerTitulo}>Detalle de venta</AppText>
            <AppText style={ms.headerFecha}>{fechaLarga(venta.fecha)}</AppText>
          </View>
          <TouchableOpacity style={ms.btnClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        >
          <View style={ms.clienteRow}>
            <View
              style={[
                ms.avatarGrande,
                { backgroundColor: AVATAR_COLORS[0].bg },
              ]}
            >
              <AppText style={[ms.avatarLetra, { color: AVATAR_COLORS[0].fg }]}>
                {venta.nombreCliente.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <AppText style={ms.clienteNombre}>{venta.nombreCliente}</AppText>
              <AppText style={ms.clienteHora}>
                {horaDeVenta(venta.fecha)}
              </AppText>
            </View>
            <View style={[ms.badge, { backgroundColor: badgeBg }]}>
              <MaterialCommunityIcons
                name={badgeIcon as any}
                size={16}
                color={badgeColor}
              />
              <AppText style={[ms.badgeTxt, { color: badgeColor }]}>
                {badgeLabel}
              </AppText>
            </View>
          </View>

          {esAnulada && venta.anulacion && (
            <View style={ms.bloqueAnulacion}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <MaterialCommunityIcons name="cancel" size={22} color={RED} />
                <AppText
                  style={{ fontSize: 18, fontWeight: "800", color: RED }}
                >
                  Factura anulada
                </AppText>
              </View>
              <View style={{ gap: 6 }}>
                <View style={ms.anulacionFila}>
                  <AppText style={ms.anulacionLabel}>Fecha:</AppText>
                  <AppText style={ms.anulacionValor}>
                    {new Date(venta.anulacion.fecha).toLocaleString("es-CO", {
                      timeZone: "America/Bogota",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </AppText>
                </View>
                <View style={ms.anulacionFila}>
                  <AppText style={ms.anulacionLabel}>Anulada por:</AppText>
                  <AppText style={ms.anulacionValor}>
                    {venta.anulacion.usuario}
                  </AppText>
                </View>
                <View style={ms.anulacionFila}>
                  <AppText style={ms.anulacionLabel}>Motivo:</AppText>
                  <AppText style={[ms.anulacionValor, { flex: 1 }]}>
                    {venta.anulacion.motivo}
                  </AppText>
                </View>
              </View>
            </View>
          )}

          <View style={ms.divisor} />

          <View style={ms.tablaHeader}>
            <AppText style={[ms.colHead, { flex: 1 }]}>Producto</AppText>
            <AppText style={[ms.colHead, ms.colCant]}>Cant.</AppText>
            <AppText style={[ms.colHead, ms.colPrecio]}>Precio</AppText>
            <AppText style={[ms.colHead, ms.colTotal]}>Total</AppText>
          </View>

          <View style={ms.divisorDashed} />

          {venta.items.map((item: ItemVenta, index: number) => (
            <View
              key={index}
              style={[
                ms.filaProducto,
                index === venta.items.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <AppText style={ms.productoNombre} numberOfLines={1}>
                  {item.nombreProducto}
                </AppText>
                <AppText style={ms.productoPrecioUnit}>
                  {fmt(item.precioUnitario)} / {item.unidad ?? "und"}
                </AppText>
              </View>
              <AppText style={[ms.colValor, ms.colCant]}>
                {item.cantidad}
              </AppText>
              <AppText style={[ms.colValor, ms.colPrecio]}>
                {fmt(item.precioUnitario)}
              </AppText>
              <AppText
                style={[ms.colValor, ms.colTotal, { color: colors.primary }]}
              >
                {fmt(item.subtotal)}
              </AppText>
            </View>
          ))}

          <View style={ms.divisorDashed} />

          <View style={ms.totalRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <MaterialCommunityIcons
                name="shopping-outline"
                size={18}
                color={GRAY}
              />
              <AppText style={ms.totalLabel}>
                {venta.items.length}{" "}
                {venta.items.length === 1 ? "producto" : "productos"}
              </AppText>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <AppText style={ms.totalLabel}>Total</AppText>
              <AppText
                style={[
                  ms.totalMonto,
                  { color: esAnulada ? "#9CA3AF" : INK },
                  esAnulada && { textDecorationLine: "line-through" },
                ]}
              >
                {fmt(venta.total)}
              </AppText>
            </View>
          </View>

          {!esAnulada && !esPazYSalvo && (
            <View style={ms.fiadoInfo}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={AMBER}
              />
              <AppText style={ms.fiadoTxt}>
                Esta venta está pendiente de cobro. Puedes registrar el pago
                desde el perfil del cliente.
              </AppText>
            </View>
          )}

          {venta.numeroFactura && (
            <View style={ms.facturaRow}>
              <MaterialCommunityIcons name="receipt" size={16} color={GRAY} />
              <AppText style={ms.facturaTxt}>
                Factura #{venta.numeroFactura}
              </AppText>
            </View>
          )}

          {tieneMetodo && (
            <View style={[ms.facturaRow, { marginTop: 6 }]}>
              <MaterialCommunityIcons
                name={esTransferencia ? "bank-transfer" : "cash"}
                size={18}
                color={esTransferencia ? "#7C3AED" : "#16A34A"}
              />
              <AppText
                style={[
                  ms.facturaTxt,
                  {
                    color: esTransferencia ? "#7C3AED" : "#16A34A",
                    fontWeight: "700",
                  },
                ]}
              >
                Pagado en {esTransferencia ? "transferencia" : "efectivo"}
              </AppText>
            </View>
          )}

          {!esAnulada && (
            <TouchableOpacity
              style={ms.btnAnular}
              activeOpacity={0.8}
              onPress={() => onAnular(venta)}
            >
              <MaterialCommunityIcons name="cancel" size={22} color={RED} />
              <AppText style={ms.btnAnularTxt}>Anular factura</AppText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Modal Anular ──────────────────────────────────────────────────────────────
const ModalAnular = ({
  venta,
  visible,
  onClose,
  onConfirmar,
  anulando,
}: {
  venta: Venta | null;
  visible: boolean;
  onClose: () => void;
  onConfirmar: (motivo: string) => void;
  anulando: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const [motivo, setMotivo] = React.useState("");
  const [errorMotivo, setErrorMotivo] = React.useState("");
  const RED = "#DC2626";

  React.useEffect(() => {
    if (visible) {
      setMotivo("");
      setErrorMotivo("");
    }
  }, [visible]);

  const handleConfirmar = () => {
    const motivoTrimmed = motivo.trim();
    if (motivoTrimmed.length < 5) {
      setErrorMotivo("Describe el motivo (mínimo 5 caracteres)");
      return;
    }
    onConfirmar(motivoTrimmed);
  };

  if (!venta) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={ms.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAwareScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          bottomOffset={20}
          extraScrollHeight={60}
        >
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={ms.handle} />
            <View style={[ms.header, { borderBottomColor: "#FEE2E2" }]}>
              <View style={{ flex: 1 }}>
                <AppText style={[ms.headerTitulo, { color: RED }]}>
                  Anular factura
                </AppText>
                <AppText style={ms.headerFecha}>
                  {venta.numeroFactura
                    ? `Factura #${venta.numeroFactura}`
                    : venta.nombreCliente}
                </AppText>
              </View>
              <TouchableOpacity
                style={[ms.btnClose, { backgroundColor: "#FCA5A5" }]}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 20 }}>
              <View style={ms.resumenAnulacion}>
                <View style={ms.resumenFila}>
                  <AppText style={ms.resumenLabel}>Cliente</AppText>
                  <AppText style={ms.resumenValor}>
                    {venta.nombreCliente}
                  </AppText>
                </View>
                <View style={ms.resumenFila}>
                  <AppText style={ms.resumenLabel}>Total</AppText>
                  <AppText
                    style={[ms.resumenValor, { color: RED, fontWeight: "800" }]}
                  >
                    {fmt(venta.total)}
                  </AppText>
                </View>
                <View style={ms.resumenFila}>
                  <AppText style={ms.resumenLabel}>Tipo</AppText>
                  <AppText style={ms.resumenValor}>
                    {venta.tipo === "contado" ? "Contado" : "Crédito"}
                  </AppText>
                </View>
              </View>

              <View style={ms.avisoAnulacion}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={22}
                  color="#92400E"
                />
                <AppText style={ms.avisoTxt}>
                  Al anular: el stock de los productos se restaurará y la
                  factura quedará excluida de las ventas activas. Esta acción no
                  se puede deshacer.
                </AppText>
              </View>

              <View style={{ gap: 8 }}>
                <AppText style={mf.label}>Motivo de anulación</AppText>
                <View
                  style={[
                    ms.inputAreaWrap,
                    errorMotivo
                      ? { borderColor: "#EF4444", backgroundColor: "#FFF5F5" }
                      : null,
                  ]}
                >
                  <TextInput
                    style={ms.inputArea}
                    value={motivo}
                    onChangeText={(t) => {
                      setMotivo(t);
                      setErrorMotivo("");
                    }}
                    placeholder="Ej: Error en los productos, cliente canceló el pedido..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
                {!!errorMotivo && (
                  <AppText style={mf.errorTxt}>{errorMotivo}</AppText>
                )}
                <AppText
                  style={{ fontSize: 14, color: "#9CA3AF", textAlign: "right" }}
                >
                  {motivo.length}/200
                </AppText>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[ms.btnCancelarAnulacion, { flex: 1 }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                  disabled={anulando}
                >
                  <AppText style={ms.btnCancelarAnulacionTxt}>Cancelar</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    ms.btnConfirmarAnulacion,
                    { flex: 1 },
                    (anulando || motivo.trim().length < 5) && { opacity: 0.5 },
                  ]}
                  onPress={handleConfirmar}
                  activeOpacity={0.8}
                  disabled={anulando || motivo.trim().length < 5}
                >
                  {anulando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="cancel"
                        size={20}
                        color="#fff"
                      />
                      <AppText style={ms.btnConfirmarAnulacionTxt}>
                        Anular
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
export const VentaDelDiaScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();

  // ── Estados base ──────────────────────────────────────────────────────────
  const [todasVentasDeHoy, setTodasVentasDeHoy] = React.useState<Venta[]>([]);
  const [abonos, setAbonos] = React.useState<Abono[]>([]);
  const [deudores, setDeudores] = React.useState<ResumenCredito[]>([]);
  const [gastos, setGastos] = React.useState<Gasto[]>([]);

  // ── Controles UI ──────────────────────────────────────────────────────────
  const [filtroEstado, setFiltroEstado] = React.useState<TipoEstado>("todas");
  const [busqueda, setBusqueda] = React.useState("");
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);
  const [mostrarTodas, setMostrarTodas] = React.useState(false);
  const [exportando, setExportando] = React.useState(false);
  const [filtrosVisibles, setFiltrosVisibles] = React.useState(false);

  // ── Modales ───────────────────────────────────────────────────────────────
  const [ventaSeleccionada, setVentaSeleccionada] =
    React.useState<Venta | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [ventaAAnular, setVentaAAnular] = React.useState<Venta | null>(null);
  const [modalAnularVisible, setModalAnularVisible] = React.useState(false);
  const [anulando, setAnulando] = React.useState(false);

  // ── Trigger para refrescar la Caja ────────────────────────────────────────
  const [refreshCajaTrigger, setRefreshCajaTrigger] = React.useState(0);

  // ── Saldo real por factura ────────────────────────────────────────────────
  const saldoPorVenta = React.useMemo(() => {
    const mapa = new Map<string, number>();
    todasVentasDeHoy.forEach((v) => {
      const totalAbonado = abonos
        .filter((a) => a.ventaId === v.id && a.estado !== "anulado")
        .reduce((sum, a) => sum + a.monto, 0);
      mapa.set(v.id, Math.max(0, v.total - totalAbonado));
    });
    return mapa;
  }, [todasVentasDeHoy, abonos]);

  const totalAbonadoPorVenta = React.useMemo(() => {
    const mapa = new Map<string, number>();
    todasVentasDeHoy.forEach((v) => {
      const totalAbonado = abonos
        .filter((a) => a.ventaId === v.id && a.estado !== "anulado")
        .reduce((sum, a) => sum + a.monto, 0);
      mapa.set(v.id, totalAbonado);
    });
    return mapa;
  }, [todasVentasDeHoy, abonos]);

  const evaluarFacturaPagada = React.useCallback(
    (venta: Venta) => {
      if (venta.estado === "anulada") return false;
      if (venta.tipo === "contado") return true;
      if (venta.estado === "pagado") return true;
      const totalAbonado = abonos
        .filter((a) => a.ventaId === venta.id && a.estado !== "anulado")
        .reduce((sum, a) => sum + a.monto, 0);
      return totalAbonado >= venta.total;
    },
    [abonos],
  );

  // ── Filtro dinámico ───────────────────────────────────────────────────────
  const ventasFiltradas = React.useMemo(() => {
    let resultado = [...todasVentasDeHoy];
    if (filtroEstado === "pazysalvo") {
      resultado = resultado.filter(
        (v) => v.estado !== "anulada" && evaluarFacturaPagada(v),
      );
    } else if (filtroEstado === "debe") {
      resultado = resultado.filter(
        (v) => v.estado !== "anulada" && !evaluarFacturaPagada(v),
      );
    } else if (filtroEstado === "anulada") {
      resultado = resultado.filter((v) => v.estado === "anulada");
    }
    if (busqueda.trim() !== "") {
      const query = busqueda.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.nombreCliente.toLowerCase().includes(query) ||
          (v.numeroFactura && v.numeroFactura.toLowerCase().includes(query)),
      );
    }
    return resultado.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }, [todasVentasDeHoy, filtroEstado, busqueda, evaluarFacturaPagada]);

  // ── Estadísticas ──────────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const ventasActivas = ventasFiltradas.filter((v) => v.estado !== "anulada");
    const ventasAnuladas = ventasFiltradas.filter(
      (v) => v.estado === "anulada",
    );

    const ventasHoy = ventasActivas.length;
    const cantAnuladas = ventasAnuladas.length;
    const clientesHoy = [...new Set(ventasActivas.map((v) => v.clienteId))]
      .length;

    const abonosDeHoy = abonos.filter(
      (a: Abono) => esHoy(a.fecha) && a.estado !== "anulado",
    );
    const totalAbonosHoy = abonosDeHoy.reduce(
      (s: number, a: Abono) => s + a.monto,
      0,
    );

    const totalContadoHoy = ventasActivas
      .filter((v) => v.tipo === "contado")
      .reduce((a, v) => a + v.total, 0);

    const totalEfectivoHoy = ventasActivas
      .filter((v) => v.tipo === "contado" && v.metodoPago === "efectivo")
      .reduce((a, v) => a + v.total, 0);

    const totalTransferenciaHoy = ventasActivas
      .filter((v) => v.tipo === "contado" && v.metodoPago === "transferencia")
      .reduce((a, v) => a + v.total, 0);

    const recibiidoHoy = totalContadoHoy + totalAbonosHoy;

    const totalEnMora = ventasActivas
      .filter((v) => !evaluarFacturaPagada(v))
      .reduce((acc, v) => {
        const abonado = abonosDeHoy
          .filter((a: Abono) => a.ventaId === v.id)
          .reduce((s: number, a: Abono) => s + a.monto, 0);
        return acc + Math.max(0, v.total - abonado);
      }, 0);

    const totalAnulado = ventasAnuladas.reduce((a, v) => a + v.total, 0);

    const creditoSaldoHoy = ventasActivas
      .filter((v) => v.tipo === "credito")
      .reduce((acc, v) => {
        const abonado = abonosDeHoy
          .filter((a: Abono) => a.ventaId === v.id)
          .reduce((s: number, a: Abono) => s + a.monto, 0);
        return acc + Math.max(0, v.total - abonado);
      }, 0);

    const creditoPendiente = deudores.reduce((a, r) => a + r.saldoActual, 0);

    const totalGastosEfectivo = gastos
      .filter((g) => g.metodoPago === "efectivo")
      .reduce((a, g) => a + g.monto, 0);

    const totalGastosTransferencia = gastos
      .filter((g) => g.metodoPago === "transferencia")
      .reduce((a, g) => a + g.monto, 0);

    const totalGastos = totalGastosEfectivo + totalGastosTransferencia;

    return {
      ventasHoy,
      cantAnuladas,
      clientesHoy,
      recibiidoHoy,
      totalContadoHoy,
      totalEfectivoHoy,
      totalTransferenciaHoy,
      totalAbonosHoy,
      creditoSaldoHoy,
      creditoPendiente,
      totalEnMora,
      totalAnulado,
      totalGastos,
      totalGastosEfectivo,
      totalGastosTransferencia,
    };
  }, [ventasFiltradas, abonos, deudores, gastos, evaluarFacturaPagada]);

  // ── Cargar datos ──────────────────────────────────────────────────────────
  const cargar = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    try {
      const [abierta, ultimaHoy, resumenes] = await Promise.all([
        cajaRepo.getCajaAbierta(),
        cajaRepo.getUltimaCajaDelDia(fechaHoy()),
        creditoRepo.getResumenes(),
      ]);
      const cajaRelevante = abierta ?? ultimaHoy;
      setDeudores(resumenes);

      if (!cajaRelevante) {
        setTodasVentasDeHoy([]);
        setAbonos([]);
        setGastos([]);
        return;
      }

      const [ventasDeLaCaja, abonosDeLaCaja, gastosDeLaCaja] =
        await Promise.all([
          ventaRepo.getByCaja(cajaRelevante.id),
          creditoRepo.getAbonosPorCaja(cajaRelevante.id),
          gastoRepo.getGastosPorCaja(cajaRelevante.id),
        ]);

      setTodasVentasDeHoy(ventasDeLaCaja);
      setAbonos(abonosDeLaCaja);
      setGastos(gastosDeLaCaja);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  React.useEffect(() => {
    cargar();
  }, []);

  // ── Modales ventas ────────────────────────────────────────────────────────
  const abrirModal = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setTimeout(() => setVentaSeleccionada(null), 300);
  };

  const handleSolicitarAnular = (venta: Venta) => {
    cerrarModal();
    setTimeout(() => {
      setVentaAAnular(venta);
      setModalAnularVisible(true);
    }, 350);
  };

  const handleConfirmarAnulacion = async (motivo: string) => {
    if (!ventaAAnular) return;
    setAnulando(true);
    try {
      await ventaRepo.anular(ventaAAnular.id, { usuario: "Usuario", motivo });

      setTodasVentasDeHoy((prev) =>
        prev.map((v) =>
          v.id === ventaAAnular.id
            ? {
                ...v,
                estado: "anulada" as const,
                anulacion: {
                  fecha: new Date().toISOString(),
                  usuario: "Usuario",
                  motivo,
                },
              }
            : v,
        ),
      );

      setModalAnularVisible(false);
      setVentaAAnular(null);
      setRefreshCajaTrigger((prev) => prev + 1);

      Alert.alert(
        "Factura anulada",
        `La factura ${ventaAAnular.numeroFactura ?? ""} de hoy fue anulada y el stock restaurado.`,
        [{ text: "Entendido" }],
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo anular la factura.");
    } finally {
      setAnulando(false);
    }
  };

  // ── Exportar Excel ────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    if (ventasFiltradas.length === 0) {
      Alert.alert(
        "Sin datos",
        "No hay ventas con el filtro actual para exportar.",
      );
      return;
    }
    setExportando(true);
    try {
      const filas: object[] = [];
      ventasFiltradas.forEach((v) => {
        const esAnulada = v.estado === "anulada";
        const saldo = saldoPorVenta.get(v.id) ?? v.total;
        const estReal = esAnulada
          ? "Anulada"
          : evaluarFacturaPagada(v)
            ? "Al día"
            : saldo < v.total
              ? "Abono parcial"
              : "Debe";

        if (v.items && v.items.length > 0) {
          v.items.forEach((item: ItemVenta) => {
            filas.push({
              Factura: v.numeroFactura ?? v.id,
              Fecha: new Date(v.fecha).toLocaleDateString("es-CO", {
                timeZone: "America/Bogota",
              }),
              Hora: new Date(v.fecha).toLocaleTimeString("es-CO", {
                timeZone: "America/Bogota",
                hour: "2-digit",
                minute: "2-digit",
              }),
              Cliente: v.nombreCliente,
              Producto: item.nombreProducto,
              Cantidad: item.cantidad,
              "Precio unitario": item.precioUnitario,
              Subtotal: item.subtotal,
              "Tipo de pago": v.tipo === "contado" ? "Contado" : "Crédito",
              "Método de pago":
                v.tipo === "contado"
                  ? v.metodoPago === "efectivo"
                    ? "Efectivo"
                    : v.metodoPago === "transferencia"
                      ? "Transferencia"
                      : "No especificado"
                  : "N/A",
              "Total factura": v.total,
              "Saldo pendiente": esAnulada ? 0 : saldo,
              Estado: estReal,
              "Motivo Anulación": esAnulada ? (v.anulacion?.motivo ?? "") : "",
            });
          });
        } else {
          filas.push({
            Factura: v.numeroFactura ?? v.id,
            Fecha: new Date(v.fecha).toLocaleDateString("es-CO", {
              timeZone: "America/Bogota",
            }),
            Hora: new Date(v.fecha).toLocaleTimeString("es-CO", {
              timeZone: "America/Bogota",
              hour: "2-digit",
              minute: "2-digit",
            }),
            Cliente: v.nombreCliente,
            Producto: "",
            Cantidad: "",
            "Precio unitario": "",
            Subtotal: "",
            "Tipo de pago": v.tipo === "contado" ? "Contado" : "Crédito",
            "Método de pago":
              v.tipo === "contado"
                ? v.metodoPago === "efectivo"
                  ? "Efectivo"
                  : v.metodoPago === "transferencia"
                    ? "Transferencia"
                    : "No especificado"
                : "N/A",
            "Total factura": v.total,
            "Saldo pendiente": esAnulada ? 0 : saldo,
            Estado: estReal,
            "Motivo Anulación": esAnulada ? (v.anulacion?.motivo ?? "") : "",
          });
        }
      });

      const hoja = XLSX.utils.json_to_sheet(filas);
      hoja["!cols"] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 8 },
        { wch: 20 },
        { wch: 22 },
        { wch: 10 },
        { wch: 16 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 25 },
      ];
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Ventas del día");

      const base64 = XLSX.write(libro, { type: "base64", bookType: "xlsx" });
      const fechaArchivo = new Date().toISOString().substring(0, 10);
      const ruta = `${FileSystem.cacheDirectory}ventas_${fechaArchivo}.xlsx`;

      await FileSystem.writeAsStringAsync(ruta, base64, {
        encoding: "base64" as FileSystem.EncodingType,
      });

      const puedoCompartir = await Sharing.isAvailableAsync();
      if (puedoCompartir) {
        await Sharing.shareAsync(ruta, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Exportar ventas del día",
          UTI: "com.microsoft.excel.xlsx",
        });
      } else {
        Alert.alert(
          "No disponible",
          "Tu dispositivo no soporta compartir archivos.",
        );
      }
    } catch (e) {
      console.error("Error exportando Excel:", e);
      Alert.alert("Error", "No se pudo generar el archivo. Intenta de nuevo.");
    } finally {
      setExportando(false);
    }
  };

  if (cargando) {
    return (
      <ScreenWrapper title="Venta del día" showBtnB={false}>
        <View style={s.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText
            style={{ marginTop: 16, fontSize: 18, color: colors.grayText }}
          >
            Cargando resumen...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  const hayVentasHistoricasHoy = todasVentasDeHoy.length > 0;
  const ventasVisibles = mostrarTodas
    ? ventasFiltradas
    : ventasFiltradas.slice(0, 5);

  const filtrosEstado: {
    key: TipoEstado;
    label: string;
    color: string;
  }[] = [
    { key: "todas", label: "Todas", color: colors.primary },
    { key: "pazysalvo", label: "Activas", color: "#16A34A" },
    { key: "debe", label: "En mora", color: "#D97706" },
    { key: "anulada", label: "Anuladas", color: "#DC2626" },
  ];

  return (
    <ScreenWrapper title="Venta del día" showBtnB={false}>
      {/* ══ CAJA ══ */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <CajaWidget
          onCajaActualizada={() => cargar(true)}
          refreshTrigger={refreshCajaTrigger}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              cargar(true);
              setRefreshCajaTrigger((prev) => prev + 1);
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ height: 4 }} />

        {/* ══ BUSCADOR — siempre visible ══════════════════════════════ */}
        {hayVentasHistoricasHoy && (
          <View style={{ marginBottom: 18 }}>
            <View style={s.contenedorBuscador}>
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color="#7B8499"
                style={{ marginLeft: 16 }}
              />
              <TextInput
                style={s.inputBuscador}
                placeholder="Buscar cliente o factura..."
                placeholderTextColor="#7B8499"
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity
                  onPress={() => setBusqueda("")}
                  style={{ padding: 10, marginRight: 8 }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {/* ══ PANEL COLAPSABLE — solo chips de estado ══════════════════ */}
        {hayVentasHistoricasHoy && (
          <View style={s.filtrosPanel}>
            <TouchableOpacity
              style={s.filtrosHeader}
              onPress={() => setFiltrosVisibles(!filtrosVisibles)}
              activeOpacity={0.8}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={24}
                  color={colors.primary}
                />
                <AppText style={s.filterTitle}>Filtros de Búsqueda</AppText>
              </View>
              <MaterialCommunityIcons
                name={filtrosVisibles ? "chevron-up" : "chevron-down"}
                size={26}
                color="#4B5563"
              />
            </TouchableOpacity>

            {filtrosVisibles && (
              <View style={s.filtrosContenido}>
                <AppText style={s.seccionFiltroTitulo}>
                  Estado de facturas
                </AppText>
                <View style={s.chipsGrid}>
                  {filtrosEstado.map(({ key, label, color }) => {
                    const activo = filtroEstado === key;
                    const conteo =
                      key === "todas"
                        ? todasVentasDeHoy.length
                        : key === "anulada"
                          ? todasVentasDeHoy.filter(
                              (v) => v.estado === "anulada",
                            ).length
                          : key === "pazysalvo"
                            ? todasVentasDeHoy.filter(
                                (v) =>
                                  v.estado !== "anulada" &&
                                  evaluarFacturaPagada(v),
                              ).length
                            : todasVentasDeHoy.filter(
                                (v) =>
                                  v.estado !== "anulada" &&
                                  !evaluarFacturaPagada(v),
                              ).length;

                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          s.chip,
                          activo && {
                            backgroundColor: color,
                            borderColor: color,
                          },
                        ]}
                        onPress={() => {
                          setFiltroEstado(key);
                          setMostrarTodas(false);
                          setBusqueda("");
                        }}
                        activeOpacity={0.8}
                      >
                        <AppText
                          style={[
                            s.chipTxt,
                            activo && { color: "#FFF", fontWeight: "700" },
                          ]}
                        >
                          {label} · {conteo}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ══ EXPORTAR EXCEL ════════════════════════════════════════════ */}
                <TouchableOpacity
                  style={[s.exportarBtn, exportando && { opacity: 0.6 }]}
                  activeOpacity={0.8}
                  onPress={exportarExcel}
                  disabled={exportando}
                >
                  {exportando ? (
                    <ActivityIndicator size="small" color="#166534" />
                  ) : (
                    <MaterialCommunityIcons
                      name="file-excel"
                      size={22}
                      color="#15803D"
                    />
                  )}
                  <AppText style={s.exportarBtnTxt}>
                    {exportando
                      ? "Generando archivo..."
                      : "Exportar ventas de hoy a Excel"}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ══ GASTOS DEL DÍA ══════════════════════════════════════════════
            Se oculta por completo cuando el Estado del pago es
            "En mora" o "Anuladas". ──────────────────────────────────── */}
        {filtroEstado !== "debe" &&
          filtroEstado !== "anulada" &&
          gastos.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={s.seccionHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={20}
                    color="#E03E3E"
                  />
                  <AppText style={s.seccionTitulo}>Gastos de hoy</AppText>
                </View>
              </View>

              <View style={s.metricaCard}>
                <View style={s.metricaFila}>
                  <AppText
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    Total
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 20,
                      fontWeight: "900",
                      color: "#DC2626",
                    }}
                  >
                    -{fmt(stats.totalGastos)}
                  </AppText>
                </View>

                <View style={s.metricaDivisor} />

                {gastos.slice(0, 3).map((g) => (
                  <View key={g.id} style={s.metricaFila}>
                    <View style={{ flex: 1 }}>
                      <AppText style={s.gastoNombre} numberOfLines={1}>
                        {g.descripcion}
                      </AppText>
                      <AppText style={s.gastoSub}>
                        {g.categoria} ·{" "}
                        {g.metodoPago === "efectivo"
                          ? "Efectivo"
                          : "Transferencia"}
                      </AppText>
                    </View>
                    <AppText style={s.gastoMonto}>-{fmt(g.monto)}</AppText>
                  </View>
                ))}

                {gastos.length > 3 && (
                  <AppText
                    style={{
                      fontSize: 13,
                      color: colors.primary,
                      fontWeight: "600",
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    +{gastos.length - 3} gastos más — ver en Gastos
                  </AppText>
                )}
              </View>
            </View>
          )}

        {/* ══ LISTA VENTAS DEL DÍA ══════════════════════════════════════ */}
        {hayVentasHistoricasHoy ? (
          ventasFiltradas.length > 0 ? (
            <>
              <View style={s.seccionHeader}>
                <AppText style={s.seccionTitulo}>Ventas de hoy</AppText>
                {ventasFiltradas.length > 5 && (
                  <TouchableOpacity
                    onPress={() => setMostrarTodas((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <AppText style={[s.verTodasTxt, { color: colors.primary }]}>
                      {mostrarTodas
                        ? "Ver menos"
                        : `Ver todas (${ventasFiltradas.length})`}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ marginBottom: 16 }}>
                {ventasVisibles.map((venta) => {
                  const esAnulada = venta.estado === "anulada";
                  const esFacturaSaldada =
                    !esAnulada && evaluarFacturaPagada(venta);
                  const totalAbonado = totalAbonadoPorVenta.get(venta.id) ?? 0;

                  const badgeBg = esAnulada
                    ? "#FEE2E2"
                    : esFacturaSaldada
                      ? "#DCFCE7"
                      : "#FEF3C7";
                  const badgeColor = esAnulada
                    ? "#DC2626"
                    : esFacturaSaldada
                      ? "#16A34A"
                      : "#D97706";
                  const badgeLabel = esAnulada
                    ? "Anulada"
                    : esFacturaSaldada
                      ? "Al día"
                      : "En mora";

                  const metodoRegistrado =
                    venta.tipo === "contado"
                      ? venta.metodoPago || "efectivo"
                      : (venta as any).metodoCuotaInicial &&
                          (venta as any).cuotaInicial > 0
                        ? (venta as any).metodoCuotaInicial
                        : null;
                  const metodoRaw = metodoRegistrado
                    ? String(metodoRegistrado).toLowerCase()
                    : null;
                  const esTransferencia = metodoRaw
                    ? metodoRaw.includes("transferencia")
                    : false;
                  const metodoTexto = esTransferencia
                    ? "Transferencia"
                    : "Efectivo";
                  const metodoIcono = esTransferencia ? "bank" : "cash";
                  const metodoBg = esTransferencia ? "#EBF1FF" : "#EBF7EE";
                  const metodoColor = esTransferencia ? "#1A56DB" : "#149246";

                  return (
                    <TouchableOpacity
                      key={venta.id}
                      style={[s.ventaCard, esAnulada && s.ventaCardAnulada]}
                      activeOpacity={0.7}
                      onPress={() => abrirModal(venta)}
                    >
                      <View style={s.ventaCardTop}>
                        <View style={s.ventaCardLeft}>
                          <View style={{ flex: 1 }}>
                            <AppText
                              style={[
                                s.clienteName,
                                esAnulada && {
                                  textDecorationLine: "line-through",
                                  color: "#9CA3AF",
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {venta.nombreCliente}
                            </AppText>

                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                marginTop: 4,
                              }}
                            >
                              <AppText style={s.ventaHora}>
                                {horaDeVenta(venta.fecha)}
                              </AppText>
                              {venta.numeroFactura && (
                                <>
                                  <AppText style={s.ventaDot}>•</AppText>
                                  <AppText style={s.ventaFactura}>
                                    #{venta.numeroFactura}
                                  </AppText>
                                </>
                              )}
                            </View>

                            {!esAnulada && metodoRaw && (
                              <View
                                style={[
                                  s.metodoPill,
                                  { backgroundColor: metodoBg },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name={metodoIcono as any}
                                  size={13}
                                  color={metodoColor}
                                  style={{ marginRight: 4 }}
                                />
                                <AppText
                                  style={[
                                    s.metodoPillTxt,
                                    { color: metodoColor },
                                  ]}
                                >
                                  {metodoTexto}
                                </AppText>
                              </View>
                            )}
                          </View>
                        </View>

                        <View
                          style={{
                            alignItems: "flex-end",
                            justifyContent: "center",
                          }}
                        >
                          <AppText
                            style={[
                              s.ventaTotal,
                              esAnulada && {
                                textDecorationLine: "line-through",
                                color: "#9CA3AF",
                              },
                            ]}
                          >
                            {fmt(venta.total)}
                          </AppText>

                          <View
                            style={[s.miniBadge, { backgroundColor: badgeBg }]}
                          >
                            <AppText
                              style={[s.miniBadgeTxt, { color: badgeColor }]}
                            >
                              {badgeLabel}
                            </AppText>
                          </View>

                          {!esAnulada && venta.tipo === "credito" && (
                            <AppText style={s.ventaAbonoTxt}>
                              Abono: {fmt(totalAbonado)}
                            </AppText>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <View
              style={[
                s.metricaCard,
                { alignItems: "center", paddingVertical: 48 },
              ]}
            >
              <MaterialCommunityIcons
                name="database-search-outline"
                size={64}
                color="#C4CBD8"
                style={{ marginBottom: 16 }}
              />
              <AppText style={s.vacioCabeza}>
                No hay ventas con este filtro
              </AppText>
            </View>
          )
        ) : (
          <View
            style={[
              s.metricaCard,
              { alignItems: "center", paddingVertical: 48 },
            ]}
          >
            <MaterialCommunityIcons
              name="cart-off"
              size={64}
              color="#C4CBD8"
              style={{ marginBottom: 16 }}
            />
            <AppText style={s.vacioCabeza}>Sin ventas hoy</AppText>
            <AppText style={s.vacioSub}>
              Cuando registres una venta aparecerá aquí el resumen del día
            </AppText>
          </View>
        )}

        {/* ══ CRÉDITO PENDIENTE HISTÓRICO ═══════════════════════════════ */}
        {/* {deudores.length > 0 && (
          <View style={s.creditoCard}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={22}
                color="#D97706"
              />
              <View>
                <AppText style={s.creditoTitulo}>
                  Cartera total pendiente
                </AppText>
                <AppText style={s.creditoSubtitulo}>Todos los días</AppText>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <AppText style={s.creditoMonto}>
                {fmt(stats.creditoPendiente)}
              </AppText>
              <AppText style={s.creditoClientes}>
                {deudores.length} cliente{deudores.length !== 1 ? "s" : ""}
              </AppText>
            </View>
          </View>
        )} */}
      </ScrollView>

      <ModalFactura
        venta={ventaSeleccionada}
        visible={modalVisible}
        onClose={cerrarModal}
        evaluarFacturaPagada={evaluarFacturaPagada}
        onAnular={handleSolicitarAnular}
      />

      <ModalAnular
        venta={ventaAAnular}
        visible={modalAnularVisible}
        onClose={() => {
          setModalAnularVisible(false);
          setVentaAAnular(null);
        }}
        onConfirmar={handleConfirmarAnulacion}
        anulando={anulando}
      />
    </ScreenWrapper>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },

  contenedorBuscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E6EF",
    borderRadius: 18,
    height: 52,
  },
  inputBuscador: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingHorizontal: 12,
    fontWeight: "500",
  },

  // ── Panel colapsable (igual que Historial) ─────────────────────────────
  filtrosPanel: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 18,
  },
  filtrosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  filtrosContenido: {
    marginTop: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 14,
  },
  seccionFiltroTitulo: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  chip: {
    width: "48.5%",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  chipTxt: { fontSize: 15, color: "#4B5563", fontWeight: "600" },

  exportarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 18,
  },
  exportarBtnTxt: { fontSize: 15, fontWeight: "700", color: "#166534" },

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seccionTitulo: { fontSize: 18, fontWeight: "800", color: "#111827" },
  verTodasTxt: { fontSize: 15, fontWeight: "700" },

  ventaCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  ventaCardAnulada: {
    opacity: 0.72,
    borderColor: "#FECACA",
    borderWidth: 1.5,
  },
  ventaCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  ventaCardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  clienteName: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  ventaHora: { fontSize: 13, color: "#94A3B8" },
  ventaDot: { fontSize: 13, color: "#CBD5E1" },
  ventaFactura: { fontSize: 13, color: "#94A3B8" },
  metodoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  metodoPillTxt: { fontSize: 12, fontWeight: "700" },
  ventaTotal: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  miniBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  miniBadgeTxt: { fontSize: 12, fontWeight: "700" },
  ventaAbonoTxt: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
    fontWeight: "500",
  },

  metricaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricaLabel: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  metricaDivisor: { height: 1, backgroundColor: "#F0F2F7" },

  gastoNombre: { fontSize: 14, fontWeight: "600", color: "#111827" },
  gastoSub: { fontSize: 12, color: "#9CA3AF" },
  gastoMonto: { fontSize: 14, fontWeight: "700", color: "#E03E3E" },

  creditoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  creditoTitulo: { fontSize: 16, color: "#92400E", fontWeight: "700" },
  creditoSubtitulo: { fontSize: 12, color: "#B45309", fontWeight: "500" },
  creditoMonto: { fontSize: 18, color: "#D97706", fontWeight: "800" },
  creditoClientes: { fontSize: 13, fontWeight: "500", color: "#B45309" },

  vacioCabeza: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  vacioSub: {
    fontSize: 15,
    color: "#7B8499",
    textAlign: "center",
    lineHeight: 22,
  },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  handle: {
    width: 42,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitulo: { fontSize: 22, fontWeight: "800", color: "#111827" },
  headerFecha: { fontSize: 15, color: "#6B7280", marginTop: 3 },
  btnClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  clienteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  avatarGrande: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { fontSize: 22, fontWeight: "700" },
  clienteNombre: { fontSize: 20, fontWeight: "700", color: "#111827" },
  clienteHora: { fontSize: 15, color: "#6B7280", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  badgeTxt: { fontSize: 14, fontWeight: "700" },
  bloqueAnulacion: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 16,
  },
  anulacionFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  anulacionLabel: { fontSize: 14, fontWeight: "600", color: "#7F1D1D" },
  anulacionValor: { fontSize: 14, color: "#991B1B" },
  divisor: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 14 },
  divisorDashed: {
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    marginVertical: 14,
  },
  tablaHeader: { flexDirection: "row", paddingVertical: 6 },
  colHead: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  colCant: { width: 50, textAlign: "center" },
  colPrecio: { width: 85, textAlign: "right" },
  colTotal: { width: 95, textAlign: "right" },
  filaProducto: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  productoNombre: { fontSize: 16, fontWeight: "600", color: "#111827" },
  productoPrecioUnit: { fontSize: 13, color: "#6B7280" },
  colValor: { fontSize: 15, fontWeight: "600", color: "#374151" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#4B5563" },
  totalMonto: { fontSize: 26, fontWeight: "800" },
  fiadoInfo: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  fiadoTxt: { flex: 1, fontSize: 14, color: "#B45309", lineHeight: 18 },
  facturaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  facturaTxt: { fontSize: 14, color: "#6B7280" },
  btnAnular: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  btnAnularTxt: { fontSize: 16, fontWeight: "700", color: "#DC2626" },
  resumenAnulacion: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  resumenFila: { flexDirection: "row", justifyContent: "space-between" },
  resumenLabel: { fontSize: 15, color: "#4B5563" },
  resumenValor: { fontSize: 15, color: "#111827", fontWeight: "600" },
  avisoAnulacion: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  avisoTxt: { flex: 1, fontSize: 14, color: "#92400E", lineHeight: 18 },
  inputAreaWrap: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    height: 95,
  },
  inputArea: { flex: 1, fontSize: 16, color: "#111827" },
  btnCancelarAnulacion: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelarAnulacionTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B5563",
  },
  btnConfirmarAnulacion: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnConfirmarAnulacionTxt: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});

const mf = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "700", color: "#374151" },
  errorTxt: { fontSize: 14, color: "#EF4444", marginTop: 3 },
});
