import { IsString, MinLength } from 'class-validator'

export class CrearCategoriaDto {
  @IsString()
  @MinLength(2)
  nombre: string
}
