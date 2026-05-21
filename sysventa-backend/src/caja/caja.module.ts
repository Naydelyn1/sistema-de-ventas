import { Module } from '@nestjs/common'
import { CajaService } from './caja.service'
import { CajaController } from './caja.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [CajaController],
  providers: [CajaService],
})
export class CajaModule {}
