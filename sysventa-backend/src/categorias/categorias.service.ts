import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearCategoriaDto } from './dto/crear-categoria.dto'

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearCategoriaDto) {
    const existe = await this.prisma.categoria.findUnique({
      where: { nombre: dto.nombre },
    })
    if (existe) throw new ConflictException('La categoría ya existe')

    return this.prisma.categoria.create({ data: dto })
  }

  async findAll() {
    return this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { productos: true } } },
    })
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } })
    if (!categoria) throw new NotFoundException('Categoría no encontrada')
    return categoria
  }

  async actualizar(id: number, dto: CrearCategoriaDto) {
    await this.findOne(id)
    return this.prisma.categoria.update({ where: { id }, data: dto })
  }

  async eliminar(id: number) {
    await this.findOne(id)
    return this.prisma.categoria.delete({ where: { id } })
  }
}
