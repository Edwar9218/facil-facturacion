import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Producto } from "../../../domain/entities/Producto";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { AppText } from "../../components/ui/AppText";
import {
  Campo,
  FormularioModal,
  ValoresCampo,
} from "../../components/ui/FormularioModal";
import { Opcion, OpcionesModal } from "../../components/ui/OpcionesModal";
import { useSlideModal } from "../../hooks/useSlideModal";
import { ProductoCard } from "./components/ProductoCard";

// ── Mock ─────────────────────────────────────────────────────────────────────
const PRODUCTOS_MOCK: Producto[] = [
  { id: "1", nombre: "Mango", precio: 5000, unidad: "Kg", disponible: 50 },
  { id: "2", nombre: "Limón", precio: 3000, unidad: "Kg", disponible: 80 },
  { id: "3", nombre: "Naranja", precio: 4000, unidad: "Kg", disponible: 60 },
  { id: "4", nombre: "Banano", precio: 2500, unidad: "Kg", disponible: 100 },
  { id: "5", nombre: "Piña", precio: 6000, unidad: "Und", disponible: 25 },
  { id: "6", nombre: "Fresa", precio: 8000, unidad: "Kg", disponible: 15 },
];

const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

// ── Campos del formulario de producto ────────────────────────────────────────
const CAMPOS_PRODUCTO: Campo[] = [
  {
    id: "nombre",
    label: "Nombre del producto",
    placeholder: "Ej: Mango, Limón, etc.",
    tipo: "texto",
    obligatorio: true,
  },
  {
    id: "precio",
    label: "Precio por unidad",
    placeholder: "0",
    tipo: "precio",
    obligatorio: true,
  },
  {
    id: "unidad",
    label: "Unidad de medida",
    tipo: "selector",
    opciones: ["Kg", "Und", "Lt", "g", "ml", "Lb", "Caja", "Bolsa"],
    obligatorio: true,
  },
  {
    id: "disponible",
    label: "Cantidad disponible",
    placeholder: "0",
    tipo: "numero",
    obligatorio: false,
  },
  {
    id: "imagen",
    label: "Foto del producto",
    tipo: "foto",
    obligatorio: false,
  },
];

// ── Valores vacíos ────────────────────────────────────────────────────────────
const valoresVacios = (): ValoresCampo => ({
  nombre: "",
  precio: "",
  unidad: "Kg",
  disponible: "",
  imagen: "",
});

export const ProductosScreen = () => {
  const { colors, typography, spacing, radius, sizes, shadows } = useTheme();

  // ── Estado ────────────────────────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [esEdicion, setEsEdicion] = useState(false);
  const [valores, setValores] = useState<ValoresCampo>(valoresVacios());

  // ── Modales ───────────────────────────────────────────────────────────────
  const modalOpciones = useSlideModal(20);
  const modalFormulario = useSlideModal(300);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (id: string, valor: string) => {
    setValores((prev) => ({ ...prev, [id]: valor }));
  };

  const abrirCrear = () => {
    setEsEdicion(false);
    setProductoSeleccionado(null);
    setValores(valoresVacios());
    modalFormulario.abrir();
  };

  const abrirEditar = (producto: Producto) => {
    modalOpciones.cerrar(() => {
      setTimeout(() => {
        setEsEdicion(true);
        setProductoSeleccionado(producto);
        setValores({
          nombre: producto.nombre,
          precio: String(producto.precio).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
          unidad: producto.unidad,
          disponible: String(producto.disponible),
          imagen: producto.imagen ?? "",
        });
        modalFormulario.abrir();
      }, 300);
    });
  };

  const guardar = () => {
    if (!valores.nombre.trim() || !valores.precio.trim()) return;

    const precioNum = Number(valores.precio.replace(/\./g, ""));

    if (esEdicion && productoSeleccionado) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id === productoSeleccionado.id
            ? {
                ...p,
                nombre: valores.nombre.trim(),
                precio: precioNum,
                unidad: valores.unidad,
                disponible: Number(valores.disponible) || 0,
                imagen: valores.imagen || undefined,
              }
            : p,
        ),
      );
    } else {
      const nuevo: Producto = {
        id: String(Date.now()),
        nombre: valores.nombre.trim(),
        precio: precioNum,
        unidad: valores.unidad,
        disponible: Number(valores.disponible) || 0,
        imagen: valores.imagen || undefined,
      };
      setProductos((prev) => [nuevo, ...prev]);
    }
    modalFormulario.cerrar();
  };

  const confirmarEliminar = (producto: Producto) => {
    modalOpciones.cerrar(() => {
      setTimeout(() => {
        Alert.alert(
          "Eliminar producto",
          `¿Seguro que quieres eliminar "${producto.nombre}"?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: () =>
                setProductos((prev) =>
                  prev.filter((p) => p.id !== producto.id),
                ),
            },
          ],
        );
      }, 150);
    });
  };

  // ── Opciones del modal ────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
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
            <ProductoCard
              producto={item}
              onPress={(producto) => {
                setProductoSeleccionado(producto);
                modalOpciones.abrir();
              }}
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
        titulo={esEdicion ? "Editar producto" : "Agregar producto"}
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
