import { Controller, Get, Query, UseGuards } from '@nestjs/common'
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
}
