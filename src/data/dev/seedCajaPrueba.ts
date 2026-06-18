// src/data/dev/seedCajaPrueba.ts
//
// ⚠️ SOLO PARA PRUEBAS EN DESARROLLO.
// Este archivo permite crear (y luego borrar) una caja con fecha de AYER
// para poder probar el flujo de "caja anterior pendiente" sin tener que
// esperar un día real.
//
// No importar este archivo desde pantallas o flujos de producción.
// Se usa únicamente desde el panel de pruebas que se agregó en CajaWidget,
// visible solo cuando __DEV__ es true.

import db from "../database/database";

// Las cajas creadas por este archivo siempre llevan esta nota, para poder
// identificarlas y borrarlas fácilmente sin tocar cajas reales.
const NOTA_PRUEBA = "PRUEBA: caja de ayer (seed de desarrollo)";

// Calcula la fecha de "ayer" en formato YYYY-MM-DD, basándose en la fecha
// de hoy en zona horaria de Bogotá (igual que el resto del repositorio).
const fechaAyer = (): string => {
  const hoyStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });
  const d = new Date(`${hoyStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Crea una caja de prueba con fecha de ayer y estado "abierta".
 * Falla intencionalmente si ya hay una caja abierta (normalmente la de
 * hoy), para no romper la regla de "solo una caja abierta a la vez".
 */
export function crearCajaDePruebaAyer(montoApertura: number = 50000): {
  ok: boolean;
  mensaje: string;
} {
  const yaAbierta = db.getFirstSync<{ id: string }>(
    "SELECT id FROM caja WHERE estado = 'abierta' LIMIT 1;",
  );
  if (yaAbierta) {
    return {
      ok: false,
      mensaje:
        "Ya hay una caja abierta (probablemente la de hoy). Cierra esa caja o bórrala con el botón de 'Borrar cajas de prueba' antes de crear la de ayer.",
    };
  }

  const fecha = fechaAyer();
  const id = `prueba-${Date.now()}`;

  db.runSync(
    `INSERT INTO caja (id, fecha, montoApertura, montoCierre, estado, notas, creadoEn)
     VALUES (?, ?, ?, 0, 'abierta', ?, ?);`,
    [id, fecha, montoApertura, NOTA_PRUEBA, `${fecha}T08:00:00`],
  );

  return {
    ok: true,
    mensaje: `Caja de prueba creada con fecha ${fecha} y apertura de ${montoApertura}.`,
  };
}

/**
 * Borra todas las cajas creadas por crearCajaDePruebaAyer (id que empieza
 * con "prueba-"). Las cajas reales nunca usan ese prefijo, así que es
 * seguro correr esto cuantas veces se quiera.
 */
export function borrarCajasDePrueba(): number {
  const result = db.runSync("DELETE FROM caja WHERE id LIKE 'prueba-%';");
  return result.changes;
}
