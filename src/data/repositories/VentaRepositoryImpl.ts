import { Venta } from "../../domain/entities/Venta";
import { VentaRepository } from "../../domain/repositories/VentaRepository";
import db from "../database/database";
import { ProductoRepositoryImpl } from "./ProductoRepositoryImpl";

const productoRepo = new ProductoRepositoryImpl();

export class VentaRepositoryImpl implements VentaRepository {
  async getAll(): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas ORDER BY rowid DESC;",
    );
    return rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items),
      // Garantizar que estado nunca llegue null al historial
      estado: r.estado ?? (r.tipo === "contado" ? "pagado" : "debe"),
    }));
  }

  async getByCliente(clienteId: string): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );
    return rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items),
      estado: r.estado ?? (r.tipo === "contado" ? "pagado" : "debe"),
    }));
  }

  async create(data: Omit<Venta, "id">): Promise<Venta> {
    const id = String(Date.now());
    const año = new Date().getFullYear();

    const resultado = db.getFirstSync<{ total: number }>(
      `SELECT COUNT(*) as total FROM ventas WHERE numeroFactura LIKE ?;`,
      [`${año}-%`],
    );
    const consecutivo = ((resultado?.total ?? 0) + 1)
      .toString()
      .padStart(3, "0");

    const numeroFactura = `${año}-${consecutivo}`;

    // El estado inicial depende del tipo:
    // contado → pagado de inmediato
    // credito → debe (pendiente de cobro)
    const estadoInicial = data.tipo === "contado" ? "pagado" : "debe";

    db.runSync(
      `INSERT INTO ventas (id, clienteId, nombreCliente, items, total, tipo, fecha, numeroFactura, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.clienteId,
        data.nombreCliente,
        JSON.stringify(data.items),
        data.total,
        data.tipo,
        data.fecha,
        numeroFactura,
        estadoInicial,
      ],
    );

    // ── Descontar stock si el producto tiene control activo ───────────────
    // Se hace después de guardar la venta para no bloquearla si algo falla.
    // Si un producto no tiene controlStock, ajustarStock lo ignora internamente.
    try {
      for (const item of data.items) {
        await productoRepo.ajustarStock(item.productoId, -item.cantidad);
      }
    } catch (e) {
      // El descuento de stock no debe romper el flujo de la venta.
      // Si falla, la venta ya quedó guardada.
      console.warn("No se pudo ajustar stock:", e);
    }

    return { id, ...data, numeroFactura, estado: estadoInicial };
  }

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM ventas WHERE id = ?;", [id]);
  }
}
