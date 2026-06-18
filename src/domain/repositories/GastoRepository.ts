// src/domain/repositories/GastoRepository.ts

import { Gasto, MetodoPagoGasto } from "../entities/Gasto";

export interface GastoRepository {
  // ── Consultas ────────────────────────────────────────────────────────────
  getGastosPorFecha(fecha: string): Promise<Gasto[]>;
  getGastosPorRango(params: {
    fechaInicio: string;
    fechaFin: string;
  }): Promise<Gasto[]>;

  /**
   * Devuelve únicamente los gastos registrados dentro de una caja específica.
   * Es lo que usa "venta del día" para mostrar solo lo de la caja actual.
   */
  getGastosPorCaja(cajaId: string): Promise<Gasto[]>;

  // ── Acciones ─────────────────────────────────────────────────────────────
  registrarGasto(params: {
    descripcion: string;
    monto: number;
    categoria: string;
    metodoPago: MetodoPagoGasto;
    foto?: string;
    cajaId?: string;
  }): Promise<Gasto>;

  eliminarGasto(gastoId: string): Promise<boolean>;

  anularGasto(params: {
    gastoId: string;
    motivo: string;
    usuario?: string;
  }): Promise<boolean>;
}
