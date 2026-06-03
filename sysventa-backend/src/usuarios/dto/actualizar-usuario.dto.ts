import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import { Rol } from '@prisma/client'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({ example: 'María García' })
  @IsOptional()
  @IsString()
  nombre?: string

  @ApiPropertyOptional({ example: 'cajero@sysventa.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ example: '123456', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @ApiPropertyOptional({ enum: Rol, example: Rol.CAJERO })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol
}
