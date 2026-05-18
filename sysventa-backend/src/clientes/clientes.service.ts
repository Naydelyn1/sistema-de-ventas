import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearClienteDto } from './dto/crear-cliente.dto'

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearClienteDto) {
    return this.prisma.cliente.create({ data: dto })
  }

  async findAll(soloActivos = true) {
    return this.prisma.cliente.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    })
  }

  async toggle(id: number) {
    const cliente = await this.findOne(id)
    return this.prisma.cliente.update({
      where: { id },
      data: { activo: !cliente.activo },
    })
  }

  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } })
    if (!cliente) throw new NotFoundException('Cliente no encontrado')
    return cliente
  }

  async buscarPorDni(dni: string) {
    return this.prisma.cliente.findUnique({ where: { dni } })
  }

  async actualizar(id: number, dto: CrearClienteDto) {
    await this.findOne(id)
    return this.prisma.cliente.update({ where: { id }, data: dto })
  }
}
