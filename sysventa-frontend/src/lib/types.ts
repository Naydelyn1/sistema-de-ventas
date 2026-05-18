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
  usuarioId: number
  clienteId?: number
  cliente?: Cliente
  usuario: { id: number; nombre: string }
  detalles: DetalleVenta[]
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

export interface AuthResponse {
  access_token: string
  usuario: Usuario
}
