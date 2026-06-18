// src/presentation/screens/creditos/hooks/useCreditos.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import { CajaRepositoryImpl } from "../../../../data/repositories/CajaRepositoryImpl";
import { CreditoRepositoryImpl } from "../../../../data/repositories/CreditoRepositoryImpl";
import { Abono } from "../../../../domain/entities/Abono";
import {
  DetalleCredito,
  ResumenCredito,
} from "../../../../domain/entities/Credito";
import { useSlideModal } from "../../../hooks/useSlideModal";
import { VistaGestor } from "../components/GestorDeudaModal";

const repo = new CreditoRepositoryImpl();
const cajaRepo = new CajaRepositoryImpl();

export const useCreditos = () => {
  const [resumenes, setResumenes] = useState<ResumenCredito[]>([]);
  const [detalle, setDetalle] = useState<DetalleCredito | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [montoAbono, setMontoAbono] = useState("");
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<
    "Efectivo" | "Transferencia"
  >("Efectivo");

  const [facturaSeleccionadaId, setFacturaSeleccionadaId] = useState<
    string | null
  >(null);
  const [vistaModal, setVistaModal] = useState<VistaGestor>("detalle");

  // ── Estado modal de anulación ─────────────────────────────────────────────
  const [abonoAAnular, setAbonoAAnular] = useState<Abono | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [modalAnulacionVisible, setModalAnulacionVisible] = useState(false);
  const [anulando, setAnulando] = useState(false);

  // Animación del bottom sheet de anulación
  const anulacionSlide = useRef(new Animated.Value(400)).current;

  const modalGestor = useSlideModal(850);

  // ── Cargar lista ──────────────────────────────────────────────────────────
  const cargarResumenes = useCallback(async () => {
    setCargando(true);
    const data = await repo.getResumenes();
    setResumenes(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarResumenes();
  }, [cargarResumenes]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const resumenesFiltrados = resumenes.filter((r) =>
    r.nombreCliente.toLowerCase().includes(busqueda.toLowerCase().trim()),
  );

  // ── Abrir detalle ─────────────────────────────────────────────────────────
  const abrirDetalle = async (clienteId: string) => {
    setVistaModal("detalle");
    setMontoAbono("");
    setMetodoPagoAbono("Efectivo");
    setFacturaSeleccionadaId(null);
    setCargandoDetalle(true);
    modalGestor.abrir();

    const data = await repo.getDetalle(clienteId);
    setDetalle(data);
    setCargandoDetalle(false);
  };

  // ── Registrar abono ───────────────────────────────────────────────────────
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
      // Sin caja abierta no se puede registrar un abono
      const caja = await cajaRepo.getCajaAbierta();
      if (!caja) {
        Alert.alert(
          "No hay caja abierta",
          "Debes abrir una caja antes de registrar un abono.",
          [{ text: "Entendido", style: "cancel" }],
        );
        return;
      }

      await repo.registrarAbono({
        clienteId: detalle.clienteId,
        ventaId: facturaSeleccionadaId ?? "",
        monto,
        fecha: new Date()
          .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
          .replace(" ", "T"),
        metodoPago: metodoPagoAbono,
        cajaId: caja.id,
      });

      const nuevoDetalle = await repo.getDetalle(detalle.clienteId);
      setDetalle(nuevoDetalle);
      await cargarResumenes();

      setMontoAbono("");
      setMetodoPagoAbono("Efectivo");
      setFacturaSeleccionadaId(null);
      setVistaModal("detalle");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "No se pudo registrar el abono.");
    }
  };

  // ── Abrir modal de anulación ──────────────────────────────────────────────
  // En iOS no se puede abrir un Modal mientras otro está visible.
  // Solución: cerrar el GestorDeudaModal primero, esperar la animación
  // de cierre (~320ms), y luego mostrar el modal de anulación.
  const abrirModalAnulacion = (abono: Abono) => {
    setAbonoAAnular(abono);
    setMotivoAnulacion("");

    // 1. Cerrar el historial de abonos
    modalGestor.cerrar();

    // 2. Abrir el modal de anulación después de que termine la animación
    setTimeout(() => {
      setModalAnulacionVisible(true);
      Animated.spring(anulacionSlide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }, 350);
  };

  const cerrarModalAnulacion = (reabrirGestor = true) => {
    Animated.timing(anulacionSlide, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setModalAnulacionVisible(false);
      setAbonoAAnular(null);
      setMotivoAnulacion("");
      // Volver al historial de abonos una vez cerrado el modal de anulación
      if (reabrirGestor) {
        setTimeout(() => {
          setVistaModal("historial");
          modalGestor.abrir();
        }, 100);
      }
    });
  };

  // ── Confirmar anulación ───────────────────────────────────────────────────
  const confirmarAnulacion = async () => {
    if (!abonoAAnular) return;
    if (!motivoAnulacion.trim()) {
      Alert.alert(
        "Campo requerido",
        "Debes escribir el motivo de la anulación.",
      );
      return;
    }

    setAnulando(true);
    try {
      await repo.anularAbono({
        abonoId: abonoAAnular.id,
        motivo: motivoAnulacion.trim(),
      });

      // Refrescar detalle y lista antes de cerrar
      if (detalle) {
        const nuevoDetalle = await repo.getDetalle(detalle.clienteId);
        setDetalle(nuevoDetalle);
      }
      await cargarResumenes();

      // Cerrar y volver al historial con datos actualizados
      cerrarModalAnulacion(true);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "No se pudo anular el abono.");
    } finally {
      setAnulando(false);
    }
  };

  // ── Helper: ir directo a abonar una factura específica ───────────────────
  const irAAbonarFacturaEspecífica = (ventaId: string) => {
    setFacturaSeleccionadaId(ventaId);
    setVistaModal("abono");
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
    metodoPagoAbono,
    setMetodoPagoAbono,

    facturaSeleccionadaId,
    setFacturaSeleccionadaId,
    irAAbonarFacturaEspecífica,

    modalGestor,
    vistaModal,
    setVistaModal,

    // Anulación
    abonoAAnular,
    motivoAnulacion,
    setMotivoAnulacion,
    modalAnulacionVisible,
    anulacionSlide,
    anulando,
    abrirModalAnulacion,
    cerrarModalAnulacion,
    confirmarAnulacion,

    abrirDetalle,
    registrarAbono,
  };
};
