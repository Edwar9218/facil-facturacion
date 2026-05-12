import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Producto } from "../../../domain/entities/Producto";
import { useTheme } from "../../../theme";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";

const UNIDADES = ["Kg", "Und", "Lt", "g", "ml", "Lb", "Caja", "Bolsa"];

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

const formatearPrecio = (texto: string) => {
  const soloNumeros = texto.replace(/[^0-9]/g, "");
  return soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const ProductosScreen = () => {
  const { colors, typography, spacing, radius, sizes, shadows } = useTheme();

  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [modalForm, setModalForm] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(
    null,
  );
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [unidad, setUnidad] = useState("Kg");
  const [disponible, setDisponible] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [modalUnidades, setModalUnidades] = useState(false);
  const [modalOpciones, setModalOpciones] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [modalFoto, setModalFoto] = useState(false);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  const abrirCrear = () => {
    setProductoEditando(null);
    setNombre("");
    setPrecio("");
    setUnidad("Kg");
    setDisponible("");
    setImagen(null);
    setModalForm(true);
  };

  const abrirEditar = (producto: Producto) => {
    setModalOpciones(false);
    setTimeout(() => {
      setProductoEditando(producto);
      setNombre(producto.nombre);
      setPrecio(formatearPrecio(String(producto.precio)));
      setUnidad(producto.unidad);
      setDisponible(String(producto.disponible));
      setImagen(producto.imagen ?? null);
      setModalForm(true);
    }, 300);
  };

  const guardar = () => {
    if (!nombre.trim() || !precio.trim() || !unidad.trim()) return;
    if (productoEditando) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id === productoEditando.id
            ? {
                ...p,
                nombre: nombre.trim(),
                precio: Number(precio.replace(/\./g, "")),
                unidad,
                disponible: Number(disponible) || 0,
                imagen: imagen ?? undefined,
              }
            : p,
        ),
      );
    } else {
      const nuevo: Producto = {
        id: String(Date.now()),
        nombre: nombre.trim(),
        precio: Number(precio.replace(/\./g, "")),
        unidad,
        disponible: Number(disponible) || 0,
        imagen: imagen ?? undefined,
      };
      setProductos((prev) => [nuevo, ...prev]);
    }
    setModalForm(false);
  };

  const confirmarEliminar = (producto: Producto) => {
    setModalOpciones(false);
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
              setProductos((prev) => prev.filter((p) => p.id !== producto.id)),
          },
        ],
      );
    }, 300);
  };

  const tomarFoto = async () => {
    setModalFoto(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const elegirGaleria = async () => {
    setModalFoto(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos acceso a la galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  // ── Estilos derivados del theme ──────────────────────────────────────────
  const s = StyleSheet.create({
    topSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      marginBottom: spacing.xxs,
    },
    searchWrapper: {
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
    },
    searchInput: {
      flex: 1,
      fontSize: typography.size.md,
      color: colors.ink,
    },
    contador: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      color: colors.grayText,
      marginBottom: spacing.xs,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.grayBorder,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.md,
      ...shadows.md,
    },
    cardImagen: {
      width: sizes.productImageMd,
      height: sizes.productImageMd,
      borderRadius: radius.md,
    },
    iconBox: {
      width: sizes.productImageMd,
      height: sizes.productImageMd,
      borderRadius: radius.md,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    cardNombre: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    cardMeta: {
      fontSize: typography.size.sm,
      color: colors.grayText,
      marginTop: spacing.xxs,
    },
    cardPrecio: {
      fontSize: typography.size.lg,
      fontWeight: typography.weight.extraBold,
      color: colors.primary,
      marginTop: spacing.xxs,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: spacing.xxxl,
    },
    emptyText: {
      fontSize: typography.size.lg,
      color: colors.grayText,
      marginTop: spacing.xs,
    },
    fab: {
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
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlayDark,
      justifyContent: "flex-end",
    },
    bottomSheet: {
      backgroundColor: colors.white,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      padding: spacing.lg,
      paddingBottom: spacing.xxxl,
      maxHeight: "90%",
    },
    sheetHandle: {
      width: 36,
      height: 4,
      backgroundColor: colors.grayBorder,
      borderRadius: radius.full,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.md,
    },
    sheetTitle: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    sheetSubtitle: {
      fontSize: typography.size.sm,
      color: colors.grayText,
      marginTop: spacing.xxs,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.grayText,
      alignItems: "center",
      justifyContent: "center",
    },
    opcionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.primaryMid,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.xs,
      backgroundColor: colors.white,
    },
    opcionIconBox: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    opcionTitulo: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    opcionSub: {
      fontSize: typography.size.xs,
      color: colors.grayText,
      marginTop: spacing.xxs,
    },
    avisoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.grayBg,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.xxs,
    },
    avisoText: {
      fontSize: typography.size.xs,
      color: colors.grayText,
    },
    inputLabel: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.bold,
      color: colors.ink,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.grayBg,
      borderWidth: 1,
      borderColor: colors.grayBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.size.md,
      color: colors.ink,
      marginBottom: spacing.md,
    },
    precioWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.grayBg,
      borderWidth: 1,
      borderColor: colors.grayBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    precioSimbolo: {
      fontSize: typography.size.xl,
      fontWeight: typography.weight.bold,
      color: colors.grayText,
      marginRight: spacing.xs,
    },
    precioInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      fontSize: typography.size.md,
      color: colors.ink,
    },
    selectorBtn: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.grayBg,
      borderWidth: 1,
      borderColor: colors.grayBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    selectorText: {
      fontSize: typography.size.md,
      color: colors.ink,
    },
    fotoBtn: {
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.primaryMid,
      borderRadius: radius.lg,
      paddingVertical: spacing.xxl,
      alignItems: "center",
      marginBottom: spacing.lg,
      gap: spacing.xxs,
    },
    fotoBtnIconBox: {
      width: 60,
      height: 60,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xxs,
    },
    fotoBtnTitle: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      color: colors.primary,
    },
    fotoBtnSub: {
      fontSize: typography.size.xs,
      color: colors.grayText,
    },
    imagenPreviewWrapper: {
      position: "relative",
      marginBottom: spacing.lg,
    },
    imagenPreview: {
      width: "100%",
      height: 180,
      borderRadius: radius.lg,
    },
    imagenCambiarBtn: {
      position: "absolute",
      bottom: spacing.xs,
      left: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxs,
      backgroundColor: colors.shadowDark,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radius.full,
    },
    imagenCambiarText: {
      fontSize: typography.size.xs,
      color: colors.white,
      fontWeight: typography.weight.medium,
    },
    imagenEliminarBtn: {
      position: "absolute",
      top: spacing.xs,
      right: spacing.xs,
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    btnGuardar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      marginTop: spacing.xxs,
      ...shadows.primary,
    },
    btnDisabled: {
      backgroundColor: "#C4CBD8",
      shadowOpacity: 0,
      elevation: 0,
    },
    btnGuardarText: {
      color: colors.white,
      fontSize: typography.size.lg,
      fontWeight: typography.weight.bold,
    },
    aviso: {
      fontSize: typography.size.xs,
      color: colors.grayText,
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    fotoOpcion: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.grayBorder,
      marginBottom: spacing.xs,
    },
    fotoOpcionIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    fotoOpcionTitulo: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.bold,
      color: colors.ink,
    },
    fotoOpcionSub: {
      fontSize: typography.size.xs,
      color: colors.grayText,
      marginTop: spacing.xxs,
    },
    fotoCancelar: {
      alignItems: "center",
      paddingVertical: spacing.md,
      marginTop: spacing.xxs,
    },
    fotoCancelarText: {
      fontSize: typography.size.md,
      fontWeight: typography.weight.medium,
      color: colors.primary,
    },
    unidadOpcion: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.xxs,
    },
    unidadOpcionActiva: {
      backgroundColor: colors.primaryLight,
    },
    unidadText: {
      fontSize: typography.size.md,
      color: colors.ink,
    },
  });

  const renderProducto = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.7}
      onPress={() => {
        setProductoSeleccionado(item);
        setModalOpciones(true);
      }}
    >
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={s.cardImagen} />
      ) : (
        <View style={s.iconBox}>
          <MaterialIcons
            name="inventory-2"
            size={sizes.iconLg}
            color={colors.primary}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.cardNombre}>{item.nombre}</Text>
        <Text style={s.cardMeta}>
          {item.unidad} · Stock: {item.disponible}
        </Text>
        <Text style={s.cardPrecio}>{fmt(item.precio)}</Text>
      </View>
      <MaterialIcons
        name="more-vert"
        size={sizes.iconLg}
        color={colors.grayText}
      />
    </TouchableOpacity>
  );

  return (
    <>
      <ScreenWrapper showBtnB={false} title="Productos">
        <View style={s.topSection}>
          <View style={s.searchWrapper}>
            <Feather
              name="search"
              size={sizes.iconSm}
              color={colors.grayText}
            />
            <TextInput
              style={s.searchInput}
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
          <Text style={s.contador}>
            {productosFiltrados.length} producto
            {productosFiltrados.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <FlatList
          data={productosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderProducto}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 40, marginBottom: spacing.xs }}>📦</Text>
              <Text style={s.emptyText}>No hay productos</Text>
            </View>
          }
          contentContainerStyle={s.listContent}
        />
      </ScreenWrapper>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={abrirCrear}>
        <Feather name="plus" size={sizes.iconLg} color={colors.white} />
      </TouchableOpacity>

      {/* ── Modal opciones ── */}
      <Modal
        visible={modalOpciones}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpciones(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalOpciones(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Opciones del producto</Text>
                <Text style={s.sheetSubtitle}>
                  {productoSeleccionado?.nombre}
                </Text>
              </View>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setModalOpciones(false)}
              >
                <Feather name="x" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.opcionBtn}
              onPress={() =>
                productoSeleccionado && abrirEditar(productoSeleccionado)
              }
            >
              <View
                style={[
                  s.opcionIconBox,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Feather
                  name="edit-2"
                  size={sizes.iconMd}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.opcionTitulo}>Editar producto</Text>
                <Text style={s.opcionSub}>Modifica nombre, precio o foto</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={sizes.iconMd}
                color={colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.opcionBtn, { borderColor: "#FECACA" }]}
              onPress={() =>
                productoSeleccionado && confirmarEliminar(productoSeleccionado)
              }
            >
              <View
                style={[
                  s.opcionIconBox,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={sizes.iconMd}
                  color={colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.opcionTitulo, { color: colors.danger }]}>
                  Eliminar producto
                </Text>
                <Text style={s.opcionSub}>
                  Esta acción no se puede deshacer
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={sizes.iconMd}
                color={colors.danger}
              />
            </TouchableOpacity>

            <View style={s.avisoRow}>
              <MaterialIcons
                name="info-outline"
                size={sizes.iconXs}
                color={colors.grayText}
              />
              <Text style={s.avisoText}>
                Los cambios solo afectan este producto
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal formulario ── */}
      <Modal
        visible={modalForm}
        transparent
        animationType="slide"
        onRequestClose={() => setModalForm(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalForm(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
            <View style={s.sheetHandle} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={s.sheetHeader}>
                <View>
                  <Text style={s.sheetTitle}>
                    {productoEditando ? "Editar producto" : "Agregar producto"}
                  </Text>
                  <Text style={s.sheetSubtitle}>
                    {productoEditando
                      ? "Modifica los datos"
                      : "Completa los datos del producto"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.closeBtn}
                  onPress={() => setModalForm(false)}
                >
                  <Feather name="x" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={s.inputLabel}>Nombre del producto</Text>
              <TextInput
                style={s.input}
                placeholder="Ej: Mango, Limón, etc."
                placeholderTextColor={colors.grayText}
                value={nombre}
                onChangeText={setNombre}
                autoFocus
              />

              <Text style={s.inputLabel}>Precio por unidad</Text>
              <View style={s.precioWrapper}>
                <Text style={s.precioSimbolo}>$</Text>
                <TextInput
                  style={s.precioInput}
                  placeholder="0"
                  placeholderTextColor={colors.grayText}
                  keyboardType="numeric"
                  value={precio}
                  onChangeText={(texto) => setPrecio(formatearPrecio(texto))}
                />
              </View>

              <Text style={s.inputLabel}>Unidad de medida</Text>
              <TouchableOpacity
                style={s.selectorBtn}
                onPress={() => setModalUnidades(true)}
              >
                <Text style={s.selectorText}>{unidad}</Text>
                <Feather
                  name="chevron-down"
                  size={sizes.iconSm}
                  color={colors.grayText}
                />
              </TouchableOpacity>

              <Text style={s.inputLabel}>Cantidad disponible</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                placeholderTextColor={colors.grayText}
                keyboardType="numeric"
                value={disponible}
                onChangeText={setDisponible}
              />

              <Text style={s.inputLabel}>
                Foto del producto{" "}
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: typography.weight.regular,
                  }}
                >
                  (opcional)
                </Text>
              </Text>

              {imagen ? (
                <View style={s.imagenPreviewWrapper}>
                  <Image source={{ uri: imagen }} style={s.imagenPreview} />
                  <TouchableOpacity
                    style={s.imagenCambiarBtn}
                    onPress={() => setModalFoto(true)}
                  >
                    <Feather name="edit-2" size={14} color={colors.white} />
                    <Text style={s.imagenCambiarText}>Cambiar foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.imagenEliminarBtn}
                    onPress={() => setImagen(null)}
                  >
                    <Feather name="x" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.fotoBtn}
                  onPress={() => setModalFoto(true)}
                >
                  <View style={s.fotoBtnIconBox}>
                    <Feather
                      name="camera"
                      size={sizes.iconXl}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={s.fotoBtnTitle}>Agregar foto</Text>
                  <Text style={s.fotoBtnSub}>
                    Toca para agregar una foto del producto
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  s.btnGuardar,
                  (!nombre.trim() || !precio.trim()) && s.btnDisabled,
                ]}
                onPress={guardar}
              >
                <Feather
                  name={productoEditando ? "check" : "plus"}
                  size={sizes.iconSm}
                  color={colors.white}
                />
                <Text style={s.btnGuardarText}>
                  {productoEditando ? "Guardar cambios" : "Agregar producto"}
                </Text>
              </TouchableOpacity>

              <Text style={s.aviso}>* Nombre y precio son obligatorios</Text>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal foto ── */}
      <Modal
        visible={modalFoto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFoto(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalFoto(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
            <View style={s.sheetHandle} />
            <Text
              style={[
                s.sheetTitle,
                { textAlign: "center", marginBottom: spacing.lg },
              ]}
            >
              Selecciona una opción
            </Text>
            <TouchableOpacity style={s.fotoOpcion} onPress={tomarFoto}>
              <View
                style={[s.fotoOpcionIcon, { backgroundColor: colors.primary }]}
              >
                <Feather
                  name="camera"
                  size={sizes.iconMd}
                  color={colors.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fotoOpcionTitulo}>Tomar foto</Text>
                <Text style={s.fotoOpcionSub}>
                  Usa la cámara para tomar una foto
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.fotoOpcion} onPress={elegirGaleria}>
              <View
                style={[s.fotoOpcionIcon, { backgroundColor: colors.success }]}
              >
                <MaterialIcons
                  name="photo-library"
                  size={sizes.iconMd}
                  color={colors.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fotoOpcionTitulo}>Elegir de galería</Text>
                <Text style={s.fotoOpcionSub}>
                  Selecciona una foto desde tu galería
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.fotoCancelar}
              onPress={() => setModalFoto(false)}
            >
              <Text style={s.fotoCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal unidades ── */}
      <Modal
        visible={modalUnidades}
        transparent
        animationType="slide"
        onRequestClose={() => setModalUnidades(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalUnidades(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.bottomSheet}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { marginBottom: spacing.md }]}>
              Unidad de medida
            </Text>
            {UNIDADES.map((u) => (
              <TouchableOpacity
                key={u}
                style={[s.unidadOpcion, unidad === u && s.unidadOpcionActiva]}
                onPress={() => {
                  setUnidad(u);
                  setModalUnidades(false);
                }}
              >
                <Text
                  style={[
                    s.unidadText,
                    unidad === u && {
                      color: colors.primary,
                      fontWeight: typography.weight.bold,
                    },
                  ]}
                >
                  {u}
                </Text>
                {unidad === u && (
                  <Feather
                    name="check"
                    size={sizes.iconSm}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
