export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  disponible: number;
  imagen?: string; // ← URL o ruta local (opcional)
}
