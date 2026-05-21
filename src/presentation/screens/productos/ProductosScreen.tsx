// src/presentation/screens/productos/ProductosScreen.tsx

import { Feather } from "@expo/vector-icons";
import React from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import { Producto } from "../../../domain/entities/Producto";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import { FormularioModal } from "../../components/ui/FormularioModal";
import { Opcion, OpcionesModal } from "../../components/ui/OpcionesModal";
import { ProductoCard } from "./components/ProductoCard";
import { CAMPOS_PRODUCTO, useProductos } from "./hooks/useProductos";

export const ProductosScreen = () => {
  const { colors, typography, spacing, radius, sizes, shadows } = useTheme();

  const {
    productosFiltrados,
    busqueda,
    setBusqueda,
    esEdicion,
    valores,
    handleChange,
    productoSeleccionado,
    modalOpciones,
    modalFormulario,
    abrirCrear,
    abrirOpciones,
    abrirEditar,
    guardar,
    confirmarEliminar,
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
      label: "Eliminar producto",
      sublabel: "Esta acción no se puede deshacer",
      iconName: "delete-outline",
      iconLibrary: "material",
      color: colors.danger,
      colorFondo: colors.dangerLight,
      onPress: () => confirmarEliminar(producto),
    },
  ];

  return (
    <>
      <ScreenWrapper showBtnB={false} title="Productos">
        {/* Buscador */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            marginBottom: spacing.xxs,
          }}
        >
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

          {/* Contador */}
          <AppText variant="label" style={{ marginBottom: spacing.xs }}>
            {productosFiltrados.length} producto
            {productosFiltrados.length !== 1 ? "s" : ""}
          </AppText>
        </View>

        {/* Lista */}
        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductoCard producto={item} onPress={abrirOpciones} />
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
                No hay productos
              </AppText>
            </View>
          }
        />
      </ScreenWrapper>

      {/* FAB */}
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

      {/* Modal opciones */}
      {productoSeleccionado && (
        <OpcionesModal
          modal={modalOpciones}
          titulo="Opciones del producto"
          subtitulo={productoSeleccionado.nombre}
          opciones={opcionesModal(productoSeleccionado)}
          aviso="Los cambios solo afectan este producto"
        />
      )}

      {/* Modal formulario */}
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
    </>
  );
};
