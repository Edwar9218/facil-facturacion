export interface Configuracion {
  clave: string;
  valor: string;
}

// ── Claves disponibles en la app ──────────────────────────────────────────────
// Úsalas como constantes para evitar errores de tipeo en cualquier pantalla.

export const CONFIG_KEYS = {
  INVENTARIO_ACTIVO: "inventarioActivo",
} as const;
