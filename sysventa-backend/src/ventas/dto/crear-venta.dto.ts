import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DetalleVentaDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  productoId: number

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  cantidad: number
}

export class CrearVentaDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  clienteId?: number

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  descuentoPct?: number

  @ApiPropertyOptional({
    enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE_PLIN'],
    example: 'EFECTIVO',
  })
  @IsOptional()
  @IsIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE_PLIN'])
  formaPago?: string

  @ApiProperty({ type: [DetalleVentaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalles: DetalleVentaDto[]
}
