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
import { CreditoRepositoryImpl } from "../../../data/repositories/CreditoRepositoryImpl";
import { VentaRepositoryImpl } from "../../../data/repositories/VentaRepositoryImpl";
import { ResumenCredito } from "../../../domain/entities/Credito";
import { ItemVenta, Venta } from "../../../domain/entities/Venta";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

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

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoEstado = "todas" | "pazysalvo" | "debe" | "anulada";

interface Abono {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  fecha: string;
  estado?: string; // "activo" | "anulado"
}

const AVATAR_COLORS = [
  { bg: "#FCE4EC", fg: "#E91E63" },
  { bg: "#E8F5E9", fg: "#2E7D32" },
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#FFF3E0", fg: "#F59E0B" },
  { bg: "#E3F2FD", fg: "#1565C0" },
  { bg: "#F3E8FF", fg: "#9333EA" },
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
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
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
                size={14}
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
                <MaterialCommunityIcons name="cancel" size={18} color={RED} />
                <AppText
                  style={{ fontSize: 15, fontWeight: "800", color: RED }}
                >
                  Factura anulada
                </AppText>
              </View>
              <View style={{ gap: 4 }}>
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
                size={15}
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
                size={16}
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
              <MaterialCommunityIcons name="receipt" size={14} color={GRAY} />
              <AppText style={ms.facturaTxt}>
                Factura #{venta.numeroFactura}
              </AppText>
            </View>
          )}

          {!esAnulada && venta.tipo === "contado" && venta.metodoPago && (
            <View style={[ms.facturaRow, { marginTop: 6 }]}>
              <MaterialCommunityIcons
                name={
                  venta.metodoPago === "efectivo" ? "cash" : "bank-transfer"
                }
                size={14}
                color={venta.metodoPago === "efectivo" ? "#16A34A" : "#7C3AED"}
              />
              <AppText
                style={[
                  ms.facturaTxt,
                  {
                    color:
                      venta.metodoPago === "efectivo" ? "#16A34A" : "#7C3AED",
                    fontWeight: "600",
                  },
                ]}
              >
                Pagado en{" "}
                {venta.metodoPago === "efectivo" ? "efectivo" : "transferencia"}
              </AppText>
            </View>
          )}

          {!esAnulada && (
            <TouchableOpacity
              style={ms.btnAnular}
              activeOpacity={0.8}
              onPress={() => onAnular(venta)}
            >
              <MaterialCommunityIcons name="cancel" size={20} color={RED} />
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
  const { colors } = useTheme();
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
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
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
                <MaterialCommunityIcons name="close" size={18} color="#fff" />
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
                  size={18}
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
                  style={{ fontSize: 12, color: "#9CA3AF", textAlign: "right" }}
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
                        size={18}
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

  // Estados Base
  const [todasVentasDeHoy, setTodasVentasDeHoy] = React.useState<Venta[]>([]);
  const [abonos, setAbonos] = React.useState<Abono[]>([]);
  const [deudores, setDeudores] = React.useState<ResumenCredito[]>([]);

  // Controles UI
  const [filtroEstado, setFiltroEstado] = React.useState<TipoEstado>("todas");
  const [busqueda, setBusqueda] = React.useState("");
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);
  const [mostrarTodas, setMostrarTodas] = React.useState(false);
  const [exportando, setExportando] = React.useState(false);

  // Modales
  const [ventaSeleccionada, setVentaSeleccionada] =
    React.useState<Venta | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  // Anulación
  const [ventaAAnular, setVentaAAnular] = React.useState<Venta | null>(null);
  const [modalAnularVisible, setModalAnularVisible] = React.useState(false);
  const [anulando, setAnulando] = React.useState(false);

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

  // ── Filtro Dinámico ───────────────────────────────────────────────────────
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

  // ── Estadísticas y Restas Automáticas de las tarjetas ───────────────────
  const stats = React.useMemo(() => {
    // Stats sobre ventasFiltradas para que cambien al filtrar (igual que Historial)
    const ventasActivas = ventasFiltradas.filter((v) => v.estado !== "anulada");
    const ventasAnuladas = ventasFiltradas.filter(
      (v) => v.estado === "anulada",
    );

    const ventasHoy = ventasActivas.length;
    const cantAnuladas = ventasAnuladas.length;
    const clientesHoy = [...new Set(ventasActivas.map((v) => v.clienteId))]
      .length;

    // Abonos cobrados HOY activos
    const abonosDeHoy = abonos.filter(
      (a: Abono) => esHoy(a.fecha) && a.estado !== "anulado",
    );
    const totalAbonosHoy = abonosDeHoy.reduce(
      (s: number, a: Abono) => s + a.monto,
      0,
    );

    // Ventas pagadas al contado (del filtro activo)
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

    // Total de facturas en mora (saldo pendiente real)
    const totalEnMora = ventasActivas
      .filter((v) => !evaluarFacturaPagada(v))
      .reduce((acc, v) => {
        const abonado = abonosDeHoy
          .filter((a: Abono) => a.ventaId === v.id)
          .reduce((s: number, a: Abono) => s + a.monto, 0);
        return acc + Math.max(0, v.total - abonado);
      }, 0);

    // Total de facturas anuladas
    const totalAnulado = ventasAnuladas.reduce((a, v) => a + v.total, 0);

    // Saldo real pendiente de las ventas a crédito del filtro activo
    const creditoSaldoHoy = ventasActivas
      .filter((v) => v.tipo === "credito")
      .reduce((acc, v) => {
        const abonado = abonosDeHoy
          .filter((a: Abono) => a.ventaId === v.id)
          .reduce((s: number, a: Abono) => s + a.monto, 0);
        return acc + Math.max(0, v.total - abonado);
      }, 0);

    const creditoPendiente = deudores.reduce((a, r) => a + r.saldoActual, 0);

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
    };
  }, [ventasFiltradas, abonos, deudores, evaluarFacturaPagada]);

  // ── Top 3 productos (excluyendo anuladas) ───────────────────────────────
  const top3 = React.useMemo(() => {
    const conteo: { [nombre: string]: number } = {};
    todasVentasDeHoy
      .filter((v) => v.estado !== "anulada")
      .forEach((v) => {
        (v.items ?? []).forEach((item: ItemVenta) => {
          const nombre = item.nombreProducto ?? "Producto";
          const subtotal =
            item.subtotal ?? (item.precioUnitario ?? 0) * (item.cantidad ?? 1);
          conteo[nombre] = (conteo[nombre] ?? 0) + subtotal;
        });
      });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, total]) => ({ nombre, total }));
  }, [todasVentasDeHoy]);

  const cargar = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    try {
      const [todasVentas, resumenes, listaAbonos] = await Promise.all([
        ventaRepo.getAll(),
        creditoRepo.getResumenes(),
        creditoRepo.getAbonos ? creditoRepo.getAbonos() : Promise.resolve([]),
      ]);

      const ventasDeHoy = todasVentas.filter((v) => esHoy(v.fecha));
      setTodasVentasDeHoy(ventasDeHoy);
      setAbonos(listaAbonos);
      setDeudores(resumenes);
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

  // ── Funciones Modales ───────────────────────────────────────────────────
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
      await ventaRepo.anular(ventaAAnular.id, {
        usuario: "Usuario",
        motivo,
      });

      // Actualizar el estado local en la matriz del día (Se recalcularán solos todos los memos de las tarjetas)
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
  const medallas = ["🥇", "🥈", "🥉"];
  const barColors = ["#F59E0B", "#9CA3AF", "#CD7C2F"];
  const maxTotal = top3[0]?.total ?? 1;

  return (
    <ScreenWrapper title="Venta del día" showBtnB={false}>
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
            onRefresh={() => cargar(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ══ FILTRO ESTADO ═════════════════════════════════════════════ */}
        {hayVentasHistoricasHoy && (
          <View style={s.filterSection}>
            {/* Buscador */}
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

            <AppText style={[s.filterTitle, { marginTop: 16 }]}>
              Estado de facturas
            </AppText>
            <View style={[s.filterRow, { flexWrap: "wrap" }]}>
              {(
                [
                  {
                    key: "todas",
                    label: "Todas",
                    color: colors.primary,
                    bgSuave: "#EFF6FF",
                  },
                  {
                    key: "pazysalvo",
                    label: "Activas",
                    color: "#16A34A",
                    bgSuave: "#F0FDF4",
                  },
                  {
                    key: "debe",
                    label: "En mora",
                    color: "#D97706",
                    bgSuave: "#FFFBEB",
                  },
                  {
                    key: "anulada",
                    label: "Anuladas",
                    color: "#DC2626",
                    bgSuave: "#FEF2F2",
                  },
                ] as {
                  key: TipoEstado;
                  label: string;
                  color: string;
                  bgSuave: string;
                }[]
              ).map(({ key, label, color, bgSuave }) => {
                const activo = filtroEstado === key;
                const conteo =
                  key === "todas"
                    ? todasVentasDeHoy.length
                    : key === "anulada"
                      ? todasVentasDeHoy.filter((v) => v.estado === "anulada")
                          .length
                      : key === "pazysalvo"
                        ? todasVentasDeHoy.filter(
                            (v) =>
                              v.estado !== "anulada" && evaluarFacturaPagada(v),
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
                      s.filterBtn,
                      { backgroundColor: activo ? color : bgSuave, flex: 1 },
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
                        s.filterBtnText,
                        { color: activo ? "#FFF" : "#4B5563", fontSize: 13 },
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </AppText>
                    <View
                      style={{
                        marginTop: 3,
                        backgroundColor: activo
                          ? "rgba(255,255,255,0.25)"
                          : color,
                        borderRadius: 10,
                        minWidth: 22,
                        height: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 5,
                      }}
                    >
                      <AppText
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: "#FFF",
                        }}
                      >
                        {conteo}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[s.btnExcel, exportando && { opacity: 0.6 }]}
          activeOpacity={0.8}
          onPress={exportarExcel}
          disabled={exportando}
        >
          {exportando ? (
            <ActivityIndicator size="small" color="#15803D" />
          ) : (
            <MaterialCommunityIcons
              name="file-excel"
              size={24}
              color="#15803D"
            />
          )}
          <AppText style={s.btnExcelTxt}>
            {exportando
              ? "Generando archivo..."
              : "Exportar ventas de hoy a Excel"}
          </AppText>
        </TouchableOpacity>

        {/* ══ TARJETA PRINCIPAL ══════════════════════════════════════════ */}
        <View style={[s.card, { marginBottom: 16 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 2,
            }}
          >
            <AppText style={s.labelGris}>
              {filtroEstado === "debe"
                ? "Dinero en mora"
                : filtroEstado === "anulada"
                  ? "Dinero anulado"
                  : "Dinero recibido"}
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#EFF6FF",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <AppText style={{ fontSize: 12 }}>📅</AppText>
              <AppText
                style={{ fontSize: 12, color: "#2563EB", fontWeight: "700" }}
              >
                {new Date().toLocaleDateString("es-CO", {
                  timeZone: "America/Bogota",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </AppText>
            </View>
          </View>

          <AppText
            style={[
              s.totalGrande,
              {
                color:
                  filtroEstado === "debe"
                    ? "#D97706"
                    : filtroEstado === "anulada"
                      ? "#DC2626"
                      : hayVentasHistoricasHoy
                        ? colors.primary
                        : colors.grayText,
              },
            ]}
          >
            {filtroEstado === "debe"
              ? fmt(stats.totalEnMora)
              : filtroEstado === "anulada"
                ? fmt(stats.totalAnulado)
                : fmt(stats.recibiidoHoy)}
          </AppText>

          {(filtroEstado === "todas" || filtroEstado === "pazysalvo") && (
            <View
              style={{
                backgroundColor: "#F8FAFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E8EEFB",
                padding: 14,
                gap: 10,
                marginBottom: 14,
              }}
            >
              {/* Ventas pagadas */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <AppText
                    style={{
                      fontSize: 18,
                      color: "#374151",
                      fontWeight: "700",
                    }}
                  >
                    Ventas pagadas
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 14,
                      color: "#9CA3AF",
                      fontWeight: "500",
                    }}
                  >
                    Pago al contado
                  </AppText>
                </View>
                <AppText
                  style={{ fontSize: 20, color: "#16A34A", fontWeight: "800" }}
                >
                  {fmt(stats.totalContadoHoy)}
                </AppText>
              </View>

              {/* Desglose efectivo / transferencia */}
              <View style={{ gap: 8 }}>
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
                      gap: 6,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="cash"
                      size={17}
                      color="#6B7280"
                    />
                    <AppText
                      style={{
                        fontSize: 16,
                        color: "#6B7280",
                        fontWeight: "500",
                      }}
                    >
                      efectivo
                    </AppText>
                  </View>
                  <AppText
                    style={{
                      fontSize: 16,
                      color: "#16A34A",
                      fontWeight: "700",
                    }}
                  >
                    {fmt(stats.totalEfectivoHoy)}
                  </AppText>
                </View>
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
                      gap: 6,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="bank-transfer"
                      size={17}
                      color="#6B7280"
                    />
                    <AppText
                      style={{
                        fontSize: 16,
                        color: "#6B7280",
                        fontWeight: "500",
                      }}
                    >
                      tranferencia
                    </AppText>
                  </View>
                  <AppText
                    style={{
                      fontSize: 16,
                      color: "#16A34A",
                      fontWeight: "700",
                    }}
                  >
                    {fmt(stats.totalTransferenciaHoy)}
                  </AppText>
                </View>
              </View>

              {(filtroEstado === "todas" || filtroEstado === "pazysalvo") && (
                <>
                  <View style={{ height: 1, backgroundColor: "#E8EEFB" }} />

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <AppText
                        style={{
                          fontSize: 18,
                          color: "#374151",
                          fontWeight: "700",
                        }}
                      >
                        Abonos recibidos
                      </AppText>
                      <AppText
                        style={{
                          fontSize: 14,
                          color: "#9CA3AF",
                          fontWeight: "500",
                        }}
                      >
                        Pagos parciales de créditos
                      </AppText>
                    </View>
                    <AppText
                      style={{
                        fontSize: 20,
                        color: "#2563EB",
                        fontWeight: "800",
                      }}
                    >
                      {fmt(stats.totalAbonosHoy)}
                    </AppText>
                  </View>
                </>
              )}
            </View>
          )}

          {stats.creditoSaldoHoy > 0 &&
            (filtroEstado === "todas" || filtroEstado === "pazysalvo") && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#FFFBEB",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#FDE68A",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialCommunityIcons
                    name="clock-alert-outline"
                    size={22}
                    color="#D97706"
                  />
                  <View>
                    <AppText
                      style={{
                        fontSize: 16,
                        color: "#92400E",
                        fontWeight: "700",
                      }}
                    >
                      Pendiente de cobro
                    </AppText>
                    <AppText
                      style={{
                        fontSize: 12,
                        color: "#B45309",
                        fontWeight: "500",
                      }}
                    >
                      Créditos sin saldar hoy
                    </AppText>
                  </View>
                </View>
                <AppText
                  style={{ fontSize: 18, color: "#D97706", fontWeight: "800" }}
                >
                  {fmt(stats.creditoSaldoHoy)}
                </AppText>
              </View>
            )}

          {stats.cantAnuladas > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#FECACA",
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 14,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <MaterialCommunityIcons
                  name="cancel"
                  size={22}
                  color="#DC2626"
                />
                <View>
                  <AppText
                    style={{
                      fontSize: 16,
                      color: "#7F1D1D",
                      fontWeight: "700",
                    }}
                  >
                    Facturas anuladas
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 12,
                      color: "#991B1B",
                      fontWeight: "500",
                    }}
                  >
                    Excluidas del total
                  </AppText>
                </View>
              </View>
              <AppText
                style={{ fontSize: 18, color: "#DC2626", fontWeight: "800" }}
              >
                {stats.cantAnuladas}
              </AppText>
            </View>
          )}

          <View style={s.divisorH} />

          <View style={s.filaCounts}>
            <View style={s.countItem}>
              <View style={[s.iconBubble, { backgroundColor: "#FFF3E0" }]}>
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={24}
                  color="#F59E0B"
                />
              </View>
              <View>
                <AppText style={s.countNum}>{stats.ventasHoy}</AppText>
                <AppText style={s.countLabel}>Ventas hoy</AppText>
              </View>
            </View>
            <View style={s.divisorV} />
            <View style={s.countItem}>
              <View style={[s.iconBubble, { backgroundColor: "#FCE4EC" }]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={24}
                  color="#E91E63"
                />
              </View>
              <View>
                <AppText style={s.countNum}>{stats.clientesHoy}</AppText>
                <AppText style={s.countLabel}>Clientes hoy</AppText>
              </View>
            </View>
          </View>

          {/* ══ TOP 3 PRODUCTOS ══════════════════════════════════════════ */}
          {top3.length > 0 && (
            <>
              <View style={[s.divisorH, { marginTop: 4, marginBottom: 16 }]} />
              <View style={{ gap: 12 }}>
                <AppText
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 2,
                  }}
                >
                  🏆 Top productos hoy
                </AppText>
                {top3.map((p, i) => (
                  <View key={p.nombre} style={{ gap: 4 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                        }}
                      >
                        <AppText style={{ fontSize: 18, lineHeight: 22 }}>
                          {medallas[i]}
                        </AppText>
                        <AppText
                          style={{
                            fontSize: 14,
                            color: "#1F2937",
                            fontWeight: "600",
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {p.nombre}
                        </AppText>
                      </View>
                      <AppText
                        style={{
                          fontSize: 14,
                          color: "#6B7280",
                          fontWeight: "700",
                          marginLeft: 8,
                        }}
                      >
                        $ {Number(p.total).toLocaleString("es-CO")}
                      </AppText>
                    </View>
                    <View
                      style={{
                        height: 5,
                        backgroundColor: "#F3F4F6",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: 5,
                          borderRadius: 4,
                          backgroundColor: barColors[i],
                          width: `${Math.round((p.total / maxTotal) * 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

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

              <View style={{ gap: 10, marginBottom: 16 }}>
                {ventasVisibles.map((venta, index) => {
                  const avatarColor =
                    AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const inicial = venta.nombreCliente.charAt(0).toUpperCase();
                  const esAnulada = venta.estado === "anulada";
                  const esFacturaSaldada =
                    !esAnulada && evaluarFacturaPagada(venta);
                  const saldo = saldoPorVenta.get(venta.id) ?? venta.total;
                  const tieneAbonosParciales =
                    !esAnulada && !esFacturaSaldada && saldo < venta.total;

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

                  return (
                    <View
                      key={venta.id}
                      style={[
                        s.ventaCard,
                        esAnulada && {
                          opacity: 0.72,
                          borderWidth: 1.5,
                          borderColor: "#FECACA",
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.avatar,
                          {
                            backgroundColor: esAnulada
                              ? "#F3F4F6"
                              : avatarColor.bg,
                          },
                        ]}
                      >
                        <AppText
                          style={[
                            s.avatarLetra,
                            { color: esAnulada ? "#9CA3AF" : avatarColor.fg },
                          ]}
                        >
                          {inicial}
                        </AppText>
                      </View>

                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <AppText
                          style={[
                            s.ventaNombre,
                            esAnulada && { color: "#9CA3AF" },
                          ]}
                          numberOfLines={1}
                        >
                          {venta.nombreCliente}
                        </AppText>
                        <AppText style={s.ventaHora}>
                          {horaDeVenta(venta.fecha)}
                        </AppText>
                        {!esAnulada &&
                          venta.tipo === "contado" &&
                          venta.metodoPago && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 3,
                                marginTop: 3,
                              }}
                            >
                              <MaterialCommunityIcons
                                name={
                                  venta.metodoPago === "efectivo"
                                    ? "cash"
                                    : "bank-transfer"
                                }
                                size={13}
                                color={
                                  venta.metodoPago === "efectivo"
                                    ? "#16A34A"
                                    : "#7C3AED"
                                }
                              />
                              <AppText
                                style={{
                                  fontSize: 12,
                                  color:
                                    venta.metodoPago === "efectivo"
                                      ? "#16A34A"
                                      : "#7C3AED",
                                  fontWeight: "600",
                                }}
                              >
                                {venta.metodoPago === "efectivo"
                                  ? "Efectivo"
                                  : "Transferencia"}
                              </AppText>
                            </View>
                          )}
                      </View>

                      <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                        {!esAnulada && !esFacturaSaldada ? (
                          <>
                            <AppText
                              style={[s.ventaMonto, { color: "#D97706" }]}
                            >
                              {fmt(saldo)}
                            </AppText>
                            {tieneAbonosParciales && (
                              <AppText
                                style={{
                                  fontSize: 11,
                                  color: "#9CA3AF",
                                  marginBottom: 1,
                                }}
                              >
                                de {fmt(venta.total)}
                              </AppText>
                            )}
                          </>
                        ) : (
                          <AppText
                            style={[
                              s.ventaMonto,
                              esAnulada && {
                                color: "#9CA3AF",
                                textDecorationLine: "line-through",
                                fontSize: 15,
                              },
                            ]}
                          >
                            {fmt(venta.total)}
                          </AppText>
                        )}
                        <View style={[s.badge, { backgroundColor: badgeBg }]}>
                          <AppText style={[s.badgeTxt, { color: badgeColor }]}>
                            {badgeLabel}
                          </AppText>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          s.btnVer,
                          {
                            borderColor: colors.grayBorder,
                            backgroundColor: "#F3F4F6",
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => abrirModal(venta)}
                      >
                        <MaterialCommunityIcons
                          name="file-eye-outline"
                          size={20}
                          color={colors.primary}
                        />
                        <AppText
                          style={[s.btnVerTxt, { color: colors.primary }]}
                        >
                          Ver
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View
              style={[s.card, { alignItems: "center", paddingVertical: 48 }]}
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
          <View style={[s.card, { alignItems: "center", paddingVertical: 48 }]}>
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
        {deudores.length > 0 && (
          <View style={s.creditoCard}>
            <View
              style={[
                s.iconBubble,
                {
                  backgroundColor: "#FEF3C7",
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="wallet-outline"
                size={26}
                color="#D97706"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <AppText style={s.creditoTitulo}>Cartera total pendiente</AppText>
              <AppText style={s.creditoSubtitulo}>todos los días</AppText>
              <AppText style={s.creditoMonto}>
                {fmt(stats.creditoPendiente)}
                <AppText style={s.creditoClientes}>
                  {" · "}
                  {deudores.length} cliente{deudores.length !== 1 ? "s" : ""}
                </AppText>
              </AppText>
            </View>
          </View>
        )}
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  labelGris: { fontSize: 17, fontWeight: "500", color: "#7B8499" },
  totalGrande: {
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 4,
    marginBottom: 8,
  },
  divisorH: { height: 1.5, backgroundColor: "#EAECF4", marginBottom: 16 },
  filaCounts: { flexDirection: "row", alignItems: "center" },
  countItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  divisorV: {
    width: 1.5,
    height: 40,
    backgroundColor: "#EAECF4",
    marginHorizontal: 8,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  countNum: { fontSize: 22, fontWeight: "800", color: "#111827" },
  countLabel: { fontSize: 15, color: "#7B8499", fontWeight: "500" },
  btnExcel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  btnExcelTxt: { fontSize: 16, fontWeight: "700", color: "#15803D" },

  filterSection: { marginBottom: 16 },
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
  filterTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: {
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnText: { fontSize: 14, fontWeight: "700" },

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seccionTitulo: { fontSize: 20, fontWeight: "800", color: "#111827" },
  verTodasTxt: { fontSize: 15, fontWeight: "700" },
  ventaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { fontSize: 20, fontWeight: "800" },
  ventaNombre: { fontSize: 17, fontWeight: "700", color: "#111827" },
  ventaHora: { fontSize: 14, color: "#7B8499", marginTop: 2 },
  ventaMonto: { fontSize: 17, fontWeight: "700", color: "#111827" },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeTxt: { fontSize: 13, fontWeight: "700" },
  btnVer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  btnVerTxt: { fontSize: 14, fontWeight: "700" },
  creditoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  creditoTitulo: { fontSize: 17, fontWeight: "800", color: "#111827" },
  creditoSubtitulo: { fontSize: 14, color: "#7B8499", marginTop: 2 },
  creditoMonto: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D97706",
    marginTop: 4,
  },
  creditoClientes: { fontSize: 15, fontWeight: "500", color: "#7B8499" },
  vacioCabeza: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  vacioSub: {
    fontSize: 16,
    color: "#7B8499",
    textAlign: "center",
    lineHeight: 24,
  },
});

const ms = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    marginTop: "auto",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2E6EF",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F7",
  },
  headerTitulo: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerFecha: { fontSize: 14, color: "#7B8499", marginTop: 2 },
  btnClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  clienteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  avatarGrande: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { fontSize: 22, fontWeight: "800" },
  clienteNombre: { fontSize: 18, fontWeight: "700", color: "#111827" },
  clienteHora: { fontSize: 14, color: "#7B8499", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeTxt: { fontSize: 13, fontWeight: "700" },
  divisor: { height: 1, backgroundColor: "#F0F2F7", marginBottom: 8 },
  divisorDashed: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E2E6EF",
    marginVertical: 8,
  },
  tablaHeader: { flexDirection: "row", paddingVertical: 4 },
  colHead: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B8499",
    letterSpacing: 0.3,
  },
  colCant: { width: 44, textAlign: "center" },
  colPrecio: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  filaProducto: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: "#E2E6EF",
  },
  productoNombre: { fontSize: 16, fontWeight: "600", color: "#111827" },
  productoPrecioUnit: { fontSize: 13, color: "#7B8499", marginTop: 2 },
  colValor: { fontSize: 15, fontWeight: "600", color: "#111827" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  totalLabel: { fontSize: 14, color: "#7B8499", fontWeight: "500" },
  totalMonto: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  fiadoInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  fiadoTxt: { flex: 1, fontSize: 14, color: "#92400E", lineHeight: 20 },
  facturaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    justifyContent: "center",
  },
  facturaTxt: { fontSize: 13, color: "#7B8499" },

  bloqueAnulacion: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    padding: 14,
    marginBottom: 4,
    marginTop: 8,
  },
  anulacionFila: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  anulacionLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
    width: 90,
  },
  anulacionValor: {
    fontSize: 13,
    color: "#7F1D1D",
    fontWeight: "600",
    flexShrink: 1,
  },

  btnAnular: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  btnAnularTxt: { fontSize: 16, fontWeight: "800", color: "#DC2626" },

  resumenAnulacion: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 8,
  },
  resumenFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumenLabel: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  resumenValor: { fontSize: 14, color: "#111827", fontWeight: "700" },
  avisoAnulacion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  avisoTxt: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 19 },
  inputAreaWrap: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
  },
  inputArea: { fontSize: 16, color: "#111827", fontWeight: "500" },
  btnCancelarAnulacion: {
    height: 52,
    borderRadius: 16,
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
    borderRadius: 16,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnConfirmarAnulacionTxt: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});

const mf = StyleSheet.create({
  label: { fontSize: 15, fontWeight: "700", color: "#374151" },
  errorTxt: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "500",
    paddingLeft: 4,
  },
});
