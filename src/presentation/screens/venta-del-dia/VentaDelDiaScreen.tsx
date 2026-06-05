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
  TouchableOpacity,
  View,
} from "react-native";
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
interface Abono {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  fecha: string;
}

interface DatosDelDia {
  recibiidoHoy: number; // contado hoy + abonos cobrados hoy
  totalHoy: number; // suma de todas las facturas del día
  ventasHoy: number;
  clientesHoy: number;
  totalCreditoHoy: number; // total original fiado hoy
  creditoSaldoHoy: number; // saldo real pendiente de ventas de hoy
  creditoPendiente: number; // cartera total (todos los días)
  ventasDelDia: Venta[];
  deudores: ResumenCredito[];
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
  saldoPorVenta,
}: {
  venta: Venta | null;
  visible: boolean;
  onClose: () => void;
  saldoPorVenta: Map<string, number>;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!venta) return null;

  const esPagado = venta.tipo === "contado" || venta.estado === "pagado";
  const saldoReal = saldoPorVenta.get(venta.id) ?? venta.total;
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
                {esPagado ? "Al día" : "En mora"}
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
              <AppText style={ms.totalLabel}>Total factura</AppText>
              <AppText style={[ms.totalMonto, { color: INK }]}>
                {fmt(venta.total)}
              </AppText>
              {!esPagado && saldoReal < venta.total && (
                <AppText
                  style={{
                    fontSize: 14,
                    color: AMBER,
                    fontWeight: "700",
                    marginTop: 2,
                  }}
                >
                  Saldo: {fmt(saldoReal)}
                </AppText>
              )}
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

