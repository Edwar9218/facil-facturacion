// src/presentation/screens/venta-del-dia/components/CajaWidget.tsx

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  borrarCajasDePrueba,
  crearCajaDePruebaAyer,
} from "../../../../data/dev/seedCajaPrueba";
import { CajaRepositoryImpl } from "../../../../data/repositories/CajaRepositoryImpl";
import { Caja, ResumenCaja } from "../../../../domain/entities/Caja";
import { AppText } from "../../../components/ui/AppText";

const cajaRepo = new CajaRepositoryImpl();

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

const formatMontoDisplay = (val: string) => {
  const clean = val.replace(/[^0-9]/g, "");
  if (!clean) return "";
  return (
    "$ " + Number(clean).toLocaleString("es-CO", { minimumFractionDigits: 0 })
  );
};

interface Props {
  onCajaActualizada: () => void;
  refreshTrigger?: number;
}

export function CajaWidget({ onCajaActualizada, refreshTrigger }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Altura real del teclado, para calcular cuánto espacio le queda al
  // contenido scrolleable del formulario de cierre (en vez de adivinar
  // con porcentajes que no se ajustan bien dentro de un contenedor sin
  // altura fija).
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    const eventoMostrar =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const eventoOcultar =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subMostrar = Keyboard.addListener(eventoMostrar, (e) =>
      setKeyboardHeight(e.endCoordinates?.height ?? 0),
    );
    const subOcultar = Keyboard.addListener(eventoOcultar, () =>
      setKeyboardHeight(0),
    );

    return () => {
      subMostrar.remove();
      subOcultar.remove();
    };
  }, []);

  const [caja, setCaja] = React.useState<Caja | null>(null);
  const [resumen, setResumen] = React.useState<ResumenCaja | null>(null);
  const [cargando, setCargando] = React.useState(true);

  const [modalApertura, setModalApertura] = React.useState(false);
  const [modalCierre, setModalCierre] = React.useState(false);
  const [modalAnterior, setModalAnterior] = React.useState(false);

  const [montoApertura, setMontoApertura] = React.useState("");
  const [montoCierre, setMontoCierre] = React.useState("");
  const [notasCierre, setNotasCierre] = React.useState("");
  const [cajaAnteriorPendiente, setCajaAnteriorPendiente] =
    React.useState<Caja | null>(null);

  // Caja y resumen sobre los que está operando el formulario de cierre.
  // Puede ser la caja de hoy o una caja pendiente de un día anterior.
  const [cajaParaCerrar, setCajaParaCerrar] = React.useState<Caja | null>(null);
  const [resumenParaCerrar, setResumenParaCerrar] =
    React.useState<ResumenCaja | null>(null);

  const fechaHoy = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });

  const cargar = React.useCallback(async () => {
    setCargando(true);
    try {
      const abiertaActualmente = await cajaRepo.getCajaAbierta();
      if (abiertaActualmente && abiertaActualmente.fecha !== fechaHoy) {
        setCajaAnteriorPendiente(abiertaActualmente);
        setModalAnterior(true);
      }

      const [abierta, ultimaHoy] = await Promise.all([
        cajaRepo.getCajaAbierta(),
        cajaRepo.getUltimaCajaDelDia(fechaHoy),
      ]);

      const cajaRelevante = abierta ?? ultimaHoy;
      const resumenHoy = cajaRelevante
        ? await cajaRepo.getResumen(cajaRelevante.id)
        : null;

      setResumen(resumenHoy);
      setCaja(cajaRelevante);
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la información de la caja.");
    } finally {
      setCargando(false);
    }
  }, [fechaHoy]);

  React.useEffect(() => {
    cargar();
  }, [cargar, refreshTrigger]);

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

  // ── Abrir el flujo real de cierre (hoy o un día anterior pendiente) ────────
  // Permite "cuadrar" la caja con el monto físico real, sin importar si
  // quedó abierta de un día anterior.
  const abrirModalCierre = async (cajaObjetivo: Caja) => {
    setCajaParaCerrar(cajaObjetivo);

    // Si es la caja que ya tenemos cargada (la relevante hoy), reusamos su resumen.
    if (caja && cajaObjetivo.id === caja.id && resumen) {
      setResumenParaCerrar(resumen);
      setModalAnterior(false);
      setModalCierre(true);
      return;
    }

    // Si es otra caja (p. ej. una pendiente de un día anterior), traemos su resumen.
    setCargando(true);
    try {
      const resumenObjetivo = await cajaRepo.getResumen(cajaObjetivo.id);
      setResumenParaCerrar(resumenObjetivo);
      setModalAnterior(false);
      setModalCierre(true);
    } catch {
      Alert.alert("Error", "No se pudo cargar el resumen de esa caja.");
    } finally {
      setCargando(false);
    }
  };

  // ── Cancelar el cierre en curso ─────────────────────────────────────────
  // Si lo que se estaba cerrando era la caja pendiente de un día anterior,
  // volvemos a mostrar la alerta para que no se pierda de vista.
  const cancelarCierre = () => {
    const eraAnterior =
      !!cajaAnteriorPendiente &&
      cajaParaCerrar?.id === cajaAnteriorPendiente.id;
    setModalCierre(false);
    setMontoCierre("");
    setNotasCierre("");
    setCajaParaCerrar(null);
    setResumenParaCerrar(null);
    if (eraAnterior) setModalAnterior(true);
  };

  const cerrarCaja = async () => {
    if (!cajaParaCerrar) return;
    const monto = Number(montoCierre);
    if (monto < 0) return;
    setCargando(true);
    try {
      await cajaRepo.cerrarCaja({
        cajaId: cajaParaCerrar.id,
        montoCierre: monto,
        notas: notasCierre.trim() || undefined,
      });
      const eraAnterior =
        !!cajaAnteriorPendiente &&
        cajaParaCerrar.id === cajaAnteriorPendiente.id;
      setModalCierre(false);
      setMontoCierre("");
      setNotasCierre("");
      setCajaParaCerrar(null);
      setResumenParaCerrar(null);
      if (eraAnterior) setCajaAnteriorPendiente(null);
      await cargar();
      onCajaActualizada();
    } catch {
      Alert.alert("Error", "No se pudo cerrar la caja.");
    } finally {
      setCargando(false);
    }
  };

  // ── Cerrar caja antigua de emergencia (sin cuadrar) ───────────────────────
  // Se deja disponible como salida rápida para cuando de verdad no se puede
  // cuadrar, pero ya NO es la única opción: el botón principal del aviso
  // ahora permite cuadrar con el flujo normal.
  const cerrarCajaAnteriorDeEmergencia = () => {
    if (!cajaAnteriorPendiente) return;
    Alert.alert(
      "¿Cerrar sin cuadrar?",
      "Esto cerrará la caja anterior usando el saldo esperado por el sistema, sin verificar el efectivo real. Úsalo solo si de verdad no puedes contar el dinero.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sin cuadrar",
          style: "destructive",
          onPress: ejecutarCierreAnteriorDeEmergencia,
        },
      ],
    );
  };

  const ejecutarCierreAnteriorDeEmergencia = async () => {
    if (!cajaAnteriorPendiente) return;
    setCargando(true);
    try {
      const resumenViejo = await cajaRepo.getResumen(cajaAnteriorPendiente.id);
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

  // ── Panel de pruebas (solo __DEV__) ───────────────────────────────────────
  // Permite simular una caja que se quedó abierta de ayer, sin esperar un
  // día real, para probar el flujo de "cuadrar y cerrar caja anterior".
  const handleCrearCajaPrueba = async () => {
    const resultado = crearCajaDePruebaAyer();
    Alert.alert(resultado.ok ? "Listo" : "No se pudo crear", resultado.mensaje);
    if (resultado.ok) {
      await cargar();
      onCajaActualizada();
    }
  };

  const handleBorrarCajasPrueba = async () => {
    const borradas = borrarCajasDePrueba();
    Alert.alert("Limpieza", `Se borraron ${borradas} caja(s) de prueba.`);
    await cargar();
    onCajaActualizada();
  };

  const renderFilaMovimiento = (
    label: string,
    valor: number,
    tipo: "positivo" | "negativo" | "neutral" | "positivoMorado",
    iconName: keyof typeof MaterialCommunityIcons.glyphMap,
  ) => {
    let iconColor = "#6B7280"; // Ícono gris sutil
    let labelPrefix = "";
    let montoColor = "#334155"; // Color neutro por defecto

    if (tipo === "positivo") {
      labelPrefix = "+ ";
      montoColor = "#16A34A"; // Monto en verde
    } else if (tipo === "positivoMorado") {
      labelPrefix = "+ ";
      montoColor = "#7C3AED"; // Monto en morado
    } else if (tipo === "negativo") {
      labelPrefix = "- ";
      montoColor = "#DC2626"; // Monto en rojo
    }

    return (
      <View style={s.filaMovimiento}>
        <View style={s.filaLeft}>
          <MaterialCommunityIcons
            name={iconName}
            size={20}
            color={iconColor}
            style={s.filaIcon}
          />
          <AppText style={s.filaLabel}>
            {labelPrefix}
            {label}
          </AppText>
        </View>
        <AppText style={[s.filaMonto, { color: montoColor }]}>
          {fmt(valor)}
        </AppText>
      </View>
    );
  };

  if (cargando && !caja) {
    return (
      <View
        style={[
          s.mainCard,
          { alignItems: "center", justifyContent: "center", height: 120 },
        ]}
      >
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  const renderSinCaja = () => (
    <TouchableOpacity
      onPress={() => setModalApertura(true)}
      style={[s.mainCard, s.cardSinCaja]}
      activeOpacity={0.75}
    >
      <View style={s.iconWrapperGr}>
        <MaterialCommunityIcons
          name="cash-register"
          size={24}
          color="#6B7280"
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={s.titulo}>Caja no abierta</AppText>
        <AppText style={s.subtitulo}>Toca para abrir la caja del día</AppText>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderCajaAbierta = () => (
    <View style={s.mainCard}>
      <View style={s.headerRow}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flex: 1,
            minWidth: 0,
          }}
        >
          <View style={s.iconWrapperAbierta}>
            <MaterialCommunityIcons
              name="cash-register"
              size={22}
              color="#16A34A"
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText style={s.titulo}>
              Caja abierta {caja?.fecha !== fechaHoy ? `(${caja?.fecha})` : ""}
            </AppText>
            <AppText style={s.subtituloApertura}>
              Apertura: {fmt(caja?.montoApertura ?? 0)}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => caja && abrirModalCierre(caja)}
          style={[s.btnCerrarMini, { flexShrink: 0 }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock" size={14} color="#DC2626" />
          <AppText style={s.btnCerrarMiniTxt}>Cerrar</AppText>
        </TouchableOpacity>
      </View>

      {resumen && (
        <View style={{ marginTop: 24, gap: 24 }}>
          {/* Bloque de Efectivo sin tarjeta interna */}
          <View>
            <AppText style={s.bloqueTituloVerde}>EFECTIVO</AppText>
            {renderFilaMovimiento(
              "Apertura",
              resumen.caja?.montoApertura ?? 0,
              "neutral",
              "lock-open-outline",
            )}
            {renderFilaMovimiento(
              "Ventas",
              resumen.ventasEfectivo,
              "positivo",
              "cart-outline",
            )}
            {renderFilaMovimiento(
              "Abonos",
              resumen.abonosEfectivo,
              "positivo",
              "hand-coin-outline",
            )}
            {renderFilaMovimiento(
              "Gastos",
              resumen.gastosEfectivo,
              "negativo",
              "receipt-text-outline",
            )}

            <View style={s.divider} />

            <View style={s.filaTotalWrapper}>
              <AppText style={s.totalLabel}>Total efectivo</AppText>
              <AppText style={s.totalMontoVerde}>
                {fmt(resumen.saldoEsperadoEfectivo)}
              </AppText>
            </View>
          </View>

          {/* Bloque de Transferencia sin tarjeta interna */}
          <View>
            <AppText style={s.bloqueTituloMorado}>TRANSFERENCIA</AppText>
            {renderFilaMovimiento(
              "Ventas",
              resumen.ventasTransferencia,
              "positivoMorado",
              "cart-outline",
            )}
            {renderFilaMovimiento(
              "Abonos",
              resumen.abonosTransferencia,
              "positivoMorado",
              "hand-coin-outline",
            )}
            {renderFilaMovimiento(
              "Gastos",
              resumen.gastosTransferencia,
              "negativo",
              "receipt-text-outline",
            )}

            <View style={s.divider} />

            <View style={s.filaTotalWrapper}>
              <AppText style={s.totalLabel}>Neto transferencia</AppText>
              <AppText style={s.totalMontoMorado}>
                {fmt(resumen.saldoNetoTransferencia)}
              </AppText>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderCajaCerrada = () => (
    <View style={s.mainCard}>
      <View style={s.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={s.iconWrapperCerrada}>
            <MaterialCommunityIcons
              name="cash-register"
              size={22}
              color="#4B5563"
            />
          </View>
          <View>
            <AppText style={s.titulo}>Caja cerrada</AppText>
            <AppText style={s.subtitulo}>{caja?.fecha}</AppText>
          </View>
        </View>
        <View style={s.badgeCerrada}>
          <AppText style={s.badgeCerradaTxt}>CERRADA</AppText>
        </View>
      </View>

      {resumen?.diferencia !== undefined && (
        <View
          style={[
            s.bloqueDiferencia,
            resumen.diferencia >= 0 ? s.bgSobrante : s.bgFaltante,
          ]}
        >
          <AppText
            style={[
              s.totalLabel,
              { color: resumen.diferencia >= 0 ? "#166534" : "#991B1B" },
            ]}
          >
            {resumen.diferencia >= 0 ? "Sobrante en caja" : "Faltante en caja"}
          </AppText>
          <AppText
            style={[
              s.totalMonto,
              { color: resumen.diferencia >= 0 ? "#16A34A" : "#DC2626" },
            ]}
          >
            {fmt(Math.abs(resumen.diferencia))}
          </AppText>
        </View>
      )}

      {caja?.notas ? (
        <AppText style={s.notasTxt}>"{caja.notas}"</AppText>
      ) : null}

      <TouchableOpacity
        onPress={() => setModalApertura(true)}
        disabled={cargando}
        style={s.btnPrimario}
        activeOpacity={0.8}
      >
        {cargando ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="cash-register"
              size={20}
              color="#FFF"
            />
            <AppText style={s.btnPrimarioTxt}>Abrir nueva caja</AppText>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const BottomSheetApertura = () => (
    <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
      <View style={s.handle} />
      <AppText style={s.sheetTitulo}>Abrir caja</AppText>
      <AppText style={s.sheetSubtitulo}>
        ¿Con cuánto dinero abres la caja hoy?
      </AppText>

      <TextInput
        style={s.inputGigante}
        placeholder="$ 0"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        value={formatMontoDisplay(montoApertura)}
        onChangeText={(v) => setMontoApertura(v.replace(/[^0-9]/g, ""))}
        autoFocus
      />

      <View style={s.btnRow}>
        <TouchableOpacity
          onPress={() => {
            setModalApertura(false);
            setMontoApertura("");
          }}
          style={s.btnSecundario}
          activeOpacity={0.8}
        >
          <AppText style={s.btnSecundarioTxt}>Cancelar</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={abrirCaja}
          disabled={cargando || montoApertura === ""}
          style={[
            s.btnPrimarioAccion,
            montoApertura === "" && { opacity: 0.5 },
          ]}
          activeOpacity={0.8}
        >
          {cargando ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="cash-register"
                size={20}
                color="#FFF"
              />
              <AppText style={s.btnPrimarioTxt}>Abrir caja</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const BottomSheetCierre = () => {
    const saldoEsperado = resumenParaCerrar?.saldoEsperadoEfectivo ?? 0;
    const montoCierreNum = Number(montoCierre);
    const diferencia = montoCierreNum - saldoEsperado;
    const esCajaAnterior =
      !!cajaParaCerrar && cajaParaCerrar.fecha !== fechaHoy;

    // Espacio reservado para el handle, los botones de abajo y los paddings
    // del sheet (no son parte del scroll, así que se restan aparte).
    const espacioReservado = 150 + insets.bottom;
    const alturaMaximaScroll = Math.max(
      180,
      windowHeight - keyboardHeight - insets.top - espacioReservado,
    );

    return (
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: alturaMaximaScroll }}
          contentContainerStyle={{ gap: 16 }}
        >
          <AppText style={s.sheetTitulo}>
            {esCajaAnterior
              ? `Cerrar caja del ${cajaParaCerrar?.fecha}`
              : "Cerrar caja"}
          </AppText>
          {esCajaAnterior && (
            <AppText style={s.avisoCajaAnterior}>
              Esta caja quedó abierta de un día anterior. Cuéntala con calma y
              registra lo que de verdad había.
            </AppText>
          )}

          <View style={s.bloqueEsperado}>
            <AppText style={s.esperadoLabel}>Saldo esperado en caja</AppText>
            <AppText style={s.esperadoMonto}>{fmt(saldoEsperado)}</AppText>
          </View>

          <AppText style={s.preguntaTxt}>
            ¿CUÁNTO HAY EN CAJA FÍSICAMENTE?
          </AppText>

          <TextInput
            style={s.inputGigante}
            placeholder="$ 0"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formatMontoDisplay(montoCierre)}
            onChangeText={(v) => setMontoCierre(v.replace(/[^0-9]/g, ""))}
            autoFocus
          />

          {montoCierre !== "" && (
            <View
              style={[
                s.bloqueDiferenciaReal,
                diferencia >= 0 ? s.bgSobrante : s.bgFaltante,
              ]}
            >
              <AppText
                style={[
                  s.totalLabel,
                  { color: diferencia >= 0 ? "#16A34A" : "#DC2626" },
                ]}
              >
                {diferencia >= 0 ? "Sobrante" : "Faltante"}
              </AppText>
              <AppText
                style={[
                  s.totalMonto,
                  { color: diferencia >= 0 ? "#16A34A" : "#DC2626" },
                ]}
              >
                {fmt(Math.abs(diferencia))}
              </AppText>
            </View>
          )}

          <TextInput
            style={s.inputNotas}
            placeholder="Notas (opcional)..."
            placeholderTextColor="#9CA3AF"
            value={notasCierre}
            onChangeText={setNotasCierre}
            multiline
          />
        </ScrollView>

        <View style={[s.btnRow, { marginTop: 12 }]}>
          <TouchableOpacity
            onPress={cancelarCierre}
            style={s.btnSecundario}
            activeOpacity={0.8}
          >
            <AppText style={s.btnSecundarioTxt}>Cancelar</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={cerrarCaja}
            disabled={montoCierre === "" || cargando}
            style={[
              s.btnPeligro,
              (montoCierre === "" || cargando) && { opacity: 0.5 },
            ]}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialIcons name="lock" size={20} color="#FFF" />
                <AppText style={s.btnPrimarioTxt}>Cerrar caja</AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      {!caja && renderSinCaja()}
      {caja?.estado === "abierta" && renderCajaAbierta()}
      {caja?.estado === "cerrada" && renderCajaCerrada()}

      {/* ── Panel de pruebas (solo __DEV__, no se ve en producción) ──
      {__DEV__ && (
        <View
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 14,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "#F59E0B",
            gap: 8,
          }}
        >
          <AppText
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: "#F59E0B",
              textAlign: "center",
            }}
          >
            🧪 PANEL DE PRUEBAS
          </AppText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleCrearCajaPrueba}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#FEF3C7",
                alignItems: "center",
              }}
            >
              <AppText
                style={{ fontSize: 12, fontWeight: "800", color: "#92400E" }}
              >
                Crear caja de ayer
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBorrarCajasPrueba}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#FEE2E2",
                alignItems: "center",
              }}
            >
              <AppText
                style={{ fontSize: 12, fontWeight: "800", color: "#991B1B" }}
              >
                Borrar cajas de prueba
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      )} */}

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
            style={s.overlay}
            activeOpacity={1}
            onPress={() => {
              setModalApertura(false);
              setMontoApertura("");
            }}
          />
          {BottomSheetApertura()}
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={modalCierre}
        transparent
        animationType="slide"
        onRequestClose={cancelarCierre}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={s.overlay}
            activeOpacity={1}
            onPress={cancelarCierre}
          />
          {BottomSheetCierre()}
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={modalAnterior} transparent animationType="fade">
        <View style={[s.overlay, { justifyContent: "center", padding: 24 }]}>
          <View style={s.dialog}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <MaterialIcons name="warning" size={44} color="#D97706" />
              <AppText style={s.dialogTitulo}>Caja anterior detectada</AppText>
            </View>

            <AppText style={s.dialogSubtitulo}>
              Hay una caja abierta con fecha del{" "}
              <AppText style={{ fontWeight: "bold", color: "#111827" }}>
                {cajaAnteriorPendiente?.fecha}
              </AppText>
              . Puedes cuadrarla y cerrarla ahora mismo, sin perder el registro
              de ese día.
            </AppText>

            <TouchableOpacity
              onPress={() =>
                cajaAnteriorPendiente && abrirModalCierre(cajaAnteriorPendiente)
              }
              disabled={cargando}
              style={[s.btnPeligro, { flex: 0 }]}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="lock" size={20} color="#FFF" />
                  <AppText style={s.btnPrimarioTxt}>
                    Cuadrar y cerrar caja anterior
                  </AppText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cerrarCajaAnteriorDeEmergencia}
              disabled={cargando}
              style={{ alignItems: "center", paddingVertical: 6 }}
              activeOpacity={0.7}
            >
              <AppText
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#6B7280",
                  textDecorationLine: "underline",
                }}
              >
                No puedo contar el efectivo, cerrar sin cuadrar
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalAnterior(false)}
              style={[s.btnSecundario, { flex: 0 }]}
              activeOpacity={0.8}
            >
              <AppText style={s.btnSecundarioTxt}>Ignorar por ahora</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20, // Aumenté un poquito el padding para que respire mejor
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSinCaja: {
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    borderWidth: 1.5,
    gap: 16,
  },

  titulo: { fontSize: 18, fontWeight: "800", color: "#111827" },
  subtitulo: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  subtituloApertura: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
    marginTop: 2,
  },

  iconWrapperGr: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperAbierta: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperCerrada: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8, // Separación con los bloques de abajo
  },

  btnCerrarMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  btnCerrarMiniTxt: { fontSize: 13, fontWeight: "700", color: "#DC2626" },
  badgeCerrada: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeCerradaTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4B5563",
    letterSpacing: 0.5,
  },

  bloqueTituloVerde: {
    fontSize: 13,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  bloqueTituloMorado: {
    fontSize: 13,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.6,
    marginBottom: 6,
  },

  filaMovimiento: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  filaLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  filaIcon: {
    marginRight: 10,
  },
  filaLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
  filaMonto: {
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 6,
  },

  filaTotalWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalMontoVerde: { fontSize: 20, fontWeight: "900", color: "#16A34A" },
  totalMontoMorado: { fontSize: 20, fontWeight: "900", color: "#7C3AED" },
  totalMonto: { fontSize: 20, fontWeight: "900" },

  bloqueDiferencia: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  bloqueDiferenciaReal: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bgSobrante: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  bgFaltante: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  notasTxt: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 12,
    paddingHorizontal: 4,
  },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    marginTop: "auto",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  sheetSubtitulo: { fontSize: 15, color: "#6B7280", textAlign: "center" },
  avisoCajaAnterior: {
    fontSize: 14,
    color: "#D97706",
    textAlign: "center",
    fontWeight: "600",
  },

  inputGigante: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  inputNotas: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    minHeight: 80,
    textAlignVertical: "top",
  },

  bloqueEsperado: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  esperadoLabel: { fontSize: 14, color: "#16A34A", fontWeight: "600" },
  esperadoMonto: {
    fontSize: 28,
    fontWeight: "900",
    color: "#16A34A",
    marginTop: 4,
  },
  preguntaTxt: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 8,
  },

  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  btnPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  btnPrimarioAccion: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnPeligro: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnSecundario: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimarioTxt: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  btnSecundarioTxt: { fontSize: 16, fontWeight: "700", color: "#4B5563" },

  dialog: { backgroundColor: "#FFF", borderRadius: 24, padding: 24, gap: 16 },
  dialogTitulo: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  dialogSubtitulo: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
  },
});
