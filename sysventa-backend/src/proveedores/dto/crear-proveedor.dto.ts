import { IsString, IsOptional, IsEmail } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearProveedorDto {
  @ApiProperty({ example: 'Distribuidora Farma SAC' })
  @IsString()
  nombre: string

  @ApiPropertyOptional({ example: '20123456789' })
  @IsOptional()
  @IsString()
  ruc?: string

  @ApiPropertyOptional({ example: 'Carlos López' })
  @IsOptional()
  @IsString()
  contacto?: string

  @ApiPropertyOptional({ example: '01-234-5678' })
  @IsOptional()
  @IsString()
  telefono?: string

  @ApiPropertyOptional({ example: 'ventas@distribufarma.com' })
  @IsOptional()
  @IsEmail()
  email?: string
}
