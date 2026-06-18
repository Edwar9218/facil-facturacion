// src/domain/repositories/CajaRepository.ts

import { Caja, ResumenCaja } from "../entities/Caja";

export interface CajaRepository {
  // ── Consultas ────────────────────────────────────────────────────────────
  /** La caja abierta actualmente (sin importar la fecha). Solo puede existir una. */
  getCajaAbierta(): Promise<Caja | null>;
  /** La última caja (abierta o cerrada) registrada para una fecha dada. */
  getUltimaCajaDelDia(fecha: string): Promise<Caja | null>;
  /** Si hay una caja abierta de un día anterior a hoy (para avisar al usuario). */
  getCajaAbiertaAnterior(): Promise<Caja | null>;
  /** Historial completo de cajas, ordenado de la más reciente a la más antigua. */
  getHistorial(): Promise<Caja[]>;
  /** Totales (ventas, abonos, gastos) de una caja específica, sin mezclar con otras. */
  getResumen(cajaId: string): Promise<ResumenCaja>;

  // ── Acciones ─────────────────────────────────────────────────────────────
  /** Abre una nueva caja. Falla si ya existe una caja abierta. */
  abrirCaja(montoApertura: number): Promise<Caja>;
  cerrarCaja(params: {
    cajaId: string;
    montoCierre: number;
    notas?: string;
  }): Promise<Caja>;
}
