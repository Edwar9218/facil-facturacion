import { Producto } from "../entities/Producto";

export interface ProductoRepository {
  getAll(): Promise<Producto[]>;
  create(producto: Omit<Producto, "id">): Promise<Producto>;
  update(producto: Producto): Promise<Producto>;
  delete(id: string): Promise<void>;
}
