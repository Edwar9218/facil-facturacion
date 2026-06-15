// src/presentation/screens/historial-caja/HistorialCajaScreen.tsx

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { CajaRepositoryImpl } from "../../../data/repositories/CajaRepositoryImpl";
import { Caja } from "../../../domain/entities/Caja";
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

export default function HistorialCajaScreen() {
  const { colors } = useTheme();

  const [cajas, setCajas] = React.useState<Caja[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [refrescando, setRefrescando] = React.useState(false);

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

  // ── Agrupar por fecha (el repo ya entrega ordenado de más reciente a más
  // antigua, así que el orden de los grupos se mantiene) ───────────────────
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
                  <View key={c.id} style={s.cajaCard}>
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
                    </View>

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

                    {c.notas ? (
                      <AppText style={s.notas} numberOfLines={2}>
                        "{c.notas}"
                      </AppText>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

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
  notas: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
  },
});
