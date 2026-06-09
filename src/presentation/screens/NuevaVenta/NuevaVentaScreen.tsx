import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreditoRepositoryImpl } from "../../../data/repositories/CreditoRepositoryImpl";
import { ResumenCredito } from "../../../domain/entities/Credito";
import { getEstadoStock } from "../../../domain/entities/Producto";
import { useTheme } from "../../../theme";
import { AppText } from "../../components/ui/AppText";
import { FormularioModal } from "../../components/ui/FormularioModal";
import { ClienteCard } from "../clientes/components/ClienteCard";
import { ProductoCard } from "../productos/components/ProductoCard";
import {
  CAMPOS_CLIENTE_VENTA,
  CAMPOS_PRODUCTO_VENTA,
  EMOJIS,
  fmt,
  smoothLayout,
  useNuevaVenta,
} from "./hooks/useNuevaVenta";

// ── Design tokens semánticos del dominio ─────────────────────────────────────
const GREEN = "#2EAA6E";
const GREEN_LIGHT = "#E6F7EF";
const RED = "#E03E3E";
const RED_LIGHT = "#FDEAEA";
const GRAY_BG = "#F6F7FB";
const GRAY_BORDER = "#E2E6EF";
const GRAY_TEXT = "#7B8499";
const GRAY_LIGHT = "#F0F2F7";
const INK = "#111827";
const INK_SOFT = "#374151";

const T = StyleSheet.create({
  display: { fontSize: 30, fontWeight: "800", color: INK, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: "700", color: INK, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: "700", color: INK },
  h3: { fontSize: 18, fontWeight: "600", color: INK_SOFT },
  body: { fontSize: 17, fontWeight: "400", color: INK_SOFT },
  bodyBold: { fontSize: 17, fontWeight: "700", color: INK },
  bodyBoldC: { fontSize: 17, fontWeight: "700", color: INK, right: 20 },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: GRAY_TEXT,
    letterSpacing: 0.3,
  },
  caption: { fontSize: 16, fontWeight: "400", color: GRAY_TEXT },
  captionMd: { fontSize: 16, fontWeight: "600", color: GRAY_TEXT },
  number: { fontSize: 36, fontWeight: "900", color: INK, letterSpacing: -1 },
  mono: { fontSize: 22, fontWeight: "700" },
});

