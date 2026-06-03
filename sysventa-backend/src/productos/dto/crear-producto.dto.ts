import { IsString, IsNumber, IsOptional, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearProductoDto {
  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  nombre: string

  @ApiPropertyOptional({ example: 'Analgésico y antipirético' })
  @IsOptional()
  @IsString()
  descripcion?: string

  @ApiProperty({ example: 5.5, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio: number

  @ApiProperty({ example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock: number

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockMinimo?: number

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  categoriaId: number

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
}
