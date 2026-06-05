export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  disponible: number;
  imagen?: string; // ← URL o ruta local (opcional)

  // ── Inventario (opcional) ─────────────────────────────────────────────────
  controlStock?: boolean; // si este producto lleva control de stock
  stock?: number; // cantidad actual disponible
  stockMinimo?: number; // cantidad mínima antes de alertar
}

// ── Helper de estado de stock ─────────────────────────────────────────────────
// Úsalo en cualquier pantalla para saber el estado sin repetir lógica:
// const estado = getEstadoStock(producto)
// "sin-control" → no lleva inventario
// "ok"          → stock por encima del mínimo
// "bajo"        → stock en el mínimo o por debajo
// "agotado"     → stock en 0

export type EstadoStock = "sin-control" | "ok" | "bajo" | "agotado";

export const getEstadoStock = (producto: Producto): EstadoStock => {
  if (!producto.controlStock) return "sin-control";
  if ((producto.stock ?? 0) === 0) return "agotado";
  if ((producto.stock ?? 0) <= (producto.stockMinimo ?? 0)) return "bajo";
  return "ok";
};
