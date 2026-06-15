// src/domain/entities/Caja.ts

export type EstadoCaja = "abierta" | "cerrada";

export interface Caja {
  id: string;
  fecha: string;
  montoApertura: number;
  montoCierre: number;
  estado: EstadoCaja;
  notas?: string;
  creadoEn: string;
  cerradoEn?: string;
}

export interface ResumenCaja {
  caja: Caja;

  // Efectivo
  ventasEfectivo: number;
  abonosEfectivo: number;
  gastosEfectivo: number;
  saldoEsperadoEfectivo: number;

  // Transferencia
  ventasTransferencia: number;
  abonosTransferencia: number;
  gastosTransferencia: number;
  saldoNetoTransferencia: number;

  // Al cerrar
  diferencia?: number; // montoCierre - saldoEsperadoEfectivo
}
