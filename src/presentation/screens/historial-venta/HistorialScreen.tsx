import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VentaRepositoryImpl } from "../../../data/repositories/VentaRepositoryImpl";
import { ItemVenta, Venta } from "../../../domain/entities/Venta";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Repos ─────────────────────────────────────────────────────────────────────
const ventaRepo = new VentaRepositoryImpl();

type TipoEstado = "todas" | "pagadas" | "fiadas";
type TipoPeriodo = "hoy" | "semana" | "mes" | "personalizado";

const AVATAR_COLORS = [
  { bg: "#FCE4EC", fg: "#E91E63" },
  { bg: "#E8F5E9", fg: "#2E7D32" },
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#FFF3E0", fg: "#F59E0B" },
  { bg: "#E3F2FD", fg: "#1565C0" },
  { bg: "#F3E8FF", fg: "#9333EA" },
];

// ── Modal Factura (Reutilizado) ───────────────────────────────────────────────
const ModalFactura = ({
  venta,
  visible,
  onClose,
}: {
  venta: Venta | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!venta) return null;

  const esPagado = venta.tipo === "contado";
  const GREEN = "#16A34A";
  const AMBER = "#D97706";
  const GRAY = "#7B8499";
  const INK = "#111827";

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
            <View
              style={[
                ms.badge,
                { backgroundColor: esPagado ? "#DCFCE7" : "#FEF3C7" },
              ]}
            >
              <MaterialCommunityIcons
                name={esPagado ? "check-circle" : "clock-outline"}
                size={14}
                color={esPagado ? GREEN : AMBER}
              />
              <AppText
                style={[ms.badgeTxt, { color: esPagado ? GREEN : AMBER }]}
              >
                {esPagado ? "Pagado" : "Fiado"}
              </AppText>
            </View>
          </View>

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
                  {fmt(item.precioUnitario)} c/u
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
              <AppText style={[ms.totalMonto, { color: INK }]}>
                {fmt(venta.total)}
              </AppText>
            </View>
          </View>

          {!esPagado && (
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
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Modal Elegir Fecha (Estructura Accesible) ─────────────────────────────────
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

  const [fInicio, setFInicio] = React.useState("2026-05-01");
  const [fFin, setFFin] = React.useState("2026-05-25");

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
          <AppText style={ms.headerTitulo}>Elegir fecha</AppText>
          <TouchableOpacity style={ms.btnClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          {/* Accesos rápidos gigantes */}
          <View style={s.filterRow}>
            <TouchableOpacity
              style={[s.filterBtn, { backgroundColor: "#F3F4F6", flex: 1 }]}
              onPress={() => {
                setFInicio(fechaHoy());
                setFFin(fechaHoy());
              }}
            >
              <AppText style={[s.filterBtnText, { color: "#111827" }]}>
                Hoy
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.filterBtn, { backgroundColor: "#F3F4F6", flex: 1 }]}
              onPress={() => {
                setFInicio("2026-05-18");
                setFFin(fechaHoy());
              }}
            >
              <AppText style={[s.filterBtnText, { color: "#111827" }]}>
                Esta semana
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Inputs visuales grandes */}
          <View style={{ gap: 6 }}>
            <AppText style={s.filterTitle}>Fecha inicial</AppText>
            <TouchableOpacity style={s.inputFechaSimulado}>
              <MaterialCommunityIcons
                name="calendar-start"
                size={22}
                color="#7B8499"
              />
              <AppText style={s.inputFechaTexto}>{fInicio}</AppText>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 6 }}>
            <AppText style={s.filterTitle}>Fecha final</AppText>
            <TouchableOpacity style={s.inputFechaSimulado}>
              <MaterialCommunityIcons
                name="calendar-end"
                size={22}
                color="#7B8499"
              />
              <AppText style={s.inputFechaTexto}>{fFin}</AppText>
            </TouchableOpacity>
          </View>

          {/* Botón de acción primario gigante */}
          <TouchableOpacity
            style={[s.btnPrincipalAncho, { marginTop: 10 }]}
            onPress={() => {
              onAplicar(fInicio, fFin);
              onClose();
            }}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#FFF" />
            <AppText style={s.btnPrincipalAnchoTxt}>Buscar ventas</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Screen Component ──────────────────────────────────────────────────────────
