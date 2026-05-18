import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CrearProductoDto {
  @IsString()
  nombre: string

  @IsOptional()
  @IsString()
  descripcion?: string

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio: number

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMinimo?: number

  @IsNumber()
  @Type(() => Number)
  categoriaId: number

  // Campos farmacia
  @IsOptional()
  @IsString()
  lote?: string

  @IsOptional()
  fechaVencimiento?: Date

  @IsOptional()
  @IsString()
  registroSanitario?: string
}
