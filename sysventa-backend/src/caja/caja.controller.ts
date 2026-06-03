import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common'
import { CajaService } from './caja.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('Caja')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Roles('ADMIN', 'CAJERO')
  @Post('abrir')
  abrir(
    @Body('montoInicial') montoInicial: number,
    @Request() req: { user: { id: number } },
  ) {
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
  actual(@Request() req: { user: { id: number } }) {
    return this.cajaService.turnoActual(req.user.id)
  }

  @Roles('ADMIN')
  @Get('activas')
  activas() {
    return this.cajaService.turnosActivos()
  }

  @Roles('ADMIN')
  @Get('historial')
  historial(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.cajaService.historial(desde, hasta)
  }
}
