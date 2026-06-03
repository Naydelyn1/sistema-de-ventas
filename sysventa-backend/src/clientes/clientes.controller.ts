import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { ClientesService } from './clientes.service'
import { CrearClienteDto } from './dto/crear-cliente.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  crear(@Body() dto: CrearClienteDto) {
    return this.clientesService.crear(dto)
  }

  @Get()
  findAll(@Query('todos') todos?: string) {
    return this.clientesService.findAll(todos !== 'true')
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.toggle(id)
  }

  @Get('buscar')
  buscar(@Query('dni') dni?: string, @Query('ruc') ruc?: string) {
    if (ruc) return this.clientesService.buscarPorRuc(ruc)
    if (dni) return this.clientesService.buscarPorDni(dni)
    return null
  }

  @Get('reniec/:dni')
  consultarReniec(@Param('dni') dni: string) {
    return this.clientesService.consultarReniec(dni)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id)
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearClienteDto,
  ) {
    return this.clientesService.actualizar(id, dto)
  }
}
