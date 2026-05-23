import { Abono } from "../entities/Abono";
import { DetalleCredito, ResumenCredito } from "../entities/Credito";

export interface CreditoRepository {
  getResumenes(): Promise<ResumenCredito[]>;
  getDetalle(clienteId: string): Promise<DetalleCredito>;
  registrarAbono(abono: Omit<Abono, "id">): Promise<Abono>;
}
