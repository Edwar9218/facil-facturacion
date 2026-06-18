// src/domain/entities/Gasto.ts

export type MetodoPagoGasto = "efectivo" | "transferencia";
export type EstadoGasto = "activo" | "anulado";

export const CATEGORIAS_SUGERIDAS = [
  "Transporte",
  "Insumos",
  "Servicios",
  "Personal",
] as const;

export interface Gasto {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: string;
  metodoPago: MetodoPagoGasto;
  foto?: string;
  cajaId?: string;
  creadoEn: string;
  estado: EstadoGasto;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
}
