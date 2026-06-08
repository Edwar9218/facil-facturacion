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

    CREATE TABLE IF NOT EXISTS anulaciones (
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

  // ── TRIGGERS ──────────────────────────────────────────────────────────────
  db.execSync(`
    DROP TRIGGER IF EXISTS desactivar_cliente_si_tiene_ventas;
    DROP TRIGGER IF EXISTS desactivar_producto_en_delete;
  `);

  db.execSync(`
    CREATE TRIGGER desactivar_cliente_si_tiene_ventas
    BEFORE DELETE ON clientes
    FOR EACH ROW
    WHEN EXISTS (SELECT 1 FROM ventas WHERE clienteId = OLD.id)
    BEGIN
      UPDATE clientes SET activo = 0 WHERE id = OLD.id;
      SELECT RAISE(IGNORE);
    END;
  `);

  db.execSync(`
    CREATE TRIGGER desactivar_producto_en_delete
    BEFORE DELETE ON productos
    FOR EACH ROW
    WHEN EXISTS (SELECT 1 FROM venta_items WHERE productoId = OLD.id)
    BEGIN
      UPDATE productos SET activo = 0 WHERE id = OLD.id;
      SELECT RAISE(IGNORE);
    END;
  `);

  // ── MIGRACIONES para usuarios con app ya instalada ────────────────────────

  const clientesInfo = db.getAllSync("PRAGMA table_info(clientes)");
  if (!clientesInfo.some((c: any) => c.name === "activo")) {
    db.execSync(
      `ALTER TABLE clientes ADD COLUMN activo INTEGER NOT NULL DEFAULT 1;`,
    );
  }

  const productosInfo = db.getAllSync("PRAGMA table_info(productos)");
  if (!productosInfo.some((c: any) => c.name === "activo")) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN activo INTEGER NOT NULL DEFAULT 1;`,
    );
  }
  if (!productosInfo.some((c: any) => c.name === "controlStock")) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN controlStock INTEGER NOT NULL DEFAULT 0;`,
    );
  }
  if (!productosInfo.some((c: any) => c.name === "stock")) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN stock REAL NOT NULL DEFAULT 0;`,
    );
  }
  if (!productosInfo.some((c: any) => c.name === "stockMinimo")) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN stockMinimo REAL NOT NULL DEFAULT 0;`,
    );
  }

  const ventasInfo = db.getAllSync("PRAGMA table_info(ventas)");
  if (!ventasInfo.some((c: any) => c.name === "estado")) {
    db.execSync(`ALTER TABLE ventas ADD COLUMN estado TEXT DEFAULT 'debe';`);
  }
  if (!ventasInfo.some((c: any) => c.name === "numeroFactura")) {
    db.execSync(`ALTER TABLE ventas ADD COLUMN numeroFactura TEXT;`);
  }
  if (!ventasInfo.some((c: any) => c.name === "metodoPago")) {
    db.execSync(`ALTER TABLE ventas ADD COLUMN metodoPago TEXT;`);
  }

  const abonosInfo = db.getAllSync("PRAGMA table_info(abonos)");
  if (!abonosInfo.some((c: any) => c.name === "ventaId")) {
    db.execSync(
      `ALTER TABLE abonos ADD COLUMN ventaId TEXT NOT NULL DEFAULT '';`,
    );
  }
  if (!abonosInfo.some((c: any) => c.name === "metodoPago")) {
    db.execSync(`ALTER TABLE abonos ADD COLUMN metodoPago TEXT;`);
  }
  if (!abonosInfo.some((c: any) => c.name === "estado")) {
    db.execSync(
      `ALTER TABLE abonos ADD COLUMN estado TEXT NOT NULL DEFAULT 'activo';`,
    );
  }
  if (!abonosInfo.some((c: any) => c.name === "motivoAnulacion")) {
    db.execSync(`ALTER TABLE abonos ADD COLUMN motivoAnulacion TEXT;`);
  }
  if (!abonosInfo.some((c: any) => c.name === "fechaAnulacion")) {
    db.execSync(`ALTER TABLE abonos ADD COLUMN fechaAnulacion TEXT;`);
  }

  // ── Índices ───────────────────────────────────────────────────────────────
  try {
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_anulaciones_ventaId
        ON anulaciones(ventaId);
      CREATE INDEX IF NOT EXISTS idx_anulaciones_abonos_abonoId
        ON anulaciones_abonos(abonoId);
    `);
  } catch {
    // Tabla muy vieja: el CREATE TABLE IF NOT EXISTS ya la habrá creado.
  }

  // ── Migración: poblar venta_items desde la columna JSON 'items' ──────────
  const ventasSinItems = db.getAllSync<{ id: string; items: string }>(`
    SELECT v.id, v.items
    FROM ventas v
    WHERE v.items IS NOT NULL
      AND v.items != '[]'
      AND v.items != ''
      AND NOT EXISTS (
        SELECT 1 FROM venta_items vi WHERE vi.ventaId = v.id
      );
  `);

  for (const venta of ventasSinItems) {
    try {
      const items: Array<{
        productoId: string;
        nombreProducto: string;
        precioUnitario: number;
        cantidad: number;
        subtotal: number;
      }> = JSON.parse(venta.items);

      for (const item of items) {
        const itemId = `${venta.id}_${item.productoId}_${Date.now()}`;
        db.runSync(
          `INSERT OR IGNORE INTO venta_items
             (id, ventaId, productoId, nombreProducto, precioUnitario, cantidad, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            itemId,
            venta.id,
            item.productoId,
            item.nombreProducto,
            item.precioUnitario,
            item.cantidad,
            item.subtotal,
          ],
        );
      }
    } catch {
      // JSON corrupto: se omite esa venta.
    }
  }
};

export default db;
