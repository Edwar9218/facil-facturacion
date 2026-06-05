import { Abono } from "../../domain/entities/Abono";
import { DetalleCredito, ResumenCredito } from "../../domain/entities/Credito";
import { Venta } from "../../domain/entities/Venta";
import { CreditoRepository } from "../../domain/repositories/CreditoRepository";
import db from "../database/database";

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
  // ── NUEVO: Retorna todos los abonos para que el Historial pueda
  //          calcular el estado real de cada factura sin lógica duplicada ──
  async getAbonos(): Promise<Abono[]> {
    return db.getAllSync<Abono>("SELECT * FROM abonos;");
  }

  // ── Resúmenes de Cartera ──────────────────────────────────────────────────
  async getResumenes(): Promise<ResumenCredito[]> {
    const ventas = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE tipo = 'credito';",
    );
    const abonos = db.getAllSync<Abono>("SELECT * FROM abonos;");
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

      // Factura saldada → no suma a cartera
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
    const abonosRaw = db.getAllSync<Abono>(
      "SELECT * FROM abonos WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );

    const abonosPorVenta = new Map<string, number>();
    for (const abono of abonosRaw) {
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

    const ventas: Venta[] = ventasRaw.map((v) => {
      const abonadoAFactura = abonosPorVenta.get(v.id) ?? 0;

      acumuladorDeudaTotal += v.total;
      acumuladorTotalAbonos += abonadoAFactura;
      acumuladorSaldoActual += v.total - abonadoAFactura;

      return {
        ...v,
        items: JSON.parse(v.items),
        numeroFactura: v.numeroFactura ?? "Sin factura",
        fecha: formatearFecha(v.fecha),
        estado: v.estado ?? "debe",
      };
    });

    const abonosFormateados: Abono[] = abonosRaw.map((a) => ({
      ...a,
      fecha: formatearFecha(a.fecha),
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
  }: {
    clienteId: string;
    ventaId: string;
    monto: number;
    fecha: string;
  }) {
    try {
      let montoRestante = monto;

      if (ventaId && ventaId !== "") {
        // Abono directo a factura específica
        await this.guardarAbonoEnDB(clienteId, ventaId, monto, fecha);

        // Recalcular saldo de esta factura y actualizar estado
        const abonoAcumulado = db.getFirstSync<any>(
          "SELECT SUM(monto) as total FROM abonos WHERE ventaId = ?",
          [ventaId],
        );
        const ventaRow = db.getFirstSync<any>(
          "SELECT total FROM ventas WHERE id = ?",
          [ventaId],
        );
        if (ventaRow) {
          const saldoRestante = ventaRow.total - (abonoAcumulado?.total ?? 0);
          db.runSync("UPDATE ventas SET estado = ? WHERE id = ?", [
            saldoRestante <= 0 ? "pagado" : "debe",
            ventaId,
          ]);
        }
      } else {
        // Abono global FIFO — aplica a las facturas más antiguas primero
        const ventasPendientes = db.getAllSync<any>(
          "SELECT id, total FROM ventas WHERE clienteId = ? AND tipo = 'credito' AND estado = 'debe' ORDER BY fecha ASC",
          [clienteId],
        );

        for (const venta of ventasPendientes) {
          if (montoRestante <= 0) break;

          const abonoAcumulado = db.getFirstSync<any>(
            "SELECT SUM(monto) as total FROM abonos WHERE ventaId = ?",
            [venta.id],
          );
          const saldoFactura = venta.total - (abonoAcumulado?.total ?? 0);

          if (saldoFactura > 0) {
            const aPagar = Math.min(montoRestante, saldoFactura);
            await this.guardarAbonoEnDB(clienteId, venta.id, aPagar, fecha);
            montoRestante -= aPagar;

            const saldoTrasAbono = saldoFactura - aPagar;
            db.runSync("UPDATE ventas SET estado = ? WHERE id = ?", [
              saldoTrasAbono <= 0 ? "pagado" : "debe",
              venta.id,
            ]);
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Error en FIFO:", error);
      throw error;
    }
  }

  private async guardarAbonoEnDB(
    clienteId: string,
    ventaId: string,
    monto: number,
    fecha: string,
  ) {
    db.runSync(
      "INSERT INTO abonos (id, clienteId, ventaId, monto, fecha) VALUES (?, ?, ?, ?, ?)",
      [Date.now().toString() + Math.random(), clienteId, ventaId, monto, fecha],
    );
  }
}
