import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { ClienteRepositoryImpl } from "../../../../data/repositories/ClienteRepositoryImpl";
import { Cliente } from "../../../../domain/entities/Cliente";
import { useSlideModal } from "../../../hooks/useSlideModal";

const repo = new ClienteRepositoryImpl();

// ── Campos formulario ─────────────────────────────────────────────────────────
export const CAMPOS_CLIENTE = [
  {
    id: "nombre",
    label: "Nombre del cliente",
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

// ── Valores vacíos ────────────────────────────────────────────────────────────
export const valoresVaciosCliente = () => ({
  nombre: "",
  telefono: "",
  direccion: "",
});

// ── Normalizar ────────────────────────────────────────────────────────────────
const normalizarNombre = (nombre: string) =>
  nombre.trim().toLowerCase().replace(/\s+/g, " ");

// ── Hook principal ────────────────────────────────────────────────────────────
export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [esEdicion, setEsEdicion] = useState(false);
  const [valores, setValores] = useState(valoresVaciosCliente());

  const modalOpciones = useSlideModal(350);
  const modalFormulario = useSlideModal(900);

  // ── Cargar BD ─────────────────────────────────────────────────────────────
  const cargarClientes = useCallback(async () => {
    setCargando(true);
    const data = await repo.getAll();
    setClientes(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (id: string, valor: string) =>
    setValores((prev) => ({ ...prev, [id]: valor }));

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

  const guardar = async () => {
    if (!valores.nombre.trim() || !valores.telefono.trim()) return;

    // ── Validar duplicado solo al crear ──────────────────────────────────────
    if (!esEdicion) {
      const nombreNuevo = normalizarNombre(valores.nombre);
      const existe = clientes.some(
        (c) => normalizarNombre(c.nombre) === nombreNuevo,
      );
      if (existe) {
        Alert.alert(
          "Cliente duplicado",
          `"${valores.nombre.trim()}" ya existe. Usa un nombre diferente.`,
          [{ text: "Entendido", style: "cancel" }],
        );
        return;
      }
    }

    if (esEdicion && clienteSeleccionado) {
      const actualizado: Cliente = {
        id: clienteSeleccionado.id,
        nombre: valores.nombre.trim(),
        telefono: valores.telefono.trim(),
        direccion: valores.direccion.trim() || undefined,
      };
      await repo.update(actualizado);
      setClientes((prev) =>
        prev.map((c) => (c.id === actualizado.id ? actualizado : c)),
      );
    } else {
      const nuevo = await repo.create({
        nombre: valores.nombre.trim(),
        telefono: valores.telefono.trim(),
        direccion: valores.direccion.trim() || undefined,
      });
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
              onPress: async () => {
                await repo.delete(cliente.id);
                setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
              },
            },
          ],
        );
      }, 150);
    });
  };

  return {
    clientes,
    cargando,
    busqueda,
    setBusqueda,
    clientesFiltrados,
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
  };
};
