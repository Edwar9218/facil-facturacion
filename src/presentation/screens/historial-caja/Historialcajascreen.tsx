// src/presentation/screens/historial-caja/HistorialCajaScreen.tsx

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { CajaRepositoryImpl } from "../../../data/repositories/CajaRepositoryImpl";
import { Caja, ResumenCaja } from "../../../domain/entities/Caja";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";

const cajaRepo = new CajaRepositoryImpl();

const fmt = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

const fechaHoy = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

const fechaAyer = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });
};

const etiquetaFecha = (fecha: string) => {
  if (fecha === fechaHoy()) return "Hoy";
  if (fecha === fechaAyer()) return "Ayer";
  const d = new Date(`${fecha}T00:00:00`);
  const texto = d.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const horaDe = (fechaIso?: string | null) => {
  if (!fechaIso) return null;
  const d = new Date(fechaIso);
  return d.toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Modal de resumen ────────────────────────────────────────────────────────
function ResumenModal({
  visible,
  cajaId,
  onClose,
}: {
  visible: boolean;
  cajaId: string | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [resumen, setResumen] = React.useState<ResumenCaja | null>(null);
  const [cargando, setCargando] = React.useState(false);

  React.useEffect(() => {
    if (!visible || !cajaId) return;
    setCargando(true);
    setResumen(null);
    cajaRepo
      .getResumen(cajaId)
      .then(setResumen)
      .finally(() => setCargando(false));
  }, [visible, cajaId]);

  const abierta = resumen?.caja?.estado === "abierta";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={ms.overlay} onPress={onClose}>
        <Pressable style={ms.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={ms.header}>
            <View style={ms.headerLeft}>
              <View
                style={[
                  ms.iconCircle,
                  { backgroundColor: abierta ? "#E6F7EF" : "#F3F4F6" },
                ]}
              >
                <MaterialCommunityIcons
                  name="cash-register"
                  size={20}
                  color={abierta ? "#2EAA6E" : "#6B7280"}
                />
              </View>
              <View>
                <AppText style={ms.headerTitulo}>Resumen de caja</AppText>
                {resumen?.caja && (
                  <AppText style={ms.headerFecha}>
                    {etiquetaFecha(resumen.caja.fecha)}
                  </AppText>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={ms.cerrarBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {cargando || !resumen ? (
            <View style={ms.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {/* Estado y horario */}
              <View style={ms.seccion}>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Estado</AppText>
                  <View
                    style={[
                      ms.badge,
                      { backgroundColor: abierta ? "#E6F7EF" : "#F3F4F6" },
                    ]}
                  >
                    <AppText
                      style={[
                        ms.badgeTxt,
                        { color: abierta ? "#2EAA6E" : "#6B7280" },
                      ]}
                    >
                      {abierta ? "Abierta" : "Cerrada"}
                    </AppText>
                  </View>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Apertura</AppText>
                  <AppText style={ms.filaValor}>
                    {horaDe(resumen.caja.creadoEn) ?? "—"}
                  </AppText>
                </View>
                {!abierta && (
                  <View style={ms.fila}>
                    <AppText style={ms.filaLabel}>Cierre</AppText>
                    <AppText style={ms.filaValor}>
                      {horaDe(resumen.caja.cerradoEn) ?? "—"}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Montos apertura / cierre */}
              <View style={ms.seccion}>
                <AppText style={ms.seccionTitulo}>Montos</AppText>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Monto inicial</AppText>
                  <AppText style={ms.filaValor}>
                    {fmt(resumen.caja.montoApertura)}
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Monto final</AppText>
                  <AppText
                    style={[ms.filaValor, abierta && { color: "#9CA3AF" }]}
                  >
                    {abierta ? "En curso" : fmt(resumen.caja.montoCierre)}
                  </AppText>
                </View>
              </View>

              {/* Efectivo */}
              <View style={ms.seccion}>
                <View style={ms.seccionHeader}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={16}
                    color="#2EAA6E"
                  />
                  <AppText style={[ms.seccionTitulo, { color: "#2EAA6E" }]}>
                    Efectivo
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Ventas</AppText>
                  <AppText style={ms.filaValorPos}>
                    {fmt(resumen.ventasEfectivo)}
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Abonos recibidos</AppText>
                  <AppText style={ms.filaValorPos}>
                    {fmt(resumen.abonosEfectivo)}
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Gastos</AppText>
                  <AppText style={ms.filaValorNeg}>
                    -{fmt(resumen.gastosEfectivo)}
                  </AppText>
                </View>
                <View style={[ms.fila, ms.totalFila]}>
                  <AppText style={ms.totalLabel}>Saldo esperado</AppText>
                  <AppText style={ms.totalValor}>
                    {fmt(resumen.saldoEsperadoEfectivo)}
                  </AppText>
                </View>
                {!abierta && resumen.diferencia !== undefined && (
                  <View style={ms.fila}>
                    <AppText style={ms.filaLabel}>Diferencia</AppText>
                    <AppText
                      style={[
                        ms.filaValor,
                        {
                          color:
                            resumen.diferencia === 0
                              ? "#2EAA6E"
                              : resumen.diferencia > 0
                                ? "#2563EB"
                                : "#EF4444",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {resumen.diferencia > 0 ? "+" : ""}
                      {fmt(resumen.diferencia)}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Transferencia */}
              <View style={ms.seccion}>
                <View style={ms.seccionHeader}>
                  <MaterialCommunityIcons
                    name="bank-transfer"
                    size={16}
                    color="#2563EB"
                  />
                  <AppText style={[ms.seccionTitulo, { color: "#2563EB" }]}>
                    Transferencia
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Ventas</AppText>
                  <AppText style={[ms.filaValorPos, { color: "#2563EB" }]}>
                    {fmt(resumen.ventasTransferencia)}
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Abonos recibidos</AppText>
                  <AppText style={[ms.filaValorPos, { color: "#2563EB" }]}>
                    {fmt(resumen.abonosTransferencia)}
                  </AppText>
                </View>
                <View style={ms.fila}>
                  <AppText style={ms.filaLabel}>Gastos</AppText>
                  <AppText style={ms.filaValorNeg}>
                    -{fmt(resumen.gastosTransferencia)}
                  </AppText>
                </View>
                <View style={[ms.fila, ms.totalFila]}>
                  <AppText style={ms.totalLabel}>Neto transferencia</AppText>
                  <AppText style={[ms.totalValor, { color: "#2563EB" }]}>
                    {fmt(resumen.saldoNetoTransferencia)}
                  </AppText>
                </View>
              </View>

              {/* Notas */}
              {resumen.caja.notas ? (
                <View style={ms.seccion}>
                  <AppText style={ms.seccionTitulo}>Notas</AppText>
                  <AppText style={ms.notas}>"{resumen.caja.notas}"</AppText>
                </View>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Pantalla principal ──────────────────────────────────────────────────────
export default function HistorialCajaScreen() {
  const { colors } = useTheme();

  const [cajas, setCajas] = React.useState<Caja[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);
  const [cajaSeleccionada, setCajaSeleccionada] = React.useState<string | null>(
    null,
  );

  const cargar = React.useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    try {
      const data = await cajaRepo.getHistorial();
      setCajas(data);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const grupos = React.useMemo(() => {
    const acc: { [fecha: string]: Caja[] } = {};
    cajas.forEach((c) => {
      if (!acc[c.fecha]) acc[c.fecha] = [];
      acc[c.fecha].push(c);
    });
    return acc;
  }, [cajas]);

  if (cargando) {
    return (
      <ScreenWrapper title="Historial de caja" showBtnB={false}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Historial de caja" showBtnB={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargar(true)}
            colors={[colors.primary]}
          />
        }
      >
        {Object.keys(grupos).length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <MaterialCommunityIcons
              name="cash-register"
              size={56}
              color="#9CA3AF"
            />
            <AppText style={{ color: "#6B7280", marginTop: 14, fontSize: 18 }}>
              Aún no hay registros de caja
            </AppText>
          </View>
        ) : (
          Object.entries(grupos).map(([fecha, cajasDelDia]) => (
            <View key={fecha} style={{ marginBottom: 20 }}>
              <AppText style={s.grupoTitulo}>{etiquetaFecha(fecha)}</AppText>

              {cajasDelDia.map((c) => {
                const abierta = c.estado === "abierta";
                const horaApertura = horaDe(c.creadoEn);
                const horaCierre = horaDe(c.cerradoEn);

                return (
                  <TouchableOpacity
                    key={c.id}
                    style={s.cajaCard}
                    onPress={() => setCajaSeleccionada(c.id)}
                    activeOpacity={0.75}
                  >
                    {/* Header */}
                    <View style={s.cajaCardHeader}>
                      <View style={s.horaRow}>
                        <View
                          style={[
                            s.iconCircle,
                            {
                              backgroundColor: abierta ? "#E6F7EF" : "#F3F4F6",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="cash-register"
                            size={18}
                            color={abierta ? "#2EAA6E" : "#6B7280"}
                          />
                        </View>
                        <AppText style={s.horaTxt}>
                          {horaApertura}
                          {horaCierre ? ` – ${horaCierre}` : ""}
                        </AppText>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View
                          style={[
                            s.badge,
                            {
                              backgroundColor: abierta ? "#E6F7EF" : "#F3F4F6",
                            },
                          ]}
                        >
                          <AppText
                            style={[
                              s.badgeTxt,
                              { color: abierta ? "#2EAA6E" : "#6B7280" },
                            ]}
                          >
                            {abierta ? "Abierta" : "Cerrada"}
                          </AppText>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={18}
                          color="#CBD5E1"
                        />
                      </View>
                    </View>

                    {/* Montos */}
                    <View style={s.montosRow}>
                      <View style={{ flex: 1 }}>
                        <AppText style={s.montoLabel}>Monto inicial</AppText>
                        <AppText style={s.montoValor}>
                          {fmt(c.montoApertura)}
                        </AppText>
                      </View>
                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <AppText style={s.montoLabel}>Monto final</AppText>
                        <AppText
                          style={[
                            s.montoValor,
                            abierta && { color: "#9CA3AF" },
                          ]}
                        >
                          {abierta ? "En curso" : fmt(c.montoCierre)}
                        </AppText>
                      </View>
                    </View>

                    {/* Hint */}
                    <View style={s.verResumenHint}>
                      <MaterialCommunityIcons
                        name="chart-bar"
                        size={13}
                        color="#94A3B8"
                      />
                      <AppText style={s.verResumenTxt}>
                        Ver resumen completo
                      </AppText>
                    </View>

                    {c.notas ? (
                      <AppText style={s.notas} numberOfLines={2}>
                        "{c.notas}"
                      </AppText>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <ResumenModal
        visible={!!cajaSeleccionada}
        cajaId={cajaSeleccionada}
        onClose={() => setCajaSeleccionada(null)}
      />
    </ScreenWrapper>
  );
}

// ── Estilos tarjeta ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  grupoTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 10,
    textTransform: "capitalize",
  },
  cajaCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
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
    gap: 12,
  },
  cajaCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  horaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  horaTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
  montosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  montoLabel: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 2,
  },
  montoValor: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  verResumenHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  verResumenTxt: {
    fontSize: 12,
    color: "#94A3B8",
  },
  notas: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
  },
});

// ── Estilos modal ────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerFecha: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 1,
    textTransform: "capitalize",
  },
  cerrarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: "center",
  },
  seccion: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filaLabel: {
    fontSize: 15,
    color: "#64748B",
  },
  filaValor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  filaValorPos: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2EAA6E",
  },
  filaValorNeg: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  totalFila: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  totalValor: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2EAA6E",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
  notas: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
    lineHeight: 20,
  },
});
