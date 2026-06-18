import { Venta } from "../entities/Venta";

export interface AnulacionData {
  usuario: string;
  motivo: string;
}

export interface VentaRepository {
  getAll(): Promise<Venta[]>;
  getByCliente(clienteId: string): Promise<Venta[]>;

  /**
   * Devuelve únicamente las ventas registradas dentro de una caja específica.
   * Es lo que usa "venta del día" para mostrar solo lo de la caja actual.
   */
  getByCaja(cajaId: string): Promise<Venta[]>;

  create(venta: Omit<Venta, "id">): Promise<Venta>;
  delete(id: string): Promise<void>;

  /**
   * Anula una factura activa:
   * 1. Marca estado = 'anulada' en ventas
   * 2. Guarda fecha, usuario y motivo en la tabla anulaciones_venta
   * 3. Restaura el stock de cada ítem
   * 4. La venta permanece visible en el historial
   *
   * Lanza error si la venta ya está anulada.
   */
  anular(id: string, data: AnulacionData): Promise<Venta>;
}
