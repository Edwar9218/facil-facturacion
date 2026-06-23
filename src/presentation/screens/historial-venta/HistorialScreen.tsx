import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
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
import { GastoRepositoryImpl } from "../../../data/repositories/GastoRepositoryImpl";
import { VentaRepositoryImpl } from "../../../data/repositories/VentaRepositoryImpl";
import { Gasto } from "../../../domain/entities/Gasto";
import { ItemVenta, Venta } from "../../../domain/entities/Venta";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

interface ResumenCredito {
  clienteId: string;
  saldoActual: number;
}

interface Abono {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  fecha: string;
  estado?: string;
  metodoPago?: string;
}

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

const fechaHoy = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

const fechaAyer = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });
};

const esHoy = (fecha: string) => fecha.startsWith(fechaHoy());
const esAyer = (fecha: string) => fecha.startsWith(fechaAyer());

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

const obtenerEtiquetaAgrupacion = (fechaStr: string) => {
  if (esHoy(fechaStr)) return "Hoy";
  if (esAyer(fechaStr)) return "Ayer";
  const d = new Date(fechaStr);
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  const texto = d.toLocaleDateString("es-CO", opciones);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const ventaRepo = new VentaRepositoryImpl();
const creditoRepo = new CreditoRepositoryImpl();
const gastoRepo = new GastoRepositoryImpl();

type TipoEstado = "todas" | "pazysalvo" | "debe" | "anulada";
type TipoPeriodo = "hoy" | "semana" | "mes" | "personalizado";

const AVATAR_COLORS = [
  { bg: "#EBF3FF", fg: "#2563EB" },
  { bg: "#FEF3C7", fg: "#D97706" },
  { bg: "#EBF7EE", fg: "#16A34A" },
  { bg: "#F3E8FF", fg: "#9333EA" },
  { bg: "#FCE4EC", fg: "#E91E63" },
];

// ── MODAL DETALLE DE FACTURA ─────────────────────────────────────────────────
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
                Esta factura fue generada a crédito y presenta saldos pendientes
                por abonar de manera específica.
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

          {!esAnulada &&
            (venta.metodoPago || (venta as any).metodoCuotaInicial) && (
              <View style={[ms.facturaRow, { marginTop: 6 }]}>
                <MaterialCommunityIcons
                  name={
                    String(
                      venta.metodoPago || (venta as any).metodoCuotaInicial,
                    )
                      .toLowerCase()
                      .includes("transferencia")
                      ? "bank-transfer"
                      : "cash"
                  }
                  size={18}
                  color={
                    String(
                      venta.metodoPago || (venta as any).metodoCuotaInicial,
                    )
                      .toLowerCase()
                      .includes("transferencia")
                      ? "#1565C0"
                      : "#16A34A"
                  }
                />
                <AppText
                  style={[
                    ms.facturaTxt,
                    {
                      color: String(
                        venta.metodoPago || (venta as any).metodoCuotaInicial,
                      )
                        .toLowerCase()
                        .includes("transferencia")
                        ? "#1565C0"
                        : "#16A34A",
                      fontWeight: "700",
                    },
                  ]}
                >
                  Gestionado en{" "}
                  {String(venta.metodoPago || (venta as any).metodoCuotaInicial)
                    .toLowerCase()
                    .includes("transferencia")
                    ? "transferencia"
                    : "efectivo"}
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

// ── MODAL MOTIVO DE ANULACIÓN ────────────────────────────────────────────────
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
                    placeholder="Ej: Error en los productos, el cliente canceló..."
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

const formatearFecha = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").substring(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const fechaValida = (f: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(f) && !isNaN(new Date(f).getTime());

// ── MODAL SELECCIONAR RANGO FECHAS ───────────────────────────────────────────
const ModalElegirFecha = ({
  visible,
  onClose,
  onAplicar,
}: {
  visible: boolean;
  onClose: () => void;
  onAplicar: (inicio: string, fin: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const hoy = fechaHoy();
  const [fInicio, setFInicio] = React.useState(hoy);
  const [fFin, setFFin] = React.useState(hoy);
  const [errorInicio, setErrorInicio] = React.useState("");
  const [errorFin, setErrorFin] = React.useState("");

  React.useEffect(() => {
    if (visible) {
      setFInicio(hoy);
      setFFin(hoy);
      setErrorInicio("");
      setErrorFin("");
    }
  }, [visible]);

  const handleBuscar = () => {
    let valido = true;
    if (!fechaValida(fInicio)) {
      setErrorInicio("Fecha inválida (AAAA-MM-DD)");
      valido = false;
    }
    if (!fechaValida(fFin)) {
      setErrorFin("Fecha inválida (AAAA-MM-DD)");
      valido = false;
    }
    if (valido && fInicio > fFin) {
      setErrorInicio("La fecha inicial no puede superar a la final");
      valido = false;
    }
    if (!valido) return;
    onAplicar(fInicio, fFin);
    onClose();
  };

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
      <KeyboardAwareScrollView
        style={{ marginTop: "auto" }}
        contentContainerStyle={[
          ms.sheet,
          { paddingBottom: insets.bottom + 24 },
        ]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={ms.handle} />
        <View style={ms.header}>
          <View style={{ flex: 1 }}>
            <AppText style={ms.headerTitulo}>Rango de fechas</AppText>
            <AppText style={ms.headerFecha}>Formato: AAAA-MM-DD</AppText>
          </View>
          <TouchableOpacity style={ms.btnClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          <View style={{ gap: 8 }}>
            <AppText style={mf.label}>
              <MaterialCommunityIcons
                name="calendar-start"
                size={18}
                color="#7B8499"
              />{" "}
              Fecha inicial
            </AppText>
            <View style={[mf.inputRow, errorInicio ? mf.inputError : null]}>
              <TextInput
                style={mf.input}
                value={fInicio}
                onChangeText={(t) => {
                  setFInicio(formatearFecha(t));
                  setErrorInicio("");
                }}
                placeholder="2026-01-01"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={10}
              />
              {fechaValida(fInicio) && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={26}
                  color="#16A34A"
                  style={{ marginRight: 14 }}
                />
              )}
            </View>
            {!!errorInicio && (
              <AppText style={mf.errorTxt}>{errorInicio}</AppText>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <AppText style={mf.label}>
              <MaterialCommunityIcons
                name="calendar-end"
                size={18}
                color="#7B8499"
              />{" "}
              Fecha final
            </AppText>
            <View style={[mf.inputRow, errorFin ? mf.inputError : null]}>
              <TextInput
                style={mf.input}
                value={fFin}
                onChangeText={(t) => {
                  setFFin(formatearFecha(t));
                  setErrorFin("");
                }}
                placeholder="2026-12-31"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={10}
                onSubmitEditing={handleBuscar}
              />
              {fechaValida(fFin) && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={26}
                  color="#16A34A"
                  style={{ marginRight: 14 }}
                />
              )}
            </View>
            {!!errorFin && <AppText style={mf.errorTxt}>{errorFin}</AppText>}
          </View>

          <TouchableOpacity
            style={[
              s.btnPrincipalAncho,
              { marginTop: 8 },
              (!fechaValida(fInicio) || !fechaValida(fFin)) && { opacity: 0.5 },
            ]}
            onPress={handleBuscar}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={26} color="#FFF" />
            <AppText style={s.btnPrincipalAnchoTxt}>Buscar ventas</AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
};

// ── COMPONENTE PRINCIPAL HISTORIAL SCREEN ────────────────────────────────────
export const HistorialScreen = () => {
  const { colors } = useTheme();

  const [todasVentas, setTodasVentas] = React.useState<Venta[]>([]);
  const [abonos, setAbonos] = React.useState<Abono[]>([]);
  const [todosGastos, setTodosGastos] = React.useState<Gasto[]>([]);
  const [ventasFiltradas, setVentasFiltradas] = React.useState<Venta[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);

  const [busqueda, setBusqueda] = React.useState("");
  const [filtroEstado, setFiltroEstado] = React.useState<TipoEstado>("todas");
  const [filtrosVisibles, setFiltrosVisibles] = React.useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = React.useState<TipoPeriodo>("hoy");
  const [rangoPersonalizado, setRangoPersonalizado] = React.useState({
    inicio: "",
    fin: "",
  });

  const [ventaSeleccionada, setVentaSeleccionada] =
    React.useState<Venta | null>(null);
  const [modalFacturaVisible, setModalFacturaVisible] = React.useState(false);
  const [modalFechaVisible, setModalFechaVisible] = React.useState(false);

  const [ventaAAnular, setVentaAAnular] = React.useState<Venta | null>(null);
  const [modalAnularVisible, setModalAnularVisible] = React.useState(false);
  const [anulando, setAnulando] = React.useState(false);

  const PAGE_SIZE = 15;
  const [pagina, setPagina] = React.useState(1);
  const [cargandoMas, setCargandoMas] = React.useState(false);
  const [exportando, setExportando] = React.useState(false);

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

  const handleSolicitarAnular = (venta: Venta) => {
    setModalFacturaVisible(false);
    setTimeout(() => {
      setVentaAAnular(venta);
      setModalAnularVisible(true);
    }, 350);
  };

  const handleConfirmarAnulacion = async (motivo: string) => {
    if (!ventaAAnular) return;
    setAnulando(true);
    try {
      await ventaRepo.anular(ventaAAnular.id, { usuario: "Admin", motivo });
      setTodasVentas((prev) =>
        prev.map((v) =>
          v.id === ventaAAnular.id
            ? {
                ...v,
                estado: "anulada" as const,
                anulacion: {
                  fecha: new Date().toISOString(),
                  usuario: "Admin",
                  motivo,
                },
              }
            : v,
        ),
      );
      setModalAnularVisible(false);
      setVentaAAnular(null);
      Alert.alert("Éxito", "Factura anulada y stock devuelto correctamente.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo anular.");
    } finally {
      setAnulando(false);
    }
  };

  // ── Rango activo calculado ────────────────────────────────────────────────
  const rangoActivo = React.useMemo(() => {
    const hoyStr = fechaHoy();
    if (filtroPeriodo === "hoy") return { inicio: hoyStr, fin: hoyStr };
    if (filtroPeriodo === "semana") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return {
        inicio: d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }),
        fin: hoyStr,
      };
    }
    if (filtroPeriodo === "mes") {
      const d = new Date();
      d.setDate(1);
      return {
        inicio: d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }),
        fin: hoyStr,
      };
    }
    if (filtroPeriodo === "personalizado" && rangoPersonalizado.inicio)
      return rangoPersonalizado;
    return null;
  }, [filtroPeriodo, rangoPersonalizado]);

  // ── Gastos: se consultan directamente a la BD por rango (no existe un
  // método "getAll" en GastoRepositoryImpl, solo getGastosPorRango/Fecha/Caja) ─
  const cargarGastos = React.useCallback(async () => {
    if (!rangoActivo) {
      setTodosGastos([]);
      return;
    }
    try {
      const gastos = await gastoRepo.getGastosPorRango({
        fechaInicio: rangoActivo.inicio,
        fechaFin: rangoActivo.fin,
      });
      setTodosGastos(gastos);
    } catch (e) {
      console.error(e);
    }
  }, [rangoActivo]);

  React.useEffect(() => {
    cargarGastos();
  }, [cargarGastos]);

  // Ya viene filtrado desde la BD según rangoActivo; se deja el alias para
  // no tener que tocar el resto de referencias (stats, export, JSX).
  const gastosFiltrados = todosGastos;

  const exportarExcel = async () => {
    if (ventasFiltradas.length === 0 && gastosFiltrados.length === 0) {
      Alert.alert("Sin datos", "No hay registros bajo los filtros actuales.");
      return;
    }
    setExportando(true);
    try {
      // Hoja ventas
      const filasVentas: any[] = [];
      ventasFiltradas.forEach((v) => {
        const esAnulada = v.estado === "anulada";
        const estReal = esAnulada
          ? "Anulada"
          : evaluarFacturaPagada(v)
            ? "Al día"
            : "En mora";
        v.items.forEach((item: ItemVenta) => {
          filasVentas.push({
            Factura: v.numeroFactura ?? v.id.substring(0, 8),
            Fecha: v.fecha.substring(0, 10),
            Cliente: v.nombreCliente,
            Producto: item.nombreProducto,
            Cantidad: item.cantidad,
            Precio: item.precioUnitario,
            Subtotal: item.subtotal,
            Tipo: v.tipo,
            "Método pago": v.metodoPago ?? "",
            Estado: estReal,
            MotivoAnulacion: esAnulada ? (v.anulacion?.motivo ?? "") : "",
          });
        });
      });

      // Hoja gastos
      const filasGastos: any[] = gastosFiltrados.map((g) => ({
        Fecha: g.fecha.substring(0, 10),
        Descripción: g.descripcion,
        Categoría: g.categoria,
        Monto: g.monto,
        "Método pago":
          g.metodoPago === "efectivo" ? "Efectivo" : "Transferencia",
      }));

      const libro = XLSX.utils.book_new();

      if (filasVentas.length > 0) {
        const hojaVentas = XLSX.utils.json_to_sheet(filasVentas);
        XLSX.utils.book_append_sheet(libro, hojaVentas, "Ventas");
      }
      if (filasGastos.length > 0) {
        const hojaGastos = XLSX.utils.json_to_sheet(filasGastos);
        XLSX.utils.book_append_sheet(libro, hojaGastos, "Gastos");
      }

      const base64 = XLSX.write(libro, { type: "base64", bookType: "xlsx" });
      const ruta = `${FileSystem.cacheDirectory}Reporte_Ventas.xlsx`;
      await FileSystem.writeAsStringAsync(ruta, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(ruta, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Exportar ventas",
        });
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo exportar.");
    } finally {
      setExportando(false);
    }
  };

  const cargarDatos = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    try {
      const [ventas, listaAbonos] = await Promise.all([
        ventaRepo.getAll(),
        creditoRepo.getAbonos ? await creditoRepo.getAbonos() : [],
      ]);
      setTodasVentas(ventas);
      setAbonos(listaAbonos);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  React.useEffect(() => {
    cargarDatos();
  }, []);

  React.useEffect(() => {
    let resultado = [...todasVentas];

    if (filtroEstado === "pazysalvo")
      resultado = resultado.filter(
        (v) => v.estado !== "anulada" && evaluarFacturaPagada(v),
      );
    else if (filtroEstado === "debe")
      resultado = resultado.filter(
        (v) => v.estado !== "anulada" && !evaluarFacturaPagada(v),
      );
    else if (filtroEstado === "anulada")
      resultado = resultado.filter((v) => v.estado === "anulada");

    if (rangoActivo) {
      resultado = resultado.filter((v) => {
        const f = v.fecha.substring(0, 10);
        return f >= rangoActivo.inicio && f <= rangoActivo.fin;
      });
    }

    if (busqueda.trim() !== "") {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.nombreCliente.toLowerCase().includes(q) ||
          (v.numeroFactura && v.numeroFactura.toLowerCase().includes(q)),
      );
    }

    setVentasFiltradas(resultado);
    setPagina(1);
  }, [todasVentas, filtroEstado, rangoActivo, busqueda, evaluarFacturaPagada]);

  // ── Stats incluyendo gastos filtrados ─────────────────────────────────────
  const stats = React.useMemo(() => {
    const activas = ventasFiltradas.filter((v) => v.estado !== "anulada");
    const anuladas = ventasFiltradas.filter((v) => v.estado === "anulada");

    const cantVentas = activas.length;
    const cantAnuladas = anuladas.length;

    let efectivoVenta = 0;
    let transferenciaVenta = 0;

    activas.forEach((v) => {
      if (v.tipo === "contado") {
        if (v.metodoPago && v.metodoPago.toLowerCase() === "transferencia") {
          transferenciaVenta += v.total;
        } else {
          efectivoVenta += v.total;
        }
      } else {
        const cuota = (v as any).cuotaInicial || 0;
        const mCuota = (
          (v as any).metodoCuotaInicial || "efectivo"
        ).toLowerCase();
        if (cuota > 0) {
          if (mCuota === "transferencia") {
            transferenciaVenta += cuota;
          } else {
            efectivoVenta += cuota;
          }
        }
      }
    });

    let efectivoAbono = 0;
    let transferenciaAbono = 0;

    abonos
      .filter((ab) => {
        if (ab.estado === "anulado") return false;
        if (!rangoActivo) return true;
        const f = ab.fecha.substring(0, 10);
        return f >= rangoActivo.inicio && f <= rangoActivo.fin;
      })
      .forEach((ab) => {
        const metodo = ((ab as any).metodoPago || "efectivo").toLowerCase();
        if (metodo === "transferencia") {
          transferenciaAbono += ab.monto;
        } else {
          efectivoAbono += ab.monto;
        }
      });

    // Gastos del rango
    const gastosEfectivo = gastosFiltrados
      .filter((g) => g.metodoPago === "efectivo")
      .reduce((a, g) => a + g.monto, 0);
    const gastosTransferencia = gastosFiltrados
      .filter((g) => g.metodoPago === "transferencia")
      .reduce((a, g) => a + g.monto, 0);
    const totalGastos = gastosEfectivo + gastosTransferencia;

    const facturasEnMora = activas.filter((v) => !evaluarFacturaPagada(v));

    const totalDebe = facturasEnMora.reduce((a, v) => {
      const abonado = abonos
        .filter((ab) => ab.ventaId === v.id && ab.estado !== "anulado")
        .reduce((s, ab) => s + ab.monto, 0);
      return a + Math.max(0, v.total - abonado);
    }, 0);

    // Tarjeta "En mora": saldo pendiente por cobrar (total - abonado)
    const montoEnMora = totalDebe;
    const cantEnMora = facturasEnMora.length;

    // Tarjeta "Anuladas": total de las facturas anuladas
    const montoAnuladas = anuladas.reduce((a, v) => a + v.total, 0);

    return {
      cantVentas,
      cantAnuladas,
      efectivoVenta,
      efectivoAbono,
      transferenciaVenta,
      transferenciaAbono,
      gastosEfectivo,
      gastosTransferencia,
      totalGastos,
      totalDebe,
      montoEnMora,
      cantEnMora,
      montoAnuladas,
    };
  }, [
    ventasFiltradas,
    abonos,
    rangoActivo,
    gastosFiltrados,
    evaluarFacturaPagada,
  ]);

  const salesAgrupadas = React.useMemo(() => {
    const grupos: { [key: string]: Venta[] } = {};
    const visibles = [...ventasFiltradas]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, pagina * PAGE_SIZE);
    visibles.forEach((v) => {
      const titulo = obtenerEtiquetaAgrupacion(v.fecha.substring(0, 10));
      if (!grupos[titulo]) grupos[titulo] = [];
      grupos[titulo].push(v);
    });
    return grupos;
  }, [ventasFiltradas, pagina]);

  const cargarMas = () => {
    if (cargandoMas || pagina * PAGE_SIZE >= ventasFiltradas.length) return;
    setCargandoMas(true);
    setTimeout(() => {
      setPagina((p) => p + 1);
      setCargandoMas(false);
    }, 300);
  };

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentSize.height - contentOffset.y - layoutMeasurement.height < 150)
      cargarMas();
  };

  return (
    <ScreenWrapper title="Historial" showBtnB={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              cargarDatos(true);
              cargarGastos();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* BUSCADOR */}
        <View style={{ marginBottom: 18 }}>
          <View style={s.contenedorBuscador}>
            <MaterialCommunityIcons
              name="magnify"
              size={26}
              color="#7B8499"
              style={{ marginLeft: 16 }}
            />
            <TextInput
              style={s.inputBuscador}
              placeholder="Buscar cliente o número de factura..."
              placeholderTextColor="#7B8499"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusqueda("")}
                style={{ padding: 12 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={22}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PANEL DE FILTROS */}
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
              <AppText style={s.seccionFiltroTitulo}>Periodo de tiempo</AppText>
              <View style={s.chipsGrid}>
                {(
                  ["hoy", "semana", "mes", "personalizado"] as TipoPeriodo[]
                ).map((p) => {
                  const activo = filtroPeriodo === p;
                  const etiquetas: Record<TipoPeriodo, string> = {
                    hoy: "Hoy",
                    semana: "7 Días",
                    mes: "Este Mes",
                    personalizado: "Rango 📅",
                  };
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        s.chip,
                        activo && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => {
                        setFiltroPeriodo(p);
                        if (p === "personalizado") setModalFechaVisible(true);
                      }}
                    >
                      <AppText
                        style={[
                          s.chipTxt,
                          activo && { color: "#FFF", fontWeight: "700" },
                        ]}
                      >
                        {etiquetas[p]}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppText style={s.seccionFiltroTitulo}>Estado del pago</AppText>
              <View style={s.chipsGrid}>
                {(
                  ["todas", "pazysalvo", "debe", "anulada"] as TipoEstado[]
                ).map((e) => {
                  const activo = filtroEstado === e;
                  const etiquetas: Record<string, string> = {
                    todas: "Todas",
                    pazysalvo: "Al Día",
                    debe: "En Mora",
                    anulada: "Anuladas",
                  };
                  return (
                    <TouchableOpacity
                      key={e}
                      style={[
                        s.chip,
                        activo && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => setFiltroEstado(e)}
                    >
                      <AppText
                        style={[
                          s.chipTxt,
                          activo && { color: "#FFF", fontWeight: "700" },
                        ]}
                      >
                        {etiquetas[e]}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={s.exportarBtn}
                onPress={exportarExcel}
                disabled={exportando}
              >
                {exportando ? (
                  <ActivityIndicator size="small" color="#4B5563" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="file-excel"
                      size={22}
                      color="#15803D"
                    />
                    <AppText style={s.exportarBtnTxt}>
                      Exportar listado a Excel
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ══ MÉTRICAS ══════════════════════════════════════════════════ */}
        <View style={s.recuadroMétricasContenedor}>
          {/* Tarjeta EFECTIVO — visible en "todas" y "pazysalvo" (Al día) */}
          {(filtroEstado === "todas" || filtroEstado === "pazysalvo") && (
            <View style={s.metricaCard}>
              <AppText style={s.metricaEncabezado}>EFECTIVO</AppText>
              <View style={s.metricaFila}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="cart-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <AppText style={s.metricaLabel}>+ Ventas</AppText>
                </View>
                <AppText style={s.metricaValorVerde}>
                  {fmt(stats.efectivoVenta)}
                </AppText>
              </View>
              <View style={s.metricaFila}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={16}
                    color="#6B7280"
                  />
                  <AppText style={s.metricaLabel}>+ Abonos</AppText>
                </View>
                <AppText style={s.metricaValorVerde}>
                  {fmt(stats.efectivoAbono)}
                </AppText>
              </View>
              {stats.gastosEfectivo > 0 && (
                <View style={s.metricaFila}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="receipt-text-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <AppText style={s.metricaLabel}>- Gastos</AppText>
                  </View>
                  <AppText style={s.metricaValorRojo}>
                    -{fmt(stats.gastosEfectivo)}
                  </AppText>
                </View>
              )}
              <View style={s.metricaDivisor} />
              <View style={s.metricaFilaTotal}>
                <AppText style={s.metricaTotalLabel}>Total efectivo</AppText>
                <AppText style={s.metricaTotalValorVerde}>
                  {fmt(
                    stats.efectivoVenta +
                      stats.efectivoAbono -
                      stats.gastosEfectivo,
                  )}
                </AppText>
              </View>
            </View>
          )}

          {/* Tarjeta TRANSFERENCIA — visible en "todas" y "pazysalvo" (Al día) */}
          {(filtroEstado === "todas" || filtroEstado === "pazysalvo") && (
            <View style={s.metricaCard}>
              <AppText style={[s.metricaEncabezado, { color: "#7C3AED" }]}>
                TRANSFERENCIA
              </AppText>
              <View style={s.metricaFila}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="cart-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <AppText style={s.metricaLabel}>+ Ventas</AppText>
                </View>
                <AppText style={[s.metricaValorVerde, { color: "#7C3AED" }]}>
                  {fmt(stats.transferenciaVenta)}
                </AppText>
              </View>
              <View style={s.metricaFila}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={16}
                    color="#6B7280"
                  />
                  <AppText style={s.metricaLabel}>+ Abonos</AppText>
                </View>
                <AppText style={[s.metricaValorVerde, { color: "#7C3AED" }]}>
                  {fmt(stats.transferenciaAbono)}
                </AppText>
              </View>
              {stats.gastosTransferencia > 0 && (
                <View style={s.metricaFila}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="receipt-text-outline"
                      size={16}
                      color="#6B7280"
                    />
                    <AppText style={s.metricaLabel}>- Gastos</AppText>
                  </View>
                  <AppText style={s.metricaValorRojo}>
                    -{fmt(stats.gastosTransferencia)}
                  </AppText>
                </View>
              )}
              <View style={s.metricaDivisor} />
              <View style={s.metricaFilaTotal}>
                <AppText style={s.metricaTotalLabel}>
                  Neto transferencia
                </AppText>
                <AppText
                  style={[s.metricaTotalValorVerde, { color: "#7C3AED" }]}
                >
                  {fmt(
                    stats.transferenciaVenta +
                      stats.transferenciaAbono -
                      stats.gastosTransferencia,
                  )}
                </AppText>
              </View>
            </View>
          )}

          {/* Tarjeta EN MORA — visible en "todas" y "debe" (En Mora) */}
          {(filtroEstado === "todas" || filtroEstado === "debe") && (
            <View style={s.metricaCard}>
              <AppText style={[s.metricaEncabezado, { color: "#D97706" }]}>
                EN MORA
              </AppText>
              <View style={s.metricaFila}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="clock-alert-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <AppText style={s.metricaLabel}>Facturas en mora</AppText>
                </View>
                <AppText style={[s.metricaValorVerde, { color: "#D97706" }]}>
                  {stats.cantEnMora}
                </AppText>
              </View>
              <View style={s.metricaDivisor} />
              <View style={s.metricaFilaTotal}>
                <AppText style={s.metricaTotalLabel}>
                  Saldo pendiente por cobrar
                </AppText>
                <AppText
                  style={[s.metricaTotalValorVerde, { color: "#D97706" }]}
                >
                  {fmt(stats.montoEnMora)}
                </AppText>
              </View>
            </View>
          )}

          {/* Tarjeta ANULADAS — visible en "todas" y "anulada" */}
          {(filtroEstado === "todas" || filtroEstado === "anulada") && (
            <View style={s.metricaCard}>
              <AppText style={[s.metricaEncabezado, { color: "#DC2626" }]}>
                ANULADAS
              </AppText>
              <View style={s.metricaFila}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="cancel"
                    size={16}
                    color="#6B7280"
                  />
                  <AppText style={s.metricaLabel}>Facturas anuladas</AppText>
                </View>
                <AppText style={[s.metricaValorVerde, { color: "#DC2626" }]}>
                  {stats.cantAnuladas}
                </AppText>
              </View>
              <View style={s.metricaDivisor} />
              <View style={s.metricaFilaTotal}>
                <AppText style={s.metricaTotalLabel}>Total anulado</AppText>
                <AppText
                  style={[s.metricaTotalValorVerde, { color: "#DC2626" }]}
                >
                  {fmt(stats.montoAnuladas)}
                </AppText>
              </View>
            </View>
          )}
        </View>

        <View style={s.statsMiniRow}>
          <AppText style={s.statsMiniTxt}>
            <MaterialCommunityIcons name="receipt" size={16} color="#6B7280" />{" "}
            {stats.cantVentas} facturas activas
          </AppText>
          {stats.cantAnuladas > 0 && (
            <AppText style={[s.statsMiniTxt, { color: "#DC2626" }]}>
              <MaterialCommunityIcons name="cancel" size={16} color="#DC2626" />{" "}
              {stats.cantAnuladas} anuladas
            </AppText>
          )}
        </View>

        {/* ══ GASTOS DEL PERIODO ══════════════════════════════════════════
            Solo visible cuando el Estado del pago es "Todas" o "Al Día".
            Se oculta por completo en "En Mora" y "Anuladas". ──────────── */}
        {(filtroEstado === "todas" || filtroEstado === "pazysalvo") &&
          gastosFiltrados.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <View style={s.seccionGastosHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={20}
                    color="#E03E3E"
                  />
                  <AppText style={s.seccionGastosTitulo}>
                    Gastos del periodo
                  </AppText>
                </View>
              </View>

              <View style={s.gastoCard}>
                {/* Total de gastos del periodo filtrado */}
                <View style={s.metricaFilaTotal}>
                  <AppText style={s.metricaTotalLabel}>Total</AppText>
                  <AppText
                    style={[s.metricaTotalValorVerde, { color: "#DC2626" }]}
                  >
                    -{fmt(stats.totalGastos)}
                  </AppText>
                </View>

                <View style={s.gastoDivisor} />

                {/* Lista de gastos individuales (máx 5) */}
                {gastosFiltrados.slice(0, 5).map((g) => (
                  <View key={g.id} style={s.gastoFila}>
                    <View style={{ flex: 1 }}>
                      <AppText style={s.gastoNombre} numberOfLines={1}>
                        {g.descripcion}
                      </AppText>
                      <AppText style={s.gastoSub}>
                        {g.categoria} ·{" "}
                        {g.metodoPago === "efectivo"
                          ? "Efectivo"
                          : "Transferencia"}{" "}
                        · {g.fecha.substring(0, 10)}
                      </AppText>
                    </View>
                    <AppText style={s.gastoMonto}>-{fmt(g.monto)}</AppText>
                  </View>
                ))}

                {gastosFiltrados.length > 5 && (
                  <AppText
                    style={{
                      fontSize: 13,
                      color: colors.primary,
                      fontWeight: "600",
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    +{gastosFiltrados.length - 5} gastos más — ver en Gastos
                  </AppText>
                )}
              </View>
            </View>
          )}

        {/* ══ LISTADO AGRUPADO DE VENTAS ════════════════════════════════ */}
        {Object.keys(salesAgrupadas).length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={56}
              color="#9CA3AF"
            />
            <AppText style={{ color: "#6B7280", marginTop: 14, fontSize: 18 }}>
              No se encontraron transacciones
            </AppText>
          </View>
        ) : (
          Object.entries(salesAgrupadas).map(([fechaGrupo, ventasInGrupo]) => (
            <View key={fechaGrupo} style={{ marginBottom: 20 }}>
              <AppText style={s.grupoTitulo}>{fechaGrupo}</AppText>
              {ventasInGrupo.map((venta) => {
                const esAnulada = venta.estado === "anulada";
                const esPaz = evaluarFacturaPagada(venta);
                const totalAbonado = abonos
                  .filter(
                    (a) => a.ventaId === venta.id && a.estado !== "anulado",
                  )
                  .reduce((sum, a) => sum + a.monto, 0);

                const badgeBg = esAnulada
                  ? "#FEE2E2"
                  : esPaz
                    ? "#DCFCE7"
                    : "#FEF3C7";
                const badgeColor = esAnulada
                  ? "#DC2626"
                  : esPaz
                    ? "#16A34A"
                    : "#D97706";
                const badgeLabel = esAnulada
                  ? "Anulada"
                  : esPaz
                    ? "Al día"
                    : "En mora";

                // Solo mostrar método si hay un pago real registrado:
                // contado siempre tiene método, crédito solo si tiene cuota inicial
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
                  ? metodoRaw.includes("transferencia") ||
                    metodoRaw.includes("banco")
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
                    style={s.ventaCard}
                    onPress={() => {
                      setVentaSeleccionada(venta);
                      setModalFacturaVisible(true);
                    }}
                    activeOpacity={0.7}
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
                            <AppText style={s.ventaDot}>•</AppText>
                            <AppText style={s.ventaFactura}>
                              #{venta.numeroFactura || venta.id.substring(0, 6)}
                            </AppText>
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
          ))
        )}

        {cargandoMas && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: 12 }}
          />
        )}
      </ScrollView>

      {/* MODALES */}
      <ModalFactura
        venta={ventaSeleccionada}
        visible={modalFacturaVisible}
        onClose={() => {
          setModalFacturaVisible(false);
          setVentaSeleccionada(null);
        }}
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

      <ModalElegirFecha
        visible={modalFechaVisible}
        onClose={() => setModalFechaVisible(false)}
        onAplicar={(inicio, fin) => setRangoPersonalizado({ inicio, fin })}
      />
    </ScreenWrapper>
  );
};

// ── ESTILOS ───────────────────────────────────────────────────────────────────
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    height: 56,
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },
  errorTxt: { fontSize: 14, color: "#EF4444", marginTop: 3 },
});

const s = StyleSheet.create({
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
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
  filterTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
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
    marginBottom: 2,
  },
  chipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 6,
  },
  chip: {
    width: "48.5%",
    paddingVertical: 11,
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
    marginTop: 8,
  },
  exportarBtnTxt: { fontSize: 15, fontWeight: "700", color: "#166534" },

  recuadroMétricasContenedor: { gap: 12, marginBottom: 20 },
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
  metricaEncabezado: {
    fontSize: 13,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricaLabel: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  metricaValorVerde: { fontSize: 15, fontWeight: "700", color: "#16A34A" },
  metricaValorRojo: { fontSize: 15, fontWeight: "700", color: "#DC2626" },
  metricaDivisor: { height: 1, backgroundColor: "#F0F2F7" },
  metricaFilaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricaTotalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  metricaTotalValorVerde: { fontSize: 20, fontWeight: "900", color: "#16A34A" },

  statsMiniRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  statsMiniTxt: { fontSize: 14, color: "#6B7280", fontWeight: "500" },

  // ── Sección gastos ────────────────────────────────────────────────────────
  seccionGastosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seccionGastosTitulo: { fontSize: 18, fontWeight: "800", color: "#111827" },
  seccionGastosMonto: { fontSize: 15, fontWeight: "700", color: "#E03E3E" },
  gastoCard: {
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
  gastoFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gastoMetodoLabel: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  gastoDivisor: { height: 1, backgroundColor: "#F0F2F7" },
  gastoNombre: { fontSize: 14, fontWeight: "600", color: "#111827" },
  gastoSub: { fontSize: 12, color: "#9CA3AF" },
  gastoMonto: { fontSize: 14, fontWeight: "700", color: "#E03E3E" },

  grupoTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 10,
    textTransform: "capitalize",
  },
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
  btnPrincipalAncho: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrincipalAnchoTxt: { fontSize: 17, fontWeight: "700", color: "#FFF" },
});
