import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { Rol } from '@prisma/client'

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  nombre?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol
}
