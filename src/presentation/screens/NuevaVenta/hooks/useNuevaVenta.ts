import { useEffect, useRef, useState } from "react";
import {
    Animated,
    LayoutAnimation,
    Platform,
    ScrollView,
    TextInput,
    UIManager,
} from "react-native";
import { useSlideModal } from "../../../hooks/useSlideModal";

// Habilitar LayoutAnimation en Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const smoothLayout = () =>
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      220,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ),
  );

// ── Mocks ────────────────────────────────────────────────────────────────────
export const CLIENTES_MOCK = [
  {
    id: "1",
    nombre: "Luis Perez",
    direccion: "cr 15 #11-56",
    telefono: "3142567894",
  },
  {
    id: "2",
    nombre: "Amilo Suares",
    direccion: "cr 15 #11-56",
    telefono: "3142567894",
  },
  {
    id: "3",
    nombre: "Luisa Perez",
    direccion: "cr 15 #11-56",
    telefono: "3142567894",
  },
];

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

export const PRODUCTOS_MOCK = [
  { id: "1", nombre: "Mango", unidad: "Kg", precio: 5000, disponible: 50 },
  { id: "2", nombre: "Limón", unidad: "Kg", precio: 3000, disponible: 80 },
  { id: "3", nombre: "Naranja", unidad: "Kg", precio: 4000, disponible: 60 },
  { id: "4", nombre: "Banano", unidad: "Kg", precio: 2500, disponible: 100 },
  { id: "5", nombre: "Mandarina", unidad: "Kg", precio: 4500, disponible: 45 },
  { id: "6", nombre: "Papaya", unidad: "Kg", precio: 3500, disponible: 30 },
  { id: "7", nombre: "Piña", unidad: "Und", precio: 6000, disponible: 25 },
  { id: "8", nombre: "Guayaba", unidad: "Kg", precio: 3000, disponible: 40 },
  { id: "9", nombre: "Maracuyá", unidad: "Kg", precio: 5500, disponible: 20 },
  {
    id: "10",
    nombre: "Tomate de árbol",
    unidad: "Kg",
    precio: 4000,
    disponible: 35,
  },
  { id: "11", nombre: "Fresa", unidad: "Kg", precio: 8000, disponible: 15 },
  { id: "12", nombre: "Uva", unidad: "Kg", precio: 9000, disponible: 10 },
];

export const FILTRO_SCROLL_OFFSET = 200;

export const fmt = (n: number) =>
  "$ " + Number(n).toLocaleString("es-CO", { minimumFractionDigits: 0 });

