export interface ItemVenta {
  productoId: string;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  unidad: string;
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

  /**
   * Método de pago (solo aplica cuando tipo === 'contado')
   * 'efectivo'      → el cliente pagó en efectivo
   * 'transferencia' → el cliente pagó por transferencia
   * null            → venta a crédito, no aplica
   */
  metodoPago: "efectivo" | "transferencia" | null;

  /**
   * Id de la caja que estaba abierta cuando se registró la venta.
   * null → no había ninguna caja abierta en ese momento (caso excepcional)
   *        o la venta es anterior a este cambio.
   */
  cajaId: string | null;

  // ── Campos de anulación (solo presentes cuando estado === 'anulada') ──
  anulacion?: {
    fecha: string; // ISO timestamp del momento de anulación
    usuario: string; // Nombre o ID del usuario que anuló
    motivo: string; // Razón registrada por el usuario
  };
}
