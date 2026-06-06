import { ItemVenta, Venta } from "../../domain/entities/Venta";
import { VentaRepository } from "../../domain/repositories/VentaRepository";
import db from "../database/database";
import { ProductoRepositoryImpl } from "./ProductoRepositoryImpl";

const productoRepo = new ProductoRepositoryImpl();

// ── Helper: construye el array de ItemVenta desde venta_items ─────────────────
// Primero intenta leer de venta_items (tabla normalizada).
// Si no hay filas (registro viejo migrado al vuelo), cae al JSON legacy.
const cargarItems = (ventaId: string, itemsJson: string): ItemVenta[] => {
  const filas = db.getAllSync<any>(
    `SELECT productoId, nombreProducto, precioUnitario, cantidad, subtotal
     FROM venta_items
     WHERE ventaId = ?
     ORDER BY rowid ASC;`,
    [ventaId],
  );

  if (filas.length > 0) return filas as ItemVenta[];

  // Fallback: JSON legacy (ventas antes de la migración)
  try {
    return JSON.parse(itemsJson) as ItemVenta[];
  } catch {
    return [];
  }
};

// ── Helper: estado normalizado ────────────────────────────────────────────────
const resolverEstado = (
  estado: string | null,
  tipo: string,
): "pagado" | "debe" => {
  if (estado === "pagado") return "pagado";
  if (estado === "debe") return "debe";
  return tipo === "contado" ? "pagado" : "debe";
};

export class VentaRepositoryImpl implements VentaRepository {
  async getAll(): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas ORDER BY rowid DESC;",
    );
    return rows.map((r) => ({
      ...r,
      items: cargarItems(r.id, r.items),
      estado: resolverEstado(r.estado, r.tipo),
    }));
  }

  async getByCliente(clienteId: string): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );
    return rows.map((r) => ({
      ...r,
      items: cargarItems(r.id, r.items),
      estado: resolverEstado(r.estado, r.tipo),
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

    const estadoInicial: "pagado" | "debe" =
      data.tipo === "contado" ? "pagado" : "debe";

    // ── Transacción: insertar venta + todos sus ítems atomicamente ────────
    db.withTransactionSync(() => {
      // La columna `items` queda '[]'; la fuente de verdad es venta_items.
      db.runSync(
        `INSERT INTO ventas
           (id, clienteId, nombreCliente, items, total, tipo, fecha, numeroFactura, estado)
         VALUES (?, ?, ?, '[]', ?, ?, ?, ?, ?);`,
        [
          id,
          data.clienteId,
          data.nombreCliente,
          data.total,
          data.tipo,
          data.fecha,
          numeroFactura,
          estadoInicial,
        ],
      );

      for (const item of data.items) {
        const itemId = `${id}_${item.productoId}`;
        db.runSync(
          `INSERT INTO venta_items
             (id, ventaId, productoId, nombreProducto, precioUnitario, cantidad, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            itemId,
            id,
            item.productoId,
            item.nombreProducto,
            item.precioUnitario,
            item.cantidad,
            item.subtotal,
          ],
        );
      }
    });

    // ── Descontar stock fuera de la transacción ───────────────────────────
    // Si falla, la venta ya quedó guardada (el stock es best-effort).
    try {
      for (const item of data.items) {
        await productoRepo.ajustarStock(item.productoId, -item.cantidad);
      }
    } catch (e) {
      console.warn("No se pudo ajustar stock:", e);
    }

    return {
      id,
      ...data,
      numeroFactura,
      estado: estadoInicial,
    };
  }

  async delete(id: string): Promise<void> {
    // ON DELETE CASCADE en venta_items borra los ítems automáticamente.
    db.runSync("DELETE FROM ventas WHERE id = ?;", [id]);
  }
}
