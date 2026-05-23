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
  numeroFactura?: string; // ← agregar
}
