import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common'
import { ProductosService } from './productos.service'
import { CrearProductoDto } from './dto/crear-producto.dto'
import { ActualizarProductoDto } from './dto/actualizar-producto.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Roles('ADMIN', 'ALMACENERO')
  @Post()
  crear(@Body() dto: CrearProductoDto) {
    return this.productosService.crear(dto)
  }

  @Roles('ADMIN')
  @Post('backfill-kardex')
  backfillKardex() {
    return this.productosService.backfillKardex()
  }

  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.productosService.findAll(todos !== 'true')
  }

  @Get('stock-bajo')
  stockBajo() {
    return this.productosService.stockBajo()
  }

  @Get('por-vencer')
  porVencer() {
    return this.productosService.porVencer()
  }

  @Get(':id/kardex')
  kardex(
    @Param('id', ParseIntPipe) id: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.productosService.kardex(id, desde, hasta)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarProductoDto) {
    return this.productosService.actualizar(id, dto)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id/toggle')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.toggleActivo(id)
  }
}
