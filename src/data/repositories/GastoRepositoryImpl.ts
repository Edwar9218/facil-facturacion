// src/data/repositories/GastoRepositoryImpl.ts

import { Gasto, MetodoPagoGasto } from "../../domain/entities/Gasto";
import { GastoRepository } from "../../domain/repositories/GastoRepository";
import db from "../database/database";

const fechaHoy = (): string =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

const timestampAhora = (): string =>
  new Date()
    .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
    .replace(" ", "T");

export class GastoRepositoryImpl implements GastoRepository {
  // ── Gastos por caja ──────────────────────────────────────────────────────
  async getGastosPorCaja(cajaId: string): Promise<Gasto[]> {
    return db.getAllSync<Gasto>(
      "SELECT * FROM gastos WHERE cajaId = ? ORDER BY creadoEn DESC;",
      [cajaId],
    );
  }

  // ── Gastos por fecha ─────────────────────────────────────────────────────
  async getGastosPorFecha(fecha: string): Promise<Gasto[]> {
    return db.getAllSync<Gasto>(
      "SELECT * FROM gastos WHERE fecha = ? ORDER BY creadoEn DESC;",
      [fecha],
    );
  }

  // ── Gastos por rango ─────────────────────────────────────────────────────
  async getGastosPorRango({
    fechaInicio,
    fechaFin,
  }: {
    fechaInicio: string;
    fechaFin: string;
  }): Promise<Gasto[]> {
    return db.getAllSync<Gasto>(
      `SELECT * FROM gastos
       WHERE fecha >= ? AND fecha <= ?
       ORDER BY fecha DESC, creadoEn DESC;`,
      [fechaInicio, fechaFin],
    );
  }

  // ── Registrar gasto ──────────────────────────────────────────────────────
  async registrarGasto({
    descripcion,
    monto,
    categoria,
    metodoPago,
    foto,
    cajaId,
  }: {
    descripcion: string;
    monto: number;
    categoria: string;
    metodoPago: MetodoPagoGasto;
    foto?: string;
    cajaId?: string;
  }): Promise<Gasto> {
    const id = `${Date.now()}${Math.random()}`;
    const hoy = fechaHoy();
    const ahora = timestampAhora();

    db.runSync(
      `INSERT INTO gastos (id, fecha, descripcion, monto, categoria, metodoPago, foto, cajaId, creadoEn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        hoy,
        descripcion,
        monto,
        categoria,
        metodoPago,
        foto ?? null,
        cajaId ?? null,
        ahora,
      ],
    );

    return db.getFirstSync<Gasto>("SELECT * FROM gastos WHERE id = ?;", [id])!;
  }

  // ── Eliminar gasto ───────────────────────────────────────────────────────
  async eliminarGasto(gastoId: string): Promise<boolean> {
    db.runSync("DELETE FROM gastos WHERE id = ?;", [gastoId]);
    return true;
  }
}
