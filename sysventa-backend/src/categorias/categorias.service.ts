import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
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

  async findAll(soloActivas = true) {
    return this.prisma.categoria.findMany({
      where: soloActivas ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { productos: true } } },
    })
  }

  async toggleActivo(id: number) {
    const categoria = await this.findOne(id)
    const nuevoEstado = !categoria.activo
    await this.prisma.producto.updateMany({
      where: { categoriaId: id },
      data: { activo: nuevoEstado },
    })
    return this.prisma.categoria.update({
      where: { id },
      data: { activo: nuevoEstado },
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
