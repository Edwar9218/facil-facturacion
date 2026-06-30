// src/data/database/database.ts

import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("facil.db");

// ── Migración: la tabla "caja" tenía fecha UNIQUE (1 caja por día). ──────────
// Ahora se permiten varias cajas por día (mientras solo una esté "abierta"),
// así que se recrea la tabla sin esa restricción si todavía la tiene.
const migrarTablaCaja = (): void => {
  const tabla = db.getFirstSync<{ sql: string }>(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'caja';`,
  );

  // Si la tabla no existe aún, el CREATE TABLE de abajo la crea ya sin UNIQUE.
  if (!tabla) return;

  // Si ya fue migrada (ya no tiene UNIQUE), no hacer nada.
  if (!tabla.sql.includes("UNIQUE")) return;

  db.execSync(`
    ALTER TABLE caja RENAME TO caja_old_migracion;

    CREATE TABLE caja (
      id            TEXT PRIMARY KEY NOT NULL,
      fecha         TEXT NOT NULL,
      montoApertura REAL NOT NULL DEFAULT 0,
      montoCierre   REAL NOT NULL DEFAULT 0,
      estado        TEXT NOT NULL DEFAULT 'abierta',
      notas         TEXT,
      creadoEn      TEXT NOT NULL,
      cerradoEn     TEXT
    );

    INSERT INTO caja (id, fecha, montoApertura, montoCierre, estado, notas, creadoEn, cerradoEn)
      SELECT id, fecha, montoApertura, montoCierre, estado, notas, creadoEn, cerradoEn
      FROM caja_old_migracion;

    DROP TABLE caja_old_migracion;
  `);
};

// ── Migración: agregar "cajaId" a "ventas" y "abonos" ─────────────────────────
// Estas dos tablas existían antes de vincularse a una caja. SQLite no soporta
// "ALTER TABLE ... ADD COLUMN IF NOT EXISTS", así que primero se verifica si
// la columna ya existe (vía PRAGMA table_info) antes de intentar agregarla.
const columnaExiste = (tabla: string, columna: string): boolean => {
  const filas = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tabla});`);
  return filas.some((f) => f.name === columna);
};

const migrarCajaIdEnVentasYAbonos = (): void => {
  if (!columnaExiste("ventas", "cajaId")) {
    db.execSync(
      `ALTER TABLE ventas ADD COLUMN cajaId TEXT REFERENCES caja(id);`,
    );
  }
  if (!columnaExiste("abonos", "cajaId")) {
    db.execSync(
      `ALTER TABLE abonos ADD COLUMN cajaId TEXT REFERENCES caja(id);`,
    );
  }
};

// ── Migración: agregar estado y motivoAnulacion a "gastos" ───────────────────
const migrarEstadoEnGastos = (): void => {
  if (!columnaExiste("gastos", "estado")) {
    db.execSync(
      `ALTER TABLE gastos ADD COLUMN estado TEXT NOT NULL DEFAULT 'activo';`,
    );
  }
  if (!columnaExiste("gastos", "motivoAnulacion")) {
    db.execSync(`ALTER TABLE gastos ADD COLUMN motivoAnulacion TEXT;`);
  }
  if (!columnaExiste("gastos", "fechaAnulacion")) {
    db.execSync(`ALTER TABLE gastos ADD COLUMN fechaAnulacion TEXT;`);
  }
};

export const initDatabase = (): void => {
  db.execSync(`PRAGMA foreign_keys = ON;`);

  migrarTablaCaja();

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

    -- ── NUEVO: Caja ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS caja (
      id            TEXT PRIMARY KEY NOT NULL,
      fecha         TEXT NOT NULL,
      montoApertura REAL NOT NULL DEFAULT 0,
      montoCierre   REAL NOT NULL DEFAULT 0,
      estado        TEXT NOT NULL DEFAULT 'abierta',
      notas         TEXT,
      creadoEn      TEXT NOT NULL,
      cerradoEn     TEXT
    );

    -- ── NUEVO: Gastos ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS gastos (
      id              TEXT PRIMARY KEY NOT NULL,
      fecha           TEXT NOT NULL,
      descripcion     TEXT NOT NULL,
      monto           REAL NOT NULL,
      categoria       TEXT NOT NULL,
      metodoPago      TEXT NOT NULL DEFAULT 'efectivo',
      foto            TEXT,
      cajaId          TEXT,
      creadoEn        TEXT NOT NULL,
      estado          TEXT NOT NULL DEFAULT 'activo',
      motivoAnulacion TEXT,
      fechaAnulacion  TEXT,
      FOREIGN KEY (cajaId)
        REFERENCES caja(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    );

    -- ── Anulaciones de gastos ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS anulaciones_gastos (
      id        TEXT PRIMARY KEY NOT NULL,
      gastoId   TEXT NOT NULL UNIQUE,
      motivo    TEXT NOT NULL,
      fecha     TEXT NOT NULL,
      usuario   TEXT NOT NULL DEFAULT 'admin',
      FOREIGN KEY (gastoId)
        REFERENCES gastos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    );
  `);

  // ── NUEVO: agrega cajaId a ventas/abonos si vienen de una versión anterior ──
  migrarCajaIdEnVentasYAbonos();

  // ── Migración estado/motivoAnulacion en gastos ────────────────────────────
  migrarEstadoEnGastos();

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

    -- ── NUEVO: índices caja y gastos ─────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_caja_fecha
      ON caja(fecha);

    -- Garantiza a nivel de BD que solo pueda existir una caja abierta a la vez
    CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_unica_abierta
      ON caja(estado) WHERE estado = 'abierta';

    CREATE INDEX IF NOT EXISTS idx_gastos_fecha
      ON gastos(fecha);

    CREATE INDEX IF NOT EXISTS idx_gastos_cajaId
      ON gastos(cajaId);

    CREATE INDEX IF NOT EXISTS idx_gastos_metodoPago
      ON gastos(metodoPago);

    CREATE INDEX IF NOT EXISTS idx_gastos_estado
      ON gastos(estado);

    CREATE INDEX IF NOT EXISTS idx_anulaciones_gastos_gastoId
      ON anulaciones_gastos(gastoId);

    -- ── NUEVO: índices cajaId en ventas y abonos ────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_ventas_cajaId
      ON ventas(cajaId);

    CREATE INDEX IF NOT EXISTS idx_abonos_cajaId
      ON abonos(cajaId);
  `);
};

// ── RESTABLECIMIENTO DE FÁBRICA ──────────────────────────────────────────────
// Borra todos los datos de la base de datos y recrea las tablas vacías.
export const resetDatabase = (): void => {
  db.execSync(`PRAGMA foreign_keys = OFF;`);

  db.execSync(`
    DROP TABLE IF EXISTS anulaciones_gastos;
    DROP TABLE IF EXISTS gastos;
    DROP TABLE IF EXISTS anulaciones_abonos;
    DROP TABLE IF EXISTS abonos;
    DROP TABLE IF EXISTS anulaciones_venta;
    DROP TABLE IF EXISTS venta_items;
    DROP TABLE IF EXISTS ventas;
    DROP TABLE IF EXISTS clientes;
    DROP TABLE IF EXISTS productos;
    DROP TABLE IF EXISTS caja;
    DROP TABLE IF EXISTS configuracion;
  `);

  db.execSync(`PRAGMA foreign_keys = ON;`);

  // Recrea todas las tablas limpias
  initDatabase();
};

export default db;
