import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  TextInput,
  UIManager,
} from "react-native";
import { ClienteRepositoryImpl } from "../../../../data/repositories/ClienteRepositoryImpl";
import { ProductoRepositoryImpl } from "../../../../data/repositories/ProductoRepositoryImpl";
import { VentaRepositoryImpl } from "../../../../data/repositories/VentaRepositoryImpl";
import { Cliente } from "../../../../domain/entities/Cliente";
import { Producto } from "../../../../domain/entities/Producto";
import { useSlideModal } from "../../../hooks/useSlideModal";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Repos ─────────────────────────────────────────────────────────────────────
const clienteRepo = new ClienteRepositoryImpl();
const productoRepo = new ProductoRepositoryImpl();
const ventaRepo = new VentaRepositoryImpl();

// ── Helpers ───────────────────────────────────────────────────────────────────
export const smoothLayout = () =>
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      220,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ),
  );

export const EMOJIS: Record<string, string> = {
  Mango: "🥭",
  Limón: "🍋",
  Naranja: "🍊",
  Banano: "🍌",
  Mandarina: "🍊",
  Papaya: "🍈",
  Piña: "🍍",
  Guayaba: "🍏",
  Maracuyá: "🌕",
  "Tomate de árbol": "🍅",
  Fresa: "🍓",
  Uva: "🍇",
};

export const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

export const FILTRO_SCROLL_OFFSET = 200;

// ── Campos formularios ────────────────────────────────────────────────────────
export const CAMPOS_CLIENTE_VENTA = [
  {
    id: "nombre",
    label: "Nombre completo",
    tipo: "texto" as const,
    obligatorio: true,
    maxLength: 22,
  },
  {
    id: "telefono",
    label: "Teléfono",
    tipo: "telefono" as const,
    obligatorio: true,
  },
  {
    id: "direccion",
    label: "Dirección",
    tipo: "texto" as const,
    obligatorio: false,
  },
];

