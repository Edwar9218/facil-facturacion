import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CajaRepositoryImpl } from "../../../data/repositories/CajaRepositoryImpl";
import { CreditoRepositoryImpl } from "../../../data/repositories/CreditoRepositoryImpl";
import { ResumenCredito } from "../../../domain/entities/Credito";
import { useTheme } from "../../../theme";
import { FormularioModal } from "../../components/ui/FormularioModal";
import { PasoCliente } from "./components/PasoCliente";
import { PasoCobro } from "./components/PasoCobro";
import { PasoProductos } from "./components/PasoProductos";
import { s } from "./components/tokens";
import {
  CAMPOS_CLIENTE_VENTA,
  CAMPOS_PRODUCTO_VENTA,
  useNuevaVenta,
} from "./hooks/useNuevaVenta";

const cajaRepo = new CajaRepositoryImpl();

export default function NuevaVentaScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { colors, spacing, shadows, sizes, typography } = useTheme();

  const dropdownMaxHeight = Math.max(160, screenHeight * 0.49);

  const router = useRouter();

  // ── Validación de caja ────────────────────────────────────────────────────
  const [cajaVerificada, setCajaVerificada] = React.useState(false);
  const [cajaAbierta, setCajaAbierta] = React.useState(false);

  const verificarCaja = async () => {
    const caja = await cajaRepo.getCajaAbierta();
    setCajaAbierta(!!caja);
    setCajaVerificada(true);
  };

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

  React.useEffect(() => {
    verificarCaja();
    cargarDatos();
    creditoRepo.getResumenes().then(setResumenesMora);
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          Keyboard.dismiss();
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // ── Modal opciones carrito ──────────────────────────────────────────────────
  const renderMenuOpciones = () => {
    if (!menuAbierto) return null;
    const BLUE = colors.primary;
    const BLUE_LIGHT = colors.primaryLight;
    return (
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={cerrarMenu}
      >
        <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
          <View style={s.sheetHandle} />
          <View style={s.opcionesHeader}>
            <View>
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}
              >
                Opciones del producto
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#7B8499",
                  marginTop: 2,
                }}
              >
                Selecciona una acción para este producto
              </Text>
            </View>
            <TouchableOpacity style={s.closeGray} onPress={cerrarMenu}>
              <MaterialIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.opcionBtn}
            activeOpacity={0.8}
            onPress={() => editarProducto(menuAbierto)}
          >
            <View style={[s.opcionIconBox, { backgroundColor: BLUE_LIGHT }]}>
              <MaterialIcons name="edit" size={24} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}
              >
                Editar producto
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#7B8499",
                  marginTop: 2,
                }}
              >
                Modifica la cantidad o precio
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={BLUE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.opcionBtn, s.opcionBtnRojo]}
            activeOpacity={0.8}
            onPress={() => eliminarConMenu(menuAbierto)}
          >
            <View style={[s.opcionIconBox, { backgroundColor: "#FDEAEA" }]}>
              <MaterialIcons name="delete-outline" size={24} color="#E03E3E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: "#E03E3E" }}
              >
                Eliminar producto
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#7B8499",
                  marginTop: 2,
                }}
              >
                Quita este producto de la venta
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#E03E3E" />
          </TouchableOpacity>

          <View style={s.avisoRow}>
            <MaterialIcons name="info-outline" size={14} color="#7B8499" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "400",
                color: "#7B8499",
                marginLeft: 6,
              }}
            >
              Esta acción solo afecta la venta actual
            </Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ── Pantalla de carga mientras verifica ──────────────────────────────────
  if (!cajaVerificada) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.grayBg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Pantalla de bloqueo si no hay caja abierta ───────────────────────────
  if (!cajaAbierta) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.grayBg }}>
        {/* Header igual al normal */}
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
            <View style={{ width: 100 }} />
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
                onPress={() => router.back()}
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

        {/* Mensaje de bloqueo */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFF7ED",
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: "#FED7AA",
              padding: 32,
              alignItems: "center",
              width: "100%",
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#FFEDD5",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="lock-outline" size={38} color="#EA580C" />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#111827",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Caja cerrada
            </Text>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "400",
                color: "#6B7280",
                textAlign: "center",
                lineHeight: 26,
                marginBottom: 28,
              }}
            >
              Para registrar ventas primero debes{"\n"}abrir la caja del día.
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#EA580C",
                borderRadius: 14,
                paddingVertical: 16,
                paddingHorizontal: 32,
                width: "100%",
                alignItems: "center",
                shadowColor: "#EA580C",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                Volver a abrir caja
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
                  onPress={retroceder}
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
                onPress={() => router.back()}
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
          scrollEnabled={
            productoActivo != null ||
            step === 3 ||
            carritoExpandido ||
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
          enabled={true}
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

          <PasoCliente
            step={step}
            flexPaso1={flexPaso1}
            filtroCliente={filtroCliente}
            setFiltroCliente={setFiltroCliente}
            filtroClienteActivo={filtroClienteActivo}
            setFiltroClienteActivo={setFiltroClienteActivo}
            clienteSeleccionado={clienteSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
            clientesFiltrados={clientesFiltrados}
            seleccionarCliente={seleccionarCliente}
            setValoresNuevoCliente={setValoresNuevoCliente}
            modalNuevoCliente={modalNuevoCliente}
            getMora={getMora}
            dropdownMaxHeight={dropdownMaxHeight}
            siguiente={siguiente}
          />

          <PasoProductos
            step={step}
            flexPaso2={flexPaso2}
            filtroProducto={filtroProducto}
            setFiltroProducto={setFiltroProducto}
            filtroActivo={filtroActivo}
            setFiltroActivo={setFiltroActivo}
            carrito={carrito}
            carritoExpandido={carritoExpandido}
            setCarritoExpandido={setCarritoExpandido}
            productoActivo={productoActivo}
            cantidadModal={cantidadModal}
            setCantidadModal={setCantidadModal}
            precioModal={precioModal}
            setPrecioModal={setPrecioModal}
            modoModal={modoModal}
            productosFiltrados={productosFiltrados}
            idsEnCarrito={idsEnCarrito}
            abrirModal={abrirModal}
            cerrarModal={cerrarModal}
            agregarAlCarrito={agregarAlCarrito}
            abrirMenu={abrirMenu}
            setValoresNuevoProducto={setValoresNuevoProducto}
            modalNuevoProducto={modalNuevoProducto}
            filtroInputRef={filtroInputRef}
            scrollRef={scrollRef}
            subtotalModal={subtotalModal}
            totalCarrito={totalCarrito}
            clienteSeleccionado={clienteSeleccionado}
            inventarioActivo={inventarioActivo}
            retroceder={retroceder}
            siguiente={siguiente}
            dropdownMaxHeight={dropdownMaxHeight}
          />

          <PasoCobro
            step={step}
            carrito={carrito}
            clienteSeleccionado={clienteSeleccionado}
            totalCarrito={totalCarrito}
            metodoPago={metodoPago}
            setMetodoPago={setMetodoPago}
            subMetodoPago={subMetodoPago}
            setSubMetodoPago={setSubMetodoPago}
            paganCon={paganCon}
            paganConNum={paganConNum}
            devuelve={devuelve}
            manejarCambioDinero={manejarCambioDinero}
            finalizarVenta={finalizarVenta}
            inputPagoRef={inputPagoRef}
            scrollRef={scrollRef}
            retroceder={retroceder}
          />

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
