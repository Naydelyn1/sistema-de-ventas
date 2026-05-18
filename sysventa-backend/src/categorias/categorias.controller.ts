import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common'
import { CategoriasService } from './categorias.service'
import { CrearCategoriaDto } from './dto/crear-categoria.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Roles('ADMIN', 'ALMACENERO')
  @Post()
  crear(@Body() dto: CrearCategoriaDto) {
    return this.categoriasService.crear(dto)
  }

  @Get()
  findAll() {
    return this.categoriasService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findOne(id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CrearCategoriaDto) {
    return this.categoriasService.actualizar(id, dto)
  }

  @Roles('ADMIN')
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.eliminar(id)
  }
}
