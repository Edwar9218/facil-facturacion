import { ItemVenta, Venta } from "../../domain/entities/Venta";
import {
  AnulacionData,
  VentaRepository,
} from "../../domain/repositories/VentaRepository";
import db from "../database/database";
import { ProductoRepositoryImpl } from "./ProductoRepositoryImpl";

const productoRepo = new ProductoRepositoryImpl();

// ── Helper: construye el array de ItemVenta desde venta_items ─────────────────
const cargarItems = (ventaId: string, itemsJson: string): ItemVenta[] => {
  const filas = db.getAllSync<any>(
    `SELECT productoId, nombreProducto, precioUnitario, cantidad, subtotal, unidad
     FROM venta_items
     WHERE ventaId = ?
     ORDER BY rowid ASC;`,
    [ventaId],
  );

  if (filas.length > 0) return filas as ItemVenta[];

  try {
    return JSON.parse(itemsJson) as ItemVenta[];
  } catch {
    return [];
  }
};

// ── Helper: carga la anulación de una venta si existe ─────────────────────────
const cargarAnulacion = (ventaId: string): Venta["anulacion"] | undefined => {
  const row = db.getFirstSync<{
    fecha: string;
    usuario: string;
    motivo: string;
  }>(
    `SELECT fecha, usuario, motivo FROM anulaciones_venta WHERE ventaId = ?;`,
    [ventaId],
  );
  return row ?? undefined;
};

// ── Helper: estado normalizado ────────────────────────────────────────────────
const resolverEstado = (
  estado: string | null,
  tipo: string,
): "pagado" | "debe" | "anulada" => {
  if (estado === "pagado") return "pagado";
  if (estado === "debe") return "debe";
  if (estado === "anulada") return "anulada";
  return tipo === "contado" ? "pagado" : "debe";
};

// ── Helper: mapea una fila de BD a la entidad Venta ───────────────────────────
const mapearVenta = (r: any): Venta => {
  const estado = resolverEstado(r.estado, r.tipo);
  return {
    ...r,
    items: cargarItems(r.id, r.items),
    estado,
    metodoPago: (r.metodoPago as "efectivo" | "transferencia" | null) ?? null,
    anulacion: estado === "anulada" ? cargarAnulacion(r.id) : undefined,
  };
};

export class VentaRepositoryImpl implements VentaRepository {
  async getAll(): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas ORDER BY rowid DESC;",
    );
    return rows.map(mapearVenta);
  }

  async getByCliente(clienteId: string): Promise<Venta[]> {
    const rows = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );
    return rows.map(mapearVenta);
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

    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO ventas
           (id, clienteId, nombreCliente, items, total, tipo, fecha, numeroFactura, estado, metodoPago)
         VALUES (?, ?, ?, '[]', ?, ?, ?, ?, ?, ?);`,
        [
          id,
          data.clienteId,
          data.nombreCliente,
          data.total,
          data.tipo,
          data.fecha,
          numeroFactura,
          estadoInicial,
          data.metodoPago ?? null,
        ],
      );

      for (const item of data.items) {
        const itemId = `${id}_${item.productoId}`;
        db.runSync(
          `INSERT INTO venta_items
             (id, ventaId, productoId, nombreProducto, precioUnitario, cantidad, subtotal, unidad)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            itemId,
            id,
            item.productoId,
            item.nombreProducto,
            item.precioUnitario,
            item.cantidad,
            item.subtotal,
            item.unidad ?? "Und", // ← corregido
          ],
        );
      }
    });

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
      metodoPago: data.metodoPago ?? null,
    };
  }

  async delete(id: string): Promise<void> {
    db.runSync("DELETE FROM ventas WHERE id = ?;", [id]);
  }

  // ── ANULAR ────────────────────────────────────────────────────────────────
  /**
   * Flujo completo de anulación (atómico):
   *
   * 1. Verifica que la venta existe, NO está ya anulada, y NO tiene abonos
   * 2. Dentro de una transacción:
   * a. Cambia estado → 'anulada' en ventas
   * b. Inserta el registro de auditoría en anulaciones_venta
   * 3. Fuera de la transacción: restaura stock de cada ítem
   * (best-effort, igual que el descuento al crear)
   * 4. Devuelve la venta actualizada con el bloque anulacion incluido
   */
  async anular(id: string, data: AnulacionData): Promise<Venta> {
    // ── 1. Verificaciones previas ─────────────────────────────────────────
    const ventaRow = db.getFirstSync<any>(
      "SELECT * FROM ventas WHERE id = ?;",
      [id],
    );

    if (!ventaRow) {
      throw new Error(`Venta "${id}" no encontrada.`);
    }

    if (ventaRow.estado === "anulada") {
      throw new Error(
        `La factura ${ventaRow.numeroFactura ?? id} ya está anulada.`,
      );
    }

    // NUEVA VALIDACIÓN: Bloquear si tiene abonos registrados
    const abonoQuery = db.getFirstSync<{ totalAbonado: number }>(
      "SELECT SUM(monto) as totalAbonado FROM abonos WHERE ventaId = ?;",
      [id],
    );

    if (abonoQuery && abonoQuery.totalAbonado > 0) {
      throw new Error(
        "Esta factura tiene abonos registrados. Primero debes revertirlos manualmente.",
      );
    }

    const fechaAnulacion = new Date().toISOString();
    const anulacionId = `anu_${id}_${Date.now()}`;

    // ── 2. Transacción: marcar + auditoría ───────────────────────────────
    db.withTransactionSync(() => {
      // a) Marcar la venta como anulada
      db.runSync(`UPDATE ventas SET estado = 'anulada' WHERE id = ?;`, [id]);

      // b) Registrar auditoría
      db.runSync(
        `INSERT INTO anulaciones_venta (id, ventaId, fecha, usuario, motivo)
         VALUES (?, ?, ?, ?, ?);`,
        [anulacionId, id, fechaAnulacion, data.usuario, data.motivo],
      );
    });

    // ── 3. Restaurar stock (best-effort) ──────────────────────────────────
    const items = cargarItems(id, ventaRow.items);
    try {
      for (const item of items) {
        await productoRepo.ajustarStock(item.productoId, +item.cantidad);
      }
    } catch (e) {
      console.warn("No se pudo restaurar stock al anular:", e);
    }

    // ── 4. Devolver venta actualizada ─────────────────────────────────────
    const anulacion: Venta["anulacion"] = {
      fecha: fechaAnulacion,
      usuario: data.usuario,
      motivo: data.motivo,
    };

    return {
      id: ventaRow.id,
      clienteId: ventaRow.clienteId,
      nombreCliente: ventaRow.nombreCliente,
      items,
      total: ventaRow.total,
      tipo: ventaRow.tipo,
      fecha: ventaRow.fecha,
      numeroFactura: ventaRow.numeroFactura,
      estado: "anulada",
      metodoPago:
        (ventaRow.metodoPago as "efectivo" | "transferencia" | null) ?? null,
      anulacion,
    };
  }
}
