import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common'
import { FacturacionService } from './facturacion.service'
import { EmitirBoletaDto } from './dto/emitir-boleta.dto'
import { EmitirFacturaDto } from './dto/emitir-factura.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Post('boleta')
  emitirBoleta(@Body() dto: EmitirBoletaDto) {
    return this.facturacionService.emitirBoleta(dto)
  }

  @Post('factura')
  emitirFactura(@Body() dto: EmitirFacturaDto) {
    return this.facturacionService.emitirFactura(dto)
  }

  @Get('ruc/:ruc')
  consultarRuc(@Param('ruc') ruc: string) {
    return this.facturacionService.consultarRuc(ruc)
  }
}
