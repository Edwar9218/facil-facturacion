// src/domain/repositories/CreditoRepository.ts

import { Abono } from "../entities/Abono";
import { DetalleCredito, ResumenCredito } from "../entities/Credito";

export interface CreditoRepository {
  getAbonos(): Promise<Abono[]>;
  getResumenes(): Promise<ResumenCredito[]>;
  getDetalle(clienteId: string): Promise<DetalleCredito>;
  registrarAbono(params: {
    clienteId: string;
    ventaId: string;
    monto: number;
    fecha: string;
    metodoPago?: string;
  }): Promise<boolean>;
  anularAbono(params: {
    abonoId: string;
    motivo: string;
    usuario?: string;
  }): Promise<boolean>;
}
