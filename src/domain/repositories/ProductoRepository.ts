import { Producto } from "../entities/Producto";

export interface ProductoRepository {
  getAll(): Promise<Producto[]>;
  create(producto: Omit<Producto, "id">): Promise<Producto>;
  update(producto: Producto): Promise<void>;
  delete(id: string): Promise<void>;

  // Suma o resta stock de un producto.
  // Usar valor negativo para descontar (ej: -2 al vender 2 unidades).
  // Solo actúa si el producto tiene controlStock activo.
  ajustarStock(id: string, cantidad: number): Promise<void>;
}
