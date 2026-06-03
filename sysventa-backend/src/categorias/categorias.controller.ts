import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { CategoriasService } from './categorias.service'
import { CrearCategoriaDto } from './dto/crear-categoria.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('Categorias')
@ApiBearerAuth()
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
  findAll(@Query('todos') todos?: string) {
    return this.categoriasService.findAll(todos !== 'true')
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findOne(id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id/toggle')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.toggleActivo(id)
  }

  @Roles('ADMIN', 'ALMACENERO')
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearCategoriaDto,
  ) {
    return this.categoriasService.actualizar(id, dto)
  }

  @Roles('ADMIN')
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.eliminar(id)
  }
}
