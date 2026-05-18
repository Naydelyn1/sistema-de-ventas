import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async resumenDia() {
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
    const inicio = new Date(hoy + 'T00:00:00-05:00')
    const fin = new Date(hoy + 'T23:59:59.999-05:00')

    const ventas = await this.prisma.venta.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      include: { detalles: true },
    })

    const compras = await this.prisma.compra.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
    })

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0)
    const totalCompras = compras.reduce((sum, c) => sum + Number(c.total), 0)

    return {
      fecha: hoy,
      cantidadVentas: ventas.length,
      totalVentas,
      cantidadCompras: compras.length,
      totalCompras,
      ganancia: totalVentas - totalCompras,
    }
  }

  async ventasPorFecha(desde: string, hasta: string) {
    const fechaDesde = new Date(desde + 'T00:00:00-05:00')
    const fechaHasta = new Date(hasta + 'T23:59:59.999-05:00')

    const ventas = await this.prisma.venta.findMany({
      where: { fecha: { gte: fechaDesde, lte: fechaHasta } },
      orderBy: { fecha: 'asc' },
    })

    const peruFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' })
    const grouped = new Map<string, { total: number; cantidad: number }>()
    for (const v of ventas) {
      const dateKey = peruFmt.format(v.fecha)
      const existing = grouped.get(dateKey) ?? { total: 0, cantidad: 0 }
      grouped.set(dateKey, {
        total: existing.total + Number(v.total),
        cantidad: existing.cantidad + 1,
      })
    }

    return Array.from(grouped.entries()).map(([fecha, data]) => ({ fecha, ...data }))
  }

  async productosMasVendidos() {
    const detalles = await this.prisma.detalleVenta.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 10,
    })

    const productos = await Promise.all(
      detalles.map(async (d) => {
        const producto = await this.prisma.producto.findUnique({
          where: { id: d.productoId },
          select: { id: true, nombre: true, precio: true },
        })
        return {
          producto,
          cantidadVendida: d._sum.cantidad,
          totalGenerado: d._sum.subtotal,
        }
      })
    )

    return productos
  }

  async stockBajo() {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
    })

    return productos.filter((p) => p.stock <= p.stockMinimo)
  }

  async resumenMensual(anio: number, mes: number) {
    const mm = String(mes).padStart(2, '0')
    const lastDay = new Date(anio, mes, 0).getDate()
    const inicio = new Date(`${anio}-${mm}-01T00:00:00-05:00`)
    const fin = new Date(`${anio}-${mm}-${lastDay}T23:59:59.999-05:00`)

    const ventas = await this.prisma.venta.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
    })

    const compras = await this.prisma.compra.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
    })

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0)
    const totalCompras = compras.reduce((sum, c) => sum + Number(c.total), 0)

    return {
      anio,
      mes,
      cantidadVentas: ventas.length,
      totalVentas,
      cantidadCompras: compras.length,
      totalCompras,
      ganancia: totalVentas - totalCompras,
    }
  }
}
