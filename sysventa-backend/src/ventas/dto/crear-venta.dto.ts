import { IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator'
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  detalles: DetalleVentaDto[]
}
