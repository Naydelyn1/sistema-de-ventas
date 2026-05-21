import { IsNumber, IsOptional, IsArray, ValidateNested, Min, Max, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class DetalleVentaDto {
  @IsNumber()
  @Type(() => Number)
  productoId: number

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  cantidad: number
}

export class CrearVentaDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  clienteId?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  descuentoPct?: number

  @IsOptional()
  @IsIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE_PLIN'])
  formaPago?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalles: DetalleVentaDto[]
}
