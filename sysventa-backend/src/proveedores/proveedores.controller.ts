import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ProveedoresService } from './proveedores.service'
import { CrearProveedorDto } from './dto/crear-proveedor.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Roles('ADMIN', 'ALMACENERO')
  @Post()
  crear(@Body() dto: CrearProveedorDto) {
    return this.proveedoresService.crear(dto)
  }

  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.proveedoresService.findAll(todos !== 'true')
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proveedoresService.findOne(id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearProveedorDto) {
    return this.proveedoresService.actualizar(id, dto)
  }

  @Roles('ADMIN')
  @Patch(':id/toggle')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.proveedoresService.toggleActivo(id)
  }
}
