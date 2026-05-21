import { Injectable, NotFoundException, BadGatewayException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { CrearClienteDto } from './dto/crear-cliente.dto'
import axios from 'axios'

@Injectable()
export class ClientesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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

  async consultarReniec(dni: string) {
    const token = this.configService.get<string>('RENIEC_API_TOKEN')
    try {
      const { data } = await axios.get(
        `https://api.decolecta.com/api/dni/${dni}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
      )
      const d = data.data
      return {
        nombre: d.nombre_completo,
        apellidoPaterno: d.apellido_paterno,
        apellidoMaterno: d.apellido_materno,
        numeroDocumento: d.numero,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (error.code === 'ECONNABORTED')
          throw new BadGatewayException('Tiempo de espera agotado al consultar RENIEC')
        if (status === 404)
          throw new NotFoundException('DNI no encontrado en RENIEC')
        if (status === 401)
          throw new BadGatewayException('Token de RENIEC inválido o expirado')
        if (status === 422)
          throw new BadGatewayException('DNI con formato inválido')
      }
      throw new BadGatewayException('Error al consultar la API de RENIEC')
    }
  }
}
