import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { ConfiguracionRepositoryImpl } from "../../../../data/repositories/ConfiguracionRepositoryImpl";
import { ProductoRepositoryImpl } from "../../../../data/repositories/ProductoRepositoryImpl";
import { CONFIG_KEYS } from "../../../../domain/entities/Configuracion";
import { Producto, getEstadoStock } from "../../../../domain/entities/Producto";
import { Campo, ValoresCampo } from "../../../components/ui/FormularioModal";
import { useSlideModal } from "../../../hooks/useSlideModal";

const repo = new ProductoRepositoryImpl();
const configRepo = new ConfiguracionRepositoryImpl();

// ── Campos formulario ─────────────────────────────────────────────────────────
export const CAMPOS_PRODUCTO: Campo[] = [
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
  /*{
    id: "disponible",
    label: "Cantidad disponible",
    placeholder: "0",
    tipo: "numero",
    obligatorio: false,
  },*/
  {
    id: "imagen",
    label: "Foto del producto",
    tipo: "foto",
    obligatorio: false,
  },
];

// ── Valores vacíos ────────────────────────────────────────────────────────────
export const valoresVaciosProducto = (): ValoresCampo => ({
  nombre: "",
  precio: "",
  unidad: "Kg",
  disponible: "",
  imagen: "",
});

// ── Normalizar nombre ─────────────────────────────────────────────────────────
const normalizarNombre = (nombre: string) =>
  nombre.trim().toLowerCase().replace(/\s+/g, " ");

// ── Tipos de filtro de stock ──────────────────────────────────────────────────
export type FiltroStock = "todos" | "stock-bajo" | "agotado";

// ── Hook principal ────────────────────────────────────────────────────────────
export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState<FiltroStock>("todos");
  const [inventarioActivo, setInventarioActivo] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [esEdicion, setEsEdicion] = useState(false);
  const [valores, setValores] = useState<ValoresCampo>(valoresVaciosProducto());

  const modalOpciones = useSlideModal(20);
  const modalFormulario = useSlideModal(300);
  const modalInventario = useSlideModal(300);

  // ── Cargar BD y configuración ─────────────────────────────────────────────
  const cargarProductos = useCallback(async () => {
    setCargando(true);
    const [data, valorConfig] = await Promise.all([
      repo.getAll(),
      configRepo.get(CONFIG_KEYS.INVENTARIO_ACTIVO),
    ]);
    setProductos(data);
    setInventarioActivo(valorConfig === "1");
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // ── Filtrado por búsqueda + stock ─────────────────────────────────────────
  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase().trim());

    if (!coincideBusqueda) return false;

    // Si el inventario no está activo, no aplicar filtro de stock
    if (!inventarioActivo || filtroStock === "todos") return true;

    const estado = getEstadoStock(p);
    if (filtroStock === "stock-bajo") return estado === "bajo";
    if (filtroStock === "agotado") return estado === "agotado";

    return true;
  });

  // ── Conteo de productos con stock bajo o agotado (para mostrar alerta) ────
  const productosStockBajo = inventarioActivo
    ? productos.filter((p) => {
        const estado = getEstadoStock(p);
        return estado === "bajo" || estado === "agotado";
      }).length
    : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (id: string, valor: string) =>
    setValores((prev) => ({ ...prev, [id]: valor }));

  const abrirCrear = () => {
    setEsEdicion(false);
    setProductoSeleccionado(null);
    setValores(valoresVaciosProducto());
    modalFormulario.abrir();
  };

  const abrirOpciones = (producto: Producto) => {
    setProductoSeleccionado(producto);
    modalOpciones.abrir();
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

  const abrirInventario = (producto: Producto) => {
    modalOpciones.cerrar(() => {
      setTimeout(() => {
        setProductoSeleccionado(producto);
        modalInventario.abrir();
      }, 300);
    });
  };

  const guardarInventario = async (
    productoId: string,
    controlStock: boolean,
    stock: number,
    stockMinimo: number,
  ) => {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;
    const actualizado: Producto = {
      ...producto,
      controlStock,
      stock,
      stockMinimo,
    };
    await repo.update(actualizado);
    setProductos((prev) =>
      prev.map((p) => (p.id === productoId ? actualizado : p)),
    );
  };

  const guardar = async () => {
    if (!valores.nombre.trim() || !valores.precio.trim()) return;

    // Validar duplicado solo al crear
    if (!esEdicion) {
      const nombreNuevo = normalizarNombre(valores.nombre);
      const existe = productos.some(
        (p) => normalizarNombre(p.nombre) === nombreNuevo,
      );
      if (existe) {
        Alert.alert(
          "Producto duplicado",
          `"${valores.nombre.trim()}" ya existe. Usa un nombre diferente.`,
          [{ text: "Entendido", style: "cancel" }],
        );
        return;
      }
    }

    const precioNum = Number(valores.precio.replace(/\./g, ""));

    if (esEdicion && productoSeleccionado) {
      const actualizado: Producto = {
        id: productoSeleccionado.id,
        nombre: valores.nombre.trim(),
        precio: precioNum,
        unidad: valores.unidad,
        disponible: Number(valores.disponible) || 0,
        imagen: valores.imagen || undefined,
        // Preservar campos de inventario al editar
        controlStock: productoSeleccionado.controlStock,
        stock: productoSeleccionado.stock,
        stockMinimo: productoSeleccionado.stockMinimo,
      };
      await repo.update(actualizado);
      setProductos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p)),
      );
    } else {
      const nuevo = await repo.create({
        nombre: valores.nombre.trim(),
        precio: precioNum,
        unidad: valores.unidad,
        disponible: Number(valores.disponible) || 0,
        imagen: valores.imagen || undefined,
        // Nuevos productos sin control de stock por defecto
        controlStock: false,
        stock: 0,
        stockMinimo: 0,
      });
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
              onPress: async () => {
                await repo.delete(producto.id);
                setProductos((prev) =>
                  prev.filter((p) => p.id !== producto.id),
                );
              },
            },
          ],
        );
      }, 150);
    });
  };

  return {
    productos,
    cargando,
    busqueda,
    setBusqueda,
    filtroStock,
    setFiltroStock,
    inventarioActivo,
    productosFiltrados,
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
  };
};
