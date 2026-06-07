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
   * 'pagado'   → contado o crédito completamente abonado
   * 'debe'     → crédito con saldo pendiente
   * 'anulada'  → factura anulada; excluida de ventas activas
   */
  estado: "pagado" | "debe" | "anulada";

  // ── Campos de anulación (solo presentes cuando estado === 'anulada') ──
  anulacion?: {
    fecha: string; // ISO timestamp del momento de anulación
    usuario: string; // Nombre o ID del usuario que anuló
    motivo: string; // Razón registrada por el usuario
  };
}
