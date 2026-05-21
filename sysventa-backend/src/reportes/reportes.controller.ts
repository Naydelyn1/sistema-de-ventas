import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { ReportesService } from './reportes.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen-dia')
  resumenDia() {
    return this.reportesService.resumenDia()
  }

  @Get('ventas-por-fecha')
  ventasPorFecha(
    @Query('desde') desde: string,

    @Query('hasta') hasta: string,
  ) {
    return this.reportesService.ventasPorFecha(desde, hasta)
  }

  @Get('productos-mas-vendidos')
  productosMasVendidos() {
    return this.reportesService.productosMasVendidos()
  }

  @Get('stock-bajo')
  stockBajo() {
    return this.reportesService.stockBajo()
  }

  @Get('resumen-mensual')
  resumenMensual(
    @Query('anio') anio: string,
    @Query('mes') mes: string,
  ) {
    return this.reportesService.resumenMensual(Number(anio), Number(mes))
  }

  @Get('excel/ventas')
  async excelVentas(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.excelVentas(desde, hasta)
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ventas-${desde}-${hasta}.xlsx"`,
    })
    res.send(buffer)
  }

  @Get('excel/compras')
  async excelCompras(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.excelCompras(desde, hasta)
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="compras-${desde}-${hasta}.xlsx"`,
    })
    res.send(buffer)
  }

  @Get('excel/stock')
  async excelStock(@Res() res: Response) {
    const buffer = await this.reportesService.excelStock()
    const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="stock-${fecha}.xlsx"`,
    })
    res.send(buffer)
  }
}