export default function NuevaVentaScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors, spacing, radius, typography, shadows, sizes } = useTheme();

  const dropdownMaxHeight = Math.max(160, screenHeight * 0.49);

  const [alturaInputCliente, setAlturaInputCliente] = React.useState(56);
  const [alturaInputProducto, setAlturaInputProducto] = React.useState(56);

  const BLUE = colors.primary;
  const BLUE_LIGHT = colors.primaryLight;

  const {
    cargarDatos,
    step,
    siguiente,
    retroceder,
    flexPaso1,
    flexPaso2,
    filtroCliente,
    setFiltroCliente,
    filtroClienteActivo,
    setFiltroClienteActivo,
    clienteSeleccionado,
    setClienteSeleccionado,
    clientesFiltrados,
    seleccionarCliente,
    valoresNuevoCliente,
    setValoresNuevoCliente,
    guardarNuevoCliente,
    modalNuevoCliente,
    filtroProducto,
    setFiltroProducto,
    filtroActivo,
    setFiltroActivo,
    carrito,
    carritoExpandido,
    setCarritoExpandido,
    productoActivo,
    cantidadModal,
    setCantidadModal,
    precioModal,
    setPrecioModal,
    menuAbierto,
    cargandoGlobal,
    modoModal,
    productosFiltrados,
    idsEnCarrito,
    abrirModal,
    cerrarModal,
    agregarAlCarrito,
    abrirMenu,
    cerrarMenu,
    editarProducto,
    eliminarConMenu,
    valoresNuevoProducto,
    setValoresNuevoProducto,
    guardarNuevoProducto,
    modalNuevoProducto,
    filtroInputRef,
    scrollAlFiltro,
    subtotalModal,
    totalCarrito,
    precioInputRef,
    metodoPago,
    setMetodoPago,
    subMetodoPago,
    setSubMetodoPago,
    paganCon,
    paganConNum,
    devuelve,
    manejarCambioDinero,
    finalizarVenta,
    inputPagoRef,
    scrollRef,
    inventarioActivo,
  } = useNuevaVenta();

  React.useEffect(() => {
    cargarDatos();
    creditoRepo.getResumenes().then(setResumenesMora);
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          // console.log("📱 App ACTIVA — usuario volvió a la app");
        } else if (nextState === "background" || nextState === "inactive") {
          // console.log("📴 App en FONDO o INACTIVA — Limpiando teclado");

          // 1. Forzamos al teclado nativo a cerrarse por completo
          Keyboard.dismiss();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  // ── Créditos para badge de mora ───────────────────────────────────────────
  const creditoRepo = React.useMemo(() => new CreditoRepositoryImpl(), []);
  const [resumenesMora, setResumenesMora] = React.useState<ResumenCredito[]>(
    [],
  );

  const getMora = (clienteId: string) => {
    const r = resumenesMora.find((r) => r.clienteId === clienteId);
    return r
      ? { enMora: r.saldoActual > 0, saldo: r.saldoActual }
      : { enMora: false, saldo: 0 };
  };

  const router = useRouter();

  // ── Logger teclado ──────────────────────────────────────────────────────────
  const logAbierto = (h: number) => {
    /* console.log("⌨️ Teclado ABIERTO — altura:", h) */
  };
  const logCerrado = () => {
    /* console.log("⌨️ Teclado CERRADO") */
  };

  const KEYBOARD_HEIGHT_THRESHOLD = 100; // ignora eventos menores a 100px

  useKeyboardHandler(
    {
      onEnd: (e) => {
        "worklet";
        if (e.height > KEYBOARD_HEIGHT_THRESHOLD) {
          runOnJS(logAbierto)(e.height);
        } else if (e.height === 0) {
          runOnJS(logCerrado)();
        }
        // altura entre 0 y 100 → evento falso de Android, se ignora
      },
    },
    [],
  );

  // ── Step indicator ──────────────────────────────────────────────────────────
  const CircleStep = ({ num, active }: { num: number; active: boolean }) => (
    <View style={[s.circle, active ? s.circleActive : s.circleInactive]}>
      <Text style={s.circleText}>{num}</Text>
    </View>
  );

  // ── Input de búsqueda reutilizable ──────────────────────────────────────────
  const renderInputBusqueda = ({
    value,
    onChangeText,
    placeholder,
    onFocus,
    onBlur,
    onClear,
    inputRef,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onClear: () => void;
    inputRef?: React.RefObject<TextInput>;
  }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.grayBorder,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
        gap: spacing.xs,
      }}
    >
      <MaterialIcons
        name="search"
        size={sizes.iconSm}
        color={colors.grayText}
      />
      <TextInput
        ref={inputRef}
        style={{
          flex: 1,
          fontSize: typography.size.md,
          color: colors.ink,
          paddingVertical: 0,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.grayText}
        value={value}
        onChangeText={(txt) => {
          // console.log(`✏️ Escribiendo en "${placeholder}":`, txt);
          onChangeText(txt);
        }}
        onFocus={() => {
          // console.log(`🔍 FOCO en input: "${placeholder}"`);
          onFocus?.();
        }}
        onBlur={() => {
          // console.log(`👋 BLUR en input: "${placeholder}"`);
          onBlur?.();
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            // console.log(`🗑️ Limpiar input: "${placeholder}"`);
            onClear();
          }}
        >
          <MaterialIcons
            name="cancel"
            size={sizes.iconSm}
            color={colors.grayText}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Botón "Crear nuevo" reutilizable ────────────────────────────────────────
  const renderCrearCard = ({
    iconName,
    label,
    sublabel,
    onPress,
  }: {
    iconName: string;
    label: React.ReactNode;
    sublabel?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.primaryLight,
        borderStyle: "dashed",
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.xs,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons
          name={iconName as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={T.bodyBold}>{label}</Text>
        {sublabel ? <Text style={T.caption}>{sublabel}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
    </TouchableOpacity>
  );

  // ── Modal opciones carrito ──────────────────────────────────────────────────
  const renderMenuOpciones = () => {
    if (!menuAbierto) return null;
    return (
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={() => {
          // console.log("❌ Cerrar menú opciones (tap overlay)");
          cerrarMenu();
        }}
      >
        <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
          <View style={s.sheetHandle} />
          <View style={s.opcionesHeader}>
            <View>
              <Text style={T.h2}>Opciones del producto</Text>
              <Text style={[T.caption, { marginTop: 2 }]}>
                Selecciona una acción para este producto
              </Text>
            </View>
            <TouchableOpacity
              style={s.closeGray}
              onPress={() => {
                // console.log("❌ Cerrar menú opciones (botón X)");
                cerrarMenu();
              }}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.opcionBtn}
            activeOpacity={0.8}
            onPress={() => {
              /* console.log(
                "✏️ Editar producto del carrito:",
                (menuAbierto as any)?.nombre,
              ) */ editarProducto(menuAbierto);
            }}
          >
            <View style={[s.opcionIconBox, { backgroundColor: BLUE_LIGHT }]}>
              <MaterialIcons name="edit" size={24} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.bodyBold}>Editar producto</Text>
              <Text style={[T.caption, { marginTop: 2 }]}>
                Modifica la cantidad o precio
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={BLUE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.opcionBtn, s.opcionBtnRojo]}
            activeOpacity={0.8}
            onPress={() => {
              /* console.log(
                "🗑️ Eliminar producto del carrito:",
                (menuAbierto as any)?.nombre,
              ) */ eliminarConMenu(menuAbierto);
            }}
          >
            <View style={[s.opcionIconBox, { backgroundColor: RED_LIGHT }]}>
              <MaterialIcons name="delete-outline" size={24} color={RED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.bodyBold, { color: RED }]}>
                Eliminar producto
              </Text>
              <Text style={[T.caption, { marginTop: 2 }]}>
                Quita este producto de la venta
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={RED} />
          </TouchableOpacity>

          <View style={s.avisoRow}>
            <MaterialIcons name="info-outline" size={14} color={GRAY_TEXT} />
            <Text style={[T.caption, { marginLeft: 6 }]}>
              Esta acción solo afecta la venta actual
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  PASO 1 — Cliente
  // ════════════════════════════════════════════════════════════════════════════
  const renderPaso1 = () => (
    <Animated.View style={[s.stepRow, { flex: flexPaso1, zIndex: 60 }]}>
      <View style={s.timelineCol}>
        <CircleStep num={1} active={step >= 1} />
        <View style={s.line} />
      </View>
      <View style={s.contentCol}>
        <View style={s.stepHeader}>
          <Ionicons name="person" size={16} color={step >= 1 ? BLUE : "#CCC"} />
          <Text
            style={[
              T.h3,
              step >= 1 ? { color: INK, fontWeight: "700" } : { color: "#CCC" },
            ]}
          >
            Seleccionar cliente
          </Text>
        </View>

        {step === 1 && (
          <View style={s.activeBlock}>
            {!clienteSeleccionado ? (
              <>
                <AppText variant="label" style={{ marginBottom: spacing.xs }}>
                  Busca o crea un cliente
                </AppText>

                <View
                  style={[
                    s.inputDropdownWrapper,
                    (filtroClienteActivo || filtroCliente.trim() !== "") && {
                      paddingBottom: dropdownMaxHeight + 0,
                    },
                  ]}
                >
                  <View
                    onLayout={(e) =>
                      setAlturaInputCliente(e.nativeEvent.layout.height)
                    }
                  >
                    {renderInputBusqueda({
                      value: filtroCliente,
                      onChangeText: setFiltroCliente,
                      placeholder: "Buscar cliente...",
                      onFocus: () => {
                        smoothLayout();
                        setFiltroClienteActivo(true);
                      },
                      onBlur: () => {
                        if (filtroCliente.trim() === "") {
                          smoothLayout();
                          setFiltroClienteActivo(false);
                        }
                      },
                      onClear: () => {
                        setFiltroCliente("");
                      },
                    })}
                  </View>

                  {(filtroClienteActivo || filtroCliente.trim() !== "") && (
                    <ScrollView
                      style={[
                        s.dropdownFloat,
                        {
                          maxHeight: dropdownMaxHeight,
                          top: alturaInputCliente,
                        },
                      ]}
                      contentContainerStyle={{ paddingBottom: 4 }}
                      keyboardShouldPersistTaps="always"
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {filtroCliente.trim() === "" ? (
                        <View style={s.guiaBox}>
                          <MaterialIcons
                            name="search"
                            size={36}
                            color={GRAY_TEXT}
                            style={{ marginBottom: 8 }}
                          />
                          <Text style={T.body}>
                            Escribe para buscar un cliente
                          </Text>
                        </View>
                      ) : clientesFiltrados.length === 0 ? (
                        <View>
                          <AppText
                            variant="caption"
                            color={colors.grayText}
                            style={{
                              marginBottom: spacing.sm,
                              textAlign: "center",
                            }}
                          >
                            No se encontró ningún cliente con ese nombre
                          </AppText>
                          {renderCrearCard({
                            iconName: "person-add",
                            label: (
                              <>
                                Crear{" "}
                                <Text style={{ color: BLUE }}>
                                  "{filtroCliente.trim()}"
                                </Text>
                              </>
                            ),
                            onPress: () => {
                              /* console.log(
                                "➕ Abrir modal NUEVO CLIENTE con nombre:",
                                filtroCliente.trim(),
                              ) */ setValoresNuevoCliente((prev) => ({
                                ...prev,
                                nombre: filtroCliente.trim(),
                              }));
                              modalNuevoCliente.abrir();
                            },
                          })}
                        </View>
                      ) : (
                        <>
                          <AppText
                            variant="label"
                            style={{ marginBottom: spacing.xs }}
                          >
                            {clientesFiltrados.length} cliente
                            {clientesFiltrados.length !== 1 ? "s" : ""}
                          </AppText>
                          {clientesFiltrados.map((c) => (
                            <ClienteCard
                              key={c.id}
                              cliente={c}
                              enMora={getMora(c.id).enMora}
                              totalDeuda={getMora(c.id).saldo}
                              onPress={() => {
                                /* console.log(
                                  "👤 Cliente seleccionado:",
                                  c.nombre,
                                  "| id:",
                                  c.id,
                                ) */ seleccionarCliente(c);
                              }}
                            />
                          ))}
                        </>
                      )}
                    </ScrollView>
                  )}
                </View>

                {!filtroClienteActivo &&
                  filtroCliente.trim() === "" &&
                  renderCrearCard({
                    iconName: "person-add",
                    label: "Crear cliente nuevo",
                    sublabel: "Agregar a la lista de clientes",
                    onPress: () => {
                      // console.log("➕ Abrir modal NUEVO CLIENTE (vacío)");
                      setValoresNuevoCliente({
                        nombre: "",
                        telefono: "",
                        direccion: "",
                      });
                      modalNuevoCliente.abrir();
                    },
                  })}
              </>
            ) : (
              <View
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.grayBorder,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  gap: spacing.md,
                  ...shadows.card,
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
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: GREEN_LIGHT,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 19, fontWeight: "700", color: GREEN }}
                    >
                      {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">Cliente seleccionado</AppText>
                    <Text style={[T.h2, { marginTop: 2 }]}>
                      {clienteSeleccionado.nombre}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 3,
                      }}
                    >
                      <MaterialIcons name="phone" size={12} color={BLUE} />
                      <Text style={[T.caption, { marginLeft: 2, color: BLUE }]}>
                        {clienteSeleccionado.telefono}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.btnRemove}
                    onPress={() => {
                      /* console.log(
                        "❌ Quitar cliente seleccionado:",
                        clienteSeleccionado.nombre,
                      ) */ setClienteSeleccionado(null);
                    }}
                  >
                    <MaterialIcons name="person-remove" size={16} color={RED} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={s.btnPrimary}
                  onPress={() => {
                    /* console.log(
                      "➡️ Continuar paso 1 → 2 | cliente:",
                      clienteSeleccionado.nombre,
                    ) */ siguiente();
                  }}
                >
                  <Text style={s.btnPrimaryText}>Continuar</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  PASO 2 — Productos
  // ════════════════════════════════════════════════════════════════════════════
  const renderPaso2 = () => (
    <Animated.View style={[s.stepRow, { flex: flexPaso2, zIndex: 40 }]}>
      <View style={s.timelineCol}>
        <CircleStep num={2} active={step >= 2} />
        <View style={s.line} />
      </View>
      <View style={s.contentCol}>
        <View style={s.stepHeader}>
          <Ionicons name="cart" size={16} color={step >= 2 ? BLUE : "#CCC"} />
          <Text
            style={[
              T.h3,
              step >= 2 ? { color: INK, fontWeight: "700" } : { color: "#CCC" },
            ]}
          >
            Agregar productos
          </Text>
        </View>

        {step === 2 && (
          <View style={s.activeBlock}>
            {productoActivo ? (
              <View>
                <View
                  style={[
                    s.modoBadge,
                    modoModal === "editar"
                      ? { backgroundColor: BLUE_LIGHT }
                      : { backgroundColor: GREEN_LIGHT },
                  ]}
                >
                  <Text
                    style={[
                      T.captionMd,
                      { color: modoModal === "editar" ? BLUE : GREEN },
                    ]}
                  >
                    {modoModal === "editar"
                      ? "✏️  Editando producto"
                      : "➕  Agregar producto"}
                  </Text>
                </View>

                <View style={s.productoModal}>
                  <View style={s.modalHeader}>
                    <Text style={{ fontSize: 30 }}>
                      {EMOJIS[productoActivo.nombre] ?? "🛒"}
                    </Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={T.h2}>{productoActivo.nombre}</Text>
                      <Text style={T.caption}>
                        {modoModal === "editar"
                          ? `Cantidad actual: ${
                              carrito.find((i) => i.id === productoActivo.id)
                                ?.qty ?? "-"
                            }`
                          : `Disponible: ${productoActivo.stock ?? 0} ${productoActivo.unidad}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        /* console.log(
                          "❌ Cerrar modal producto:",
                          productoActivo.nombre,
                        ) */ cerrarModal();
                      }}
                      style={s.closeBtnRed}
                    >
                      <MaterialIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={s.modalGrid}>
                    <View style={s.modalField}>
                      <Text style={T.label}>Precio unitario</Text>
                      <TextInput
                        style={[s.cantidadInput, { color: BLUE }]}
                        keyboardType="numeric"
                        value={precioModal}
                        onChangeText={(txt) => {
                          const limpio = txt.replace(/[^0-9]/g, "");
                          /* console.log(
                            "💲 Precio modificado:",
                            limpio,
                            "| producto:",
                            productoActivo.nombre,
                          ) */ setPrecioModal(limpio);
                        }}
                        onFocus={() => {
                          /* console.log(
                            "🔍 FOCO en input: Precio unitario | producto:",
                            productoActivo.nombre,
                          ) */
                        }}
                        onBlur={() => {
                          /* console.log("👋 BLUR en input: Precio unitario") */
                        }}
                        placeholder="0"
                        placeholderTextColor={GRAY_TEXT}
                      />
                    </View>
                    <View style={s.modalField}>
                      <Text style={T.label}>
                        Cantidad ({productoActivo.unidad})
                      </Text>
                      <TextInput
                        ref={filtroInputRef}
                        style={s.cantidadInput}
                        keyboardType="numeric"
                        value={cantidadModal}
                        onChangeText={(txt) => {
                          /* console.log(
                            "🔢 Cantidad modificada:",
                            txt,
                            "| producto:",
                            productoActivo.nombre,
                          ) */ setCantidadModal(txt);
                        }}
                        onFocus={() => {
                          /* console.log(
                            "🔍 FOCO en input: Cantidad | producto:",
                            productoActivo.nombre,
                          ) */
                        }}
                        onBlur={() => {
                          /* console.log("👋 BLUR en input: Cantidad") */
                        }}
                      />
                    </View>
                  </View>

                  <View style={s.subtotalRow}>
                    <Text style={T.caption}>Subtotal</Text>
                    <Text style={[T.h2, { color: BLUE }]}>
                      {fmt(subtotalModal)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    s.btnAgregar,
                    modoModal === "editar" && { backgroundColor: BLUE },
                  ]}
                  onPress={() => {
                    /* console.log(
                      `🛒 ${modoModal === "editar" ? "Guardar cambios" : "Agregar al carrito"} | producto: ${productoActivo.nombre} | cantidad: ${cantidadModal} | precio: ${precioModal}`,
                    ) */ agregarAlCarrito();
                  }}
                >
                  <Text style={s.btnPrimaryText}>
                    {modoModal === "editar"
                      ? "Guardar cambios"
                      : "Agregar al pedido"}
                  </Text>
                  <MaterialIcons
                    name={
                      modoModal === "editar" ? "check" : "add-shopping-cart"
                    }
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <AppText variant="label" style={{ marginBottom: spacing.xs }}>
                  Busca o crea un producto
                </AppText>

                <View
                  style={[
                    s.inputDropdownWrapper,
                    (filtroActivo || filtroProducto.trim() !== "") && {
                      paddingBottom: dropdownMaxHeight + 0,
                    },
                  ]}
                >
                  <View
                    onLayout={(e) =>
                      setAlturaInputProducto(e.nativeEvent.layout.height)
                    }
                  >
                    {renderInputBusqueda({
                      value: filtroProducto,
                      onChangeText: setFiltroProducto,
                      placeholder: "Buscar producto...",
                      inputRef: filtroInputRef,
                      onFocus: () => {
                        smoothLayout();
                        setFiltroActivo(true);
                      },
                      onBlur: () => {
                        if (filtroProducto.trim() === "") {
                          smoothLayout();
                          setFiltroActivo(false);
                        }
                      },
                      onClear: () => {
                        setFiltroProducto("");
                        filtroInputRef.current?.focus();
                      },
                    })}
                  </View>

                  {(filtroActivo || filtroProducto.trim() !== "") && (
                    <ScrollView
                      style={[
                        s.dropdownFloat,
                        {
                          maxHeight: dropdownMaxHeight,
                          top: alturaInputProducto,
                        },
                      ]}
                      contentContainerStyle={{ paddingBottom: 4 }}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {filtroProducto.trim() === "" ? (
                        <View style={s.guiaBox}>
                          <MaterialIcons
                            name="search"
                            size={36}
                            color={GRAY_TEXT}
                            style={{ marginBottom: 8 }}
                          />
                          <Text style={T.body}>
                            Escribe para buscar un producto
                          </Text>
                        </View>
                      ) : productosFiltrados.length === 0 ? (
                        <View>
                          <AppText
                            variant="caption"
                            color={colors.grayText}
                            style={{
                              textAlign: "center",
                              marginBottom: spacing.sm,
                            }}
                          >
                            No se encontró ese producto
                          </AppText>
                          {renderCrearCard({
                            iconName: "add-shopping-cart",
                            label: (
                              <>
                                Crear{" "}
                                <Text style={{ color: BLUE }}>
                                  "{filtroProducto.trim()}"
                                </Text>
                              </>
                            ),
                            onPress: () => {
                              /* console.log(
                                "➕ Abrir modal NUEVO PRODUCTO con nombre:",
                                filtroProducto.trim(),
                              ) */ setValoresNuevoProducto((prev) => ({
                                ...prev,
                                nombre: filtroProducto.trim(),
                                imagen: prev.imagen ?? "",
                              }));
                              modalNuevoProducto.abrir();
                            },
                          })}
                        </View>
                      ) : (
                        (() => {
                          const disponibles = productosFiltrados.filter(
                            (p) => !idsEnCarrito.includes(p.id),
                          );
                          const yaEnPedido = productosFiltrados.filter((p) =>
                            idsEnCarrito.includes(p.id),
                          );
                          const renderCard = (p: any) => {
                            const enCarrito = idsEnCarrito.includes(p.id);
                            const itemCarrito = enCarrito
                              ? carrito.find((i: any) => i.id === p.id)
                              : null;
                            return (
                              <ProductoCard
                                key={p.id}
                                producto={p}
                                mostrarStock={inventarioActivo}
                                ocultarMenu={true}
                                enCarrito={enCarrito}
                                itemCarrito={itemCarrito}
                                onPress={() => {
                                  if (!enCarrito) {
                                    if (
                                      inventarioActivo &&
                                      getEstadoStock(p) === "agotado"
                                    ) {
                                      Alert.alert(
                                        "Producto agotado",
                                        `"${p.nombre}" no tiene stock disponible y no puede agregarse a la venta.`,
                                        [
                                          {
                                            text: "Entendido",
                                            style: "cancel",
                                          },
                                        ],
                                      );
                                      return;
                                    }
                                    abrirModal(p);
                                  }
                                }}
                                onPressMenu={
                                  enCarrito
                                    ? () => {
                                        /* console.log(
                                    "⚙️ Menú opciones abierto para:",
                                    itemCarrito?.nombre,
                                  ) */ abrirMenu(itemCarrito);
                                      }
                                    : undefined
                                }
                              />
                            );
                          };
                          return (
                            <>
                              {disponibles.map(renderCard)}
                              {yaEnPedido.length > 0 && (
                                <>
                                  <View style={s.separadorYaAgregado}>
                                    <View style={s.separadorLinea} />
                                    <Text style={s.separadorTexto}>
                                      Ya en el pedido
                                    </Text>
                                    <View style={s.separadorLinea} />
                                  </View>
                                  {yaEnPedido.map(renderCard)}
                                </>
                              )}
                            </>
                          );
                        })()
                      )}
                    </ScrollView>
                  )}
                </View>

                {!filtroActivo &&
                  renderCrearCard({
                    iconName: "add-shopping-cart",
                    label: "Crear producto nuevo",
                    sublabel: "Agregar al catálogo",
                    onPress: () => {
                      // console.log("➕ Abrir modal NUEVO PRODUCTO (vacío)");
                      setValoresNuevoProducto({
                        nombre: "",
                        precio: "",
                        unidad: "Kg",
                        disponible: "",
                        imagen: "",
                      });
                      modalNuevoProducto.abrir();
                    },
                  })}
              </View>
            )}

            {!filtroActivo && !productoActivo && (
              <View style={{ marginTop: 20 }}>
                <AppText variant="label" style={{ marginBottom: spacing.xs }}>
                  Resumen del pedido
                </AppText>
                <View
                  style={{
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.grayBorder,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    ...shadows.card,
                  }}
                >
                  <View style={s.ticketRow}>
                    <Text style={T.label}>Cliente</Text>
                    <Text style={T.bodyBoldC}>
                      {clienteSeleccionado?.nombre}
                    </Text>
                  </View>
                  <View style={s.tablaHeaderRow}>
                    <Text style={[T.label, s.colDesc]}>Producto</Text>
                    <Text style={[T.label, s.colCant]}>Cant</Text>
                    <Text style={[T.label, s.colTotal]}>Total</Text>
                    <View style={{ width: 28 }} />
                  </View>
                  <View style={s.dividerDashed} />

                  {carrito.length === 0 && (
                    <View
                      style={{
                        alignItems: "center",
                        paddingVertical: 20,
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>🛒</Text>
                      <Text style={[T.caption, { textAlign: "center" }]}>
                        Aún no has agregado productos
                      </Text>
                    </View>
                  )}

                  {carrito.length > 0 &&
                    carritoExpandido &&
                    carrito.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          s.tablaFila,
                          index === carrito.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                        onPress={() => {
                          /* console.log(
                            "⚙️ Abrir menú desde resumen carrito:",
                            item.nombre,
                          ) */ abrirMenu(item);
                        }}
                        activeOpacity={0.6}
                        delayPressIn={50}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={[T.bodyBold, s.colDesc]}
                                numberOfLines={1}
                              >
                                {item.nombre}
                              </Text>
                              <Text style={[T.body, s.colCant]}>
                                {item.qty}
                              </Text>
                              <Text style={[T.bodyBold, s.colTotal]}>
                                {(item.precio * item.qty).toLocaleString(
                                  "es-CO",
                                )}
                              </Text>
                            </View>
                            <Text style={[T.caption, { marginTop: 2 }]}>
                              {fmt(item.precio)} / {item.unidad}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 44,
                              alignItems: "flex-end",
                              justifyContent: "center",
                              paddingLeft: 20,
                            }}
                          >
                            <MaterialIcons
                              name="more-vert"
                              size={26}
                              color={GRAY_TEXT}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}

                  {carrito.length > 0 && carritoExpandido && (
                    <View style={s.dividerDashed} />
                  )}

                  <TouchableOpacity
                    style={s.totalRow}
                    onPress={() => {
                      /* console.log(
                        "📋 Toggle carrito expandido:",
                        !carritoExpandido,
                      ) */ setCarritoExpandido((v) => !v);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MaterialIcons
                        name="shopping-basket"
                        size={13}
                        color={GRAY_TEXT}
                      />
                      <Text style={T.caption}>
                        {carrito.length}{" "}
                        {carrito.length === 1 ? "producto" : "productos"}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={T.label}>Total</Text>
                      <Text style={[T.h2, { color: INK }]}>
                        {fmt(totalCarrito)}
                      </Text>
                      <MaterialIcons
                        name={
                          carritoExpandido
                            ? "keyboard-arrow-up"
                            : "keyboard-arrow-down"
                        }
                        size={20}
                        color={GRAY_TEXT}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!filtroActivo && !productoActivo && (
              <View style={[s.botonesRow, { marginTop: 24 }]}>
                <TouchableOpacity
                  style={s.btnOutline}
                  onPress={() => {
                    // console.log("⬅️ Retroceder paso 2 → 1");
                    retroceder();
                  }}
                >
                  <MaterialIcons name="arrow-back" size={16} color={BLUE} />
                  <Text style={[s.btnOutlineText, { color: BLUE }]}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btnPrimary, carrito.length === 0 && s.btnDisabled]}
                  onPress={
                    carrito.length > 0
                      ? () => {
                          /* console.log(
                            "➡️ Continuar paso 2 → 3 | productos en carrito:",
                            carrito.length,
                          ) */ siguiente();
                        }
                      : undefined
                  }
                  activeOpacity={carrito.length > 0 ? 0.7 : 1}
                >
                  <Text style={s.btnPrimaryText}>
                    {carrito.length === 0 ? "Agrega un producto" : "Continuar"}
                  </Text>
                  {carrito.length > 0 && (
                    <MaterialIcons
                      name="arrow-forward"
                      size={16}
                      color="#fff"
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  PASO 3 — Cobro
  // ════════════════════════════════════════════════════════════════════════════
  const renderPaso3 = () => (
    <View style={[s.stepRow, { zIndex: 30 }]}>
      <View style={s.timelineCol}>
        <CircleStep num={3} active={step >= 3} />
      </View>
      <View style={s.contentCol}>
        <View style={s.stepHeader}>
          <MaterialIcons
            name="payments"
            size={16}
            color={step >= 3 ? BLUE : "#CCC"}
          />
          <Text
            style={[
              T.h3,
              step >= 3 ? { color: INK, fontWeight: "700" } : { color: "#CCC" },
            ]}
          >
            Finalizar cobro
          </Text>
        </View>

        {step === 3 && (
          <View style={s.activeBlock}>
            <View style={s.ticketCard}>
              <View style={[s.ticketStripe, { backgroundColor: BLUE }]} />
              <View style={s.ticketBody}>
                <View style={s.ticketRow}>
                  <Text style={T.label}>Cliente</Text>
                  <Text style={T.bodyBold}>{clienteSeleccionado?.nombre}</Text>
                </View>
                <View style={s.dividerDashed} />
                {carrito.length === 0 ? (
                  <View style={{ paddingVertical: 14, alignItems: "center" }}>
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>🛒</Text>
                    <Text style={[T.caption, { textAlign: "center" }]}>
                      No hay productos en el pedido
                    </Text>
                  </View>
                ) : (
                  carrito.map((item) => (
                    <View
                      key={item.id}
                      style={[s.ticketRow, { paddingVertical: 5 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={T.body}>{item.nombre}</Text>
                        <Text style={T.caption}>
                          {item.qty} {item.unidad} × {fmt(item.precio)}
                        </Text>
                      </View>
                      <Text style={T.bodyBold}>
                        {fmt(item.precio * item.qty)}
                      </Text>
                    </View>
                  ))
                )}
                <View style={s.dividerDashed} />
                <View
                  style={[
                    s.ticketRow,
                    { alignItems: "flex-end", paddingTop: 4 },
                  ]}
                >
                  <View>
                    <Text style={T.label}>Total a cobrar</Text>
                    <Text style={T.number}>{fmt(totalCarrito)}</Text>
                  </View>
                  <View style={[s.totalBadge, { backgroundColor: BLUE_LIGHT }]}>
                    <Text style={[s.totalBadgeText, { color: BLUE }]}>
                      {carrito.length} ítem{carrito.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── 1. ¿Cómo pagó el cliente? ── */}
            <AppText
              variant="label"
              style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
            >
              ¿Cómo pagó el cliente?
            </AppText>

            <View style={s.metodoPagoGrid}>
              {/* CONTADO */}
              <TouchableOpacity
                style={[
                  s.metodoBtn,
                  metodoPago === "contado" && {
                    ...s.metodoBtnActive,
                    backgroundColor: BLUE,
                    borderColor: BLUE,
                  },
                ]}
                onPress={() => {
                  setMetodoPago("contado");
                  setSubMetodoPago(null);
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 99999, animated: true });
                  }, 100);
                }}
              >
                {metodoPago === "contado" && (
                  <View style={{ position: "absolute", top: 10, right: 10 }}>
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    s.metodoIconBox,
                    metodoPago === "contado"
                      ? s.metodoIconBoxActive
                      : { backgroundColor: BLUE_LIGHT },
                  ]}
                >
                  <MaterialIcons
                    name="payments"
                    size={32}
                    color={metodoPago === "contado" ? "#fff" : BLUE}
                  />
                </View>
                <Text
                  style={[
                    s.metodoBtnLabel,
                    metodoPago === "contado" && s.metodoBtnLabelActive,
                  ]}
                >
                  Contado
                </Text>
                <Text
                  style={[
                    T.caption,
                    metodoPago === "contado"
                      ? { color: "rgba(255,255,255,0.75)" }
                      : {},
                  ]}
                >
                  Pago inmediato
                </Text>
              </TouchableOpacity>

              {/* CRÉDITO */}
              <TouchableOpacity
                style={[
                  s.metodoBtn,
                  metodoPago === "credito" && s.metodoBtnCredito,
                ]}
                onPress={() => {
                  setMetodoPago("credito");
                  setSubMetodoPago(null);
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: 99999, animated: true });
                  }, 100);
                }}
              >
                {metodoPago === "credito" && (
                  <View style={{ position: "absolute", top: 10, right: 10 }}>
                    <MaterialIcons name="check-circle" size={18} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    s.metodoIconBox,
                    metodoPago === "credito" && s.metodoIconBoxCredito,
                  ]}
                >
                  <MaterialIcons
                    name="schedule"
                    size={32}
                    color={metodoPago === "credito" ? "#fff" : "#F59E0B"}
                  />
                </View>
                <Text
                  style={[
                    s.metodoBtnLabel,
                    metodoPago === "credito" && { color: "#fff" },
                  ]}
                >
                  Crédito
                </Text>
                <Text
                  style={[
                    T.caption,
                    metodoPago === "credito"
                      ? { color: "rgba(255,255,255,0.75)" }
                      : {},
                  ]}
                >
                  Queda pendiente
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── 2. Método de pago (solo si contado) ── */}
            {metodoPago === "contado" && (
              <>
                <AppText
                  variant="label"
                  style={{ marginTop: spacing.lg, marginBottom: 4 }}
                >
                  Método de pago
                </AppText>
                <Text style={[T.caption, { marginBottom: spacing.sm }]}>
                  Selecciona cómo recibió el pago
                </Text>

                <View style={s.metodoPagoGrid}>
                  {/* EFECTIVO */}
                  <TouchableOpacity
                    style={[
                      s.metodoBtn,
                      subMetodoPago === "efectivo" && {
                        ...s.metodoBtnActive,
                        backgroundColor: GREEN,
                        borderColor: GREEN,
                        shadowColor: GREEN,
                      },
                    ]}
                    onPress={() => {
                      setSubMetodoPago("efectivo");
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({
                          y: 99999,
                          animated: true,
                        });
                      }, 100);
                    }}
                  >
                    {subMetodoPago === "efectivo" && (
                      <View
                        style={{ position: "absolute", top: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#fff"
                        />
                      </View>
                    )}
                    <View
                      style={[
                        s.metodoIconBox,
                        subMetodoPago === "efectivo"
                          ? s.metodoIconBoxActive
                          : { backgroundColor: GREEN_LIGHT },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={32}
                        color={subMetodoPago === "efectivo" ? "#fff" : GREEN}
                      />
                    </View>
                    <Text
                      style={[
                        s.metodoBtnLabel,
                        subMetodoPago === "efectivo" && s.metodoBtnLabelActive,
                      ]}
                    >
                      Efectivo
                    </Text>
                    <Text
                      style={[
                        T.caption,
                        { textAlign: "center" },
                        subMetodoPago === "efectivo"
                          ? { color: "rgba(255,255,255,0.75)" }
                          : {},
                      ]}
                    >
                      El cliente paga{"\n"}en efectivo
                    </Text>
                  </TouchableOpacity>

                  {/* TRANSFERENCIA */}
                  <TouchableOpacity
                    style={[
                      s.metodoBtn,
                      subMetodoPago === "transferencia" && {
                        ...s.metodoBtnActive,
                        backgroundColor: "#7C3AED",
                        borderColor: "#7C3AED",
                        shadowColor: "#7C3AED",
                      },
                    ]}
                    onPress={() => {
                      setSubMetodoPago("transferencia");
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({
                          y: 99999,
                          animated: true,
                        });
                      }, 100);
                    }}
                  >
                    {subMetodoPago === "transferencia" && (
                      <View
                        style={{ position: "absolute", top: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#fff"
                        />
                      </View>
                    )}
                    <View
                      style={[
                        s.metodoIconBox,
                        subMetodoPago === "transferencia"
                          ? { backgroundColor: "rgba(255,255,255,0.2)" }
                          : { backgroundColor: "#EDE9FE" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="bank-transfer"
                        size={32}
                        color={
                          subMetodoPago === "transferencia" ? "#fff" : "#7C3AED"
                        }
                      />
                    </View>
                    <Text
                      style={[
                        s.metodoBtnLabel,
                        subMetodoPago === "transferencia" &&
                          s.metodoBtnLabelActive,
                      ]}
                    >
                      Transferencia
                    </Text>
                    <Text
                      style={[
                        T.caption,
                        { textAlign: "center" },
                        subMetodoPago === "transferencia"
                          ? { color: "rgba(255,255,255,0.75)" }
                          : {},
                      ]}
                    >
                      El cliente paga{"\n"}por transferencia
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── 3. Calculadora de cambio (solo efectivo) ── */}
            {metodoPago === "contado" && subMetodoPago === "efectivo" && (
              <View style={s.calculadoraCard}>
                <AppText variant="label" style={{ marginBottom: spacing.sm }}>
                  ¿Con cuánto pagó?
                </AppText>
                <TextInput
                  ref={inputPagoRef}
                  style={s.inputDinero}
                  keyboardType="numeric"
                  value={paganCon}
                  onChangeText={manejarCambioDinero}
                  placeholder="$ 0"
                  placeholderTextColor={GRAY_TEXT}
                  onFocus={() => {
                    scrollRef.current?.scrollTo({ y: 99999, animated: true });
                  }}
                />
                {paganConNum > 0 && (
                  <View
                    style={[
                      s.vueltoBox,
                      paganConNum < totalCarrito && {
                        backgroundColor: RED_LIGHT,
                        borderColor: RED,
                      },
                    ]}
                  >
                    {paganConNum < totalCarrito ? (
                      <>
                        <MaterialIcons
                          name="warning-amber"
                          size={18}
                          color={RED}
                        />
                        <Text
                          style={[T.captionMd, { color: RED, marginTop: 4 }]}
                        >
                          Pago insuficiente, falta saldo
                        </Text>
                        <Text style={[T.number, { color: RED }]}>
                          {fmt(totalCarrito - paganConNum)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons
                          name="check-circle-outline"
                          size={18}
                          color={GREEN}
                        />
                        <Text
                          style={[T.captionMd, { color: GREEN, marginTop: 4 }]}
                        >
                          Cambio para el cliente
                        </Text>
                        <Text style={[T.number, { color: GREEN }]}>
                          {fmt(devuelve)}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Info transferencia */}
            {metodoPago === "contado" && subMetodoPago === "transferencia" && (
              <View
                style={[
                  s.CreditoInfo,
                  { borderColor: "#DDD6FE", backgroundColor: "#F5F3FF" },
                ]}
              >
                <MaterialCommunityIcons
                  name="bank-transfer"
                  size={16}
                  color="#7C3AED"
                />
                <Text
                  style={[
                    T.caption,
                    { flex: 1, marginLeft: 8, color: "#5B21B6" },
                  ]}
                >
                  Pago por transferencia. No aplica cálculo de cambio.
                </Text>
              </View>
            )}

            {/* Info crédito */}
            {metodoPago === "credito" && (
              <View style={s.CreditoInfo}>
                <MaterialIcons name="info-outline" size={16} color="#F59E0B" />
                <Text
                  style={[
                    T.caption,
                    { flex: 1, marginLeft: 8, color: "#92400E" },
                  ]}
                >
                  Esta venta quedará registrada como deuda de{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {clienteSeleccionado?.nombre}
                  </Text>
                  . Podrás cobrarla después desde su perfil.
                </Text>
              </View>
            )}

            {/* ── Botones Atrás / Listo vendido ── */}
            <View style={[s.botonesRow, { marginTop: 24 }]}>
              <TouchableOpacity
                style={s.btnOutline}
                onPress={() => {
                  retroceder();
                }}
              >
                <MaterialIcons name="arrow-back" size={16} color={BLUE} />
                <Text style={[s.btnOutlineText, { color: BLUE }]}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.btnFinalizar,
                  // Deshabilitar si:
                  // - no hay tipo seleccionado
                  // - es contado sin subMétodo
                  // - es efectivo con pago insuficiente
                  (!metodoPago ||
                    (metodoPago === "contado" && !subMetodoPago) ||
                    (subMetodoPago === "efectivo" &&
                      paganConNum < totalCarrito)) &&
                    s.btnDisabled,
                ]}
                onPress={finalizarVenta}
                activeOpacity={0.85}
              >
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={s.btnPrimaryText}>¡Listo, vendido!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.grayBg }}>
        {/* HEADER */}
        <View
          style={{
            backgroundColor: colors.white,
            paddingHorizontal: spacing.sm,
            paddingBottom: spacing.md,
            paddingTop: insets.top + 8,
            ...shadows.md,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ width: 100, alignItems: "flex-start" }}>
              {step > 1 && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                  activeOpacity={0.7}
                  onPress={() => {
                    // console.log("⬅️ Volver (header) desde paso:", step);
                    retroceder();
                  }}
                >
                  <Feather
                    name="chevron-left"
                    size={sizes.iconMd}
                    color={colors.grayText}
                  />
                  <Text
                    style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.regular,
                      color: colors.grayText,
                    }}
                  >
                    volver
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="receipt-text-check-outline"
                size={36}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: typography.size.xxl,
                  fontWeight: typography.weight.black,
                  color: colors.primary,
                  marginTop: -4,
                }}
              >
                Fácil
              </Text>
            </View>

            <View style={{ width: 100, alignItems: "flex-end" }}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                activeOpacity={0.7}
                onPress={() => {
                  /* console.log(
                    "🚪 Salir de NuevaVentaScreen (paso actual:",
                    step,
                    ")",
                  ) */ router.back();
                }}
              >
                <Text
                  style={{
                    fontSize: typography.size.lg,
                    fontWeight: typography.weight.regular,
                    color: colors.grayText,
                  }}
                >
                  salir
                </Text>
                <MaterialCommunityIcons
                  name="logout-variant"
                  size={sizes.iconMd}
                  color={colors.grayText}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <KeyboardAwareScrollView
          ref={scrollRef}
          bottomOffset={250}
          extraKeyboardSpace={0}
          scrollEnabled={
            productoActivo != null ||
            step === 3 ||
            (!filtroActivo &&
              !filtroClienteActivo &&
              filtroCliente.trim() === "" &&
              filtroProducto.trim() === "")
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: typography.size.xxl,
              fontWeight: typography.weight.extraBold,
              color: colors.ink,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xs,
            }}
          >
            Nueva venta
          </Text>

          {renderPaso1()}
          {renderPaso2()}
          {renderPaso3()}
          <View style={{ height: 60 }} />
        </KeyboardAwareScrollView>
      </View>

      {renderMenuOpciones()}

      {/* Modal nuevo cliente */}
      <FormularioModal
        modal={modalNuevoCliente}
        titulo="Nuevo cliente"
        subtitulo="Completa los datos del cliente"
        campos={CAMPOS_CLIENTE_VENTA}
        valores={valoresNuevoCliente}
        onChange={(id, valor) =>
          setValoresNuevoCliente((prev) => ({ ...prev, [id]: valor }))
        }
        onGuardar={guardarNuevoCliente}
        labelGuardar="Guardar cliente"
        esEdicion={false}
      />

      {/* Modal nuevo producto */}
      <FormularioModal
        modal={modalNuevoProducto}
        titulo="Nuevo producto"
        subtitulo="Completa los datos del producto"
        campos={CAMPOS_PRODUCTO_VENTA}
        valores={valoresNuevoProducto}
        onChange={(id, valor) =>
          setValoresNuevoProducto((prev) => ({ ...prev, [id]: valor }))
        }
        onGuardar={guardarNuevoProducto}
      />

      {/* Loader global */}
      {cargandoGlobal && (
        <View style={s.loaderGlobalContainer}>
          <View style={s.loaderPanel}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      )}
    </>
  );
}

// ── Estilos que no dependen del tema ─────────────────────────────────────────
const s = StyleSheet.create({
  stepRow: { flexDirection: "row", minHeight: 0 },
  timelineCol: { width: 20, alignItems: "center" },
  contentCol: { flex: 1, paddingLeft: 14, paddingBottom: 20 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  circleActive: { backgroundColor: "#0077EE" },
  circleInactive: { backgroundColor: "#D1D5DB" },
  circleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: GRAY_BORDER,
    marginVertical: 2,
    zIndex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    gap: 8,
  },
  activeBlock: { marginTop: 10 },
  inputDropdownWrapper: {
    position: "relative",
    zIndex: 100,
    marginBottom: 0,
  },
  dropdownFloat: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
    padding: 8,
  },
  btnRemove: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: RED_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  modoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  productoModal: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  closeBtnRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
  },
  modalGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  modalField: { flex: 1 },
  cantidadInput: {
    backgroundColor: GRAY_LIGHT,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 10,
    padding: 12,
    fontSize: 26,
    fontWeight: "700",
    color: INK,
    textAlign: "center",
    marginTop: 6,
  },
  subtotalRow: {
    backgroundColor: "#EBF4FF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btnAgregar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 4,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  guiaBox: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    borderRadius: 14,
  },
  tablaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colDesc: { flex: 1 },
  colCant: { width: 44, textAlign: "center" },
  colTotal: { width: 90, textAlign: "right" },
  tablaFila: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: GRAY_BORDER,
  },
  dividerDashed: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: GRAY_BORDER,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  botonesRow: { flexDirection: "row", gap: 10 },
  btnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#0077EE",
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnOutlineText: { fontWeight: "700", fontSize: 17 },
  btnPrimary: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0077EE",
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: "#0077EE",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  btnDisabled: { backgroundColor: "#C4CBD8", shadowOpacity: 0 },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketStripe: { height: 5 },
  ticketBody: { padding: 16 },
  ticketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 10,
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalBadgeText: { fontSize: 14, fontWeight: "600" },
  metodoPagoGrid: { flexDirection: "row", gap: 12, marginBottom: 4 },
  metodoBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: GRAY_BORDER,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  metodoBtnActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  metodoBtnCredito: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  metodoIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  metodoIconBoxActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  metodoIconBoxCredito: { backgroundColor: "rgba(255,255,255,0.2)" },
  metodoBtnLabel: { fontSize: 18, fontWeight: "700", color: INK },
  metodoBtnLabelActive: { color: "#fff" },
  calculadoraCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },
  inputDinero: {
    backgroundColor: GRAY_LIGHT,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: INK,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    letterSpacing: -1,
  },
  vueltoBox: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: 2,
  },
  CreditoInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  btnFinalizar: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 999,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: GRAY_BORDER,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  opcionesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  closeGray: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  opcionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#C8E0FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  opcionBtnRojo: { borderColor: "#FECACA" },
  opcionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avisoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GRAY_LIGHT,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  loaderGlobalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loaderPanel: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  separadorYaAgregado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
  },
  separadorLinea: { flex: 1, height: 1, backgroundColor: GRAY_BORDER },
  separadorTexto: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: GRAY_TEXT,
    letterSpacing: 0.4,
  },
});
