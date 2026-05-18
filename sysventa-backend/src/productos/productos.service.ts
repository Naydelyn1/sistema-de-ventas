import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearProductoDto } from './dto/crear-producto.dto'
import { ActualizarProductoDto } from './dto/actualizar-producto.dto'

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearProductoDto) {
    return this.prisma.producto.create({
      data: dto,
      include: { categoria: true },
    })
  }

  async findAll(soloActivos = true) {
    return this.prisma.producto.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    })
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    })
    if (!producto) throw new NotFoundException('Producto no encontrado')
    return producto
  }

  async actualizar(id: number, dto: ActualizarProductoDto) {
    await this.findOne(id)
    return this.prisma.producto.update({
      where: { id },
      data: dto,
      include: { categoria: true },
    })
  }

  async toggleActivo(id: number) {
    const producto = await this.findOne(id)
    return this.prisma.producto.update({
      where: { id },
      data: { activo: !producto.activo },
    })
  }

  async stockBajo() {
    return this.prisma.producto.findMany({
      where: {
        activo: true,
        stock: { lte: this.prisma.producto.fields.stockMinimo as any },
      },
    })
  }

  async porVencer() {
    const hoy = new Date()
    const en30dias = new Date()
    en30dias.setDate(hoy.getDate() + 30)

    return this.prisma.producto.findMany({
      where: {
        activo: true,
        fechaVencimiento: {
          gte: hoy,
          lte: en30dias,
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    })
  }
}
