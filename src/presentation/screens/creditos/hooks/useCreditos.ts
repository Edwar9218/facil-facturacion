// src/presentation/screens/creditos/hooks/useCreditos.ts

import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { CreditoRepositoryImpl } from "../../../../data/repositories/CreditoRepositoryImpl";
import {
    DetalleCredito,
    ResumenCredito,
} from "../../../../domain/entities/Credito";
import { useSlideModal } from "../../../hooks/useSlideModal";
import { VistaGestor } from "../components/GestorDeudaModal"; // Asumiendo que exportaste el type

const repo = new CreditoRepositoryImpl();

export const useCreditos = () => {
  const [resumenes, setResumenes] = useState<ResumenCredito[]>([]);
  const [detalle, setDetalle] = useState<DetalleCredito | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [montoAbono, setMontoAbono] = useState("");

  // ── 1. Nuevo estado para controlar qué se ve dentro del modal único ──
  const [vistaModal, setVistaModal] = useState<VistaGestor>("detalle");

  // ── 2. Instanciamos un solo modal ──
  // Le damos un height de 800 o 900 para que cubra la pantalla y el teclado sin problemas.
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

  // ── Abrir detalle (Modificado) ─────────────────────────────────────────
  const abrirDetalle = async (clienteId: string) => {
    setVistaModal("detalle"); // Siempre que abrimos, aseguramos que inicie en "detalle"
    setMontoAbono(""); // Limpiamos inputs pasados
    setCargandoDetalle(true);
    modalGestor.abrir(); // Abrimos el modal único

    const data = await repo.getDetalle(clienteId);
    setDetalle(data);
    setCargandoDetalle(false);
  };

  // ── Registrar abono (Modificado) ────────────────────────────────────────
  const registrarAbono = async () => {
    const monto = Number(montoAbono.replace(/\D/g, ""));
    if (!monto || monto <= 0 || !detalle) return;

    if (monto > detalle.saldoActual) {
      Alert.alert(
        "Monto inválido",
        "El abono no puede ser mayor al saldo actual.",
        [{ text: "Entendido", style: "cancel" }],
      );
      return;
    }

    await repo.registrarAbono({
      clienteId: detalle.clienteId,
      monto,
      fecha: new Date()
        .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
        .replace(" ", "T"),
    });

    // Refrescar detalle local y lista global
    const nuevoDetalle = await repo.getDetalle(detalle.clienteId);
    setDetalle(nuevoDetalle);
    await cargarResumenes();

    // ── 3. Magia aquí: En lugar de cerrar y abrir modales, solo cambiamos la vista ──
    setMontoAbono("");
    setVistaModal("detalle");
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

    // Retornamos nuestro modal único y su gestor de vistas
    modalGestor,
    vistaModal,
    setVistaModal,

    abrirDetalle,
    registrarAbono,
  };
};
