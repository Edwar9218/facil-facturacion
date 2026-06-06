export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  disponible: number;
  imagen?: string;

  // ── Soft delete ───────────────────────────────────────────────────────────
  /** false / 0 = archivado. El repo filtra activo=1 por defecto. */
  activo?: boolean;

  // ── Inventario (opcional) ─────────────────────────────────────────────────
  controlStock?: boolean;
  stock?: number;
  stockMinimo?: number;
}

// ── Helper de estado de stock ─────────────────────────────────────────────────
export type EstadoStock = "sin-control" | "ok" | "bajo" | "agotado";

export const getEstadoStock = (producto: Producto): EstadoStock => {
  if (!producto.controlStock) return "sin-control";
  if ((producto.stock ?? 0) === 0) return "agotado";
  if ((producto.stock ?? 0) <= (producto.stockMinimo ?? 0)) return "bajo";
  return "ok";
};
