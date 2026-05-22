import { Venta } from "../entities/Venta";

export interface VentaRepository {
  getAll(): Promise<Venta[]>;
  getByCliente(clienteId: string): Promise<Venta[]>;
  create(venta: Omit<Venta, "id">): Promise<Venta>;
  delete(id: string): Promise<void>;
}
