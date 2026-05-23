import { Venta } from "../../domain/entities/Venta";
import { VentaRepository } from "../../domain/repositories/VentaRepository";
import db from "../database/database";

export class VentaRepositoryImpl implements VentaRepository {
  async getAll(): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas ORDER BY rowid DESC;",
    );
    return rows.map((r) => ({ ...r, items: JSON.parse(r.items) }));
  }

  async getByCliente(clienteId: string): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );
    return rows.map((r) => ({ ...r, items: JSON.parse(r.items) }));
  }

  async create(data: Omit<Venta, "id">): Promise<Venta> {
    const id = String(Date.now());
    const año = new Date().getFullYear();

    // Cuenta cuántas facturas hay este año para generar el consecutivo
    const resultado = db.getFirstSync<{ total: number }>(
      `SELECT COUNT(*) as total FROM ventas
       WHERE numeroFactura LIKE ?;`,
      [`${año}-%`],
    );
    const consecutivo = ((resultado?.total ?? 0) + 1)
      .toString()
      .padStart(3, "0");

    // Formato: 2026-001, 2026-002, ...
    const numeroFactura = `${año}-${consecutivo}`;

    db.runSync(
      `INSERT INTO ventas (id, clienteId, nombreCliente, items, total, tipo, fecha, numeroFactura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.clienteId,
        data.nombreCliente,
        JSON.stringify(data.items),
        data.total,
        data.tipo,
        data.fecha,
        numeroFactura,
      ],
    );

    return { id, ...data, numeroFactura };
  }

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM ventas WHERE id = ?;", [id]);
  }
}
