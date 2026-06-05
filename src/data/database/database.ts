import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("facil.db");

export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS productos (
      id           TEXT PRIMARY KEY NOT NULL,
      nombre       TEXT NOT NULL,
      precio       REAL NOT NULL,
      unidad       TEXT NOT NULL,
      disponible   INTEGER NOT NULL DEFAULT 0,
      imagen       TEXT,
      controlStock INTEGER NOT NULL DEFAULT 0,
      stock        REAL NOT NULL DEFAULT 0,
      stockMinimo  REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id          TEXT PRIMARY KEY NOT NULL,
      nombre      TEXT NOT NULL,
      telefono    TEXT NOT NULL,
      direccion   TEXT
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id            TEXT PRIMARY KEY NOT NULL,
      clienteId     TEXT NOT NULL,
      nombreCliente TEXT NOT NULL,
      items         TEXT NOT NULL,
      total         REAL NOT NULL,
      tipo          TEXT NOT NULL,
      fecha         TEXT NOT NULL,
      numeroFactura TEXT,
      estado        TEXT DEFAULT 'debe'
    );

    CREATE TABLE IF NOT EXISTS abonos (
      id        TEXT PRIMARY KEY NOT NULL,
      clienteId TEXT NOT NULL,
      ventaId   TEXT NOT NULL,
      monto     REAL NOT NULL,
      fecha     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );
  `);

  // ── Migraciones seguras ───────────────────────────────────────────────────
  // Usamos PRAGMA table_info para no fallar si las columnas ya existen.
  // Esto protege a usuarios que ya tienen la app instalada.

  // 1. Asegurar estado en ventas
  const ventasInfo = db.getAllSync("PRAGMA table_info(ventas)");
  const tieneEstado = ventasInfo.some((col: any) => col.name === "estado");
  if (!tieneEstado) {
    db.execSync(`ALTER TABLE ventas ADD COLUMN estado TEXT DEFAULT 'debe';`);
  }

  // 2. Asegurar numeroFactura en ventas
  const tieneFactura = ventasInfo.some(
    (col: any) => col.name === "numeroFactura",
  );
  if (!tieneFactura) {
    db.execSync(`ALTER TABLE ventas ADD COLUMN numeroFactura TEXT;`);
  }

  // 3. Asegurar ventaId en abonos
  const abonosInfo = db.getAllSync("PRAGMA table_info(abonos)");
  const tieneVentaId = abonosInfo.some((col: any) => col.name === "ventaId");
  if (!tieneVentaId) {
    db.execSync(
      `ALTER TABLE abonos ADD COLUMN ventaId TEXT NOT NULL DEFAULT '';`,
    );
  }

  // 4. Migración inventario en productos (para usuarios que ya tienen la app)
  const productosInfo = db.getAllSync("PRAGMA table_info(productos)");

  const tieneControlStock = productosInfo.some(
    (col: any) => col.name === "controlStock",
  );
  if (!tieneControlStock) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN controlStock INTEGER NOT NULL DEFAULT 0;`,
    );
  }

  const tieneStock = productosInfo.some((col: any) => col.name === "stock");
  if (!tieneStock) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN stock REAL NOT NULL DEFAULT 0;`,
    );
  }

  const tieneStockMinimo = productosInfo.some(
    (col: any) => col.name === "stockMinimo",
  );
  if (!tieneStockMinimo) {
    db.execSync(
      `ALTER TABLE productos ADD COLUMN stockMinimo REAL NOT NULL DEFAULT 0;`,
    );
  }
};

export default db;
