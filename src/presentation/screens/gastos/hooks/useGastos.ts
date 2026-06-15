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

  // ── Cargar gastos del día ────────────────────────────────────────────────
  const cargarGastos = React.useCallback(async () => {
    setCargando(true);
    try {
      const datos = await gastoRepo.getGastosPorFecha(fechaHoy());
      setGastos(datos);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    cargarGastos();
  }, []);

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
      const categoriaFinal = categoriaLibre
        ? form.categoriaPersonalizada.trim()
        : form.categoria;

      // Vincular a caja abierta si existe
      const caja = await cajaRepo.getCajaAbierta();
      const cajaId = caja?.estado === "abierta" ? caja.id : undefined;

      await gastoRepo.registrarGasto({
        descripcion: form.descripcion.trim(),
        monto: Number(form.monto),
        categoria: categoriaFinal,
        metodoPago: form.metodoPago,
        foto: form.foto || undefined,
        cajaId,
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

  // ── Totales del día ──────────────────────────────────────────────────────
  const totalEfectivo = gastos
    .filter((g) => g.metodoPago === "efectivo")
    .reduce((acc, g) => acc + g.monto, 0);

  const totalTransferencia = gastos
    .filter((g) => g.metodoPago === "transferencia")
    .reduce((acc, g) => acc + g.monto, 0);

  return {
    gastos,
    cargando,
    modalAbierto,
    form,
    categoriaLibre,
    gastoAEliminar,
    totalEfectivo,
    totalTransferencia,
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