export const HistorialScreen = () => {
  const { colors } = useTheme();

  // Estados de control
  const [todasVentas, setTodasVentas] = React.useState<Venta[]>([]);
  const [ventasFiltradas, setVentasFiltradas] = React.useState<Venta[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);

  // Estados de Filtros
  const [busqueda, setBusqueda] = React.useState("");
  const [filtroEstado, setFiltroEstado] = React.useState<TipoEstado>("todas");
  const [filtroPeriodo, setFiltroPeriodo] = React.useState<TipoPeriodo>("mes");
  const [rangoPersonalizado, setRangoPersonalizado] = React.useState({
    inicio: "",
    fin: "",
  });

  // Modales
  const [ventaSeleccionada, setVentaSeleccionada] =
    React.useState<Venta | null>(null);
  const [modalFacturaVisible, setModalFacturaVisible] = React.useState(false);
  const [modalFechaVisible, setModalFechaVisible] = React.useState(false);

  const cargarDatos = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    try {
      const res = await ventaRepo.getAll();
      setTodasVentas(res);
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

  // Procesamiento de filtros en tiempo real (Corregido y unificado)
  React.useEffect(() => {
    let resultado = [...todasVentas];

    // 1. Filtrado por Estado
    if (filtroEstado === "pagadas") {
      resultado = resultado.filter((v) => v.tipo === "contado");
    } else if (filtroEstado === "fiadas") {
      resultado = resultado.filter((v) => v.tipo === "credito");
    }

    // 2. Filtrado por Periodo / Fechas
    const hoyStr = fechaHoy();
    if (filtroPeriodo === "hoy") {
      resultado = resultado.filter((v) => v.fecha.startsWith(hoyStr));
    } else if (filtroPeriodo === "semana") {
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
      resultado = resultado.filter((v) => new Date(v.fecha) >= haceUnaSemana);
    } else if (filtroPeriodo === "mes") {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      resultado = resultado.filter((v) => new Date(v.fecha) >= inicioMes);
    } else if (filtroPeriodo === "personalizado" && rangoPersonalizado.inicio) {
      resultado = resultado.filter((v) => {
        const fVenta = v.fecha.substring(0, 10);
        return (
          fVenta >= rangoPersonalizado.inicio &&
          fVenta <= rangoPersonalizado.fin
        );
      });
    }

    // 3. Filtrado por Buscador (Nombre o Factura)
    if (busqueda.trim() !== "") {
      const query = busqueda.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.nombreCliente.toLowerCase().includes(query) ||
          (v.numeroFactura && v.numeroFactura.toLowerCase().includes(query)),
      );
    }

    setVentasFiltradas(resultado);
  }, [todasVentas, filtroEstado, filtroPeriodo, rangoPersonalizado, busqueda]);

  // Cálculos estadísticos dinámicos basados en la selección actual
  const stats = React.useMemo(() => {
    const total = ventasFiltradas.reduce((a, v) => a + v.total, 0);
    const cantVentas = ventasFiltradas.length;
    const contado = ventasFiltradas
      .filter((v) => v.tipo === "contado")
      .reduce((a, v) => a + v.total, 0);
    const credito = ventasFiltradas
      .filter((v) => v.tipo === "credito")
      .reduce((a, v) => a + v.total, 0);
    const clientesUnicos = [...new Set(ventasFiltradas.map((v) => v.clienteId))]
      .length;

    return { total, cantVentas, contado, credito, clientesUnicos };
  }, [ventasFiltradas]);

  // Agrupador de ventas por fechas
  const ventasAgrupadas = React.useMemo(() => {
    const grupos: { [key: string]: Venta[] } = {};
    const ordenadas = [...ventasFiltradas].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    ordenadas.forEach((venta) => {
      const fechaClave = venta.fecha.substring(0, 10);
      const titulo = obtenerEtiquetaAgrupacion(fechaClave);
      if (!grupos[titulo]) grupos[titulo] = [];
      grupos[titulo].push(venta);
    });
    return grupos;
  }, [ventasFiltradas]);

  if (cargando) {
    return (
      <ScreenWrapper title="Historial" showBtnB={false}>
        <View style={s.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText
            style={{ marginTop: 16, fontSize: 18, color: colors.grayText }}
          >
            Cargando historial...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Historial" showBtnB={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarDatos(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ══ TARJETA RESUMEN GRANDE ══════════════════════════════════════ */}
        <View style={[s.card, { marginBottom: 16 }]}>
          <AppText style={s.labelGris}>Monto total del periodo</AppText>
          <AppText style={[s.totalGrande, { color: colors.primary }]}>
            {fmt(stats.total)}
          </AppText>

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
                <AppText style={s.countNum}>{stats.cantVentas}</AppText>
                <AppText style={s.countLabel}>Ventas</AppText>
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
                <AppText style={s.countNum}>{stats.clientesUnicos}</AppText>
                <AppText style={s.countLabel}>Clientes</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* ══ TARJETAS ESTADÍSTICAS EN MATRIZ ══════════════════════════ */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={s.fila2}>
            <View
              style={[
                s.miniCard,
                { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
              ]}
            >
              <View style={[s.iconBubble, { backgroundColor: "#DCFCE7" }]}>
                <MaterialCommunityIcons name="cash" size={24} color="#16A34A" />
              </View>
              <AppText style={[s.miniTitulo, { color: "#16A34A" }]}>
                De contado
              </AppText>
              <AppText style={[s.miniMonto, { color: "#15803D" }]}>
                {fmt(stats.contado)}
              </AppText>
            </View>

            <View
              style={[
                s.miniCard,
                { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" },
              ]}
            >
              <View style={[s.iconBubble, { backgroundColor: "#EDE9FE" }]}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={24}
                  color="#7C3AED"
                />
              </View>
              <AppText style={[s.miniTitulo, { color: "#7C3AED" }]}>
                A crédito
              </AppText>
              <AppText style={[s.miniMonto, { color: "#6D28D9" }]}>
                {fmt(stats.credito)}
              </AppText>
            </View>
          </View>
        </View>

        {/* ══ BUSCADOR CÓMODO Y GRANDE ══════════════════════════════════ */}
        <View style={{ marginBottom: 24 }}>
          <AppText style={s.filterTitle}>Buscar cliente o factura</AppText>
          <View style={s.contenedorBuscador}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color="#7B8499"
              style={{ marginLeft: 16 }}
            />
            <TextInput
              style={s.inputBuscador}
              placeholder="Escribe el nombre o número..."
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

        {/* ══ FILTRO ESTADO ══════════════════════════════════════════════ */}
        <View style={s.filterSection}>
          <AppText style={s.filterTitle}>Estado</AppText>
          <View style={s.filterRow}>
            {(["todas", "pagadas", "fiadas"] as TipoEstado[]).map((estado) => {
              const activo = filtroEstado === estado;
              return (
                <TouchableOpacity
                  key={estado}
                  style={[
                    s.filterBtn,
                    activo
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: "#F3F4F6" },
                    { flex: 1 },
                  ]}
                  onPress={() => setFiltroEstado(estado)}
                  activeOpacity={0.8}
                >
                  <AppText
                    style={[
                      s.filterBtnText,
                      { color: activo ? "#FFF" : "#4B5563" },
                    ]}
                  >
                    {estado === "todas"
                      ? "Todas"
                      : estado === "pagadas"
                        ? "Pagadas"
                        : "Fiadas"}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ══ FILTRO PERIODO ═════════════════════════════════════════════ */}
        <View style={s.filterSection}>
          <AppText style={s.filterTitle}>Periodo</AppText>
          <View style={s.filterRow}>
            {(["hoy", "semana", "mes"] as TipoPeriodo[]).map((periodo) => {
              const activo = filtroPeriodo === periodo;
              return (
                <TouchableOpacity
                  key={periodo}
                  style={[
                    s.filterBtn,
                    activo
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: "#F3F4F6" },
                    { flex: 1 },
                  ]}
                  onPress={() => setFiltroPeriodo(periodo)}
                  activeOpacity={0.8}
                >
                  <AppText
                    style={[
                      s.filterBtnText,
                      { color: activo ? "#FFF" : "#4B5563" },
                    ]}
                  >
                    {periodo === "hoy"
                      ? "Hoy"
                      : periodo === "semana"
                        ? "Semana"
                        : "Mes"}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ══ BOTÓN GRANDE SELECCIONAR FECHA ════════════════════════════ */}
        <TouchableOpacity
          style={[
            s.fechaBtn,
            filtroPeriodo === "personalizado" && {
              borderColor: colors.primary,
              backgroundColor: "#EFF6FF",
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setModalFechaVisible(true)}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color={colors.primary}
          />
          <AppText style={[s.fechaBtnText, { color: colors.primary }]}>
            {filtroPeriodo === "personalizado" && rangoPersonalizado.inicio
              ? `${rangoPersonalizado.inicio} al ${rangoPersonalizado.fin}`
              : "Elegir fecha personalizada"}
          </AppText>
        </TouchableOpacity>

        {/* ══ BOTÓN EXPORTAR EXCEL ANCHO ════════════════════════════════ */}
        <TouchableOpacity style={s.btnExcelAncho} activeOpacity={0.8}>
          <MaterialCommunityIcons name="file-excel" size={24} color="#15803D" />
          <AppText style={s.btnExcelAnchoTxt}>
            Exportar historial a Excel
          </AppText>
        </TouchableOpacity>

        <View style={[s.divisorH, { marginVertical: 12 }]} />

        {/* ══ LISTA DE VENTAS AGRUPADAS POR DÍA ══════════════════════════ */}
        {Object.keys(ventasAgrupadas).length > 0 ? (
          Object.keys(ventasAgrupadas).map((fechaGrupo) => (
            <View key={fechaGrupo} style={{ marginBottom: 20 }}>
              <AppText style={s.tituloGrupoFecha}>{fechaGrupo}</AppText>

              <View style={{ gap: 12, marginTop: 8 }}>
                {ventasAgrupadas[fechaGrupo].map((venta, index) => {
                  const avatarColor =
                    AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const inicial = venta.nombreCliente.charAt(0).toUpperCase();
                  const esPagado = venta.tipo === "contado";

                  return (
                    <View key={venta.id} style={s.ventaCard}>
                      <View
                        style={[s.avatar, { backgroundColor: avatarColor.bg }]}
                      >
                        <AppText
                          style={[s.avatarLetra, { color: avatarColor.fg }]}
                        >
                          {inicial}
                        </AppText>
                      </View>

                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <AppText style={s.ventaNombre} numberOfLines={1}>
                          {venta.nombreCliente}
                        </AppText>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          <AppText style={s.ventaHora}>
                            {horaDeVenta(venta.fecha)}
                          </AppText>
                          {venta.numeroFactura && (
                            <AppText style={s.numeroFacturaTag}>
                              #{venta.numeroFactura}
                            </AppText>
                          )}
                        </View>
                      </View>

                      <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                        <AppText style={s.ventaMonto}>
                          {fmt(venta.total)}
                        </AppText>
                        <View
                          style={[
                            s.badge,
                            {
                              backgroundColor: esPagado ? "#DCFCE7" : "#FEF3C7",
                              paddingVertical: 3,
                            },
                          ]}
                        >
                          <AppText
                            style={[
                              s.badgeTxt,
                              {
                                color: esPagado ? "#16A34A" : "#D97706",
                                fontSize: 12,
                              },
                            ]}
                          >
                            {esPagado ? "Pagado" : "Fiado"}
                          </AppText>
                        </View>
                      </View>

                      {/* Botón Ver Macizo y Gigante Táctil */}
                      <TouchableOpacity
                        style={[s.btnVerGrande, { backgroundColor: "#F3F4F6" }]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setVentaSeleccionada(venta);
                          setModalFacturaVisible(true);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="file-eye-outline"
                          size={22}
                          color={colors.primary}
                        />
                        <AppText
                          style={[s.btnVerGrandeTxt, { color: colors.primary }]}
                        >
                          Ver
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          /* ESTADO VACÍO */
          <View
            style={[
              s.card,
              { alignItems: "center", paddingVertical: 48, marginTop: 12 },
            ]}
          >
            <MaterialCommunityIcons
              name="database-search-outline"
              size={64}
              color="#C4CBD8"
              style={{ marginBottom: 16 }}
            />
            <AppText style={s.vacioCabeza}>No se encontraron ventas</AppText>
            <AppText style={s.vacioSub}>
              Prueba cambiando los filtros o modificando el término de búsqueda
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* MODAL DETALLE DE FACTURA */}
      <ModalFactura
        venta={ventaSeleccionada}
        visible={modalFacturaVisible}
        onClose={() => {
          setModalFacturaVisible(false);
          setTimeout(() => setVentaSeleccionada(null), 300);
        }}
      />

      {/* MODAL FILTRO DE FECHA */}
      <ModalElegirFecha
        visible={modalFechaVisible}
        onClose={() => setModalFechaVisible(false)}
        onAplicar={(inicio, fin) => {
          setRangoPersonalizado({ inicio, fin });
          setFiltroPeriodo("personalizado");
        }}
      />
    </ScreenWrapper>
  );
};

// ── Estilos Screen Accesible ──────────────────────────────────────────────────
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
  },
  labelGris: { fontSize: 17, fontWeight: "500", color: "#7B8499" },
  totalGrande: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 4,
    marginBottom: 16,
  },
  divisorH: { height: 1.5, backgroundColor: "#EAECF4", marginBottom: 16 },
  filaCounts: { flexDirection: "row", alignItems: "center" },
  countItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
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
  fila2: { flexDirection: "row", gap: 12 },
  miniCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 120,
    gap: 6,
  },
  miniTitulo: { fontSize: 15, fontWeight: "800" },
  miniMonto: { fontSize: 20, fontWeight: "900", marginTop: 2 },

  // Buscador Cómodo
  contenedorBuscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E6EF",
    borderRadius: 18,
    height: 58,
    marginTop: 8,
  },
  inputBuscador: {
    flex: 1,
    fontSize: 17,
    color: "#111827",
    paddingHorizontal: 12,
    fontWeight: "500",
  },

  // Componentes de Filtros estructurados
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
  },
  filterBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnText: {
    fontSize: 17,
    fontWeight: "700",
  },

  // Botón Fecha
  fechaBtn: {
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  fechaBtnText: {
    fontSize: 17,
    fontWeight: "700",
  },

  // Botón Excel Ancho Profesional
  btnExcelAncho: {
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  btnExcelAnchoTxt: {
    fontSize: 17,
    fontWeight: "700",
    color: "#16A34A",
  },

  // Listado Dinámico Grupos
  tituloGrupoFecha: {
    fontSize: 19,
    fontWeight: "800",
    color: "#4B5563",
    paddingLeft: 4,
  },
  ventaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: { fontSize: 18, fontWeight: "800" },
  ventaNombre: { fontSize: 17, fontWeight: "700", color: "#111827" },
  ventaHora: { fontSize: 14, color: "#7B8499" },
  numeroFacturaTag: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ventaMonto: { fontSize: 17, fontWeight: "700", color: "#111827" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeTxt: { fontSize: 13, fontWeight: "700" },

  // Botón Ver Rediseñado (Más Alto)
  btnVerGrande: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 6,
  },
  btnVerGrandeTxt: { fontSize: 15, fontWeight: "700" },

  // Simulación Inputs del Modal
  inputFechaSimulado: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputFechaTexto: { fontSize: 17, fontWeight: "600", color: "#111827" },
  btnPrincipalAncho: {
    height: 58,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnPrincipalAnchoTxt: { fontSize: 18, fontWeight: "700", color: "#FFF" },
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

// ── Estilos Modal Factura Detalle ─────────────────────────────────────────────
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
});
