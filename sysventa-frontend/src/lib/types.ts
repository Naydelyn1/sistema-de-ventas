export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'ADMIN' | 'CAJERO' | 'ALMACENERO'
  activo: boolean
  creadoEn: string
}

export interface Categoria {
  id: number
  nombre: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  stockMinimo: number
  activo: boolean
  categoriaId: number
  categoria: Categoria
  lote?: string
  fechaVencimiento?: string
  registroSanitario?: string
}

export interface Cliente {
  id: number
  nombre: string
  dni?: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
}

export interface Proveedor {
  id: number
  nombre: string
  ruc?: string
  contacto?: string
  telefono?: string
  email?: string
  activo: boolean
}

export interface DetalleVenta {
  id: number
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto: Producto
}

export interface Venta {
  id: number
  fecha: string
  total: number
  descuentoPct?: number
  formaPago?: string
  usuarioId: number
  clienteId?: number
  cliente?: Cliente
  usuario: { id: number; nombre: string }
  detalles: DetalleVenta[]
  tipoComprobante?: string
  serieComprobante?: string
  numeroComprobante?: number
  enlacePdf?: string
  aceptadaSunat?: boolean
}

export interface MovimientoStock {
  id: number
  productoId: number
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  stockAntes: number
  stockDespues: number
  motivo: 'COMPRA' | 'VENTA' | 'AJUSTE'
  ventaId?: number
  compraId?: number
  fecha: string
  usuarioId?: number
  producto?: { nombre: string; stock: number }
}

export interface DetalleCompra {
  id: number
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto: Producto
}

export interface Compra {
  id: number
  fecha: string
  total: number
  proveedorId: number
  proveedor: Proveedor
  usuarioId: number
  usuario: { id: number; nombre: string }
  serieComprobante?: string
  numeroComprobante?: string
  detalles?: DetalleCompra[]
}

export interface ResumenDia {
  fecha: string
  cantidadVentas: number
  totalVentas: number
  cantidadCompras: number
  totalCompras: number
  ganancia: number
}

export interface ProductoMasVendido {
  producto: { id: number; nombre: string; precio: number }
  cantidadVendida: number
  totalGenerado: number
}

export interface TurnoCaja {
  id: number
  usuarioId: number
  usuario: { id: number; nombre: string }
  fechaApertura: string
  fechaCierre?: string
  montoInicial: number
  montoFinal?: number
  totalVentas: number
  diferencia?: number
  estado: 'ABIERTO' | 'CERRADO'
  observaciones?: string
  // campos calculados al vuelo
  ventasPorFormaPago?: Record<string, number>
  cantidadPorFormaPago?: Record<string, number>
  totalVentasEfectivo?: number
  cantidadVentas?: number
  totalVentasTodas?: number
  montoEsperado?: number
}

export interface AuthResponse {
  access_token: string
  usuario: Usuario
}
