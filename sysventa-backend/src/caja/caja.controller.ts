import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common'
import { CajaService } from './caja.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Roles('ADMIN', 'CAJERO')
  @Post('abrir')
  abrir(@Body('montoInicial') montoInicial: number, @Request() req: any) {
    return this.cajaService.abrirTurno(req.user.id, Number(montoInicial))
  }

  @Roles('ADMIN', 'CAJERO')
  @Post(':id/cerrar')
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Body('montoFinal') montoFinal: number,
    @Body('observaciones') observaciones?: string,
  ) {
    return this.cajaService.cerrarTurno(id, Number(montoFinal), observaciones)
  }

  @Get('actual')
  actual() {
    return this.cajaService.turnoActual()
  }

  @Roles('ADMIN')
  @Get('historial')
  historial() {
    return this.cajaService.historial()
  }
}
