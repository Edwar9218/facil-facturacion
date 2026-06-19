// src/presentation/screens/gastos/GastosScreen.tsx

import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIAS_SUGERIDAS, Gasto } from "../../../domain/entities/Gasto";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import { Campo, FormularioModal } from "../../components/ui/FormularioModal";
import { GastoCard } from "./components/GastoCard";
import { TipoEstadoFiltro, TipoPeriodo, useGastos } from "./hooks/useGastos";

const fmt = (n: number) =>
  n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

// ── Helpers de fecha ─────────────────────────────────────────────────────────
const fechaHoy = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

const formatearFecha = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").substring(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const fechaValida = (f: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(f) && !isNaN(new Date(f).getTime());

// ── MODAL RANGO DE FECHAS ────────────────────────────────────────────────────
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
        style={gs.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <KeyboardAwareScrollView
        style={{ marginTop: "auto" }}
        contentContainerStyle={[
          gs.sheet,
          { paddingBottom: insets.bottom + 24 },
        ]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={gs.handle} />
        <View style={gs.sheetHeader}>
          <View style={{ flex: 1 }}>
            <AppText style={gs.sheetTitulo}>Rango de fechas</AppText>
            <AppText style={gs.sheetSubtitulo}>Formato: AAAA-MM-DD</AppText>
          </View>
          <TouchableOpacity style={gs.btnClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          <View style={{ gap: 8 }}>
            <AppText style={gs.inputLabel}>📅 Fecha inicial</AppText>
            <View
              style={[gs.inputRow, errorInicio ? gs.inputError : undefined]}
            >
              <TextInput
                style={gs.input}
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
              <AppText style={gs.errorTxt}>{errorInicio}</AppText>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <AppText style={gs.inputLabel}>📅 Fecha final</AppText>
            <View style={[gs.inputRow, errorFin ? gs.inputError : undefined]}>
              <TextInput
                style={gs.input}
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
            {!!errorFin && <AppText style={gs.errorTxt}>{errorFin}</AppText>}
          </View>

          <TouchableOpacity
            style={[
              gs.btnPrimario,
              { marginTop: 8 },
              (!fechaValida(fInicio) || !fechaValida(fFin)) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleBuscar}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="magnify" size={22} color="#FFF" />
            <AppText style={gs.btnPrimarioTxt}>Buscar gastos</AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
};

// ── MODAL ANULAR GASTO ───────────────────────────────────────────────────────
const ModalAnularGasto = ({
  gasto,
  visible,
  onClose,
  onConfirmar,
  anulando,
}: {
  gasto: Gasto | null;
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

  if (!gasto) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={gs.overlay}>
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
          <View style={[gs.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={gs.handle} />
            <View style={[gs.sheetHeader, { borderBottomColor: "#FEE2E2" }]}>
              <View style={{ flex: 1 }}>
                <AppText style={[gs.sheetTitulo, { color: RED }]}>
                  Anular gasto
                </AppText>
                <AppText style={gs.sheetSubtitulo}>{gasto.descripcion}</AppText>
              </View>
              <TouchableOpacity
                style={[gs.btnClose, { backgroundColor: "#FCA5A5" }]}
                onPress={onClose}
              >
                <MaterialCommunityIcons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, gap: 20 }}>
              {/* Resumen del gasto */}
              <View style={gs.resumenAnulacion}>
                <View style={gs.resumenFila}>
                  <AppText style={gs.resumenLabel}>Descripción</AppText>
                  <AppText style={gs.resumenValor}>{gasto.descripcion}</AppText>
                </View>
                <View style={gs.resumenFila}>
                  <AppText style={gs.resumenLabel}>Monto</AppText>
                  <AppText
                    style={[gs.resumenValor, { color: RED, fontWeight: "800" }]}
                  >
                    {fmt(gasto.monto)}
                  </AppText>
                </View>
                <View style={gs.resumenFila}>
                  <AppText style={gs.resumenLabel}>Categoría</AppText>
                  <AppText style={gs.resumenValor}>{gasto.categoria}</AppText>
                </View>
                <View style={gs.resumenFila}>
                  <AppText style={gs.resumenLabel}>Método</AppText>
                  <AppText style={gs.resumenValor}>
                    {gasto.metodoPago === "efectivo"
                      ? "Efectivo"
                      : "Transferencia"}
                  </AppText>
                </View>
              </View>

              {/* Aviso */}
              <View style={gs.avisoAnulacion}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color="#92400E"
                />
                <AppText style={gs.avisoTxt}>
                  Al anular el gasto quedará excluido de los totales del
                  periodo. Esta acción no se puede deshacer.
                </AppText>
              </View>

              {/* Motivo */}
              <View style={{ gap: 8 }}>
                <AppText style={gs.inputLabel}>Motivo de anulación</AppText>
                <View
                  style={[
                    gs.inputAreaWrap,
                    errorMotivo
                      ? {
                          borderColor: "#EF4444",
                          backgroundColor: "#FFF5F5",
                        }
                      : undefined,
                  ]}
                >
                  <TextInput
                    style={gs.inputArea}
                    value={motivo}
                    onChangeText={(t) => {
                      setMotivo(t);
                      setErrorMotivo("");
                    }}
                    placeholder="Ej: Gasto duplicado, error en el monto..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
                {!!errorMotivo && (
                  <AppText style={gs.errorTxt}>{errorMotivo}</AppText>
                )}
                <AppText
                  style={{
                    fontSize: 13,
                    color: "#9CA3AF",
                    textAlign: "right",
                  }}
                >
                  {motivo.length}/200
                </AppText>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[gs.btnSecundario, { flex: 1 }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                  disabled={anulando}
                >
                  <AppText style={gs.btnSecundarioTxt}>Cancelar</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    gs.btnDanger,
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
                      <AppText style={gs.btnDangerTxt}>Anular</AppText>
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

// ── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function GastosScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows, typography } = useTheme();

  const {
    gastos,
    cargando,
    modalAbierto,
    form,
    categoriaLibre,
    totalEfectivo,
    totalTransferencia,
    filtrosVisibles,
    setFiltrosVisibles,
    filtroPeriodo,
    setFiltroPeriodo,
    filtroEstado,
    setFiltroEstado,
    rangoPersonalizado,
    setRangoPersonalizado,
    modalFechaVisible,
    setModalFechaVisible,
    rangoActivo,
    gastoAAnular,
    modalAnularVisible,
    anulando,
    solicitarAnular,
    confirmarAnulacion,
    cancelarAnulacion,
    setCampo,
    seleccionarCategoria,
    abrirModal,
    cerrarModal,
    registrarGasto,
  } = useGastos();

  // ── Etiqueta del periodo activo ──────────────────────────────────────────
  const etiquetaPeriodo = () => {
    if (filtroPeriodo === "hoy") return "Hoy";
    if (filtroPeriodo === "semana") return "Últimos 7 días";
    if (filtroPeriodo === "mes") return "Este mes";
    if (filtroPeriodo === "personalizado" && rangoActivo) {
      return `${rangoActivo.inicio}  →  ${rangoActivo.fin}`;
    }
    return "";
  };

  // ── Resumen superior ──────────────────────────────────────────────────────
  const renderResumen = () => (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: "#A7F3D0",
          ...shadows.card,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <MaterialCommunityIcons name="cash" size={16} color="#2EAA6E" />
          <AppText
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: "#2EAA6E",
            }}
          >
            Efectivo
          </AppText>
        </View>
        <AppText
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.black,
            color: "#E03E3E",
          }}
        >
          -{fmt(totalEfectivo)}
        </AppText>
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: "#DDD6FE",
          ...shadows.card,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <MaterialCommunityIcons
            name="bank-transfer"
            size={16}
            color="#7C3AED"
          />
          <AppText
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: "#7C3AED",
            }}
          >
            Transferencia
          </AppText>
        </View>
        <AppText
          style={{
            fontSize: typography.size.xl,
            fontWeight: typography.weight.black,
            color: "#E03E3E",
          }}
        >
          -{fmt(totalTransferencia)}
        </AppText>
      </View>
    </View>
  );

  // ── Panel de filtros ──────────────────────────────────────────────────────
  const renderFiltros = () => (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.grayBorder,
        marginBottom: spacing.md,
        overflow: "hidden",
        ...shadows.card,
      }}
    >
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: spacing.md,
        }}
        onPress={() => setFiltrosVisibles(!filtrosVisibles)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={22}
            color={colors.primary}
          />
          <AppText
            style={{
              fontSize: typography.size.md,
              fontWeight: typography.weight.bold,
              color: colors.ink,
            }}
          >
            Filtros de Búsqueda
          </AppText>
        </View>
        <MaterialCommunityIcons
          name={filtrosVisibles ? "chevron-up" : "chevron-down"}
          size={24}
          color="#4B5563"
        />
      </TouchableOpacity>

      {filtrosVisibles && (
        <View style={{ padding: spacing.md, paddingTop: 0, gap: spacing.md }}>
          {/* Periodo de tiempo */}
          <View>
            <AppText
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: spacing.sm,
              }}
            >
              Periodo de tiempo
            </AppText>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
            >
              {(["hoy", "semana", "mes", "personalizado"] as TipoPeriodo[]).map(
                (p) => {
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
                      style={{
                        flex: 1,
                        minWidth: "45%",
                        paddingVertical: 10,
                        paddingHorizontal: spacing.sm,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: activo
                          ? colors.primary
                          : colors.grayBorder,
                        backgroundColor: activo ? colors.primary : colors.white,
                        alignItems: "center",
                      }}
                      onPress={() => {
                        setFiltroPeriodo(p);
                        if (p === "personalizado") setModalFechaVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <AppText
                        style={{
                          fontSize: typography.size.sm,
                          fontWeight: activo
                            ? typography.weight.bold
                            : typography.weight.medium,
                          color: activo ? "#FFF" : colors.ink,
                        }}
                      >
                        {etiquetas[p]}
                      </AppText>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
          </View>

          {/* Estado */}
          <View>
            <AppText
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: spacing.sm,
              }}
            >
              Estado
            </AppText>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {(
                [
                  ["activo", "Activos"],
                  ["anulado", "Anulados"],
                  ["todos", "Todos"],
                ] as [TipoEstadoFiltro, string][]
              ).map(([estado, label]) => {
                const activo = filtroEstado === estado;
                return (
                  <TouchableOpacity
                    key={estado}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: activo ? colors.primary : colors.grayBorder,
                      backgroundColor: activo ? colors.primary : colors.white,
                      alignItems: "center",
                    }}
                    onPress={() => setFiltroEstado(estado)}
                    activeOpacity={0.8}
                  >
                    <AppText
                      style={{
                        fontSize: typography.size.sm,
                        fontWeight: activo
                          ? typography.weight.bold
                          : typography.weight.medium,
                        color: activo ? "#FFF" : colors.ink,
                      }}
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // ── Formulario nuevo gasto ────────────────────────────────────────────────
  const modalConfig = {
    visible: modalAbierto,
    abrir: abrirModal,
    cerrar: cerrarModal,
  };

  const camposFormulario: Campo[] = [
    {
      id: "descripcion",
      label: "Descripción",
      placeholder: "Ej: Gasolina, Almuerzo...",
      tipo: "texto",
      obligatorio: true,
    },
    {
      id: "monto",
      label: "Monto",
      placeholder: "0",
      tipo: "precio",
      obligatorio: true,
    },
    {
      id: "categoria",
      label: "Categoría",
      tipo: "selector",
      opciones: [...CATEGORIAS_SUGERIDAS, "Otro"],
      obligatorio: true,
    },
    ...(categoriaLibre
      ? [
          {
            id: "categoriaPersonalizada",
            label: "Nombre de la categoría",
            placeholder: "Escribe la categoría...",
            tipo: "texto" as const,
            obligatorio: true,
          },
        ]
      : []),
    {
      id: "metodoPago",
      label: "Método de Pago",
      tipo: "selector",
      opciones: ["efectivo", "transferencia"],
      obligatorio: true,
    },
    {
      id: "foto",
      label: "Foto del comprobante",
      tipo: "foto",
      obligatorio: false,
    },
  ];

  const valoresFormulario = {
    descripcion: form.descripcion,
    monto:
      form.monto && Number(form.monto) > 0
        ? form.monto.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        : "",
    categoria: categoriaLibre ? "Otro" : form.categoria,
    categoriaPersonalizada: form.categoriaPersonalizada,
    metodoPago: form.metodoPago,
    foto: form.foto,
  };

  const handleOnChange = (id: string, valor: string) => {
    if (id === "monto") {
      setCampo("monto", valor.replace(/[^0-9]/g, ""));
    } else if (id === "categoria") {
      seleccionarCategoria(valor);
    } else {
      setCampo(id as any, valor);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // El FAB va FUERA del ScreenWrapper para que no quede dentro del ScrollView
  // interno y siempre permanezca flotando sobre la pantalla.
  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper title="Gastos" showBtnB={false}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Periodo activo */}
          <AppText
            style={{
              fontSize: typography.size.sm,
              color: colors.grayText,
              marginBottom: spacing.md,
              textTransform: "capitalize",
            }}
          >
            {etiquetaPeriodo()}
          </AppText>

          {renderResumen()}
          {renderFiltros()}

          {/* Lista de gastos */}
          {cargando && gastos.length === 0 ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : gastos.length === 0 ? (
            <View
              style={{ alignItems: "center", paddingVertical: 48, gap: 10 }}
            >
              <AppText style={{ fontSize: 40 }}>💸</AppText>
              <AppText
                style={{
                  fontSize: typography.size.lg,
                  fontWeight: typography.weight.bold,
                  color: colors.ink,
                }}
              >
                Sin gastos
              </AppText>
              <AppText
                style={{
                  fontSize: typography.size.md,
                  color: colors.grayText,
                  textAlign: "center",
                }}
              >
                No hay gastos en el periodo seleccionado
              </AppText>
            </View>
          ) : (
            gastos.map((g) => (
              <GastoCard key={g.id} gasto={g} onAnular={solicitarAnular} />
            ))
          )}
        </ScrollView>
      </ScreenWrapper>

      {/* ── FAB flotante — fuera del ScreenWrapper para no desplazarse con el scroll ── */}
      <TouchableOpacity
        onPress={abrirModal}
        style={{
          position: "absolute",
          bottom: insets.bottom + spacing.lg,
          right: spacing.lg,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#E03E3E",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#E03E3E",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal formulario nuevo gasto */}
      <FormularioModal
        modal={modalConfig}
        titulo="Nuevo gasto"
        subtitulo="Registra los detalles del gasto actual"
        campos={camposFormulario}
        valores={valoresFormulario}
        onChange={handleOnChange}
        onGuardar={registrarGasto}
        labelGuardar="Registrar gasto"
      />

      {/* Modal rango de fechas */}
      <ModalElegirFecha
        visible={modalFechaVisible}
        onClose={() => setModalFechaVisible(false)}
        onAplicar={(inicio, fin) => setRangoPersonalizado({ inicio, fin })}
      />

      {/* Modal anular gasto */}
      <ModalAnularGasto
        gasto={gastoAAnular}
        visible={modalAnularVisible}
        onClose={cancelarAnulacion}
        onConfirmar={confirmarAnulacion}
        anulando={anulando}
      />
    </View>
  );
}

// ── Estilos compartidos de modales ───────────────────────────────────────────
const gs = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 4,
  },
  sheetTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  sheetSubtitulo: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  btnClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    padding: 14,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
  },
  inputAreaWrap: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    padding: 12,
  },
  inputArea: {
    fontSize: 15,
    color: "#111827",
    minHeight: 80,
  },
  errorTxt: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 2,
  },
  btnPrimario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 16,
  },
  btnPrimarioTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  resumenAnulacion: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resumenFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumenLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  resumenValor: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  avisoAnulacion: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
  },
  avisoTxt: {
    flex: 1,
    fontSize: 13,
    color: "#78350F",
    lineHeight: 19,
  },
  btnSecundario: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecundarioTxt: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#DC2626",
  },
  btnDangerTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