// ── Screen ────────────────────────────────────────────────────────────────────
export const VentaDelDiaScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const [datos, setDatos] = React.useState<DatosDelDia | null>(null);
  const [abonos, setAbonos] = React.useState<Abono[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);
  const [mostrarTodas, setMostrarTodas] = React.useState(false);
  const [exportando, setExportando] = React.useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] =
    React.useState<Venta | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  const abrirModal = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setTimeout(() => setVentaSeleccionada(null), 300);
  };

  // ── Saldo real por factura ────────────────────────────────────────────────
  const saldoPorVenta = React.useMemo(() => {
    const mapa = new Map<string, number>();
    if (!datos) return mapa;
    datos.ventasDelDia.forEach((v) => {
      const totalAbonado = abonos
        .filter((a) => a.ventaId === v.id)
        .reduce((sum, a) => sum + a.monto, 0);
      mapa.set(v.id, Math.max(0, v.total - totalAbonado));
    });
    return mapa;
  }, [datos, abonos]);

  const cargar = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    const [todasVentas, resumenes, listaAbonos] = await Promise.all([
      ventaRepo.getAll(),
      creditoRepo.getResumenes(),
      creditoRepo.getAbonos ? creditoRepo.getAbonos() : Promise.resolve([]),
    ]);

    const ventasDeHoy = todasVentas.filter((v) => esHoy(v.fecha));
    const clientesIds = [...new Set(ventasDeHoy.map((v) => v.clienteId))];

    // Abonos cobrados hoy (independiente de cuándo fue la venta)
    const abonosDeHoy = listaAbonos.filter((a: Abono) => esHoy(a.fecha));
    const totalAbonosHoy = abonosDeHoy.reduce(
      (s: number, a: Abono) => s + a.monto,
      0,
    );

    // Recibido hoy = ventas de contado de hoy + abonos cobrados hoy
    const totalContadoHoy = ventasDeHoy
      .filter((v) => v.tipo === "contado")
      .reduce((a, v) => a + v.total, 0);
    const recibiidoHoy = totalContadoHoy + totalAbonosHoy;

    // Saldo real de ventas a crédito de HOY
    // Solo descuenta abonos cobrados HOY (filtrado por fecha del abono)
    // Así si alguien abonó ayer, no afecta el pendiente de hoy
    const totalCreditoHoy = ventasDeHoy
      .filter((v) => v.tipo === "credito")
      .reduce((a, v) => a + v.total, 0);

    const creditoSaldoHoy = ventasDeHoy
      .filter((v) => v.tipo === "credito")
      .reduce((acc, v) => {
        const abonado = abonosDeHoy
          .filter((a: Abono) => a.ventaId === v.id)
          .reduce((s: number, a: Abono) => s + a.monto, 0);
        return acc + Math.max(0, v.total - abonado);
      }, 0);

    setAbonos(listaAbonos);
    setDatos({
      recibiidoHoy,
      totalHoy: ventasDeHoy.reduce((a, v) => a + v.total, 0),
      ventasHoy: ventasDeHoy.length,
      clientesHoy: clientesIds.length,
      totalCreditoHoy,
      creditoSaldoHoy,
      creditoPendiente: resumenes.reduce((a, r) => a + r.saldoActual, 0),
      ventasDelDia: ventasDeHoy,
      deudores: resumenes,
    });

    setCargando(false);
    setRefrescando(false);
  };

  React.useEffect(() => {
    cargar();
  }, []);

  // ── Top 3 productos del día ───────────────────────────────────────────────
  const top3 = React.useMemo(() => {
    if (!datos) return [];
    const conteo: { [nombre: string]: number } = {};
    datos.ventasDelDia.forEach((v) => {
      (v.items ?? []).forEach((item: ItemVenta) => {
        const nombre = item.nombreProducto ?? "Producto";
        conteo[nombre] = (conteo[nombre] ?? 0) + (item.cantidad ?? 1);
      });
    });
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }, [datos]);

  // ── Exportar Excel ────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    if (!datos || datos.ventasDelDia.length === 0) {
      Alert.alert("Sin datos", "No hay ventas hoy para exportar.");
      return;
    }
    setExportando(true);
    try {
      const filas: object[] = [];
      datos.ventasDelDia.forEach((v) => {
        const saldo = saldoPorVenta.get(v.id) ?? v.total;
        const estadoReal =
          v.tipo === "contado" || v.estado === "pagado"
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
              "Total factura": v.total,
              "Saldo pendiente": saldo,
              Estado: estadoReal,
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
            "Total factura": v.total,
            "Saldo pendiente": saldo,
            Estado: estadoReal,
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
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
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

  if (!datos) return null;

  const hayVentas = datos.ventasHoy > 0;
  const ventasVisibles = mostrarTodas
    ? datos.ventasDelDia
    : datos.ventasDelDia.slice(0, 5);
  const medallas = ["🥇", "🥈", "🥉"];
  const barColors = ["#F59E0B", "#9CA3AF", "#CD7C2F"];
  const maxCantidad = top3[0]?.cantidad ?? 1;

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
        {/* ══ TARJETA PRINCIPAL ══════════════════════════════════════════ */}
        <View style={[s.card, { marginBottom: 16 }]}>
          {/* Encabezado: título + badge fecha larga */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 2,
            }}
          >
            <AppText style={s.labelGris}>Dinero recibido</AppText>
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
              { color: hayVentas ? colors.primary : colors.grayText },
            ]}
          >
            {fmt(datos.recibiidoHoy)}
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
            {/* Fila: Ventas de contado */}
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
                    ✅ Ventas de contado
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
                {fmt(
                  datos.ventasDelDia
                    .filter((v) => v.tipo === "contado")
                    .reduce((a, v) => a + v.total, 0),
                )}
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
                    💵 Abonos recibidos
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
                {fmt(
                  datos.recibiidoHoy -
                    datos.ventasDelDia
                      .filter((v) => v.tipo === "contado")
                      .reduce((a, v) => a + v.total, 0),
                )}
              </AppText>
            </View>
          </View>

          {/* Pendiente de cobro — solo si hay saldo */}
          {datos.creditoSaldoHoy > 0 && (
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
                {fmt(datos.creditoSaldoHoy)}
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
                <AppText style={s.countNum}>{datos.ventasHoy}</AppText>
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
                <AppText style={s.countNum}>{datos.clientesHoy}</AppText>
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
          )}
        </View>

        {/* ══ BOTÓN EXPORTAR EXCEL ══════════════════════════════════════ */}
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

        {/* ══ LISTA VENTAS DEL DÍA ══════════════════════════════════════ */}
        {hayVentas && (
          <>
            <View style={s.seccionHeader}>
              <AppText style={s.seccionTitulo}>Ventas de hoy</AppText>
              {datos.ventasDelDia.length > 5 && (
                <TouchableOpacity
                  onPress={() => setMostrarTodas((v) => !v)}
                  activeOpacity={0.7}
                >
                  <AppText style={[s.verTodasTxt, { color: colors.primary }]}>
                    {mostrarTodas
                      ? "Ver menos"
                      : `Ver todas (${datos.ventasDelDia.length})`}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ gap: 10, marginBottom: 16 }}>
              {ventasVisibles.map((venta, index) => {
                const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const inicial = venta.nombreCliente.charAt(0).toUpperCase();
                const esPagado =
                  venta.tipo === "contado" || venta.estado === "pagado";
                const saldo = saldoPorVenta.get(venta.id) ?? venta.total;
                const tieneAbonosParciales = !esPagado && saldo < venta.total;

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
                    <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                      {!esPagado ? (
                        <>
                          <AppText style={[s.ventaMonto, { color: "#D97706" }]}>
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
                        <AppText style={s.ventaMonto}>
                          {fmt(venta.total)}
                        </AppText>
                      )}
                      <View
                        style={[
                          s.badge,
                          { backgroundColor: esPagado ? "#DCFCE7" : "#FEF3C7" },
                        ]}
                      >
                        <AppText
                          style={[
                            s.badgeTxt,
                            { color: esPagado ? "#16A34A" : "#D97706" },
                          ]}
                        >
                          {esPagado ? "Al día" : "En mora"}
                        </AppText>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[s.btnVer, { borderColor: colors.grayBorder }]}
                      activeOpacity={0.7}
                      onPress={() => abrirModal(venta)}
                    >
                      <MaterialCommunityIcons
                        name="file-eye-outline"
                        size={20}
                        color={colors.primary}
                      />
                      <AppText style={[s.btnVerTxt, { color: colors.primary }]}>
                        Ver
                      </AppText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ══ CRÉDITO PENDIENTE HISTÓRICO ═══════════════════════════════ */}
        {datos.deudores.length > 0 && (
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
                {fmt(datos.creditoPendiente)}
                <AppText style={s.creditoClientes}>
                  {" · "}
                  {datos.deudores.length} cliente
                  {datos.deudores.length !== 1 ? "s" : ""}
                </AppText>
              </AppText>
            </View>
          </View>
        )}

        {/* ══ ESTADO VACÍO ══════════════════════════════════════════════ */}
        {!hayVentas && (
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
      </ScrollView>

      <ModalFactura
        venta={ventaSeleccionada}
        visible={modalVisible}
        onClose={cerrarModal}
        saldoPorVenta={saldoPorVenta}
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
