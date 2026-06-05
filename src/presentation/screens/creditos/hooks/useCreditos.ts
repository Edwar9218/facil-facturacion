// src/presentation/screens/creditos/hooks/useCreditos.ts

import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { CreditoRepositoryImpl } from "../../../../data/repositories/CreditoRepositoryImpl";
import {
  DetalleCredito,
  ResumenCredito,
} from "../../../../domain/entities/Credito";
import { useSlideModal } from "../../../hooks/useSlideModal";
import { VistaGestor } from "../components/GestorDeudaModal";

const repo = new CreditoRepositoryImpl();

export const useCreditos = () => {
  const [resumenes, setResumenes] = useState<ResumenCredito[]>([]);
  const [detalle, setDetalle] = useState<DetalleCredito | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [montoAbono, setMontoAbono] = useState("");

  // ── Nuevo estado para saber a qué factura específica se le va a abonar ──
  // Si está en null, significa que es un abono global (Cascada / FIFO)
  const [facturaSeleccionadaId, setFacturaSeleccionadaId] = useState<
    string | null
  >(null);

  // ── 1. Nuevo estado para controlar qué se ve dentro del modal único ──
  const [vistaModal, setVistaModal] = useState<VistaGestor>("detalle");

  // ── 2. Instanciamos un solo modal ──
  const modalGestor = useSlideModal(850);

  // ── Cargar lista ────────────────────────────────────────────────────────
  const cargarResumenes = useCallback(async () => {
    setCargando(true);
    const data = await repo.getResumenes();
    setResumenes(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarResumenes();
  }, [cargarResumenes]);

  // ── Filtrado ────────────────────────────────────────────────────────────
  const resumenesFiltrados = resumenes.filter((r) =>
    r.nombreCliente.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  // ── Abrir detalle ───────────────────────────────────────────────────────
  const abrirDetalle = async (clienteId: string) => {
    setVistaModal("detalle");
    setMontoAbono("");
    setFacturaSeleccionadaId(null); // Resetear factura seleccionada al abrir un cliente nuevo
    setCargandoDetalle(true);
    modalGestor.abrir();

    const data = await repo.getDetalle(clienteId);
    setDetalle(data);
    setCargandoDetalle(false);
  };

  // ── Registrar abono (Corregido con ventaId) ─────────────────────────────
  const registrarAbono = async () => {
    const monto = Number(montoAbono.replace(/\D/g, ""));
    if (!monto || monto <= 0 || !detalle) return;

    if (monto > detalle.saldoActual) {
      Alert.alert(
        "Monto inválido",
        "El abono no puede ser mayor al saldo total pendiente del cliente.",
        [{ text: "Entendido", style: "cancel" }],
      );
      return;
    }

    try {
      // 🚀 AQUÍ SE SOLUCIONA EL CRASH DE SQLITE:
      // Si "facturaSeleccionadaId" tiene un ID, se manda. Si es null, enviamos ""
      // y dejamos que la salvaguarda del Repositorio busque la factura más vieja automáticamente.
      await repo.registrarAbono({
        clienteId: detalle.clienteId,
        ventaId: facturaSeleccionadaId ?? "",
        monto,
        fecha: new Date()
          .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
          .replace(" ", "T"),
      });

      // Refrescar detalle local y lista global comercial
      const nuevoDetalle = await repo.getDetalle(detalle.clienteId);
      setDetalle(nuevoDetalle);
      await cargarResumenes();

      // Limpiezas de estados post-abono
      setMontoAbono("");
      setFacturaSeleccionadaId(null);
      setVistaModal("detalle");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "No se pudo registrar el abono.");
    }
  };

  // ── Helper para cuando la UI decida abonar a una factura específica ──
  const irAAbonarFacturaEspecífica = (ventaId: string) => {
    setFacturaSeleccionadaId(ventaId);
    setVistaModal("abono"); // Cambiamos la vista del modal directamente al formulario de abono
  };

  return {
    resumenes,
    resumenesFiltrados,
    cargando,
    cargandoDetalle,
    busqueda,
    setBusqueda,
    detalle,
    montoAbono,
    setMontoAbono,

    // Nuevos estados de control granular
    facturaSeleccionadaId,
    setFacturaSeleccionadaId,
    irAAbonarFacturaEspecífica,

    modalGestor,
    vistaModal,
    setVistaModal,

    abrirDetalle,
    registrarAbono,
  };
};
