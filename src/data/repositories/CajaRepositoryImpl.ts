// src/data/repositories/CajaRepositoryImpl.ts

import { Caja, ResumenCaja } from "../../domain/entities/Caja";
import { CajaRepository } from "../../domain/repositories/CajaRepository";
import db from "../database/database";

const fechaHoy = (): string =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

const timestampAhora = (): string =>
  new Date()
    .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
    .replace(" ", "T");

export class CajaRepositoryImpl implements CajaRepository {
  // ── Caja abierta actualmente (solo puede existir una a la vez) ────────────
  async getCajaAbierta(): Promise<Caja | null> {
    return (
      db.getFirstSync<Caja>(
        "SELECT * FROM caja WHERE estado = 'abierta' ORDER BY creadoEn DESC LIMIT 1;",
      ) ?? null
    );
  }

  // ── Última caja (abierta o cerrada) de una fecha dada ──────────────────────
  async getUltimaCajaDelDia(fecha: string): Promise<Caja | null> {
    return (
      db.getFirstSync<Caja>(
        "SELECT * FROM caja WHERE fecha = ? ORDER BY creadoEn DESC LIMIT 1;",
        [fecha],
      ) ?? null
    );
  }

  // ── Caja abierta de un día anterior ──────────────────────────────────────
  async getCajaAbiertaAnterior(): Promise<Caja | null> {
    const abierta = await this.getCajaAbierta();
    if (abierta && abierta.fecha < fechaHoy()) return abierta;
    return null;
  }

  // ── Historial completo ─────────────────────────────────────────────────────
  async getHistorial(): Promise<Caja[]> {
    return db.getAllSync<Caja>("SELECT * FROM caja ORDER BY creadoEn DESC;");
  }

  // ── Resumen de una caja específica ──────────────────────────────────────
  async getResumen(cajaId: string): Promise<ResumenCaja> {
    const caja = db.getFirstSync<Caja>("SELECT * FROM caja WHERE id = ?;", [
      cajaId,
    ]);

    // ── Ventas ───────────────────────────────────────────────────────────
    const ventasEfectivo =
      db.getFirstSync<{ total: number }>(
        `SELECT COALESCE(SUM(total), 0) as total
       FROM ventas
       WHERE cajaId = ? AND tipo = 'contado' AND metodoPago = 'efectivo';`,
        [cajaId],
      )?.total ?? 0;

    const ventasTransferencia =
      db.getFirstSync<{ total: number }>(
        `SELECT COALESCE(SUM(total), 0) as total
       FROM ventas
       WHERE cajaId = ? AND tipo = 'contado' AND metodoPago = 'transferencia';`,
        [cajaId],
      )?.total ?? 0;

    // ── Abonos ───────────────────────────────────────────────────────────
    // NOTA: el metodoPago de un abono se guarda como "Efectivo"/"Transferencia"
    // (con mayúscula), a diferencia de ventas y gastos que usan minúscula.
    // Por eso aquí se compara con LOWER() para no perder esos registros.
    const abonosEfectivo =
      db.getFirstSync<{ total: number }>(
        `SELECT COALESCE(SUM(monto), 0) as total
       FROM abonos
       WHERE cajaId = ? AND LOWER(metodoPago) = 'efectivo' AND estado = 'activo';`,
        [cajaId],
      )?.total ?? 0;

    const abonosTransferencia =
      db.getFirstSync<{ total: number }>(
        `SELECT COALESCE(SUM(monto), 0) as total
       FROM abonos
       WHERE cajaId = ? AND LOWER(metodoPago) = 'transferencia' AND estado = 'activo';`,
        [cajaId],
      )?.total ?? 0;

    // ── Gastos ───────────────────────────────────────────────────────────
    const gastosEfectivo =
      db.getFirstSync<{ total: number }>(
        `SELECT COALESCE(SUM(monto), 0) as total
       FROM gastos
       WHERE cajaId = ? AND metodoPago = 'efectivo' AND estado = 'activo';`,
        [cajaId],
      )?.total ?? 0;

    const gastosTransferencia =
      db.getFirstSync<{ total: number }>(
        `SELECT COALESCE(SUM(monto), 0) as total
       FROM gastos
       WHERE cajaId = ? AND metodoPago = 'transferencia' AND estado = 'activo'`,
        [cajaId],
      )?.total ?? 0;

    // ── Cálculos ─────────────────────────────────────────────────────────
    const montoApertura = caja?.montoApertura ?? 0;
    const saldoEsperadoEfectivo =
      montoApertura + ventasEfectivo + abonosEfectivo - gastosEfectivo;

    const saldoNetoTransferencia =
      ventasTransferencia + abonosTransferencia - gastosTransferencia;

    const diferencia =
      caja?.estado === "cerrada"
        ? caja.montoCierre - saldoEsperadoEfectivo
        : undefined;

    return {
      caja: caja ?? null,
      ventasEfectivo,
      abonosEfectivo,
      gastosEfectivo,
      saldoEsperadoEfectivo,
      ventasTransferencia,
      abonosTransferencia,
      gastosTransferencia,
      saldoNetoTransferencia,
      diferencia,
    } as ResumenCaja;
  }

  // ── Abrir caja ───────────────────────────────────────────────────────────
  async abrirCaja(montoApertura: number): Promise<Caja> {
    const abierta = await this.getCajaAbierta();
    if (abierta) {
      throw new Error(
        "Ya hay una caja abierta. Cierra la caja actual antes de abrir una nueva.",
      );
    }

    const hoy = fechaHoy();
    const ahora = timestampAhora();
    const id = `${Date.now()}${Math.random()}`;

    db.runSync(
      `INSERT INTO caja (id, fecha, montoApertura, montoCierre, estado, creadoEn)
       VALUES (?, ?, ?, 0, 'abierta', ?);`,
      [id, hoy, montoApertura, ahora],
    );

    return db.getFirstSync<Caja>("SELECT * FROM caja WHERE id = ?;", [id])!;
  }

  // ── Cerrar caja ──────────────────────────────────────────────────────────
  async cerrarCaja({
    cajaId,
    montoCierre,
    notas,
  }: {
    cajaId: string;
    montoCierre: number;
    notas?: string;
  }): Promise<Caja> {
    const ahora = timestampAhora();

    db.runSync(
      `UPDATE caja
       SET montoCierre = ?, estado = 'cerrada', notas = ?, cerradoEn = ?
       WHERE id = ?;`,
      [montoCierre, notas ?? null, ahora, cajaId],
    );

    return db.getFirstSync<Caja>("SELECT * FROM caja WHERE id = ?;", [cajaId])!;
  }
}
