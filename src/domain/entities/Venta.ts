export interface ItemVenta {
  productoId: string;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  clienteId: string;
  nombreCliente: string;
  items: ItemVenta[];
  total: number;
  tipo: "contado" | "credito";
  fecha: string;
  numeroFactura?: string;
  /**
   * 'pagado'  → contado o crédito completamente abonado
   * 'debe'    → crédito con saldo pendiente
   *
   * Nota: el campo existe en BD desde la migración anterior.
   * VentaRepositoryImpl siempre lo garantiza (nunca llega undefined).
   */
  estado: "pagado" | "debe";
}
