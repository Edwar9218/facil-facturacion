// src/presentation/screens/productos/ProductosScreen.tsx

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import { Producto } from "../../../domain/entities/Producto";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import { FormularioModal } from "../../components/ui/FormularioModal";
import { Opcion, OpcionesModal } from "../../components/ui/OpcionesModal";
import { InventarioModal } from "./components/InventarioModal";
import { ProductoCard } from "./components/ProductoCard";
import {
  CAMPOS_PRODUCTO,
  FiltroStock,
  useProductos,
} from "./hooks/useProductos";

export const ProductosScreen = () => {
  const { colors, typography, spacing, radius, sizes, shadows } = useTheme();

  const {
    productosFiltrados,
    busqueda,
    setBusqueda,
    filtroStock,
    setFiltroStock,
    inventarioActivo,
    productosStockBajo,
    esEdicion,
    valores,
    handleChange,
    productoSeleccionado,
    modalOpciones,
    modalFormulario,
    abrirCrear,
    abrirOpciones,
    abrirEditar,
    abrirInventario,
    guardarInventario,
    guardar,
    confirmarEliminar,
    modalInventario,
  } = useProductos();

  // ── Opciones del modal 3 puntos ───────────────────────────────────────────
  const opcionesModal = (producto: Producto): Opcion[] => [
    {
      label: "Editar producto",
      sublabel: "Modifica nombre, precio o foto",
      iconName: "edit-2",
      iconLibrary: "feather",
      color: colors.primary,
      colorFondo: colors.primaryLight,
      onPress: () => abrirEditar(producto),
    },
    {
      label: "Inventario",
      sublabel: "Controla cuánto tienes de este producto",
      iconName: "package-variant",
      iconLibrary: "material-community",
      color: "#D97706",
      colorFondo: "#FEF3C7",
      onPress: () => abrirInventario(producto),
    },
    {
      label: "Eliminar producto",
      sublabel: "Esta acción no se puede deshacer",
      iconName: "delete-outline",
      iconLibrary: "material",
      color: colors.danger,
      colorFondo: colors.dangerLight,
      onPress: () => confirmarEliminar(producto),
    },
  ];

  // ── Config de filtros de stock ────────────────────────────────────────────
  const FILTROS: { value: FiltroStock; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "stock-bajo", label: "Stock bajo" },
    { value: "agotado", label: "Agotado" },
  ];

  return (
    <>
      <ScreenWrapper showBtnB={false} title="Productos">
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            marginBottom: spacing.xxs,
          }}
        >
          {/* ── Buscador ───────────────────────────────────────────────── */}
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
            <Feather
              name="search"
              size={sizes.iconSm}
              color={colors.grayText}
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: typography.size.md,
                color: colors.ink,
              }}
              placeholder="Buscar producto..."
              placeholderTextColor={colors.grayText}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda("")}>
                <Feather name="x" size={sizes.iconSm} color={colors.grayText} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Alerta de stock bajo (solo si inventario activo) ────────── */}
          {inventarioActivo && productosStockBajo > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#FEF3C7",
                borderRadius: radius.md,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: spacing.sm,
                borderWidth: 1,
                borderColor: "#FDE68A",
              }}
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={18}
                color="#D97706"
              />
              <AppText
                style={{
                  fontSize: 14,
                  color: "#92400E",
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {productosStockBajo} producto
                {productosStockBajo !== 1 ? "s" : ""} con stock bajo o agotado
              </AppText>
            </View>
          )}

          {/* ── Filtros de stock (solo si inventario activo) ─────────────── */}
          {inventarioActivo && (
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginBottom: spacing.sm,
              }}
            >
              {FILTROS.map((f) => {
                const activo = filtroStock === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => setFiltroStock(f.value)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: radius.md,
                      alignItems: "center",
                      backgroundColor: activo ? colors.primary : "#F3F4F6",
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: activo ? "#FFFFFF" : "#4B5563",
                      }}
                    >
                      {f.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Contador ─────────────────────────────────────────────────── */}
          <AppText variant="label" style={{ marginBottom: spacing.xs }}>
            {productosFiltrados.length} producto
            {productosFiltrados.length !== 1 ? "s" : ""}
          </AppText>
        </View>

        {/* ── Lista ────────────────────────────────────────────────────── */}
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductoCard
              producto={item}
              onPress={abrirOpciones}
              mostrarStock={inventarioActivo}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 100,
          }}
          ListEmptyComponent={
            <View
              style={{ alignItems: "center", paddingVertical: spacing.xxxl }}
            >
              <AppText style={{ fontSize: 40, marginBottom: spacing.xs }}>
                📦
              </AppText>
              <AppText variant="body" color={colors.grayText}>
                {filtroStock !== "todos"
                  ? "No hay productos con ese estado de stock"
                  : "No hay productos"}
              </AppText>
            </View>
          }
        />
      </ScreenWrapper>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: spacing.xl,
          right: spacing.lg,
          width: sizes.fabSize,
          height: sizes.fabSize,
          borderRadius: sizes.fabSize / 2,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          ...shadows.primary,
        }}
        onPress={abrirCrear}
      >
        <Feather name="plus" size={sizes.iconLg} color={colors.white} />
      </TouchableOpacity>

      {/* ── Modal opciones ───────────────────────────────────────────────── */}
      {productoSeleccionado && (
        <OpcionesModal
          modal={modalOpciones}
          titulo="Opciones del producto"
          subtitulo={productoSeleccionado.nombre}
          opciones={opcionesModal(productoSeleccionado)}
          aviso="Los cambios solo afectan este producto"
        />
      )}

      {/* ── Modal formulario ─────────────────────────────────────────────── */}
      <FormularioModal
        modal={modalFormulario}
        titulo={esEdicion ? "Editar producto" : "Nuevo producto"}
        subtitulo={
          esEdicion ? "Modifica los datos" : "Completa los datos del producto"
        }
        campos={CAMPOS_PRODUCTO}
        valores={valores}
        onChange={handleChange}
        onGuardar={guardar}
        labelGuardar="Agregar producto"
        labelGuardarEditar="Guardar cambios"
        esEdicion={esEdicion}
      />
      {/* ── Modal inventario ─────────────────────────────────────────────── */}
      <InventarioModal
        modal={modalInventario}
        producto={productoSeleccionado}
        onGuardar={guardarInventario}
      />
    </>
  );
};
