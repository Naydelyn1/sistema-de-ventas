import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearProductoDto } from './dto/crear-producto.dto'
import { ActualizarProductoDto } from './dto/actualizar-producto.dto'

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearProductoDto) {
    return this.prisma.producto.create({ data: dto, include: { categoria: true } })
  }

  async findAll(soloActivos = true) {
    return this.prisma.producto.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    })
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({ where: { id }, include: { categoria: true } })
    if (!producto) throw new NotFoundException('Producto no encontrado')
    return producto
  }

  async actualizar(id: number, dto: ActualizarProductoDto) {
    await this.findOne(id)
    return this.prisma.producto.update({ where: { id }, data: dto, include: { categoria: true } })
  }

  async toggleActivo(id: number) {
    const producto = await this.findOne(id)
    return this.prisma.producto.update({ where: { id }, data: { activo: !producto.activo } })
  }

  async stockBajo() {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: { stock: 'asc' },
    })
    return productos.filter((p) => p.stock <= p.stockMinimo)
  }

  async porVencer() {
    const hoy = new Date()
    const en30dias = new Date()
    en30dias.setDate(hoy.getDate() + 30)
    return this.prisma.producto.findMany({
      where: { activo: true, fechaVencimiento: { gte: hoy, lte: en30dias } },
      orderBy: { fechaVencimiento: 'asc' },
    })
  }

  async backfillKardex() {
    // Eliminar solo movimientos sin ventaId/compraId (los auto-generados ahora ya tienen IDs)
    // Para evitar duplicados: eliminar todos y reconstruir desde cero
    await this.prisma.movimientoStock.deleteMany({})

    const productos = await this.prisma.producto.findMany({ select: { id: true, stock: true } })

    // Obtener todas las transacciones ordenadas por fecha ASC
    const compras = await this.prisma.detalleCompra.findMany({
      include: { compra: { select: { id: true, fecha: true, usuarioId: true } } },
      orderBy: { compra: { fecha: 'asc' } },
    })
    const ventas = await this.prisma.detalleVenta.findMany({
      include: { venta: { select: { id: true, fecha: true, usuarioId: true } } },
      orderBy: { venta: { fecha: 'asc' } },
    })

    // Calcular stock inicial por producto: stock_actual + total_salidas - total_entradas
    const stockSim: Record<number, number> = {}
    for (const p of productos) {
      const entradas = compras.filter((c) => c.productoId === p.id).reduce((s, c) => s + c.cantidad, 0)
      const salidas = ventas.filter((v) => v.productoId === p.id).reduce((s, v) => s + v.cantidad, 0)
      stockSim[p.id] = Math.max(0, p.stock + salidas - entradas)
    }

    // Mezclar compras y ventas en orden cronológico
    type Evento =
      | { tipo: 'ENTRADA'; fecha: Date; productoId: number; cantidad: number; compraId: number; ventaId?: never; usuarioId: number | null }
      | { tipo: 'SALIDA'; fecha: Date; productoId: number; cantidad: number; ventaId: number; compraId?: never; usuarioId: number | null }

    const eventos: Evento[] = [
      ...compras.map((c) => ({
        tipo: 'ENTRADA' as const,
        fecha: c.compra.fecha,
        productoId: c.productoId,
        cantidad: c.cantidad,
        compraId: c.compra.id,
        usuarioId: c.compra.usuarioId,
      })),
      ...ventas.map((v) => ({
        tipo: 'SALIDA' as const,
        fecha: v.venta.fecha,
        productoId: v.productoId,
        cantidad: v.cantidad,
        ventaId: v.venta.id,
        usuarioId: v.venta.usuarioId,
      })),
    ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

    // Crear movimientos en orden
    for (const ev of eventos) {
      const stockAntes = stockSim[ev.productoId] ?? 0
      const stockDespues = ev.tipo === 'ENTRADA' ? stockAntes + ev.cantidad : stockAntes - ev.cantidad
      stockSim[ev.productoId] = stockDespues
      await this.prisma.movimientoStock.create({
        data: {
          productoId: ev.productoId,
          tipo: ev.tipo,
          cantidad: ev.cantidad,
          stockAntes,
          stockDespues,
          motivo: ev.tipo === 'ENTRADA' ? 'COMPRA' : 'VENTA',
          compraId: ev.tipo === 'ENTRADA' ? ev.compraId : null,
          ventaId: ev.tipo === 'SALIDA' ? ev.ventaId : null,
          usuarioId: ev.usuarioId,
          fecha: ev.fecha,
        },
      })
    }

    return { ok: true, movimientosCreados: eventos.length }
  }

  async kardex(id: number, desde?: string, hasta?: string) {
    await this.findOne(id)
    const where: any = { productoId: id }
    if (desde && hasta) {
      where.fecha = {
        gte: new Date(desde + 'T00:00:00-05:00'),
        lte: new Date(hasta + 'T23:59:59.999-05:00'),
      }
    }
    return this.prisma.movimientoStock.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        producto: { select: { nombre: true, stock: true } },
      },
    })
  }
}
