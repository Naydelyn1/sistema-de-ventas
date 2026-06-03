import { IsString, IsOptional, IsEmail } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CrearClienteDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre: string

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  dni?: string

  @ApiPropertyOptional({ example: '20123456789' })
  @IsOptional()
  @IsString()
  ruc?: string

  @ApiPropertyOptional({ example: '987654321' })
  @IsOptional()
  @IsString()
  telefono?: string

  @ApiPropertyOptional({ example: 'cliente@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: 'Av. Lima 123' })
  @IsOptional()
  @IsString()
  direccion?: string
}
