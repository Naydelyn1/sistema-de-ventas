import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common'
import { ComprasService } from './compras.service'
import { CrearCompraDto } from './dto/crear-compra.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Roles('ADMIN', 'ALMACENERO')
  @Post()
  crear(@Body() dto: CrearCompraDto, @Request() req: any) {
    return this.comprasService.crear(dto, req.user.id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Get()
  findAll(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.comprasService.findAll(desde, hasta)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comprasService.findOne(id)
  }
}
