// src/presentation/screens/productos/hooks/useProductos.ts

import { useState } from "react";
import { Alert } from "react-native";
import { Producto } from "../../../../domain/entities/Producto";
import { Campo, ValoresCampo } from "../../../components/ui/FormularioModal";
import { useSlideModal } from "../../../hooks/useSlideModal";

// ── Mock ──────────────────────────────────────────────────────────────────────
const PRODUCTOS_MOCK: Producto[] = [
  { id: "1", nombre: "Mango", precio: 5000, unidad: "Kg", disponible: 50 },
  { id: "2", nombre: "Limón", precio: 3000, unidad: "Kg", disponible: 80 },
  { id: "3", nombre: "Naranja", precio: 4000, unidad: "Kg", disponible: 60 },
  { id: "4", nombre: "Banano", precio: 2500, unidad: "Kg", disponible: 100 },
  { id: "5", nombre: "Piña", precio: 6000, unidad: "Und", disponible: 25 },
  { id: "6", nombre: "Fresa", precio: 8000, unidad: "Kg", disponible: 15 },
];

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
export const valoresVaciosProducto = (): ValoresCampo => ({
  nombre: "",
  precio: "",
  unidad: "Kg",
  disponible: "",
  imagen: "",
});

// ── Hook principal ────────────────────────────────────────────────────────────
export const useProductos = () => {
  // ── Estado ───────────────────────────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [esEdicion, setEsEdicion] = useState(false);
  const [valores, setValores] = useState<ValoresCampo>(valoresVaciosProducto());

  // ── Modales ───────────────────────────────────────────────────────────────────
  const modalOpciones = useSlideModal(20);
  const modalFormulario = useSlideModal(300);

  // ── Filtrado ──────────────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleChange = (id: string, valor: string) => {
    setValores((prev) => ({ ...prev, [id]: valor }));
  };

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

  // ── Return ─────────────────────────────────────────────────────────────────────
  return {
    // Lista
    productos,
    busqueda,
    setBusqueda,
    productosFiltrados,

    // Formulario
    esEdicion,
    valores,
    handleChange,
    productoSeleccionado,

    // Modales
    modalOpciones,
    modalFormulario,

    // Acciones
    abrirCrear,
    abrirOpciones,
    abrirEditar,
    guardar,
    confirmarEliminar,
  };
};
