import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Animated,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getEstadoStock } from "../../../../domain/entities/Producto";
import { useTheme } from "../../../../theme";
import { AppText } from "../../../components/ui/AppText";
import { ProductoCard } from "../../productos/components/ProductoCard";
import { EMOJIS, fmt, smoothLayout } from "../hooks/useNuevaVenta";
import { GRAY_TEXT, INK, s, T } from "./tokens";

interface Props {
  step: number;
  flexPaso2: Animated.AnimatedNode;
  filtroProducto: string;
  setFiltroProducto: (v: string) => void;
  filtroActivo: boolean;
  setFiltroActivo: (v: boolean) => void;
  carrito: any[];
  carritoExpandido: boolean;
  setCarritoExpandido: React.Dispatch<React.SetStateAction<boolean>>;
  productoActivo: any;
  cantidadModal: string;
  setCantidadModal: (v: string) => void;
  precioModal: string;
  setPrecioModal: (v: string) => void;
  modoModal: "agregar" | "editar";
  productosFiltrados: any[];
  idsEnCarrito: string[];
  abrirModal: (p: any) => void;
  cerrarModal: () => void;
  agregarAlCarrito: () => void;
  abrirMenu: (item: any) => void;
  setValoresNuevoProducto: React.Dispatch<React.SetStateAction<any>>;
  modalNuevoProducto: { abrir: () => void };
  filtroInputRef: React.RefObject<TextInput>;
  scrollRef: React.RefObject<any>;
  subtotalModal: number;
  totalCarrito: number;
  clienteSeleccionado: any;
  inventarioActivo: boolean;
  retroceder: () => void;
  siguiente: () => void;
  dropdownMaxHeight: number;
}

