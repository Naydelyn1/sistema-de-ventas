import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseIntPipe } from '@nestjs/common'
import { UsuariosService } from './usuarios.service'
import { CrearUsuarioDto } from './dto/crear-usuario.dto'
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Roles('ADMIN')
  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto)
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usuariosService.findAll()
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id)
  }

  @Roles('ADMIN')
  @Patch(':id')
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarUsuarioDto) {
    return this.usuariosService.actualizar(id, dto)
  }

  @Roles('ADMIN')
  @Patch(':id/toggle')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.toggleActivo(id)
  }
}
