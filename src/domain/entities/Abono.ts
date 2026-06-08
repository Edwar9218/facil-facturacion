// src/domain/entities/Abono.ts

export interface Abono {
  id: string;
  clienteId: string;
  ventaId: string;
  monto: number;
  fecha: string;
  metodoPago?: string; // "Efectivo" | "Transferencia" | etc.
  estado?: "activo" | "anulado"; // default: "activo"
  motivoAnulacion?: string;
  fechaAnulacion?: string;
}

export interface AnulacionAbono {
  id: string;
  abonoId: string;
  clienteId: string;
  ventaId: string;
  motivo: string;
  fecha: string;
  usuario: string;
}
