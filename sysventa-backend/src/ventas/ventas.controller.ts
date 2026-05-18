import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { VentasService } from './ventas.service'
import { CrearVentaDto } from './dto/crear-venta.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Roles('ADMIN', 'CAJERO')
  @Post()
  crear(@Body() dto: CrearVentaDto, @Request() req: any) {
    return this.ventasService.crear(dto, req.user.id)
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.ventasService.findAll()
  }

  @Get('hoy')
  ventasDelDia(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.ventasService.ventasDelDia(desde, hasta)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id)
  }
}
