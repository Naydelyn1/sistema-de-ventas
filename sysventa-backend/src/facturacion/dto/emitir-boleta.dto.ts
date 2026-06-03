import { IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class EmitirBoletaDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  ventaId!: number

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  dniCliente?: string

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  nombreCliente?: string
}