export const CAMPOS_PRODUCTO_VENTA = [
  {
    id: "nombre",
    label: "Nombre del producto",
    placeholder: "Ej: Mango...",
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

// ── Hook principal ────────────────────────────────────────────────────────────
export const useNuevaVenta = () => {
  const [step, setStep] = useState(1);

  // ── Paso 1 — Cliente ──────────────────────────────────────────────────────
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroClienteActivo, setFiltroClienteActivo] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [valoresNuevoCliente, setValoresNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
  });

  // ── Paso 2 — Productos ────────────────────────────────────────────────────
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [carritoExpandido, setCarritoExpandido] = useState(false);
  const [productoActivo, setProductoActivo] = useState<Producto | null>(null);
  const [cantidadModal, setCantidadModal] = useState("1");
  const [precioModal, setPrecioModal] = useState("");
  const [menuAbierto, setMenuAbierto] = useState<any>(null);
  const [cargandoGlobal, setCargandoGlobal] = useState(false);
  const [modoModal, setModoModal] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [valoresNuevoProducto, setValoresNuevoProducto] = useState({
    nombre: "",
    precio: "",
    unidad: "Kg",
    disponible: "",
    imagen: "",
  });

  // ── Paso 3 — Cobro ────────────────────────────────────────────────────────
  const [metodoPago, setMetodoPago] = useState<"contado" | "credito">(
    "contado",
  );
  const [paganCon, setPaganCon] = useState("");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scrollRef = useRef<any>(null);
  const filtroInputRef = useRef<TextInput>(null);
  const inputPagoRef = useRef<TextInput>(null);
  const precioInputRef = useRef<TextInput>(null);

  // ── Modales ───────────────────────────────────────────────────────────────
  const modalNuevoCliente = useSlideModal(700);
  const modalNuevoProducto = useSlideModal(700);

  // ── Animaciones ───────────────────────────────────────────────────────────
  const flexPaso1 = useRef(new Animated.Value(1)).current;
  const flexPaso2 = useRef(new Animated.Value(0)).current;

  const animarPasos = (nuevoStep: number) => {
    Animated.parallel([
      Animated.timing(flexPaso1, {
        toValue: nuevoStep === 1 ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(flexPaso2, {
        toValue: nuevoStep === 2 ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // ── Cargar BD al montar ───────────────────────────────────────────────────
  const cargarDatos = async () => {
    setCargandoGlobal(true);
    const [cs, ps] = await Promise.all([
      clienteRepo.getAll(),
      productoRepo.getAll(),
    ]);
    setClientes(cs);
    setProductos(ps);
    setCargandoGlobal(false);
  };

  // ── Pasos ─────────────────────────────────────────────────────────────────
  const limpiarPaso2 = () => {
    smoothLayout();
    setProductoActivo(null);
    setCantidadModal("1");
    setFiltroProducto("");
    setMenuAbierto(null);
    setFiltroActivo(false);
  };

  const scrollAlTop = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 80);
  };

  const siguiente = () => {
    limpiarPaso2();
    const nuevoStep = Math.min(step + 1, 3);
    setStep(nuevoStep);
    animarPasos(nuevoStep);
    scrollAlTop();
  };

  const retroceder = () => {
    limpiarPaso2();
    setFiltroCliente("");
    setFiltroClienteActivo(false);
    const nuevoStep = Math.max(step - 1, 1);
    setStep(nuevoStep);
    animarPasos(nuevoStep);
    scrollAlTop();
  };

  const scrollAlFiltro = (conLoader = true) => {
    if (conLoader) {
      setCargandoGlobal(true);
      setTimeout(() => setCargandoGlobal(false), 400);
    }
  };

  // ── Clientes ──────────────────────────────────────────────────────────────
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

  const clientesFiltrados = clientes.filter((c) =>
    norm(c.nombre).includes(norm(filtroCliente)),
  );

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setStep(2);
    animarPasos(2);
  };

  const guardarNuevoCliente = async () => {
    if (
      !valoresNuevoCliente.nombre.trim() ||
      !valoresNuevoCliente.telefono.trim()
    )
      return;
    const nuevo = await clienteRepo.create({
      nombre: valoresNuevoCliente.nombre.trim(),
      telefono: valoresNuevoCliente.telefono.trim(),
      direccion: valoresNuevoCliente.direccion.trim() || undefined,
    });
    setClientes((prev) => [nuevo, ...prev]);
    setClienteSeleccionado(nuevo);
    setValoresNuevoCliente({ nombre: "", telefono: "", direccion: "" });
    modalNuevoCliente.cerrar();
  };

  // ── Productos ─────────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) =>
    norm(p.nombre).includes(norm(filtroProducto)),
  );

  const idsEnCarrito = carrito.map((i) => i.id);

  const abrirModal = (producto: Producto) => {
    smoothLayout();
    setProductoActivo(producto);
    setCantidadModal("1");
    setPrecioModal(String(producto.precio));
    setModoModal("agregar");
    setFiltroProducto("");
    setFiltroActivo(false);
    setTimeout(() => precioInputRef.current?.focus(), 120);
  };

  const cerrarModal = () => {
    smoothLayout();
    setProductoActivo(null);
    setCantidadModal("1");
    setPrecioModal("");
    setModoModal(null);
    setFiltroActivo(false);
  };

  const agregarAlCarrito = () => {
    if (!productoActivo) return;
    const qty = parseInt(cantidadModal, 10) || 1;
    const precio =
      parseFloat(precioModal.replace(/\./g, "")) || productoActivo.precio;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.id === productoActivo.id);
      if (existe)
        return prev.map((i) =>
          i.id === productoActivo.id ? { ...i, qty, precio } : i,
        );
      return [...prev, { ...productoActivo, precio, qty }];
    });
    setCarritoExpandido(false);
    cerrarModal();
  };

  const eliminarDelCarrito = (id: string) =>
    setCarrito((prev) => prev.filter((i) => i.id !== id));

  const abrirMenu = (item: any) => setMenuAbierto(item);
  const cerrarMenu = () => setMenuAbierto(null);

  const editarProducto = (item: any) => {
    cerrarMenu();
    setProductoActivo(item);
    setCantidadModal(String(item.qty));
    setPrecioModal(String(item.precio));
    setModoModal("editar");
    setFiltroProducto("");
    setFiltroActivo(false);
    setTimeout(() => precioInputRef.current?.focus(), 120);
  };

  const eliminarConMenu = (item: any) => {
    cerrarMenu();
    setTimeout(() => {
      Alert.alert(
        "Eliminar producto",
        `¿Seguro que quieres eliminar "${item.nombre}" del carrito?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => eliminarDelCarrito(item.id),
          },
        ],
      );
    }, 150);
  };

  const guardarNuevoProducto = async () => {
    if (
      !valoresNuevoProducto.nombre.trim() ||
      !valoresNuevoProducto.precio.trim()
    )
      return;
    const nuevo = await productoRepo.create({
      nombre: valoresNuevoProducto.nombre.trim(),
      precio: Number(valoresNuevoProducto.precio.replace(/\./g, "")),
      unidad: valoresNuevoProducto.unidad || "Kg",
      disponible: Number(valoresNuevoProducto.disponible) || 0,
      imagen: valoresNuevoProducto.imagen || undefined,
    });
    setProductos((prev) => [nuevo, ...prev]);
    setValoresNuevoProducto({
      nombre: "",
      precio: "",
      unidad: "Kg",
      disponible: "",
      imagen: "",
    });
    modalNuevoProducto.cerrar();
  };

  // ── Cobro ─────────────────────────────────────────────────────────────────
  const totalCarrito = carrito.reduce((a, i) => a + i.precio * i.qty, 0);

  const subtotalModal = productoActivo
    ? (parseFloat(precioModal.replace(/\./g, "")) || productoActivo.precio) *
      (parseInt(cantidadModal, 10) || 1)
    : 0;

  const paganConNum =
    parseFloat(paganCon.replace(/\./g, "").replace(",", ".")) || 0;
  const devuelve = paganConNum >= totalCarrito ? paganConNum - totalCarrito : 0;

  const manejarCambioDinero = (texto: string) => {
    const soloNumeros = texto.replace(/[^0-9]/g, "");
    setPaganCon(soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  // ── Finalizar venta ───────────────────────────────────────────────────────
  const finalizarVenta = async () => {
    if (!clienteSeleccionado || carrito.length === 0) return;

    try {
      const venta = await ventaRepo.create({
        clienteId: clienteSeleccionado.id,
        nombreCliente: clienteSeleccionado.nombre,
        items: carrito.map((i) => ({
          productoId: i.id,
          nombreProducto: i.nombre,
          precioUnitario: i.precio,
          cantidad: i.qty,
          subtotal: i.precio * i.qty,
        })),
        total: totalCarrito,
        tipo: metodoPago,
        fecha: new Date()
          .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
          .replace(" ", "T"),
      });

      Alert.alert(
        "✅ Venta registrada",
        `Factura: ${venta.numeroFactura}\nCliente: ${clienteSeleccionado.nombre}\nTotal: ${fmt(totalCarrito)}\nTipo: ${metodoPago === "contado" ? "Contado" : "Crédito"}`,
        [{ text: "Listo", onPress: resetVenta }],
      );
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la venta.");
    }
  };

  // ── Reset completo ────────────────────────────────────────────────────────
  const resetVenta = () => {
    setStep(1);
    animarPasos(1);
    setClienteSeleccionado(null);
    setCarrito([]);
    setFiltroCliente("");
    setFiltroProducto("");
    setMetodoPago("contado");
    setPaganCon("");
    scrollAlTop();
  };

  // ── Return ────────────────────────────────────────────────────────────────
  return {
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
    paganCon,
    paganConNum,
    devuelve,
    manejarCambioDinero,
    finalizarVenta,
    inputPagoRef,
    scrollRef,
    cargarDatos,
  };
};
