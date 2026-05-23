import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("facil.db");

export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS productos (
      id          TEXT PRIMARY KEY NOT NULL,
      nombre      TEXT NOT NULL,
      precio      REAL NOT NULL,
      unidad      TEXT NOT NULL,
      disponible  INTEGER NOT NULL DEFAULT 0,
      imagen      TEXT
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id          TEXT PRIMARY KEY NOT NULL,
      nombre      TEXT NOT NULL,
      telefono    TEXT NOT NULL,
      direccion   TEXT
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id              TEXT PRIMARY KEY NOT NULL,
      clienteId       TEXT NOT NULL,
      nombreCliente   TEXT NOT NULL,
      items           TEXT NOT NULL,
      total           REAL NOT NULL,
      tipo            TEXT NOT NULL,
      fecha           TEXT NOT NULL,
      numeroFactura   TEXT
    );

    CREATE TABLE IF NOT EXISTS abonos (
      id        TEXT PRIMARY KEY NOT NULL,
      clienteId TEXT NOT NULL,
      monto     REAL NOT NULL,
      fecha     TEXT NOT NULL
    );
  `);

  // Migración segura: agrega la columna si la BD ya existía sin ella
  try {
    db.execSync(`ALTER TABLE ventas ADD COLUMN numeroFactura TEXT;`);
  } catch (_) {
    // La columna ya existe — ignorar
  }
};

export default db;
