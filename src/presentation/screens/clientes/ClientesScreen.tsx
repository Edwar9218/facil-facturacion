import { Feather } from "@expo/vector-icons";
import React from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import { Cliente } from "../../../domain/entities/Cliente";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import { FormularioModal } from "../../components/ui/FormularioModal";
import { Opcion, OpcionesModal } from "../../components/ui/OpcionesModal";
import { ClienteCard } from "./components/ClienteCard";
import { CAMPOS_CLIENTE, useClientes } from "./hooks/useClientes";

export const ClientesScreen = () => {
  const { colors, typography, spacing, radius, sizes, shadows } = useTheme();

  const {
    clientesFiltrados,
    busqueda,
    setBusqueda,
    esEdicion,
    valores,
    handleChange,
    clienteSeleccionado,
    modalOpciones,
    modalFormulario,
    abrirCrear,
    abrirOpciones,
    abrirEditar,
    guardar,
    confirmarEliminar,
    getMora,
  } = useClientes();

  // ── Opciones del modal 3 puntos ───────────────────────────────────────────
  const opcionesModal = (cliente: Cliente): Opcion[] => [
    {
      label: "Editar cliente",
      sublabel: "Modifica nombre, teléfono o dirección",
      iconName: "edit-2",
      iconLibrary: "feather",
      color: colors.primary,
      colorFondo: colors.primaryLight,
      onPress: () => abrirEditar(cliente),
    },
    {
      label: "Eliminar cliente",
      sublabel: "Esta acción no se puede deshacer",
      iconName: "delete-outline",
      iconLibrary: "material",
      color: colors.danger,
      colorFondo: colors.dangerLight,
      onPress: () => confirmarEliminar(cliente),
    },
  ];

  return (
    <>
      <ScreenWrapper showBtnB={false} title="Clientes">
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
              placeholder="Buscar cliente..."
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
            {clientesFiltrados.length} cliente
            {clientesFiltrados.length !== 1 ? "s" : ""}
          </AppText>
        </View>

        {/* Lista */}
        <FlatList
          data={clientesFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClienteCard
              cliente={item}
              enMora={getMora(item.id).enMora}
              totalDeuda={getMora(item.id).saldo}
              onPress={abrirOpciones}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: 100,
          }}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                paddingVertical: spacing.xxxl,
              }}
            >
              <AppText style={{ fontSize: 40, marginBottom: spacing.xs }}>
                👥
              </AppText>
              <AppText variant="body" color={colors.grayText}>
                No hay clientes
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
      {clienteSeleccionado && (
        <OpcionesModal
          modal={modalOpciones}
          titulo="Opciones del cliente"
          subtitulo={clienteSeleccionado.nombre}
          opciones={opcionesModal(clienteSeleccionado)}
          aviso="Los cambios solo afectan este cliente"
        />
      )}

      {/* Modal formulario */}
      <FormularioModal
        modal={modalFormulario}
        titulo={esEdicion ? "Editar cliente" : "Nuevo cliente"}
        subtitulo={
          esEdicion ? "Modifica los datos" : "Completa los datos del cliente"
        }
        campos={CAMPOS_CLIENTE}
        valores={valores}
        onChange={handleChange}
        onGuardar={guardar}
        labelGuardar="Agregar cliente"
        labelGuardarEditar="Guardar cambios"
        esEdicion={esEdicion}
      />
    </>
  );
};
