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
  // ── Resúmenes ─────────────────────────────────────────────────────────────
  async getResumenes(): Promise<ResumenCredito[]> {
    const ventas = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE tipo = 'credito';",
    );
    const abonos = db.getAllSync<Abono>("SELECT * FROM abonos;");
    const clientes = db.getAllSync<any>("SELECT * FROM clientes;");

    const mapa = new Map<string, ResumenCredito>();

    for (const venta of ventas) {
      const existente = mapa.get(venta.clienteId);
      if (existente) {
        existente.deudaTotal += venta.total;
        existente.saldoActual += venta.total;
      } else {
        const cliente = clientes.find((c) => c.id === venta.clienteId);
        mapa.set(venta.clienteId, {
          clienteId: venta.clienteId,
          nombreCliente: venta.nombreCliente,
          telefono: cliente?.telefono ?? "",
          direccion: cliente?.direccion ?? undefined,
          deudaTotal: venta.total,
          totalAbonos: 0,
          saldoActual: venta.total,
        });
      }
    }

    for (const abono of abonos) {
      const resumen = mapa.get(abono.clienteId);
      if (resumen) {
        resumen.totalAbonos += abono.monto;
        resumen.saldoActual = resumen.deudaTotal - resumen.totalAbonos;
      }
    }

    return Array.from(mapa.values()).filter((r) => r.saldoActual > 0);
  }

  // ── Detalle ───────────────────────────────────────────────────────────────
  async getDetalle(clienteId: string): Promise<DetalleCredito> {
    const resumenes = await this.getResumenes();
    const resumen = resumenes.find((r) => r.clienteId === clienteId);

    const ventasRaw = db.getAllSync<any>(
      "SELECT * FROM ventas WHERE clienteId = ? AND tipo = 'credito' ORDER BY rowid DESC;",
      [clienteId],
    );

    const ventas: Venta[] = ventasRaw.map((v, index) => ({
      ...v,
      items: JSON.parse(v.items),
      numeroFactura: v.numeroFactura ?? "Sin factura",
      fecha: formatearFecha(v.fecha),
    }));

    const abonos = db.getAllSync<Abono>(
      "SELECT * FROM abonos WHERE clienteId = ? ORDER BY rowid DESC;",
      [clienteId],
    );

    const abonosFormateados: Abono[] = abonos.map((a) => ({
      ...a,
      fecha: formatearFecha(a.fecha),
    }));

    return {
      clienteId,
      nombreCliente: resumen?.nombreCliente ?? "",
      telefono: resumen?.telefono ?? "",
      direccion: resumen?.direccion,
      deudaTotal: resumen?.deudaTotal ?? 0,
      totalAbonos: resumen?.totalAbonos ?? 0,
      saldoActual: resumen?.saldoActual ?? 0,
      ventas,
      abonos: abonosFormateados,
    };
  }

  // ── Registrar abono ───────────────────────────────────────────────────────
  async registrarAbono(data: Omit<Abono, "id">): Promise<Abono> {
    const id = String(Date.now());
    db.runSync(
      "INSERT INTO abonos (id, clienteId, monto, fecha) VALUES (?, ?, ?, ?);",
      [id, data.clienteId, data.monto, data.fecha],
    );
    return { id, ...data };
  }
}
