import { Abono } from "./Abono";
import { Venta } from "./Venta";

export interface ResumenCredito {
  clienteId: string;
  nombreCliente: string;
  telefono: string;
  direccion?: string;
  deudaTotal: number;
  totalAbonos: number;
  saldoActual: number;
}

export interface DetalleCredito extends ResumenCredito {
  ventas: Venta[];
  abonos: Abono[];
}
