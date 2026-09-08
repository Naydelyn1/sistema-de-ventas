import { IsString, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ActualizarProductoDto {
  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsOptional()
  @IsString()
  nombre?: string

  @ApiPropertyOptional({ example: 'Analgésico y antipirético' })
  @IsOptional()
  @IsString()
  descripcion?: string

  @ApiPropertyOptional({ example: 5.5, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio?: number

  @ApiPropertyOptional({ example: 100, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMinimo?: number

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  categoriaId?: number

  @ApiPropertyOptional({ example: 'L-2024-001' })
  @IsOptional()
  @IsString()
  lote?: string

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  fechaVencimiento?: Date

  @ApiPropertyOptional({ example: 'RS-001-2024' })
  @IsOptional()
  @IsString()
  registroSanitario?: string

  @ApiPropertyOptional({ example: 'Caja x 100 tabletas' })
  @IsOptional()
  @IsString()
  presentacion?: string

  @ApiPropertyOptional({ example: '/uploads/productos/1712345678-producto.png', nullable: true })
  @IsOptional()
  @ValidateIf((o, v) => v !== null)
  @IsString()
  imagenUrl?: string | null
}
