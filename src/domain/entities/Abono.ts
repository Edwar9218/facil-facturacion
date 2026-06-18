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
  /**
   * Id de la caja que estaba abierta cuando se registró el abono.
   * undefined/null → no había ninguna caja abierta en ese momento, o el
   * abono es anterior a este cambio.
   */
  cajaId?: string;
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
