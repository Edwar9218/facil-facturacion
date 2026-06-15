// src/presentation/screens/venta-del-dia/components/CajaWidget.tsx

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CajaRepositoryImpl } from "../../../../data/repositories/CajaRepositoryImpl";
import { Caja, ResumenCaja } from "../../../../domain/entities/Caja";
import { useTheme } from "../../../../theme";

const cajaRepo = new CajaRepositoryImpl();

// Formateador estándar para textos normales
const fmt = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

// Formateador en tiempo real para los Inputs de texto (COP)
const formatMontoDisplay = (val: string) => {
  const clean = val.replace(/[^0-9]/g, "");
  if (!clean) return "";
  return (
    "$ " + Number(clean).toLocaleString("es-CO", { minimumFractionDigits: 0 })
  );
};

interface Props {
  onCajaActualizada: () => void;
  refreshTrigger?: number; // <-- NUEVA: Propiedad para recibir la señal de actualización
}

export function CajaWidget({ onCajaActualizada, refreshTrigger }: Props) {
  const { colors, spacing, radius, shadows, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const [caja, setCaja] = React.useState<Caja | null>(null);
  const [resumen, setResumen] = React.useState<ResumenCaja | null>(null);
  const [cargando, setCargando] = React.useState(true);

  // Modales
  const [modalApertura, setModalApertura] = React.useState(false);
  const [modalCierre, setModalCierre] = React.useState(false);
  const [modalAnterior, setModalAnterior] = React.useState(false);

  // Inputs
  const [montoApertura, setMontoApertura] = React.useState("");
  const [montoCierre, setMontoCierre] = React.useState("");
  const [notasCierre, setNotasCierre] = React.useState("");
  const [cajaAnteriorPendiente, setCajaAnteriorPendiente] =
    React.useState<Caja | null>(null);

  const fechaHoy = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });

  // ── Cargar ────────────────────────────────────────────────────────────────
  const cargar = React.useCallback(async () => {
    setCargando(true);
    try {
      // 1. Verificar si hay alguna caja de DÍAS ANTERIORES que se quedó abierta
      const abiertaActualmente = await cajaRepo.getCajaAbierta();
      if (abiertaActualmente && abiertaActualmente.fecha !== fechaHoy) {
        setCajaAnteriorPendiente(abiertaActualmente);
        setModalAnterior(true);
      }

      // 2. Carga normal del estado del día
      const [abierta, ultimaHoy, resumenHoy] = await Promise.all([
        cajaRepo.getCajaAbierta(),
        cajaRepo.getUltimaCajaDelDia(fechaHoy),
        cajaRepo.getResumen(fechaHoy),
      ]);
      setResumen(resumenHoy);
      setCaja(abierta ?? ultimaHoy);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la información de la caja.");
    } finally {
      setCargando(false);
    }
  }, [fechaHoy]);

  // MEJORA: Escucha activamente los cambios del refreshTrigger del padre
  React.useEffect(() => {
    cargar();
  }, [cargar, refreshTrigger]);

  // ── Abrir caja ────────────────────────────────────────────────────────────
  const abrirCaja = async () => {
    const monto = Number(montoApertura);
    if (monto < 0) return;
    setCargando(true);
    try {
      await cajaRepo.abrirCaja(monto);
      setModalApertura(false);
      setMontoApertura("");
      await cargar();
      onCajaActualizada();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo abrir la caja.");
    } finally {
      setCargando(false);
    }
  };

  // ── Cerrar caja ───────────────────────────────────────────────────────────
  const cerrarCaja = async () => {
    if (!caja) return;
    const monto = Number(montoCierre);
    if (monto < 0) return;
    setCargando(true);
    try {
      await cajaRepo.cerrarCaja({
        cajaId: caja.id,
        montoCierre: monto,
        notas: notasCierre.trim() || undefined,
      });
      setModalCierre(false);
      setMontoCierre("");
      setNotasCierre("");
      await cargar();
      onCajaActualizada();
    } catch {
      Alert.alert("Error", "No se pudo cerrar la caja.");
    } finally {
      setCargando(false);
    }
  };

  // ── Cerrar caja antigua de emergencia ─────────────────────────────────────
  const cerrarCajaAnteriorDeEmergencia = async () => {
    if (!cajaAnteriorPendiente) return;
    setCargando(true);
    try {
      const resumenViejo = await cajaRepo.getResumen(
        cajaAnteriorPendiente.fecha,
      );
      await cajaRepo.cerrarCaja({
        cajaId: cajaAnteriorPendiente.id,
        montoCierre: resumenViejo.saldoEsperadoEfectivo,
        notas: "Cierre automático por sistema (olvido de cierre)",
      });
      setModalAnterior(false);
      setCajaAnteriorPendiente(null);
      await cargar();
      onCajaActualizada();
      Alert.alert(
        "Éxito",
        "La caja del día anterior fue cerrada con el saldo esperado.",
      );
    } catch {
      Alert.alert("Error", "No se pudo cerrar la caja anterior.");
    } finally {
      setCargando(false);
    }
  };

  // ── Fila resumen ──────────────────────────────────────────────────────────
  const renderFilaResumen = (
    label: string,
    valor: number,
    tipo: "positivo" | "negativo" | "neutral",
  ) => {
    const color =
      tipo === "positivo"
        ? "#2EAA6E"
        : tipo === "negativo"
          ? "#E03E3E"
          : colors.ink;
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: typography.size.sm, color: colors.grayText }}>
          {label}
        </Text>
        <Text
          style={{
            fontSize: typography.size.md,
            fontWeight: typography.weight.semiBold,
            color,
          }}
        >
          {fmt(valor)}
        </Text>
      </View>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (cargando && !caja) {
    return (
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          padding: spacing.lg,
          alignItems: "center",
          ...shadows.card,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // ── Sin caja ──────────────────────────────────────────────────────────────
  const renderSinCaja = () => (
    <TouchableOpacity
      onPress={() => setModalApertura(true)}
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: colors.grayBorder,
        ...shadows.card,
      }}
      activeOpacity={0.75}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.grayLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name="cash-register"
          size={24}
          color={colors.grayText}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: typography.size.md,
            fontWeight: typography.weight.bold,
            color: colors.ink,
          }}
        >
          Caja no abierta
        </Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            color: colors.grayText,
            marginTop: 2,
          }}
        >
          Toca para abrir la caja del día
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={colors.grayText} />
    </TouchableOpacity>
  );

  // ── Caja abierta ──────────────────────────────────────────────────────────
  const renderCajaAbierta = () => (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#A7F3D0",
        ...shadows.card,
      }}
    >
      <View style={{ height: 5, backgroundColor: "#2EAA6E" }} />
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        {/* Header */}
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
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#E6F7EF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="cash-register"
                size={20}
                color="#2EAA6E"
              />
            </View>
            <View>
              <Text
                style={{
                  fontSize: typography.size.md,
                  fontWeight: typography.weight.bold,
                  color: colors.ink,
                }}
              >
                Caja abierta{" "}
                {caja?.fecha !== fechaHoy ? `(${caja?.fecha})` : ""}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: "#2EAA6E",
                  fontWeight: typography.weight.semiBold,
                }}
              >
                Apertura: {fmt(caja?.montoApertura ?? 0)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setModalCierre(true)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: 20,
              backgroundColor: "#FDEAEA",
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: "#E03E3E",
              }}
            >
              Cerrar caja
            </Text>
          </TouchableOpacity>
        </View>

        {resumen && (
          <>
            {/* Resumen efectivo */}
            <View
              style={{
                backgroundColor: "#F6F7FB",
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                  color: colors.grayText,
                  letterSpacing: 0.3,
                  marginBottom: 4,
                }}
              >
                EFECTIVO
              </Text>
              {renderFilaResumen(
                "Apertura",
                resumen.caja?.montoApertura ?? 0,
                "neutral",
              )}
              {renderFilaResumen(
                "+ Ventas",
                resumen.ventasEfectivo,
                "positivo",
              )}
              {renderFilaResumen(
                "+ Abonos",
                resumen.abonosEfectivo,
                "positivo",
              )}
              {renderFilaResumen(
                "- Gastos",
                resumen.gastosEfectivo,
                "negativo",
              )}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#E2E6EF",
                  marginVertical: 4,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: typography.size.md,
                    fontWeight: typography.weight.bold,
                    color: colors.ink,
                  }}
                >
                  Saldo esperado
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.xl,
                    fontWeight: typography.weight.black,
                    color: "#2EAA6E",
                  }}
                >
                  {fmt(resumen.saldoEsperadoEfectivo)}
                </Text>
              </View>
            </View>

            {/* Resumen transferencia */}
            <View
              style={{
                backgroundColor: "#F5F3FF",
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                  color: "#7C3AED",
                  letterSpacing: 0.3,
                  marginBottom: 4,
                }}
              >
                TRANSFERENCIA
              </Text>
              {renderFilaResumen(
                "+ Ventas",
                resumen.ventasTransferencia,
                "positivo",
              )}
              {renderFilaResumen(
                "+ Abonos",
                resumen.abonosTransferencia,
                "positivo",
              )}
              {renderFilaResumen(
                "- Gastos",
                resumen.gastosTransferencia,
                "negativo",
              )}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#DDD6FE",
                  marginVertical: 4,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: typography.size.md,
                    fontWeight: typography.weight.bold,
                    color: colors.ink,
                  }}
                >
                  Neto transferencia
                </Text>
                <Text
                  style={{
                    fontSize: typography.size.xl,
                    fontWeight: typography.weight.black,
                    color: "#7C3AED",
                  }}
                >
                  {fmt(resumen.saldoNetoTransferencia)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );

  // ── Caja cerrada ──────────────────────────────────────────────────────────
  const renderCajaCerrada = () => (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.grayBorder,
        ...shadows.card,
      }}
    >
      <View style={{ height: 5, backgroundColor: colors.grayText }} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <MaterialCommunityIcons
            name="cash-register"
            size={20}
            color={colors.grayText}
          />
          <Text
            style={{
              fontSize: typography.size.md,
              fontWeight: typography.weight.bold,
              color: colors.grayText,
            }}
          >
            Caja cerrada ({caja?.fecha})
          </Text>
        </View>

        {resumen?.diferencia !== undefined && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: resumen.diferencia >= 0 ? "#E6F7EF" : "#FDEAEA",
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: resumen.diferencia >= 0 ? "#2EAA6E" : "#E03E3E",
              }}
            >
              {resumen.diferencia >= 0 ? "Sobrante" : "Faltante"}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xl,
                fontWeight: typography.weight.black,
                color: resumen.diferencia >= 0 ? "#2EAA6E" : "#E03E3E",
              }}
            >
              {fmt(Math.abs(resumen.diferencia))}
            </Text>
          </View>
        )}

        {caja?.notas ? (
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.grayText,
              fontStyle: "italic",
            }}
          >
            "{caja.notas}"
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => setModalApertura(true)}
          disabled={cargando}
          style={{
            marginTop: spacing.xs,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: "#2EAA6E",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
          }}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="cash-register"
                size={18}
                color={colors.white}
              />
              <Text
                style={{
                  fontSize: typography.size.md,
                  fontWeight: typography.weight.bold,
                  color: colors.white,
                }}
              >
                Abrir nueva caja
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Contenido del bottom sheet Apertura ───────────────────────────────────
  const BottomSheetApertura = () => (
    <View
      style={{
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.lg,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          backgroundColor: colors.grayBorder,
          borderRadius: 2,
          alignSelf: "center",
          marginBottom: spacing.xs,
        }}
      />
      <Text
        style={{
          fontSize: typography.size.xl,
          fontWeight: typography.weight.black,
          color: colors.ink,
          textAlign: "center",
        }}
      >
        Abrir caja
      </Text>
      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.grayText,
          textAlign: "center",
        }}
      >
        ¿Con cuánto dinero abres la caja hoy?
      </Text>

      <TextInput
        style={{
          backgroundColor: colors.grayLight,
          borderRadius: radius.md,
          padding: spacing.md,
          fontSize: typography.size.xxl,
          fontWeight: typography.weight.black,
          color: colors.ink,
          textAlign: "center",
          borderWidth: 1,
          borderColor: colors.grayBorder,
          letterSpacing: -1,
        }}
        placeholder="$ 0"
        placeholderTextColor={colors.grayText}
        keyboardType="numeric"
        value={formatMontoDisplay(montoApertura)}
        onChangeText={(v) => setMontoApertura(v.replace(/[^0-9]/g, ""))}
        autoFocus
      />

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <TouchableOpacity
          onPress={() => {
            setModalApertura(false);
            setMontoApertura("");
          }}
          style={{
            flex: 1,
            padding: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colors.grayBorder,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: typography.size.md,
              fontWeight: typography.weight.bold,
              color: colors.grayText,
            }}
          >
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={abrirCaja}
          disabled={cargando || montoApertura === ""}
          style={{
            flex: 2,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor:
              montoApertura === "" ? colors.grayBorder : "#2EAA6E",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
          }}
        >
          {cargando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="cash-register"
                size={18}
                color={colors.white}
              />
              <Text
                style={{
                  fontSize: typography.size.md,
                  fontWeight: typography.weight.bold,
                  color: colors.white,
                }}
              >
                Abrir caja
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Contenido del bottom sheet Cierre ─────────────────────────────────────
  const BottomSheetCierre = () => {
    const saldoEsperado = resumen?.saldoEsperadoEfectivo ?? 0;
    const montoCierreNum = Number(montoCierre);
    const diferencia = montoCierreNum - saldoEsperado;

    return (
      <View
        style={{
          backgroundColor: colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: colors.grayBorder,
            borderRadius: 2,
            alignSelf: "center",
            marginBottom: spacing.xs,
          }}
        />
        <Text
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.black,
            color: colors.ink,
            textAlign: "center",
          }}
        >
          Cerrar caja
        </Text>

        {/* Saldo esperado */}
        <View
          style={{
            backgroundColor: "#E6F7EF",
            borderRadius: radius.md,
            padding: spacing.md,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              color: "#2EAA6E",
              fontWeight: typography.weight.semiBold,
            }}
          >
            Saldo esperado en caja
          </Text>
          <Text
            style={{
              fontSize: typography.size.xxl,
              fontWeight: typography.weight.black,
              color: "#2EAA6E",
            }}
          >
            {fmt(saldoEsperado)}
          </Text>
        </View>

        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.grayText,
            letterSpacing: 0.3,
          }}
        >
          ¿CUÁNTO HAY EN CAJA FÍSICAMENTE?
        </Text>

        <TextInput
          style={{
            backgroundColor: colors.grayLight,
            borderRadius: radius.md,
            padding: spacing.md,
            fontSize: typography.size.xxl,
            fontWeight: typography.weight.black,
            color: colors.ink,
            textAlign: "center",
            borderWidth: 1,
            borderColor: colors.grayBorder,
            letterSpacing: -1,
          }}
          placeholder="$ 0"
          placeholderTextColor={colors.grayText}
          keyboardType="numeric"
          value={formatMontoDisplay(montoCierre)}
          onChangeText={(v) => setMontoCierre(v.replace(/[^0-9]/g, ""))}
          autoFocus
        />

        {/* Diferencia en tiempo real */}
        {montoCierre !== "" && (
          <View
            style={{
              backgroundColor: diferencia >= 0 ? "#E6F7EF" : "#FDEAEA",
              borderRadius: radius.md,
              padding: spacing.md,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: typography.size.md,
                fontWeight: typography.weight.bold,
                color: diferencia >= 0 ? "#2EAA6E" : "#E03E3E",
              }}
            >
              {diferencia >= 0 ? "Sobrante" : "Faltante"}
            </Text>
            <Text
              style={{
                fontSize: typography.size.xl,
                fontWeight: typography.weight.black,
                color: diferencia >= 0 ? "#2EAA6E" : "#E03E3E",
              }}
            >
              {fmt(Math.abs(diferencia))}
            </Text>
          </View>
        )}

        {/* Notas opcionales */}
        <TextInput
          style={{
            backgroundColor: colors.grayLight,
            borderRadius: radius.md,
            padding: spacing.md,
            fontSize: typography.size.md,
            color: colors.ink,
            borderWidth: 1,
            borderColor: colors.grayBorder,
          }}
          placeholder="Notas (opcional)..."
          placeholderTextColor={colors.grayText}
          value={notasCierre}
          onChangeText={setNotasCierre}
          multiline
        />

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => {
              setModalCierre(false);
              setMontoCierre("");
              setNotasCierre("");
            }}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colors.grayBorder,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: typography.size.md,
                fontWeight: typography.weight.bold,
                color: colors.grayText,
              }}
            >
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={cerrarCaja}
            disabled={montoCierre === "" || cargando}
            style={{
              flex: 2,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor:
                montoCierre === "" ? colors.grayBorder : "#E03E3E",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: spacing.xs,
            }}
          >
            {cargando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialIcons name="lock" size={18} color={colors.white} />
                <Text
                  style={{
                    fontSize: typography.size.md,
                    fontWeight: typography.weight.bold,
                    color: colors.white,
                  }}
                >
                  Cerrar caja
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <>
      {!caja && renderSinCaja()}
      {caja?.estado === "abierta" && renderCajaAbierta()}
      {caja?.estado === "cerrada" && renderCajaCerrada()}

      {/* ── Modal apertura ── */}
      <Modal
        visible={modalApertura}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalApertura(false);
          setMontoApertura("");
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => {
              setModalApertura(false);
              setMontoApertura("");
            }}
          />
          {BottomSheetApertura()}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal cierre ── */}
      <Modal
        visible={modalCierre}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalCierre(false);
          setMontoCierre("");
          setNotasCierre("");
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            activeOpacity={1}
            onPress={() => {
              setModalCierre(false);
              setMontoCierre("");
              setNotasCierre("");
            }}
          />
          {BottomSheetCierre()}
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal Alerta Caja Anterior Abierta ── */}
      <Modal visible={modalAnterior} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.md,
              ...shadows.dialog,
            }}
          >
            <View style={{ alignItems: "center", gap: spacing.xs }}>
              <MaterialIcons name="warning" size={40} color="#F59E0B" />
              <Text
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.black,
                  color: colors.ink,
                  textAlign: "center",
                }}
              >
                Caja anterior detectada
              </Text>
            </View>

            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.grayText,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Hay una caja abierta con fecha del{" "}
              <Text style={{ fontWeight: "bold", color: colors.ink }}>
                {cajaAnteriorPendiente?.fecha}
              </Text>
              . Para operar hoy de manera correcta, debes cerrarla primero.
            </Text>

            <TouchableOpacity
              onPress={cerrarCajaAnteriorDeEmergencia}
              disabled={cargando}
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: "#E03E3E",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: spacing.xs,
              }}
            >
              {cargando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <MaterialIcons name="lock" size={18} color={colors.white} />
                  <Text
                    style={{
                      fontSize: typography.size.md,
                      fontWeight: typography.weight.bold,
                      color: colors.white,
                    }}
                  >
                    Cerrar caja anterior
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalAnterior(false)}
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: colors.grayBorder,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: typography.size.md,
                  fontWeight: typography.weight.bold,
                  color: colors.grayText,
                }}
              >
                Ignorar por ahora
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
