import { IsString, IsOptional, IsEmail } from 'class-validator'

export class CrearProveedorDto {
  @IsString()
  nombre: string

  @IsOptional()
  @IsString()
  ruc?: string

  @IsOptional()
  @IsString()
  contacto?: string

  @IsOptional()
  @IsString()
  telefono?: string

  @IsOptional()
  @IsEmail()
  email?: string
}
