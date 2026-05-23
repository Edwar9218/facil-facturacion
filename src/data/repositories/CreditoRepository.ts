import { Abono } from "../entities/Abono";
import { DetalleCredito, ResumenCredito } from "../entities/Credito";

export interface CreditoRepository {
  // Todos los clientes con saldo pendiente
  getResumenes(): Promise<ResumenCredito[]>;

  // Detalle completo de un cliente: ventas + abonos
  getDetalle(clienteId: string): Promise<DetalleCredito>;

  // Registrar un abono
  registrarAbono(data: Omit<Abono, "id">): Promise<Abono>;

  // Historial de abonos de un cliente
  getAbonos(clienteId: string): Promise<Abono[]>;
}
