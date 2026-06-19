// src/data/repositories/CreditoRepositoryImpl.ts

import { Abono } from "../../domain/entities/Abono";
import { DetalleCredito, ResumenCredito } from "../../domain/entities/Credito";
import db from "../database/database";
import { CreditoRepository } from "./CreditoRepository";

// ── Formatear fecha ───────────────────────────────────────────────────────────
const formatearFecha = (fecha: string): string => {
  const d = new Date(fecha);
  return d.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export class CreditoRepositoryImpl implements CreditoRepository {
  // ── Todos los abonos (sin filtrar) ────────────────────────────────────────
  async getAbonos(): Promise<Abono[]> {
    return db.getAllSync<Abono>("SELECT * FROM abonos;");
  }

  // ── Abonos de una caja específica (usado por "venta del día") ────────────
  async getAbonosPorCaja(cajaId: string): Promise<Abono[]> {
    return db.getAllSync<Abono>(
      "SELECT * FROM abonos WHERE cajaId = ? ORDER BY rowid DESC;",
      [cajaId],
    );
  }

  // ── Resúmenes de Cartera (solo abonos activos cuentan) ────────────────────
  async getResumenes(): Promise<ResumenCredito[]> {
    const ventas = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE tipo = 'credito';",
    );
    const abonos = db.getAllSync<Abono>(
      "SELECT * FROM abonos WHERE estado = 'activo' OR estado IS NULL;",
    );
    const clientes = db.getAllSync<any>("SELECT * FROM clientes;");

    const abonosPorVenta = new Map<string, number>();
    for (const abono of abonos) {
      const acumulado = abonosPorVenta.get(abono.ventaId) ?? 0;
      abonosPorVenta.set(abono.ventaId, acumulado + abono.monto);
    }

    const mapaClientes = new Map<string, ResumenCredito>();

    for (const venta of ventas) {
      const totalAbonadoAFactura = abonosPorVenta.get(venta.id) ?? 0;
      const saldoRestanteFactura = venta.total - totalAbonadoAFactura;

      if (saldoRestanteFactura <= 0) continue;

      const existente = mapaClientes.get(venta.clienteId);
      if (existente) {
        existente.deudaTotal += venta.total;
        existente.totalAbonos += totalAbonadoAFactura;
        existente.saldoActual += saldoRestanteFactura;
      } else {
        const cliente = clientes.find((c) => c.id === venta.clienteId);
        mapaClientes.set(venta.clienteId, {
          clienteId: venta.clienteId,
          nombreCliente: venta.nombreCliente,
          telefono: cliente?.telefono ?? "",
          direccion: cliente?.direccion ?? undefined,
          deudaTotal: venta.total,
          totalAbonos: totalAbonadoAFactura,
          saldoActual: saldoRestanteFactura,
        });
      }
    }

    return Array.from(mapaClientes.values());
  }

  // ── Detalle de estado de cuenta de un Cliente ─────────────────────────────
  async getDetalle(clienteId: string): Promise<DetalleCredito> {
    // Todos los abonos del cliente (activos y anulados) para el historial
    const abonosRaw = db.getAllSync<Abono>(
      "SELECT * FROM abonos WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );

    // Solo abonos activos para calcular saldo
    const abonosActivos = abonosRaw.filter(
      (a) => a.estado === "activo" || !a.estado,
    );

    const abonosPorVenta = new Map<string, number>();
    for (const abono of abonosActivos) {
      const acumulado = abonosPorVenta.get(abono.ventaId) ?? 0;
      abonosPorVenta.set(abono.ventaId, acumulado + abono.monto);
    }

    const ventasRaw = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE clienteId = ? AND tipo = 'credito' ORDER BY rowid DESC;",
      [clienteId],
    );

    let acumuladorDeudaTotal = 0;
    let acumuladorTotalAbonos = 0;
    let acumuladorSaldoActual = 0;

    const ventas = ventasRaw.map((v) => {
      const abonadoAFactura = abonosPorVenta.get(v.id) ?? 0;

      acumuladorDeudaTotal += v.total;
      acumuladorTotalAbonos += abonadoAFactura;
      acumuladorSaldoActual += v.total - abonadoAFactura;

      // Primero busca en venta_items, si no hay usa el JSON de la columna items
      const itemsDeTabla = db.getAllSync<any>(
        `SELECT productoId, nombreProducto, precioUnitario, cantidad, subtotal, unidad
         FROM venta_items WHERE ventaId = ? ORDER BY rowid ASC;`,
        [v.id],
      );
      const items =
        itemsDeTabla.length > 0
          ? itemsDeTabla
          : v.items
            ? (() => {
                try {
                  return JSON.parse(v.items);
                } catch {
                  return [];
                }
              })()
            : [];

      return {
        ...v,
        items,
        numeroFactura: v.numeroFactura ?? "Sin factura",
        fecha: formatearFecha(v.fecha),
        estado: v.estado ?? "debe",
      };
    });

    const abonosFormateados: Abono[] = abonosRaw.map((a) => ({
      ...a,
      fecha: formatearFecha(a.fecha),
      fechaAnulacion: a.fechaAnulacion
        ? formatearFecha(a.fechaAnulacion)
        : undefined,
    }));

    const clientes = db.getAllSync<any>(
      "SELECT * FROM clientes WHERE id = ?;",
      [clienteId],
    );
    const cliente = clientes[0];

    return {
      clienteId,
      nombreCliente: cliente?.nombre ?? "Cliente desconocido",
      telefono: cliente?.telefono ?? "",
      direccion: cliente?.direccion ?? undefined,
      deudaTotal: acumuladorDeudaTotal,
      totalAbonos: acumuladorTotalAbonos,
      saldoActual: acumuladorSaldoActual,
      ventas,
      abonos: abonosFormateados,
    };
  }

  // ── Registrar abono (FIFO) ────────────────────────────────────────────────
  async registrarAbono({
    clienteId,
    ventaId,
    monto,
    fecha,
    metodoPago,
    cajaId,
  }: {
    clienteId: string;
    ventaId: string;
    monto: number;
    fecha: string;
    metodoPago?: string;
    cajaId?: string;
  }) {
    try {
      let montoRestante = monto;

      if (ventaId && ventaId !== "") {
        // Abono directo a factura específica
        await this.guardarAbonoEnDB(
          clienteId,
          ventaId,
          monto,
          fecha,
          metodoPago,
          cajaId,
        );
        this.recalcularEstadoVenta(ventaId);
      } else {
        // Abono global FIFO — aplica a las facturas más antiguas primero
        const ventasPendientes = db.getAllSync<any>(
          "SELECT id, total FROM ventas WHERE clienteId = ? AND tipo = 'credito' AND estado = 'debe' ORDER BY fecha ASC",
          [clienteId],
        );

        for (const venta of ventasPendientes) {
          if (montoRestante <= 0) break;

          const abonoAcumulado = db.getFirstSync<any>(
            "SELECT SUM(monto) as total FROM abonos WHERE ventaId = ? AND (estado = 'activo' OR estado IS NULL)",
            [venta.id],
          );
          const saldoFactura = venta.total - (abonoAcumulado?.total ?? 0);

          if (saldoFactura > 0) {
            const aPagar = Math.min(montoRestante, saldoFactura);
            await this.guardarAbonoEnDB(
              clienteId,
              venta.id,
              aPagar,
              fecha,
              metodoPago,
              cajaId,
            );
            montoRestante -= aPagar;
            this.recalcularEstadoVenta(venta.id);
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Error en FIFO:", error);
      throw error;
    }
  }

  // ── Anular abono ──────────────────────────────────────────────────────────
  async anularAbono({
    abonoId,
    motivo,
    usuario = "admin",
  }: {
    abonoId: string;
    motivo: string;
    usuario?: string;
  }): Promise<boolean> {
    try {
      const abono = db.getFirstSync<Abono>(
        "SELECT * FROM abonos WHERE id = ?;",
        [abonoId],
      );

      if (!abono) throw new Error("Abono no encontrado.");
      if (abono.estado === "anulado")
        throw new Error("El abono ya fue anulado.");

      const fechaAnulacion = new Date()
        .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
        .replace(" ", "T");

      // 1. Marcar el abono como anulado
      db.runSync(
        `UPDATE abonos
         SET estado = 'anulado', motivoAnulacion = ?, fechaAnulacion = ?
         WHERE id = ?;`,
        [motivo, fechaAnulacion, abonoId],
      );

      // 2. Registrar en tabla de auditoría
      const anulacionId = `${Date.now()}${Math.random()}`;
      db.runSync(
        `INSERT INTO anulaciones_abonos (id, abonoId, clienteId, ventaId, motivo, fecha, usuario)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          anulacionId,
          abonoId,
          abono.clienteId,
          abono.ventaId,
          motivo,
          fechaAnulacion,
          usuario,
        ],
      );

      // 3. Recalcular estado de la venta afectada
      this.recalcularEstadoVenta(abono.ventaId);

      return true;
    } catch (error) {
      console.error("Error al anular abono:", error);
      throw error;
    }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────
  private async guardarAbonoEnDB(
    clienteId: string,
    ventaId: string,
    monto: number,
    fecha: string,
    metodoPago?: string,
    cajaId?: string,
  ) {
    db.runSync(
      `INSERT INTO abonos (id, clienteId, ventaId, monto, fecha, metodoPago, estado, cajaId)
       VALUES (?, ?, ?, ?, ?, ?, 'activo', ?);`,
      [
        Date.now().toString() + Math.random(),
        clienteId,
        ventaId,
        monto,
        fecha,
        metodoPago ?? null,
        cajaId ?? null,
      ],
    );
  }

  // Recalcula si la venta queda 'pagado' o 'debe' considerando solo abonos activos
  private recalcularEstadoVenta(ventaId: string) {
    const venta = db.getFirstSync<any>(
      "SELECT total FROM ventas WHERE id = ?;",
      [ventaId],
    );
    if (!venta) return;

    const abonoAcumulado = db.getFirstSync<any>(
      "SELECT SUM(monto) as total FROM abonos WHERE ventaId = ? AND (estado = 'activo' OR estado IS NULL);",
      [ventaId],
    );

    const saldoRestante = venta.total - (abonoAcumulado?.total ?? 0);
    db.runSync("UPDATE ventas SET estado = ? WHERE id = ?;", [
      saldoRestante <= 0 ? "pagado" : "debe",
      ventaId,
    ]);
  }
}
