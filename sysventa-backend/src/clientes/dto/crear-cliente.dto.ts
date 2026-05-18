import { IsString, IsOptional, IsEmail } from 'class-validator'

export class CrearClienteDto {
  @IsString()
  nombre: string

  @IsOptional()
  @IsString()
  dni?: string

  @IsOptional()
  @IsString()
  telefono?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  direccion?: string
}
