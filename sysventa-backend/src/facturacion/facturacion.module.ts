import { Module } from '@nestjs/common'
import { FacturacionService } from './facturacion.service'
import { FacturacionController } from './facturacion.controller'

@Module({
  providers: [FacturacionService],
  controllers: [FacturacionController],
})
export class FacturacionModule {}