export function PasoProductos({
  step,
  flexPaso2,
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
  modoModal,
  productosFiltrados,
  idsEnCarrito,
  abrirModal,
  cerrarModal,
  agregarAlCarrito,
  abrirMenu,
  setValoresNuevoProducto,
  modalNuevoProducto,
  filtroInputRef,
  scrollRef,
  subtotalModal,
  totalCarrito,
  clienteSeleccionado,
  inventarioActivo,
  retroceder,
  siguiente,
  dropdownMaxHeight,
}: Props) {
  const { colors, spacing, radius, shadows, sizes, typography } = useTheme();
  const BLUE = colors.primary;
  const BLUE_LIGHT = colors.primaryLight;

  const [alturaInputProducto, setAlturaInputProducto] = React.useState(56);

  const CircleStep = ({ num, active }: { num: number; active: boolean }) => (
    <View style={[s.circle, active ? s.circleActive : s.circleInactive]}>
      <AppText style={s.circleText}>{num}</AppText>
    </View>
  );

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
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <MaterialIcons
            name="cancel"
            size={sizes.iconSm}
            color={colors.grayText}
          />
        </TouchableOpacity>
      )}
    </View>
  );

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
        <AppText style={T.bodyBold}>{label}</AppText>
        {sublabel ? <AppText style={T.caption}>{sublabel}</AppText> : null}
      </View>
      <MaterialIcons name="chevron-right" size={18} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[s.stepRow, { flex: flexPaso2, zIndex: 40 }]}>
      <View style={s.timelineCol}>
        <CircleStep num={2} active={step >= 2} />
        <View style={s.line} />
      </View>
      <View style={s.contentCol}>
        <View style={s.stepHeader}>
          <Ionicons name="cart" size={16} color={step >= 2 ? BLUE : "#CCC"} />
          <AppText
            style={[
              T.h3,
              step >= 2 ? { color: INK, fontWeight: "700" } : { color: "#CCC" },
            ]}
          >
            Agregar productos
          </AppText>
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
                      : { backgroundColor: "#E6F7EF" },
                  ]}
                >
                  <AppText
                    style={[
                      T.captionMd,
                      { color: modoModal === "editar" ? BLUE : "#2EAA6E" },
                    ]}
                  >
                    {modoModal === "editar"
                      ? "✏️  Editando producto"
                      : "➕  Agregar producto"}
                  </AppText>
                </View>

                <View style={s.productoModal}>
                  <View style={s.modalHeader}>
                    <AppText style={{ fontSize: 30 }}>
                      {EMOJIS[productoActivo.nombre] ?? "🛒"}
                    </AppText>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <AppText style={T.h2}>{productoActivo.nombre}</AppText>
                      <AppText style={T.caption}>
                        {modoModal === "editar"
                          ? `Cantidad actual: ${
                              carrito.find((i) => i.id === productoActivo.id)
                                ?.qty ?? "-"
                            }`
                          : `Disponible: ${productoActivo.stock ?? 0} ${productoActivo.unidad}`}
                      </AppText>
                    </View>
                    <TouchableOpacity
                      onPress={cerrarModal}
                      style={s.closeBtnRed}
                    >
                      <MaterialIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={s.modalGrid}>
                    <View style={s.modalField}>
                      <AppText style={T.label}>Precio unitario</AppText>
                      <TextInput
                        style={[s.cantidadInput, { color: BLUE }]}
                        keyboardType="numeric"
                        value={precioModal}
                        onChangeText={(txt) => {
                          const limpio = txt.replace(/[^0-9]/g, "");
                          setPrecioModal(limpio);
                        }}
                        placeholder="0"
                        placeholderTextColor={GRAY_TEXT}
                      />
                    </View>
                    <View style={s.modalField}>
                      <AppText style={T.label}>
                        Cantidad ({productoActivo.unidad})
                      </AppText>
                      <TextInput
                        ref={filtroInputRef}
                        style={s.cantidadInput}
                        keyboardType="numeric"
                        value={cantidadModal}
                        onChangeText={setCantidadModal}
                      />
                    </View>
                  </View>

                  <View style={s.subtotalRow}>
                    <AppText style={T.caption}>Subtotal</AppText>
                    <AppText style={[T.h2, { color: BLUE }]}>
                      {fmt(subtotalModal)}
                    </AppText>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    s.btnAgregar,
                    modoModal === "editar" && { backgroundColor: BLUE },
                  ]}
                  onPress={agregarAlCarrito}
                >
                  <AppText style={s.btnPrimaryText}>
                    {modoModal === "editar"
                      ? "Guardar cambios"
                      : "Agregar al pedido"}
                  </AppText>
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
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            filtroInputRef.current?.focus();
                          });
                        });
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
                          <AppText style={T.body}>
                            Escribe para buscar un producto
                          </AppText>
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
                                <AppText style={{ color: BLUE }}>
                                  "{filtroProducto.trim()}"
                                </AppText>
                              </>
                            ),
                            onPress: () => {
                              setValoresNuevoProducto((prev: any) => ({
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
                                    ? () => abrirMenu(itemCarrito)
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
                                    <AppText style={s.separadorTexto}>
                                      Ya en el pedido
                                    </AppText>
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
                    <AppText style={T.label}>Cliente</AppText>
                    <AppText style={T.bodyBoldC}>
                      {clienteSeleccionado?.nombre}
                    </AppText>
                  </View>
                  <View style={s.tablaHeaderRow}>
                    <AppText style={[T.label, s.colDesc]}>Producto</AppText>
                    <AppText style={[T.label, s.colCant]}>Cant</AppText>
                    <AppText style={[T.label, s.colTotal]}>Total</AppText>
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
                      <AppText style={{ fontSize: 32 }}>🛒</AppText>
                      <AppText style={[T.caption, { textAlign: "center" }]}>
                        Aún no has agregado productos
                      </AppText>
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
                        onPress={() => abrirMenu(item)}
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
                              <AppText
                                style={[T.bodyBold, s.colDesc]}
                                numberOfLines={1}
                              >
                                {item.nombre}
                              </AppText>
                              <AppText style={[T.body, s.colCant]}>
                                {item.qty}
                              </AppText>
                              <AppText style={[T.bodyBold, s.colTotal]}>
                                {(item.precio * item.qty).toLocaleString(
                                  "es-CO",
                                )}
                              </AppText>
                            </View>
                            <AppText style={[T.caption, { marginTop: 2 }]}>
                              {fmt(item.precio)} / {item.unidad}
                            </AppText>
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
                      setCarritoExpandido((v) => {
                        if (v) {
                          setTimeout(() => {
                            scrollRef.current?.scrollTo({
                              y: 0,
                              animated: true,
                            });
                          }, 50);
                        }
                        return !v;
                      });
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
                      <AppText style={T.caption}>
                        {carrito.length}{" "}
                        {carrito.length === 1 ? "producto" : "productos"}
                      </AppText>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <AppText style={T.label}>Total</AppText>
                      <AppText style={[T.h2, { color: INK }]}>
                        {fmt(totalCarrito)}
                      </AppText>
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
                <TouchableOpacity style={s.btnOutline} onPress={retroceder}>
                  <MaterialIcons name="arrow-back" size={16} color={BLUE} />
                  <AppText style={[s.btnOutlineText, { color: BLUE }]}>
                    Atrás
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btnPrimary, carrito.length === 0 && s.btnDisabled]}
                  onPress={carrito.length > 0 ? siguiente : undefined}
                  activeOpacity={carrito.length > 0 ? 0.7 : 1}
                >
                  <AppText style={s.btnPrimaryText}>
                    {carrito.length === 0 ? "Agrega un producto" : "Continuar"}
                  </AppText>
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
}
