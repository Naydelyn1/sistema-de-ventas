import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const FORMAS_PAGO = ['EFECTIVO', 'YAPE_PLIN', 'TARJETA', 'TRANSFERENCIA'] as const
type FormaPago = typeof FORMAS_PAGO[number]

@Injectable()
export class CajaService {
  constructor(private prisma: PrismaService) {}

  private async ventasPorFormaPago(desde: Date) {
    const ventas = await this.prisma.venta.findMany({
      where: { fecha: { gte: desde } },
      select: { total: true, formaPago: true },
    })

    const totales: Record<string, number> = {}
    const cantidades: Record<string, number> = {}

    for (const fp of FORMAS_PAGO) {
      totales[fp] = 0
      cantidades[fp] = 0
    }

    for (const v of ventas) {
      const fp = (v.formaPago ?? 'EFECTIVO') as string
      totales[fp] = (totales[fp] ?? 0) + Number(v.total)
      cantidades[fp] = (cantidades[fp] ?? 0) + 1
    }

    return { totales, cantidades, totalGeneral: ventas.reduce((s, v) => s + Number(v.total), 0), cantidad: ventas.length }
  }

  async abrirTurno(usuarioId: number, montoInicial: number) {
    const abierto = await this.prisma.turnoCaja.findFirst({ where: { estado: 'ABIERTO' } })
    if (abierto) throw new BadRequestException('Ya hay un turno abierto. Ciérralo antes de abrir uno nuevo.')

    return this.prisma.turnoCaja.create({
      data: { usuarioId, montoInicial, estado: 'ABIERTO' },
      include: { usuario: { select: { id: true, nombre: true } } },
    })
  }

  async cerrarTurno(turnoId: number, montoFinal: number, observaciones?: string) {
    const turno = await this.prisma.turnoCaja.findUnique({ where: { id: turnoId } })
    if (!turno) throw new NotFoundException('Turno no encontrado')
    if (turno.estado === 'CERRADO') throw new BadRequestException('Este turno ya fue cerrado')

    const { totales, totalGeneral } = await this.ventasPorFormaPago(turno.fechaApertura)
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

  async turnoActual() {
    const turno = await this.prisma.turnoCaja.findFirst({
      where: { estado: 'ABIERTO' },
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaApertura: 'desc' },
    })
    if (!turno) return null

    const { totales, cantidades, totalGeneral, cantidad } = await this.ventasPorFormaPago(turno.fechaApertura)
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

  async historial(limit = 20) {
    return this.prisma.turnoCaja.findMany({
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaApertura: 'desc' },
      take: limit,
    })
  }
}
