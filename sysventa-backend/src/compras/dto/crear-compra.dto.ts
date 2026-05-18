import { IsNumber, IsArray, ValidateNested, Min, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class DetalleCompraDto {
  @IsNumber()
  @Type(() => Number)
  productoId: number

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  cantidad: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precioCompra: number
}

export class CrearCompraDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  proveedorId?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCompraDto)
  detalles: DetalleCompraDto[]
}
