import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CrearCategoriaDto {
  @ApiProperty({ example: 'Analgésicos', minLength: 2 })
  @IsString()
  @MinLength(2)
  nombre: string
}
