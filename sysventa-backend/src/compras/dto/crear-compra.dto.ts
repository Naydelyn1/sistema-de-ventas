import {
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsOptional,
  IsString,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DetalleCompraDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  productoId: number

  @ApiProperty({ example: 50, minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  cantidad: number

  @ApiProperty({ example: 3.2, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioCompra: number
}

export class CrearCompraDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  proveedorId?: number

  @ApiPropertyOptional({ example: 'F001' })
  @IsOptional()
  @IsString()
  serieComprobante?: string

  @ApiPropertyOptional({ example: '00000123' })
  @IsOptional()
  @IsString()
  numeroComprobante?: string

  @ApiProperty({ type: [DetalleCompraDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCompraDto)
  detalles: DetalleCompraDto[]
}
