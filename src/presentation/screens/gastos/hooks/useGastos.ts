// src/presentation/screens/gastos/hooks/useGastos.ts

import React from "react";
import { Alert } from "react-native";
import { CajaRepositoryImpl } from "../../../../data/repositories/CajaRepositoryImpl";
import { GastoRepositoryImpl } from "../../../../data/repositories/GastoRepositoryImpl";
import { Gasto, MetodoPagoGasto } from "../../../../domain/entities/Gasto";

const gastoRepo = new GastoRepositoryImpl();
const cajaRepo = new CajaRepositoryImpl();

const fechaHoy = (): string =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

export type TipoPeriodo = "hoy" | "semana" | "mes" | "personalizado";
export type TipoEstadoFiltro = "todos" | "activo" | "anulado";

export interface FormGasto {
  descripcion: string;
  monto: string;
  categoria: string;
  metodoPago: MetodoPagoGasto;
  foto: string;
  categoriaPersonalizada: string;
}

const FORM_INICIAL: FormGasto = {
  descripcion: "",
  monto: "",
  categoria: "",
  metodoPago: "efectivo",
  foto: "",
  categoriaPersonalizada: "",
};

export function useGastos() {
  const [gastos, setGastos] = React.useState<Gasto[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [form, setForm] = React.useState<FormGasto>(FORM_INICIAL);
  const [categoriaLibre, setCategoriaLibre] = React.useState(false);
  const [gastoAEliminar, setGastoAEliminar] = React.useState<Gasto | null>(
    null,
  );

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filtrosVisibles, setFiltrosVisibles] = React.useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = React.useState<TipoPeriodo>("hoy");
  const [filtroEstado, setFiltroEstado] =
    React.useState<TipoEstadoFiltro>("activo");
  const [rangoPersonalizado, setRangoPersonalizado] = React.useState({
    inicio: "",
    fin: "",
  });
  const [modalFechaVisible, setModalFechaVisible] = React.useState(false);

  // ── Anulación ─────────────────────────────────────────────────────────────
  const [gastoAAnular, setGastoAAnular] = React.useState<Gasto | null>(null);
  const [modalAnularVisible, setModalAnularVisible] = React.useState(false);
  const [anulando, setAnulando] = React.useState(false);

  // ── Rango activo calculado ────────────────────────────────────────────────
  const rangoActivo = React.useMemo(() => {
    const hoyStr = fechaHoy();
    if (filtroPeriodo === "hoy") return { inicio: hoyStr, fin: hoyStr };
    if (filtroPeriodo === "semana") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return {
        inicio: d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }),
        fin: hoyStr,
      };
    }
    if (filtroPeriodo === "mes") {
      const d = new Date();
      d.setDate(1);
      return {
        inicio: d.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }),
        fin: hoyStr,
      };
    }
    if (filtroPeriodo === "personalizado" && rangoPersonalizado.inicio)
      return rangoPersonalizado;
    return { inicio: hoyStr, fin: hoyStr };
  }, [filtroPeriodo, rangoPersonalizado]);

  // ── Cargar gastos del rango activo ────────────────────────────────────────
  const cargarGastos = React.useCallback(async () => {
    setCargando(true);
    try {
      const datos = await gastoRepo.getGastosPorRango({
        fechaInicio: rangoActivo.inicio,
        fechaFin: rangoActivo.fin,
      });
      setGastos(datos);
    } finally {
      setCargando(false);
    }
  }, [rangoActivo]);

  React.useEffect(() => {
    cargarGastos();
  }, [cargarGastos]);

  // ── Gastos filtrados por estado ───────────────────────────────────────────
  const gastosFiltrados = React.useMemo(() => {
    if (filtroEstado === "todos") return gastos;
    return gastos.filter((g) => (g.estado ?? "activo") === filtroEstado);
  }, [gastos, filtroEstado]);

  // ── Form helpers ─────────────────────────────────────────────────────────
  const setCampo = (campo: keyof FormGasto, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const seleccionarCategoria = (cat: string) => {
    if (cat === "Otro") {
      setCategoriaLibre(true);
      setForm((prev) => ({ ...prev, categoria: "" }));
    } else {
      setCategoriaLibre(false);
      setForm((prev) => ({
        ...prev,
        categoria: cat,
        categoriaPersonalizada: "",
      }));
    }
  };

  const abrirModal = () => {
    setForm(FORM_INICIAL);
    setCategoriaLibre(false);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setForm(FORM_INICIAL);
    setCategoriaLibre(false);
  };

  // ── Validar form ─────────────────────────────────────────────────────────
  const formValido = (): boolean => {
    const categoriaFinal = categoriaLibre
      ? form.categoriaPersonalizada.trim()
      : form.categoria;

    return (
      form.descripcion.trim() !== "" &&
      Number(form.monto) > 0 &&
      categoriaFinal !== ""
    );
  };

  // ── Registrar gasto ──────────────────────────────────────────────────────
  const registrarGasto = async () => {
    if (!formValido()) return;

    setCargando(true);
    try {
      const caja = await cajaRepo.getCajaAbierta();
      if (!caja) {
        Alert.alert(
          "No hay caja abierta",
          "Debes abrir una caja antes de registrar un gasto.",
          [{ text: "Entendido", style: "cancel" }],
        );
        return;
      }

      const categoriaFinal = categoriaLibre
        ? form.categoriaPersonalizada.trim()
        : form.categoria;

      await gastoRepo.registrarGasto({
        descripcion: form.descripcion.trim(),
        monto: Number(form.monto),
        categoria: categoriaFinal,
        metodoPago: form.metodoPago,
        foto: form.foto || undefined,
        cajaId: caja.id,
      });

      cerrarModal();
      await cargarGastos();
    } catch (error) {
      Alert.alert("Error", "No se pudo registrar el gasto.");
    } finally {
      setCargando(false);
    }
  };

  // ── Eliminar gasto ───────────────────────────────────────────────────────
  const confirmarEliminar = (gasto: Gasto) => {
    setGastoAEliminar(gasto);
    Alert.alert(
      "Eliminar gasto",
      `¿Seguro que quieres eliminar "${gasto.descripcion}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setGastoAEliminar(null),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await gastoRepo.eliminarGasto(gasto.id);
              await cargarGastos();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el gasto.");
            } finally {
              setGastoAEliminar(null);
            }
          },
        },
      ],
    );
  };

  // ── Anular gasto ─────────────────────────────────────────────────────────
  const solicitarAnular = (gasto: Gasto) => {
    setGastoAAnular(gasto);
    setModalAnularVisible(true);
  };

  const confirmarAnulacion = async (motivo: string) => {
    if (!gastoAAnular) return;
    setAnulando(true);
    try {
      await gastoRepo.anularGasto({ gastoId: gastoAAnular.id, motivo });
      setGastos((prev) =>
        prev.map((g) =>
          g.id === gastoAAnular.id
            ? {
                ...g,
                estado: "anulado" as const,
                motivoAnulacion: motivo,
                fechaAnulacion: new Date().toISOString(),
              }
            : g,
        ),
      );
      setModalAnularVisible(false);
      setGastoAAnular(null);
      Alert.alert("Éxito", "El gasto fue anulado correctamente.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo anular el gasto.");
    } finally {
      setAnulando(false);
    }
  };

  const cancelarAnulacion = () => {
    setModalAnularVisible(false);
    setGastoAAnular(null);
  };

  // ── Totales del rango (solo activos) ─────────────────────────────────────
  const gastosActivos = gastos.filter(
    (g) => (g.estado ?? "activo") === "activo",
  );

  const totalEfectivo = gastosActivos
    .filter((g) => g.metodoPago === "efectivo")
    .reduce((acc, g) => acc + g.monto, 0);

  const totalTransferencia = gastosActivos
    .filter((g) => g.metodoPago === "transferencia")
    .reduce((acc, g) => acc + g.monto, 0);

  return {
    gastos: gastosFiltrados,
    cargando,
    modalAbierto,
    form,
    categoriaLibre,
    gastoAEliminar,
    totalEfectivo,
    totalTransferencia,
    // filtros
    filtrosVisibles,
    setFiltrosVisibles,
    filtroPeriodo,
    setFiltroPeriodo,
    filtroEstado,
    setFiltroEstado,
    rangoPersonalizado,
    setRangoPersonalizado,
    modalFechaVisible,
    setModalFechaVisible,
    rangoActivo,
    // anulacion
    gastoAAnular,
    modalAnularVisible,
    anulando,
    solicitarAnular,
    confirmarAnulacion,
    cancelarAnulacion,
    // acciones
    cargarGastos,
    setCampo,
    seleccionarCategoria,
    abrirModal,
    cerrarModal,
    formValido,
    registrarGasto,
    confirmarEliminar,
  };
}
