import { Producto } from "../../domain/entities/Producto";
import { ProductoRepository } from "../../domain/repositories/ProductoRepository";
import db from "../database/database";

export class ProductoRepositoryImpl implements ProductoRepository {
  async getAll(): Promise<Producto[]> {
    return db.getAllSync<Producto>(
      "SELECT * FROM productos ORDER BY rowid DESC;",
    );
  }

  async create(data: Omit<Producto, "id">): Promise<Producto> {
    const id = String(Date.now());
    db.runSync(
      `INSERT INTO productos (id, nombre, precio, unidad, disponible, imagen)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.nombre,
        data.precio,
        data.unidad,
        data.disponible ?? 0,
        data.imagen ?? null,
      ],
    );
    return { id, ...data };
  }

  async update(producto: Producto): Promise<void> {
    db.runSync(
      `UPDATE productos
       SET nombre = ?, precio = ?, unidad = ?, disponible = ?, imagen = ?
       WHERE id = ?;`,
      [
        producto.nombre,
        producto.precio,
        producto.unidad,
        producto.disponible ?? 0,
        producto.imagen ?? null,
        producto.id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM productos WHERE id = ?;", [id]);
  }
}
