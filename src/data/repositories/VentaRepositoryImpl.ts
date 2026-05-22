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
    db.runSync(
      `INSERT INTO ventas (id, clienteId, nombreCliente, items, total, tipo, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.clienteId,
        data.nombreCliente,
        JSON.stringify(data.items),
        data.total,
        data.tipo,
        data.fecha,
      ],
    );
    return { id, ...data };
  }

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM ventas WHERE id = ?;", [id]);
  }
}
