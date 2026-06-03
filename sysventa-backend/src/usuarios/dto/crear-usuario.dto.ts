import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator'
import { Rol } from '@prisma/client'
import { ApiProperty } from '@nestjs/swagger'

export class CrearUsuarioDto {
  @ApiProperty({ example: 'María García' })
  @IsString()
  nombre: string

  @ApiProperty({ example: 'cajero@sysventa.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ enum: Rol, example: Rol.CAJERO })
  @IsEnum(Rol)
  rol: Rol
}
