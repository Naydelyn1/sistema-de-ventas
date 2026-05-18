import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearProveedorDto } from './dto/crear-proveedor.dto'

@Injectable()
export class ProveedoresService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearProveedorDto) {
    return this.prisma.proveedor.create({ data: dto })
  }

  async findAll(soloActivos = true) {
    return this.prisma.proveedor.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    })
  }

  async findOne(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } })
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado')
    return proveedor
  }

  async actualizar(id: number, dto: CrearProveedorDto) {
    await this.findOne(id)
    return this.prisma.proveedor.update({ where: { id }, data: dto })
  }

  async toggleActivo(id: number) {
    const proveedor = await this.findOne(id)
    return this.prisma.proveedor.update({
      where: { id },
      data: { activo: !proveedor.activo },
    })
  }
}
