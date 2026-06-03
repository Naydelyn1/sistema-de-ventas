import { IsNumber, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class EmitirFacturaDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  ventaId: number

  @ApiProperty({ example: '20123456789' })
  @IsString()
  ruc: string

  @ApiProperty({ example: 'Empresa SAC' })
  @IsString()
  razonSocial: string
}
