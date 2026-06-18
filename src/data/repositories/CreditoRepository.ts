// src/data/repositories/CreditoRepository.ts

import { Abono } from "../../domain/entities/Abono";
import { DetalleCredito, ResumenCredito } from "../../domain/entities/Credito";

export interface CreditoRepository {
  getAbonos(): Promise<Abono[]>;

  /**
   * Devuelve únicamente los abonos registrados dentro de una caja específica.
   * Es lo que usa "venta del día" para mostrar solo lo de la caja actual.
   */
  getAbonosPorCaja(cajaId: string): Promise<Abono[]>;

  getResumenes(): Promise<ResumenCredito[]>;
  getDetalle(clienteId: string): Promise<DetalleCredito>;
  registrarAbono(params: {
    clienteId: string;
    ventaId: string;
    monto: number;
    fecha: string;
    metodoPago?: string;
    cajaId?: string;
  }): Promise<boolean>;
  anularAbono(params: {
    abonoId: string;
    motivo: string;
    usuario?: string;
  }): Promise<boolean>;
}
