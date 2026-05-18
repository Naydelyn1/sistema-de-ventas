import { IsString, IsNumber, IsOptional, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class ActualizarProductoDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsString()
  descripcion?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMinimo?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriaId?: number

  @IsOptional()
  @IsString()
  lote?: string

  @IsOptional()
  fechaVencimiento?: Date

  @IsOptional()
  @IsString()
  registroSanitario?: string
}
