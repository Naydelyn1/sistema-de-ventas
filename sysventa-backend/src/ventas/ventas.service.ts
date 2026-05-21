import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearVentaDto } from './dto/crear-venta.dto'

@Injectable()
export class VentasService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearVentaDto, usuarioId: number) {
    const turnoAbierto = await this.prisma.turnoCaja.findFirst({ where: { estado: 'ABIERTO' } })
    if (!turnoAbierto) throw new BadRequestException('No hay un turno de caja abierto. Abre el turno antes de realizar ventas.')

    for (const detalle of dto.detalles) {
      const producto = await this.prisma.producto.findUnique({ where: { id: detalle.productoId } })
      if (!producto || !producto.activo) throw new NotFoundException(`Producto ${detalle.productoId} no encontrado`)
      if (producto.stock < detalle.cantidad) throw new BadRequestException(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`
      )
    }

    const descPct = dto.descuentoPct ?? 0
    const formaPago = dto.formaPago ?? 'EFECTIVO'

    const venta = await this.prisma.$transaction(async (tx) => {
      let totalBruto = 0
      const detallesData: { productoId: number; cantidad: number; precioUnitario: any; subtotal: number }[] = []

      for (const detalle of dto.detalles) {
        const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } })
        const subtotal = Number(producto!.precio) * detalle.cantidad
        totalBruto += subtotal

        detallesData.push({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: producto!.precio,
          subtotal,
        })

        const stockAntes = producto!.stock
        const stockDespues = stockAntes - detalle.cantidad

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { decrement: detalle.cantidad } },
        })

        await tx.movimientoStock.create({
          data: {
            productoId: detalle.productoId,
            tipo: 'SALIDA',
            cantidad: detalle.cantidad,
            stockAntes,
            stockDespues,
            motivo: 'VENTA',
            usuarioId,
          },
        })
      }

      const descuentoMonto = Math.round(totalBruto * descPct) / 100
      const total = Math.round((totalBruto - descuentoMonto) * 100) / 100

      return tx.venta.create({
        data: {
          total,
          descuentoPct: descPct,
          formaPago,
          usuarioId,
          clienteId: dto.clienteId,
          detalles: { create: detallesData },
        },
        include: {
          detalles: { include: { producto: true } },
          cliente: true,
          usuario: { select: { id: true, nombre: true } },
        },
      })
    })

    // Actualizar ventaId en movimientos recién creados
    await this.prisma.movimientoStock.updateMany({
      where: { ventaId: null, motivo: 'VENTA', usuarioId },
      data: { ventaId: venta.id },
    })

    return venta
  }

  async findAll() {
    return this.prisma.venta.findMany({
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    })
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
      },
    })
    if (!venta) throw new NotFoundException('Venta no encontrada')
    return venta
  }

  async ventasDelDia(desde?: string, hasta?: string) {
    let fechaDesde: Date
    let fechaHasta: Date
    if (desde && hasta) {
      fechaDesde = new Date(desde + 'T00:00:00-05:00')
      fechaHasta = new Date(hasta + 'T23:59:59.999-05:00')
    } else {
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
      fechaDesde = new Date(hoy + 'T00:00:00-05:00')
      fechaHasta = new Date(hoy + 'T23:59:59.999-05:00')
    }
    const where = { fecha: { gte: fechaDesde, lte: fechaHasta } }
    const ventas = await this.prisma.venta.findMany({
      where,
      include: {
        detalles: { include: { producto: true } },
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    })
    const total = ventas.reduce((sum, v) => sum + Number(v.total), 0)
    return { ventas, totalVentas: ventas.length, totalIngresos: total }
  }
}
