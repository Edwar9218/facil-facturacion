import { Producto } from "../../domain/entities/Producto";
import { ProductoRepository } from "../../domain/repositories/ProductoRepository";
import db from "../database/database";

export class ProductoRepositoryImpl implements ProductoRepository {
  async getAll(): Promise<Producto[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM productos WHERE activo = 1 ORDER BY rowid DESC;",
    );
    return rows.map(this.mapRow);
  }

  async getArchivados(): Promise<Producto[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM productos WHERE activo = 0 ORDER BY rowid DESC;",
    );
    return rows.map(this.mapRow);
  }

  async create(data: Omit<Producto, "id">): Promise<Producto> {
    const id = String(Date.now());
    db.runSync(
      `INSERT INTO productos
         (id, nombre, precio, unidad, disponible, imagen, controlStock, stock, stockMinimo, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1);`,
      [
        id,
        data.nombre,
        data.precio,
        data.unidad,
        data.disponible ?? 0,
        data.imagen ?? null,
        data.controlStock ? 1 : 0,
        data.stock ?? 0,
        data.stockMinimo ?? 0,
      ],
    );
    return { id, ...data };
  }

  async update(producto: Producto): Promise<void> {
    db.runSync(
      `UPDATE productos
       SET nombre=?, precio=?, unidad=?, disponible=?, imagen=?,
           controlStock=?, stock=?, stockMinimo=?
       WHERE id = ?;`,
      [
        producto.nombre,
        producto.precio,
        producto.unidad,
        producto.disponible ?? 0,
        producto.imagen ?? null,
        producto.controlStock ? 1 : 0,
        producto.stock ?? 0,
        producto.stockMinimo ?? 0,
        producto.id,
      ],
    );
  }

  // DELETE activa el trigger → siempre archiva, nunca borra de verdad
  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM productos WHERE id = ?;", [id]);
  }

  async reactivar(id: string): Promise<void> {
    db.runSync("UPDATE productos SET activo = 1 WHERE id = ?;", [id]);
  }

  async ajustarStock(id: string, cantidad: number): Promise<void> {
    db.runSync(
      `UPDATE productos SET stock = MAX(0, stock + ?)
       WHERE id = ? AND controlStock = 1;`,
      [cantidad, id],
    );
  }

  private mapRow(row: any): Producto {
    return {
      id: row.id,
      nombre: row.nombre,
      precio: row.precio,
      unidad: row.unidad,
      disponible: row.disponible,
      imagen: row.imagen ?? undefined,
      controlStock: row.controlStock === 1,
      stock: row.stock ?? 0,
      stockMinimo: row.stockMinimo ?? 0,
    };
  }
}
