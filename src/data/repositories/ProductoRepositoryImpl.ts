import { Producto } from "../../domain/entities/Producto";
import { ProductoRepository } from "../../domain/repositories/ProductoRepository";
import db from "../database/database";

export class ProductoRepositoryImpl implements ProductoRepository {
  async getAll(): Promise<Producto[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM productos ORDER BY rowid DESC;",
    );
    return rows.map(this.mapRow);
  }

  async create(data: Omit<Producto, "id">): Promise<Producto> {
    const id = String(Date.now());
    db.runSync(
      `INSERT INTO productos
         (id, nombre, precio, unidad, disponible, imagen, controlStock, stock, stockMinimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
       SET nombre       = ?,
           precio       = ?,
           unidad       = ?,
           disponible   = ?,
           imagen       = ?,
           controlStock = ?,
           stock        = ?,
           stockMinimo  = ?
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

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM productos WHERE id = ?;", [id]);
  }

  // ── Método exclusivo de inventario ───────────────────────────────────────
  // Suma o resta stock de un producto. Se llama desde VentaRepositoryImpl
  // al registrar una venta. Usa valor negativo para descontar.
  async ajustarStock(id: string, cantidad: number): Promise<void> {
    db.runSync(
      `UPDATE productos
       SET stock = MAX(0, stock + ?)
       WHERE id = ? AND controlStock = 1;`,
      [cantidad, id],
    );
  }

  // ── Mapper privado ────────────────────────────────────────────────────────
  // Convierte la fila SQLite (donde controlStock es 0/1) al tipo Producto
  // (donde controlStock es boolean). Centralizado aquí para no repetirlo.
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
