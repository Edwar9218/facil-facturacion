// src/data/database/database.ts

import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("facil.db");

export const initDatabase = (): void => {
  db.execSync(`PRAGMA foreign_keys = ON;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS productos (
      id           TEXT PRIMARY KEY NOT NULL,
      nombre       TEXT NOT NULL,
      precio       REAL NOT NULL,
      unidad       TEXT NOT NULL,
      disponible   INTEGER NOT NULL DEFAULT 0,
      imagen       TEXT,
      controlStock INTEGER NOT NULL DEFAULT 0,
      stock        REAL NOT NULL DEFAULT 0,
      stockMinimo  REAL NOT NULL DEFAULT 0,
      activo       INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id        TEXT PRIMARY KEY NOT NULL,
      nombre    TEXT NOT NULL,
      telefono  TEXT NOT NULL,
      direccion TEXT,
      activo    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id            TEXT PRIMARY KEY NOT NULL,
      clienteId     TEXT NOT NULL,
      nombreCliente TEXT NOT NULL,
      items         TEXT NOT NULL DEFAULT '[]',
      total         REAL NOT NULL,
      tipo          TEXT NOT NULL,
      fecha         TEXT NOT NULL,
      numeroFactura TEXT,
      estado        TEXT NOT NULL DEFAULT 'debe',
      metodoPago    TEXT,
      FOREIGN KEY (clienteId)
        REFERENCES clientes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS venta_items (
      id              TEXT PRIMARY KEY NOT NULL,
      ventaId         TEXT NOT NULL,
      productoId      TEXT NOT NULL,
      nombreProducto  TEXT NOT NULL,
      precioUnitario  REAL NOT NULL,
      cantidad        REAL NOT NULL,
      subtotal        REAL NOT NULL,
      unidad          TEXT NOT NULL DEFAULT 'Und',
      FOREIGN KEY (ventaId)
        REFERENCES ventas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (productoId)
        REFERENCES productos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS abonos (
      id              TEXT PRIMARY KEY NOT NULL,
      clienteId       TEXT NOT NULL,
      ventaId         TEXT NOT NULL,
      monto           REAL NOT NULL,
      fecha           TEXT NOT NULL,
      metodoPago      TEXT,
      estado          TEXT NOT NULL DEFAULT 'activo',
      motivoAnulacion TEXT,
      fechaAnulacion  TEXT,
      FOREIGN KEY (clienteId)
        REFERENCES clientes(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
      FOREIGN KEY (ventaId)
        REFERENCES ventas(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS anulaciones_venta (
      id        TEXT PRIMARY KEY NOT NULL,
      ventaId   TEXT NOT NULL UNIQUE,
      fecha     TEXT NOT NULL,
      usuario   TEXT NOT NULL,
      motivo    TEXT NOT NULL,
      FOREIGN KEY (ventaId)
        REFERENCES ventas(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS anulaciones_abonos (
      id        TEXT PRIMARY KEY NOT NULL,
      abonoId   TEXT NOT NULL UNIQUE,
      clienteId TEXT NOT NULL,
      ventaId   TEXT NOT NULL,
      motivo    TEXT NOT NULL,
      fecha     TEXT NOT NULL,
      usuario   TEXT NOT NULL DEFAULT 'admin',
      FOREIGN KEY (abonoId)
        REFERENCES abonos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );
  `);

  db.execSync(`
    DROP TRIGGER IF EXISTS desactivar_cliente_si_tiene_ventas;
    DROP TRIGGER IF EXISTS desactivar_producto_en_delete;

    CREATE TRIGGER desactivar_cliente_si_tiene_ventas
    BEFORE DELETE ON clientes
    FOR EACH ROW
    WHEN EXISTS (SELECT 1 FROM ventas WHERE clienteId = OLD.id)
    BEGIN
      UPDATE clientes SET activo = 0 WHERE id = OLD.id;
      SELECT RAISE(IGNORE);
    END;

    CREATE TRIGGER desactivar_producto_en_delete
    BEFORE DELETE ON productos
    FOR EACH ROW
    WHEN EXISTS (SELECT 1 FROM venta_items WHERE productoId = OLD.id)
    BEGIN
      UPDATE productos SET activo = 0 WHERE id = OLD.id;
      SELECT RAISE(IGNORE);
    END;
  `);

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_anulaciones_ventaId
      ON anulaciones_venta(ventaId);

    CREATE INDEX IF NOT EXISTS idx_anulaciones_abonos_abonoId
      ON anulaciones_abonos(abonoId);
  `);
};

export default db;
