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
import { VentaRepositoryImpl } from "../../../data/repositories/VentaRepositoryImpl";
import { ItemVenta, Venta } from "../../../domain/entities/Venta";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

interface ResumenCredito {
  clienteId: string;
  saldoActual: number;
}

// ── NUEVA INTERFAZ PARA ABONOS ──
interface Abono {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  fecha: string;
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

type TipoEstado = "todas" | "pazysalvo" | "debe";
type TipoPeriodo = "hoy" | "semana" | "mes" | "personalizado";

const AVATAR_COLORS = [
  { bg: "#FCE4EC", fg: "#E91E63" },
  { bg: "#E8F5E9", fg: "#2E7D32" },
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#FFF3E0", fg: "#F59E0B" },
  { bg: "#E3F2FD", fg: "#1565C0" },
  { bg: "#F3E8FF", fg: "#9333EA" },
];

const ModalFactura = ({
  venta,
  visible,
  onClose,
  evaluarFacturaPagada,
}: {
  venta: Venta | null;
  visible: boolean;
  onClose: () => void;
  evaluarFacturaPagada: (v: Venta) => boolean;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!venta) return null;

  const esPazYSalvo = evaluarFacturaPagada(venta);
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
                { backgroundColor: esPazYSalvo ? "#DCFCE7" : "#FEF3C7" },
              ]}
            >
              <MaterialCommunityIcons
                name={esPazYSalvo ? "check-circle" : "clock-outline"}
                size={14}
                color={esPazYSalvo ? GREEN : AMBER}
              />
              <AppText
                style={[ms.badgeTxt, { color: esPazYSalvo ? GREEN : AMBER }]}
              >
                {esPazYSalvo ? "Al día" : "En mora"}
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

          {!esPazYSalvo && (
            <View style={ms.fiadoInfo}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
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

const formatearFecha = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").substring(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const fechaValida = (f: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(f) && !isNaN(new Date(f).getTime());

const ModalElegirFecha = ({
  visible,
  onClose,
  onAplicar,
}: {
  visible: boolean;
  onClose: () => void;
  onAplicar: (inicio: string, fin: string) => void;
}) => {
  const { colors } = useTheme();
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

  const handleInicio = (texto: string) => {
    const formateado = formatearFecha(texto);
    setFInicio(formateado);
    setErrorInicio("");
  };

  const handleFin = (texto: string) => {
    const formateado = formatearFecha(texto);
    setFFin(formateado);
    setErrorFin("");
  };

  const handleBuscar = () => {
    let valido = true;
    if (!fechaValida(fInicio)) {
      setErrorInicio("Fecha inválida. Usa el formato AAAA-MM-DD");
      valido = false;
    }
    if (!fechaValida(fFin)) {
      setErrorFin("Fecha inválida. Usa el formato AAAA-MM-DD");
      valido = false;
    }
    if (valido && fInicio > fFin) {
      setErrorInicio("La fecha inicial no puede ser mayor que la final");
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
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <View style={ms.handle} />
        <View style={ms.header}>
          <View style={{ flex: 1 }}>
            <AppText style={ms.headerTitulo}>Rango de fechas</AppText>
            <AppText style={ms.headerFecha}>Formato: AAAA-MM-DD</AppText>
          </View>
          <TouchableOpacity style={ms.btnClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          <View style={{ gap: 8 }}>
            <AppText style={mf.label}>
              <MaterialCommunityIcons
                name="calendar-start"
                size={16}
                color="#7B8499"
              />
              {"  "}Fecha inicial
            </AppText>
            <View style={[mf.inputRow, errorInicio ? mf.inputError : null]}>
              <TextInput
                style={mf.input}
                value={fInicio}
                onChangeText={handleInicio}
                placeholder="2026-01-01"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={10}
              />
              {fechaValida(fInicio) && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
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
                size={16}
                color="#7B8499"
              />
              {"  "}Fecha final
            </AppText>
            <View style={[mf.inputRow, errorFin ? mf.inputError : null]}>
              <TextInput
                style={mf.input}
                value={fFin}
                onChangeText={handleFin}
                placeholder="2026-12-31"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={10}
                onSubmitEditing={handleBuscar}
              />
              {fechaValida(fFin) && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
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
              (!fechaValida(fInicio) || !fechaValida(fFin)) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleBuscar}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#FFF" />
            <AppText style={s.btnPrincipalAnchoTxt}>Buscar ventas</AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
};

export const HistorialScreen = () => {
  const { colors } = useTheme();

  // Estados de control
  const [todasVentas, setTodasVentas] = React.useState<Venta[]>([]);
  const [abonos, setAbonos] = React.useState<Abono[]>([]); // 👈 1. Nuevo estado para almacenar los abonos
  const [ventasFiltradas, setVentasFiltradas] = React.useState<Venta[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);

  // Estados de Filtros
  const [busqueda, setBusqueda] = React.useState("");
  const [filtroEstado, setFiltroEstado] = React.useState<TipoEstado>("todas");
  const [filtroPeriodo, setFiltroPeriodo] = React.useState<TipoPeriodo>("hoy");
  const [rangoPersonalizado, setRangoPersonalizado] = React.useState({
    inicio: "",
    fin: "",
  });

  // Modales
  const [ventaSeleccionada, setVentaSeleccionada] =
    React.useState<Venta | null>(null);
  const [modalFacturaVisible, setModalFacturaVisible] = React.useState(false);
  const [modalFechaVisible, setModalFechaVisible] = React.useState(false);

  // Paginación infinita
  const PAGE_SIZE = 10;
  const [pagina, setPagina] = React.useState(1);
  const [cargandoMas, setCargandoMas] = React.useState(false);

  // Exportar a Excel
  const [exportando, setExportando] = React.useState(false);

  // ── 2. NUEVA LÓGICA DE VALIDACIÓN INDIVIDUAL DE FACTURA CORREGIDA ──
  const evaluarFacturaPagada = React.useCallback(
    (venta: Venta) => {
      // 1. Si es de contado, siempre está pagada
      if (venta.tipo === "contado") return true;

      // 2. CORRECCIÓN: Priorizar el campo 'estado' que ya trae tu objeto Venta
      if (venta.estado === "pagado") return true;

      // 3. Fallback: Si no está marcada como "pagado",
      // calcula basándose en los abonos por si acaso (opcional)
      const totalAbonado = abonos
        .filter((a) => a.ventaId === venta.id)
        .reduce((sum, a) => sum + a.monto, 0);

      return totalAbonado >= venta.total;
    },
    [abonos],
  );

  const exportarExcel = async () => {
    if (ventasFiltradas.length === 0) {
      Alert.alert(
        "Sin datos",
        "No hay ventas para exportar con los filtros actuales.",
      );
      return;
    }
    setExportando(true);
    try {
      const filas: object[] = [];
      ventasFiltradas.forEach((v) => {
        const estReal = evaluarFacturaPagada(v) ? "Al día" : "En mora";
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
              "Estado Factura": estReal,
              Total: v.total,
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
            "Estado Factura": estReal,
            Total: v.total,
          });
        }
      });

      const hoja = XLSX.utils.json_to_sheet(filas);
      hoja["!cols"] = [
        { wch: 20 }, // Factura
        { wch: 12 }, // Fecha
        { wch: 8 }, // Hora
        { wch: 20 }, // Cliente
        { wch: 22 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 16 }, // Precio unitario
        { wch: 12 }, // Subtotal
        { wch: 16 }, // Estado Factura
        { wch: 12 }, // Total
      ];

      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Historial");

      const base64 = XLSX.write(libro, { type: "base64", bookType: "xlsx" });
      const fechaArchivo = new Date().toISOString().substring(0, 10);
      const ruta = `${FileSystem.cacheDirectory}historial_${fechaArchivo}.xlsx`;

      await FileSystem.writeAsStringAsync(ruta, base64, {
        encoding: "base64" as FileSystem.EncodingType,
      });

      const puedoCompartir = await Sharing.isAvailableAsync();
      if (puedoCompartir) {
        await Sharing.shareAsync(ruta, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Exportar historial de ventas",
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

  // ── 3. CARGA COMPLETA DE VENTAS Y ABONOS DESDE SQLITE ──
  // Dentro de HistorialScreen.tsx
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
      console.error("Error cargando datos:", e);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };
  React.useEffect(() => {
    cargarDatos();
  }, []);

  // Procesamiento de filtros corregido para evaluar factura de forma individual
  React.useEffect(() => {
    let resultado = [...todasVentas];

    // 1. Filtrado Inteligente por Estado Real de Factura
    if (filtroEstado === "pazysalvo") {
      resultado = resultado.filter((v) => evaluarFacturaPagada(v));
    } else if (filtroEstado === "debe") {
      resultado = resultado.filter((v) => !evaluarFacturaPagada(v));
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

    // 3. Filtrado por Buscador
    if (busqueda.trim() !== "") {
      const query = busqueda.toLowerCase();
      resultado = resultado.filter(
        (v) =>
          v.nombreCliente.toLowerCase().includes(query) ||
          (v.numeroFactura && v.numeroFactura.toLowerCase().includes(query)),
      );
    }

    setVentasFiltradas(resultado);
    setPagina(1);
  }, [
    todasVentas,
    filtroEstado,
    filtroPeriodo,
    rangoPersonalizado,
    busqueda,
    evaluarFacturaPagada,
  ]);

  // Formatea fecha sv-SE a legible corta
  const fmtFechaCorta = (svStr: string) => {
    const d = new Date(svStr + "T00:00:00");
    return d.toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
      day: "numeric",
      month: "short",
    });
  };

  // Rango de fechas activo (para filtrar abonos del mismo periodo)
  const rangoActivo = React.useMemo(() => {
    const hoyStr = fechaHoy();
    if (filtroPeriodo === "hoy") {
      return { inicio: hoyStr, fin: hoyStr };
    } else if (filtroPeriodo === "semana") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return {
        inicio: d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }),
        fin: hoyStr,
      };
    } else if (filtroPeriodo === "mes") {
      const d = new Date();
      d.setDate(1);
      return {
        inicio: d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }),
        fin: hoyStr,
      };
    } else if (filtroPeriodo === "personalizado" && rangoPersonalizado.inicio) {
      return { inicio: rangoPersonalizado.inicio, fin: rangoPersonalizado.fin };
    }
    return null;
  }, [filtroPeriodo, rangoPersonalizado]);

  // Etiqueta legible del rango
  const etiquetaRango = React.useMemo(() => {
    if (!rangoActivo) return "";
    if (filtroPeriodo === "hoy")
      return "Hoy, " + fmtFechaCorta(rangoActivo.inicio);
    if (rangoActivo.inicio === rangoActivo.fin)
      return fmtFechaCorta(rangoActivo.inicio);
    return (
      fmtFechaCorta(rangoActivo.inicio) +
      " al " +
      fmtFechaCorta(rangoActivo.fin)
    );
  }, [rangoActivo, filtroPeriodo]);

  // Estadísticas exactas basadas en la corrección por factura
  const stats = React.useMemo(() => {
    const total = ventasFiltradas.reduce((a, v) => a + v.total, 0);
    const cantVentas = ventasFiltradas.length;

    // IDs de ventas en el período filtrado (para cruzar abonos)
    const ventasIds = new Set(ventasFiltradas.map((v) => v.id));

    // LOGICA IDENTICA A VentaDelDia:
    // recibido = ventas de contado del periodo + TODOS los abonos cobrados en el periodo

    // 1. Ventas de CONTADO creadas en el periodo
    const totalContado = ventasFiltradas
      .filter((v) => v.tipo === "contado")
      .reduce((a, v) => a + v.total, 0);

    // 2. TODOS los abonos cuya fecha cae en el rango (sin importar la fecha de la venta)
    const totalAbonosParciales = abonos
      .filter((ab) => {
        if (!rangoActivo) return true;
        const fechaAbono = ab.fecha.substring(0, 10);
        return (
          fechaAbono >= rangoActivo.inicio && fechaAbono <= rangoActivo.fin
        );
      })
      .reduce((s, ab) => s + ab.monto, 0);

    // 3. Total recibido = contado del periodo + abonos cobrados en el periodo
    const totalRecibido = totalContado + totalAbonosParciales;

    // Cuentas por cobrar = suma de saldos reales (total - abonado) de facturas pendientes
    const totalDebe = ventasFiltradas
      .filter((v) => !evaluarFacturaPagada(v))
      .reduce((a, v) => {
        const totalAbonado = abonos
          .filter((ab) => ab.ventaId === v.id)
          .reduce((s, ab) => s + ab.monto, 0);
        return a + Math.max(0, v.total - totalAbonado);
      }, 0);

    const clientesUnicos = [...new Set(ventasFiltradas.map((v) => v.clienteId))]
      .length;

    const conteoProductos: { [nombre: string]: number } = {};
    ventasFiltradas.forEach((v) => {
      (v.items ?? []).forEach((item: ItemVenta) => {
        const nombre = item.nombreProducto ?? item.productoId ?? "Producto";
        conteoProductos[nombre] =
          (conteoProductos[nombre] ?? 0) + (item.cantidad ?? 1);
      });
    });
    const top3 = Object.entries(conteoProductos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    return {
      total,
      cantVentas,
      totalContado,
      totalAbonosParciales,
      totalRecibido,
      totalDebe,
      clientesUnicos,
      top3,
    };
  }, [ventasFiltradas, evaluarFacturaPagada, abonos, rangoActivo]);

  // Saldo real pendiente por factura (total - abonos aplicados a esa venta)
  const saldoPorVenta = React.useMemo(() => {
    const mapa = new Map<string, number>();
    todasVentas.forEach((v) => {
      const totalAbonado = abonos
        .filter((a) => a.ventaId === v.id)
        .reduce((sum, a) => sum + a.monto, 0);
      const saldo = Math.max(0, v.total - totalAbonado);
      mapa.set(v.id, saldo);
    });
    return mapa;
  }, [todasVentas, abonos]);

  // Ventas visibles
  const ventasVisibles = React.useMemo(() => {
    const ordenadas = [...ventasFiltradas].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
    return ordenadas.slice(0, pagina * PAGE_SIZE);
  }, [ventasFiltradas, pagina]);

  const hayMas = ventasVisibles.length < ventasFiltradas.length;

  const cargarMas = () => {
    if (cargandoMas || !hayMas) return;
    setCargandoMas(true);
    setTimeout(() => {
      setPagina((p) => p + 1);
      setCargandoMas(false);
    }, 400);
  };

  const ventasAgrupadas = React.useMemo(() => {
    const grupos: { [key: string]: Venta[] } = {};
    const ordenadas = [...ventasVisibles].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    ordenadas.forEach((venta) => {
      const fechaClave = venta.fecha.substring(0, 10);
      const titulo = obtenerEtiquetaAgrupacion(fechaClave);
      if (!grupos[titulo]) grupos[titulo] = [];
      grupos[titulo].push(venta);
    });
    return grupos;
  }, [ventasVisibles]);

  if (cargando) {
    return (
      <ScreenWrapper title="Historial" showBtnB={false}>
        <View style={s.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText
            style={{ marginTop: 16, fontSize: 18, color: colors.grayText }}
          >
            Cargando historial comercial...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanciaAlFondo =
      contentSize.height - contentOffset.y - layoutMeasurement.height;
    if (distanciaAlFondo < 200) {
      cargarMas();
    }
  };

  return (
    <ScreenWrapper title="Historial" showBtnB={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarDatos(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* BUSCADOR */}
        <View style={{ marginBottom: 20 }}>
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

        {/* FILTRO ESTADO FACTURA */}
        <View style={s.filterSection}>
          <AppText style={s.filterTitle}>Estado de facturas</AppText>
          <View style={s.filterRow}>
            {(["todas", "pazysalvo", "debe"] as TipoEstado[]).map((estado) => {
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
                      : estado === "pazysalvo"
                        ? "Al día"
                        : "En mora"}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FILTRO PERIODO */}
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

        {/* FECHA PERSONALIZADA */}
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

        {/* EXPORTAR EXCEL */}
        <TouchableOpacity
          style={[s.btnExcelAncho, exportando && { opacity: 0.6 }]}
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
          <AppText style={s.btnExcelAnchoTxt}>
            {exportando ? "Generando archivo..." : "Exportar historial a Excel"}
          </AppText>
        </TouchableOpacity>

        {/* TARJETA RESUMEN GRANDE */}
        <View style={[s.card, { marginBottom: 16 }]}>
          {/* Encabezado con rango de fechas */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 2,
            }}
          >
            <AppText style={s.labelGris}>Dinero recibido</AppText>
            {!!etiquetaRango && (
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
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={13}
                  color="#2563EB"
                />
                <AppText
                  style={{ fontSize: 12, color: "#2563EB", fontWeight: "700" }}
                >
                  {etiquetaRango}
                </AppText>
              </View>
            )}
          </View>

          <AppText style={[s.totalGrande, { color: colors.primary }]}>
            {fmt(stats.totalRecibido)}
          </AppText>

          {/* Desglose siempre visible */}
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
            {/* Fila: Ventas pagadas */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#DCFCE7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="check-bold"
                    size={20}
                    color="#16A34A"
                  />
                </View>
                <View>
                  <AppText
                    style={{
                      fontSize: 16,
                      color: "#374151",
                      fontWeight: "700",
                    }}
                  >
                    Ventas pagadas
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      fontWeight: "500",
                    }}
                  >
                    Pago al contado
                  </AppText>
                </View>
              </View>
              <AppText
                style={{ fontSize: 18, color: "#16A34A", fontWeight: "800" }}
              >
                {fmt(stats.totalContado)}
              </AppText>
            </View>

            <View style={{ height: 1, backgroundColor: "#E8EEFB" }} />

            {/* Fila: Abonos recibidos */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#DBEAFE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="cash-plus"
                    size={20}
                    color="#2563EB"
                  />
                </View>
                <View>
                  <AppText
                    style={{
                      fontSize: 16,
                      color: "#374151",
                      fontWeight: "700",
                    }}
                  >
                    Abonos recibidos
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      fontWeight: "500",
                    }}
                  >
                    Pagos parciales de créditos
                  </AppText>
                </View>
              </View>
              <AppText
                style={{ fontSize: 18, color: "#2563EB", fontWeight: "800" }}
              >
                {fmt(stats.totalAbonosParciales)}
              </AppText>
            </View>
          </View>

          {/* Pendiente de cobro */}
          {stats.totalDebe > 0 && (
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
                    Créditos sin saldar
                  </AppText>
                </View>
              </View>
              <AppText
                style={{ fontSize: 18, color: "#D97706", fontWeight: "800" }}
              >
                {fmt(stats.totalDebe)}
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

          {/* TOP PRODUCTOS */}
          {stats.top3.length > 0 &&
            (() => {
              const medallas = ["🥇", "🥈", "🥉"];
              const barColors = ["#F59E0B", "#9CA3AF", "#CD7C2F"];
              const maxCantidad = stats.top3[0]?.cantidad ?? 1;
              return (
                <>
                  <View
                    style={[s.divisorH, { marginTop: 4, marginBottom: 16 }]}
                  />
                  <View style={{ gap: 12 }}>
                    <AppText
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      🏆 Top productos
                    </AppText>
                    {stats.top3.map((p, i) => (
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
                            {p.cantidad} uds
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
                              width: `${Math.round((p.cantidad / maxCantidad) * 100)}%`,
                            }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              );
            })()}
        </View>

        {/* LISTADO DINÁMICO DE FACTURAS */}
        {ventasFiltradas.length > 0 && (
          <AppText style={[s.filterTitle, { marginBottom: 4 }]}>
            Listado de facturas
          </AppText>
        )}

        {Object.keys(ventasAgrupadas).length > 0 ? (
          Object.keys(ventasAgrupadas).map((fechaGrupo) => (
            <View key={fechaGrupo} style={{ marginBottom: 20 }}>
              <AppText style={s.tituloGrupoFecha}>{fechaGrupo}</AppText>
              <View style={{ gap: 12, marginTop: 8 }}>
                {ventasAgrupadas[fechaGrupo].map((venta, index) => {
                  const avatarColor =
                    AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const inicial = venta.nombreCliente.charAt(0).toUpperCase();
                  const esFacturaSaldada = evaluarFacturaPagada(venta);

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
                        <AppText style={s.ventaHora}>
                          {horaDeVenta(venta.fecha)}
                        </AppText>
                      </View>
                      <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                        {/* Si es crédito pendiente mostramos saldo, si no el total */}
                        {!esFacturaSaldada ? (
                          <>
                            <AppText
                              style={[s.ventaMonto, { color: "#D97706" }]}
                            >
                              {fmt(saldoPorVenta.get(venta.id) ?? venta.total)}
                            </AppText>
                            <AppText
                              style={{
                                fontSize: 11,
                                color: "#9CA3AF",
                                marginBottom: 2,
                              }}
                            >
                              de {fmt(venta.total)}
                            </AppText>
                          </>
                        ) : (
                          <AppText style={s.ventaMonto}>
                            {fmt(venta.total)}
                          </AppText>
                        )}
                        <View
                          style={[
                            s.badge,
                            {
                              backgroundColor: esFacturaSaldada
                                ? "#DCFCE7"
                                : "#FEF3C7",
                              paddingVertical: 3,
                            },
                          ]}
                        >
                          <AppText
                            style={[
                              s.badgeTxt,
                              {
                                color: esFacturaSaldada ? "#16A34A" : "#D97706",
                                fontSize: 12,
                              },
                            ]}
                          >
                            {esFacturaSaldada ? "Al día" : "En mora"}
                          </AppText>
                        </View>
                      </View>
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

        {cargandoMas && (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* MODAL DETALLE DE FACTURA */}
      <ModalFactura
        venta={ventaSeleccionada}
        visible={modalFacturaVisible}
        evaluarFacturaPagada={evaluarFacturaPagada}
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
  ventaMonto: { fontSize: 17, fontWeight: "700", color: "#111827" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeTxt: { fontSize: 13, fontWeight: "700" },

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
});

const mf = StyleSheet.create({
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    height: 58,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    letterSpacing: 1,
  },
  errorTxt: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "500",
    paddingLeft: 4,
  },
});
