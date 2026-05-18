import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearCompraDto } from './dto/crear-compra.dto'

@Injectable()
export class ComprasService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearCompraDto, usuarioId: number) {
    // Verificar que todos los productos existan
    for (const detalle of dto.detalles) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: detalle.productoId },
      })
      if (!producto) {
        throw new NotFoundException(`Producto ${detalle.productoId} no encontrado`)
      }
    }

    const compra = await this.prisma.$transaction(async (tx) => {
      let total = 0
      const detallesData: {
        productoId: number
        cantidad: number
        precioCompra: number
        subtotal: number
      }[] = []

      for (const detalle of dto.detalles) {
        const subtotal = detalle.precioCompra * detalle.cantidad
        total += subtotal

        detallesData.push({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioCompra: detalle.precioCompra,
          subtotal,
        })

        // Incrementar stock
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { increment: detalle.cantidad } },
        })
      }

      return tx.compra.create({
        data: {
          total,
          proveedorId: dto.proveedorId ?? null,
          usuarioId,
          detalles: { create: detallesData },
        },
        include: {
          detalles: { include: { producto: true } },
          proveedor: true,
          usuario: { select: { id: true, nombre: true } },
        },
      })
    })

    return compra
  }

  async findAll(desde?: string, hasta?: string) {
    const where: any = {}
    if (desde && hasta) {
      where.fecha = {
        gte: new Date(desde + 'T00:00:00-05:00'),
        lte: new Date(hasta + 'T23:59:59.999-05:00'),
      }
    }
    return this.prisma.compra.findMany({
      where,
      include: {
        detalles: { include: { producto: true } },
        proveedor: true,
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    })
  }

  async findOne(id: number) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: {
        detalles: { include: { producto: true } },
        proveedor: true,
      },
    })
    if (!compra) throw new NotFoundException('Compra no encontrada')
    return compra
  }
}