// ── Campos formularios reutilizables ─────────────────────────────────────────
export const CAMPOS_CLIENTE_VENTA = [
  {
    id: "nombre",
    label: "Nombre completo",
    tipo: "texto" as const,
    obligatorio: true,
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

export const CAMPOS_PRODUCTO_VENTA: Campo[] = [
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
  }, // <--- Esto activa la cámara/galería
];

// ── Hook principal ────────────────────────────────────────────────────────────
export const useNuevaVenta = () => {
  const [step, setStep] = useState(1);

  // ── Paso 1 ────────────────────────────────────────────────────────────────
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroClienteActivo, setFiltroClienteActivo] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [clientes, setClientes] = useState(CLIENTES_MOCK);

  // Formulario nuevo cliente
  const [valoresNuevoCliente, setValoresNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
  });

  // ── Paso 2 ────────────────────────────────────────────────────────────────
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [carritoExpandido, setCarritoExpandido] = useState(false);
  const [productoActivo, setProductoActivo] = useState<any>(null);
  const [cantidadModal, setCantidadModal] = useState("1");
  const [precioModal, setPrecioModal] = useState("");
  const [menuAbierto, setMenuAbierto] = useState<any>(null);
  const [cargandoGlobal, setCargandoGlobal] = useState(false);
  const [modoModal, setModoModal] = useState<string | null>(null);
  const [productos, setProductos] = useState(PRODUCTOS_MOCK);

  // Formulario nuevo producto
  const [valoresNuevoProducto, setValoresNuevoProducto] = useState({
    nombre: "",
    precio: "",
    unidad: "Kg",
    disponible: "",
    imagen: "", // <--- AGREGA ESTA LÍNEA
  });

  // ── Paso 3 ────────────────────────────────────────────────────────────────
  const [metodoPago, setMetodoPago] = useState("contado");
  const [paganCon, setPaganCon] = useState("");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const scrollRef = useRef<ScrollView>(null);
  const filtroInputRef = useRef<TextInput>(null);
  const inputPagoRef = useRef<TextInput>(null);

  // ── Modales reutilizables ─────────────────────────────────────────────────
  const modalNuevoCliente = useSlideModal(700);
  const modalNuevoProducto = useSlideModal(700);

  // ── Animaciones pasos ─────────────────────────────────────────────────────
  const flexPaso1 = useRef(new Animated.Value(1)).current;
  const flexPaso2 = useRef(new Animated.Value(0)).current;
  const minHeightPaso1 = useRef(new Animated.Value(0)).current;
  const minHeightPaso2 = useRef(new Animated.Value(0)).current;

  // ── Lógica pasos ──────────────────────────────────────────────────────────
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

  useEffect(() => {
    Animated.timing(minHeightPaso1, {
      toValue: filtroClienteActivo ? 400 : 400,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [filtroClienteActivo]);

  useEffect(() => {
    Animated.timing(minHeightPaso2, {
      toValue: filtroActivo ? 400 : 400,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [filtroActivo]);

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

  // ── Lógica cliente ────────────────────────────────────────────────────────
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

  const clientesFiltrados = clientes.filter((c) =>
    norm(c.nombre).includes(norm(filtroCliente)),
  );

  const seleccionarCliente = (cliente: any) => {
    setClienteSeleccionado(cliente);
    const nuevoStep = 2;
    setStep(nuevoStep);
    animarPasos(nuevoStep);
  };

  const guardarNuevoCliente = () => {
    if (
      !valoresNuevoCliente.nombre.trim() ||
      !valoresNuevoCliente.telefono.trim()
    )
      return;
    const nuevo = {
      id: String(Date.now()),
      nombre: valoresNuevoCliente.nombre.trim(),
      telefono: valoresNuevoCliente.telefono.trim(),
      direccion: valoresNuevoCliente.direccion.trim() || "Sin dirección",
    };
    setClientes((prev) => [nuevo, ...prev]);
    setClienteSeleccionado(nuevo);
    setValoresNuevoCliente({ nombre: "", telefono: "", direccion: "" });
    modalNuevoCliente.cerrar();
  };

  // ── Lógica producto ───────────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) =>
    norm(p.nombre).includes(norm(filtroProducto)),
  );

  const idsEnCarrito = carrito.map((i) => i.id);

  const scrollAlFiltro = (conLoader = true) => {
    if (conLoader) setCargandoGlobal(true);
    setTimeout(() => {
      requestAnimationFrame(() => {
        filtroInputRef.current?.measureLayout(
          scrollRef.current as any,
          (_x: number, y: number) => {
            const targetY = Math.max(0, y - FILTRO_SCROLL_OFFSET);
            scrollRef.current?.scrollTo({ y: targetY, animated: true });
            if (conLoader) setTimeout(() => setCargandoGlobal(false), 200);
          },
          () => {
            if (conLoader) setCargandoGlobal(false);
          },
        );
      });
    }, 300);
  };

  const abrirModal = (producto: any) => {
    smoothLayout();
    setProductoActivo(producto);
    setCantidadModal("1");
    setPrecioModal(String(producto.precio));
    setModoModal("agregar");
    setFiltroProducto("");
    setFiltroActivo(false);
    scrollAlFiltro();
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
    scrollAlFiltro();
  };

  const eliminarConMenu = (id: string) => {
    cerrarMenu();
    eliminarDelCarrito(id);
  };

  const guardarNuevoProducto = () => {
    if (
      !valoresNuevoProducto.nombre.trim() ||
      !valoresNuevoProducto.precio.trim()
    )
      return;

    const nuevo = {
      id: String(Date.now()),
      nombre: valoresNuevoProducto.nombre.trim(),
      // Quita los puntos del precio antes de guardar como número
      precio: Number(valoresNuevoProducto.precio.replace(/\./g, "")),
      unidad: valoresNuevoProducto.unidad || "Kg",
      disponible: Number(valoresNuevoProducto.disponible) || 0,
      imagen: valoresNuevoProducto.imagen || undefined, // <--- GUARDA LA FOTO AQUÍ
    };

    setProductos((prev) => [nuevo, ...prev]);

    // Limpiar el formulario completo, incluyendo la imagen
    setValoresNuevoProducto({
      nombre: "",
      precio: "",
      unidad: "Kg",
      disponible: "",
      imagen: "", // <--- LIMPIA LA FOTO
    });

    modalNuevoProducto.cerrar();
  };

  // ── Lógica cobro ──────────────────────────────────────────────────────────
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
    const formateado = soloNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPaganCon(formateado);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const finalizarVenta = () => {
    alert(
      `Venta registrada!\nCliente: ${clienteSeleccionado?.nombre}\nTotal: ${fmt(totalCarrito)}`,
    );
  };

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Pasos
    step,
    siguiente,
    retroceder,
    flexPaso1,
    flexPaso2,
    minHeightPaso1,
    minHeightPaso2,

    // Paso 1 — Cliente
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

    // Paso 2 — Productos
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

    // Paso 3 — Cobro
    metodoPago,
    setMetodoPago,
    paganCon,
    paganConNum,
    devuelve,
    manejarCambioDinero,
    finalizarVenta,
    inputPagoRef,
    scrollRef,
  };
};
