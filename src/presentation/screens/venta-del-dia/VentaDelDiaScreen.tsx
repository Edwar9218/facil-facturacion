import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

// ── Repos ─────────────────────────────────────────────────────────────────────
const ventaRepo = new VentaRepositoryImpl();
const creditoRepo = new CreditoRepositoryImpl();

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface DatosDelDia {
  totalHoy: number;
  ventasHoy: number;
  clientesHoy: number;
  totalContado: number;
  totalCreditoHoy: number;
  creditoPendiente: number;
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
}: {
  venta: Venta | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const { colors, spacing, radius } = useTheme();
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
      {/* Overlay */}
      <TouchableOpacity
        style={ms.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sheet */}
      <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>
        {/* Handle */}
        <View style={ms.handle} />

        {/* Header */}
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
          {/* Cliente + hora */}
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

          {/* Divider */}
          <View style={ms.divisor} />

          {/* Tabla productos */}
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

          {/* Total */}
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

          {/* Info pago fiado */}
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

          {/* Número de factura si existe */}
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
  const { colors, spacing, radius, shadows } = useTheme();
  const router = useRouter();

  const [datos, setDatos] = React.useState<DatosDelDia | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);
  const [mostrarTodas, setMostrarTodas] = React.useState(false);

  // ── Modal ──
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

  const cargar = async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);

    const [todasVentas, resumenes] = await Promise.all([
      ventaRepo.getAll(),
      creditoRepo.getResumenes(),
    ]);

    const ventasDeHoy = todasVentas.filter((v) => esHoy(v.fecha));
    const clientesIds = [...new Set(ventasDeHoy.map((v) => v.clienteId))];

    setDatos({
      totalHoy: ventasDeHoy.reduce((a, v) => a + v.total, 0),
      ventasHoy: ventasDeHoy.length,
      clientesHoy: clientesIds.length,
      totalContado: ventasDeHoy
        .filter((v) => v.tipo === "contado")
        .reduce((a, v) => a + v.total, 0),
      totalCreditoHoy: ventasDeHoy
        .filter((v) => v.tipo === "credito")
        .reduce((a, v) => a + v.total, 0),
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
        {/* ══ TARJETA TOTAL HOY ══════════════════════════════════════════ */}
        <View style={[s.card, { marginBottom: 16 }]}>
          <AppText style={s.labelGris}>Total vendido hoy</AppText>
          <AppText
            style={[
              s.totalGrande,
              { color: hayVentas ? colors.primary : colors.grayText },
            ]}
          >
            {fmt(datos.totalHoy)}
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
              <AppText style={s.countNum}>{datos.ventasHoy}</AppText>
              <AppText style={s.countLabel}>Ventas hoy</AppText>
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
              <AppText style={s.countNum}>{datos.clientesHoy}</AppText>
              <AppText style={s.countLabel}>Clientes hoy</AppText>
            </View>
          </View>
        </View>

        {/* ══ 2 TARJETAS ════════════════════════════════════════════════ */}
        <View style={[s.fila2, { marginBottom: 24 }]}>
          <View
            style={[
              s.miniCard,
              { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
            ]}
          >
            <View style={[s.iconBubble, { backgroundColor: "#DCFCE7" }]}>
              <MaterialCommunityIcons name="cash" size={26} color="#16A34A" />
            </View>
            <AppText style={[s.miniTitulo, { color: "#16A34A" }]}>
              De contado
            </AppText>
            <AppText style={[s.miniMonto, { color: "#15803D" }]}>
              {fmt(datos.totalContado)}
            </AppText>
            <AppText style={[s.miniSub, { color: "#4ADE80" }]}>
              Dinero recibido hoy
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
                size={26}
                color="#7C3AED"
              />
            </View>
            <AppText style={[s.miniTitulo, { color: "#7C3AED" }]}>
              A crédito hoy
            </AppText>
            <AppText style={[s.miniMonto, { color: "#6D28D9" }]}>
              {fmt(datos.totalCreditoHoy)}
            </AppText>
            <AppText style={[s.miniSub, { color: "#A78BFA" }]}>
              Ventas fiadas hoy
            </AppText>
          </View>
        </View>

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
                const esPagado = venta.tipo === "contado";

                return (
                  <View key={venta.id} style={s.ventaCard}>
                    {/* Avatar */}
                    <View
                      style={[s.avatar, { backgroundColor: avatarColor.bg }]}
                    >
                      <AppText
                        style={[s.avatarLetra, { color: avatarColor.fg }]}
                      >
                        {inicial}
                      </AppText>
                    </View>

                    {/* Nombre + hora */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <AppText style={s.ventaNombre} numberOfLines={1}>
                        {venta.nombreCliente}
                      </AppText>
                      <AppText style={s.ventaHora}>
                        {horaDeVenta(venta.fecha)}
                      </AppText>
                    </View>

                    {/* Monto + badge */}
                    <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                      <AppText style={s.ventaMonto}>{fmt(venta.total)}</AppText>
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
                          {esPagado ? "Pagado" : "Fiado"}
                        </AppText>
                      </View>
                    </View>

                    {/* Botón Ver — ahora abre el modal */}
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

        {/* ══ CRÉDITO PENDIENTE ═════════════════════════════════════════ */}
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
              <AppText style={s.creditoTitulo}>Crédito pendiente</AppText>
              <AppText style={s.creditoSubtitulo}>de días anteriores</AppText>
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

      {/* ══ MODAL FACTURA ═════════════════════════════════════════════════ */}
      <ModalFactura
        venta={ventaSeleccionada}
        visible={modalVisible}
        onClose={cerrarModal}
      />
    </ScreenWrapper>
  );
};

// ── Estilos screen ────────────────────────────────────────────────────────────
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
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 4,
    marginBottom: 16,
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
  fila2: { flexDirection: "row", gap: 12 },
  miniCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    minHeight: 160,
    gap: 8,
  },
  miniTitulo: { fontSize: 15, fontWeight: "800" },
  miniMonto: { fontSize: 22, fontWeight: "900" },
  miniSub: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
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

// ── Estilos modal ─────────────────────────────────────────────────────────────
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

  // cliente
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

  // tabla
  tablaHeader: {
    flexDirection: "row",
    paddingVertical: 4,
  },
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

  // total
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  totalLabel: { fontSize: 14, color: "#7B8499", fontWeight: "500" },
  totalMonto: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },

  // fiado info
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
  fiadoTxt: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
  },

  // factura
  facturaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    justifyContent: "center",
  },
  facturaTxt: { fontSize: 13, color: "#7B8499" },
});
