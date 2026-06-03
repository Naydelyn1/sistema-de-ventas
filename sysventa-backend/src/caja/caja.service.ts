import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const FORMAS_PAGO = [
  'EFECTIVO',
  'YAPE_PLIN',
  'TARJETA',
  'TRANSFERENCIA',
] as const

@Injectable()
export class CajaService {
  constructor(private prisma: PrismaService) {}

  private async ventasPorFormaPago(
    desde: Date,
    usuarioId: number,
    hasta?: Date,
  ) {
    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, ...(hasta ? { lte: hasta } : {}) },
        usuarioId,
      },
      select: { total: true, formaPago: true },
    })

    const totales: Record<string, number> = {}
    const cantidades: Record<string, number> = {}

    for (const fp of FORMAS_PAGO) {
      totales[fp] = 0
      cantidades[fp] = 0
    }

    for (const v of ventas) {
      const fp = v.formaPago ?? 'EFECTIVO'
      totales[fp] = (totales[fp] ?? 0) + Number(v.total)
      cantidades[fp] = (cantidades[fp] ?? 0) + 1
    }

    return {
      totales,
      cantidades,
      totalGeneral: ventas.reduce((s, v) => s + Number(v.total), 0),
      cantidad: ventas.length,
    }
  }

  async abrirTurno(usuarioId: number, montoInicial: number) {
    const abierto = await this.prisma.turnoCaja.findFirst({
      where: { estado: 'ABIERTO', usuarioId },
    })
    if (abierto)
      throw new BadRequestException(
        'Ya tienes un turno abierto. Ciérralo antes de abrir uno nuevo.',
      )

    return this.prisma.turnoCaja.create({
      data: { usuarioId, montoInicial, estado: 'ABIERTO' },
      include: { usuario: { select: { id: true, nombre: true } } },
    })
  }

  async cerrarTurno(
    turnoId: number,
    montoFinal: number,
    observaciones?: string,
  ) {
    const turno = await this.prisma.turnoCaja.findUnique({
      where: { id: turnoId },
    })
    if (!turno) throw new NotFoundException('Turno no encontrado')
    if (turno.estado === 'CERRADO')
      throw new BadRequestException('Este turno ya fue cerrado')

    const { totales, totalGeneral } = await this.ventasPorFormaPago(
      turno.fechaApertura,
      turno.usuarioId,
    )
    const totalEfectivo = totales['EFECTIVO'] ?? 0
    const montoEsperado = Number(turno.montoInicial) + totalEfectivo
    const diferencia = montoFinal - montoEsperado

    return this.prisma.turnoCaja.update({
      where: { id: turnoId },
      data: {
        fechaCierre: new Date(),
        montoFinal,
        totalVentas: totalGeneral,
        diferencia,
        estado: 'CERRADO',
        observaciones,
      },
      include: { usuario: { select: { id: true, nombre: true } } },
    })
  }

  async turnoActual(usuarioId: number) {
    const turno = await this.prisma.turnoCaja.findFirst({
      where: { estado: 'ABIERTO', usuarioId },
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaApertura: 'desc' },
    })
    if (!turno) return null

    const { totales, cantidades, totalGeneral, cantidad } =
      await this.ventasPorFormaPago(turno.fechaApertura, usuarioId)
    const totalEfectivo = totales['EFECTIVO'] ?? 0

    return {
      ...turno,
      ventasPorFormaPago: totales,
      cantidadPorFormaPago: cantidades,
      totalVentasEfectivo: totalEfectivo,
      cantidadVentas: cantidad,
      totalVentasTodas: totalGeneral,
      montoEsperado: Number(turno.montoInicial) + totalEfectivo,
    }
  }

  async turnosActivos() {
    const turnos = await this.prisma.turnoCaja.findMany({
      where: { estado: 'ABIERTO' },
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaApertura: 'asc' },
    })

    return Promise.all(
      turnos.map(async (turno) => {
        const { totales, cantidades, totalGeneral, cantidad } =
          await this.ventasPorFormaPago(turno.fechaApertura, turno.usuarioId)
        const totalEfectivo = totales['EFECTIVO'] ?? 0
        return {
          ...turno,
          ventasPorFormaPago: totales,
          cantidadPorFormaPago: cantidades,
          totalVentasEfectivo: totalEfectivo,
          cantidadVentas: cantidad,
          totalVentasTodas: totalGeneral,
          montoEsperado: Number(turno.montoInicial) + totalEfectivo,
        }
      }),
    )
  }

  async historial(desde?: string, hasta?: string) {
    const where: Record<string, unknown> = {}
    if (desde || hasta) {
      where.fechaApertura = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta + 'T23:59:59') } : {}),
      }
    }
    const turnos = await this.prisma.turnoCaja.findMany({
      where,
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaApertura: 'desc' },
    })

    return Promise.all(
      turnos.map(async (turno) => {
        const hastaDate = turno.fechaCierre ?? undefined
        const { totales, cantidades, totalGeneral, cantidad } =
          await this.ventasPorFormaPago(
            turno.fechaApertura,
            turno.usuarioId,
            hastaDate,
          )
        const totalEfectivo = totales['EFECTIVO'] ?? 0
        return {
          ...turno,
          ventasPorFormaPago: totales,
          cantidadPorFormaPago: cantidades,
          totalVentasEfectivo: totalEfectivo,
          cantidadVentas: cantidad,
          totalVentasTodas: totalGeneral,
          montoEsperado: Number(turno.montoInicial) + totalEfectivo,
        }
      }),
    )
  }
}
