export interface Abono {
  id: string;
  clienteId: string;
  ventaId: string; // 👈 Vinculación indispensable
  monto: number;
  fecha: string;
}
