import { useState } from "react";
import { Alert } from "react-native";
import { Cliente } from "../../../../domain/entities/Cliente";
import { useSlideModal } from "../../../hooks/useSlideModal";

// ── Mock ─────────────────────────────────────────────────────────────────────
const CLIENTES_MOCK: Cliente[] = [
  {
    id: "1",
    nombre: "Luis Perez",
    telefono: "3142567894",
    direccion: "Cr 15 #11-56",
  },
  {
    id: "2",
    nombre: "Amilo Suares",
    telefono: "3142567894",
    direccion: "Cr 15 #11-56",
  },
  {
    id: "3",
    nombre: "Luisa Perez",
    telefono: "3142567894",
    direccion: "Cr 15 #11-56",
  },
];

// ── Campos formulario ─────────────────────────────────────────────────────────
export const CAMPOS_CLIENTE = [
  {
    id: "nombre",
    label: "Nombre del cliente",
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

// ── Valores vacíos ────────────────────────────────────────────────────────────
export const valoresVaciosCliente = () => ({
  nombre: "",
  telefono: "",
  direccion: "",
});

// ── Hook principal ────────────────────────────────────────────────────────────
export const useClientes = () => {
  // ── Estado ──────────────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [esEdicion, setEsEdicion] = useState(false);
  const [valores, setValores] = useState(valoresVaciosCliente());

  // ── Modales ──────────────────────────────────────────────────────────────────
  const modalOpciones = useSlideModal(350);
  const modalFormulario = useSlideModal(900);

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (id: string, valor: string) => {
    setValores((prev) => ({ ...prev, [id]: valor }));
  };

  const abrirCrear = () => {
    setEsEdicion(false);
    setClienteSeleccionado(null);
    setValores(valoresVaciosCliente());
    modalFormulario.abrir();
  };

  const abrirOpciones = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    modalOpciones.abrir();
  };

  const abrirEditar = (cliente: Cliente) => {
    modalOpciones.cerrar(() => {
      setTimeout(() => {
        setEsEdicion(true);
        setClienteSeleccionado(cliente);
        setValores({
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          direccion: cliente.direccion ?? "",
        });
        modalFormulario.abrir();
      }, 300);
    });
  };

  const guardar = () => {
    if (!valores.nombre.trim() || !valores.telefono.trim()) return;

    if (esEdicion && clienteSeleccionado) {
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteSeleccionado.id
            ? {
                ...c,
                nombre: valores.nombre.trim(),
                telefono: valores.telefono.trim(),
                direccion: valores.direccion.trim() || undefined,
              }
            : c,
        ),
      );
    } else {
      const nuevo: Cliente = {
        id: String(Date.now()),
        nombre: valores.nombre.trim(),
        telefono: valores.telefono.trim(),
        direccion: valores.direccion.trim() || undefined,
      };
      setClientes((prev) => [nuevo, ...prev]);
    }
    modalFormulario.cerrar();
  };

  const confirmarEliminar = (cliente: Cliente) => {
    modalOpciones.cerrar(() => {
      setTimeout(() => {
        Alert.alert(
          "Eliminar cliente",
          `¿Seguro que quieres eliminar a "${cliente.nombre}"?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: () =>
                setClientes((prev) => prev.filter((c) => c.id !== cliente.id)),
            },
          ],
        );
      }, 150);
    });
  };

  // ── Return ────────────────────────────────────────────────────────────────────
  return {
    // Lista
    clientes,
    busqueda,
    setBusqueda,
    clientesFiltrados,

    // Formulario
    esEdicion,
    valores,
    handleChange,
    clienteSeleccionado,

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
