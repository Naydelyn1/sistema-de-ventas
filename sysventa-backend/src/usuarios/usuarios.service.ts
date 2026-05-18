import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearUsuarioDto) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    })

    if (existe) {
      throw new ConflictException('El email ya está registrado')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const usuario = await this.prisma.usuario.create({
      data: {
        ...dto,
        password: passwordHash,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    })

    return usuario
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
    })
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    })

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado')
    }

    return usuario
  }

  async actualizar(id: number, dto: ActualizarUsuarioDto) {
    await this.findOne(id)

    const data: any = { ...dto }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10)
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
    })
  }

  async toggleActivo(id: number) {
    const usuario = await this.findOne(id)

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !usuario.activo },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    })
  }
}
