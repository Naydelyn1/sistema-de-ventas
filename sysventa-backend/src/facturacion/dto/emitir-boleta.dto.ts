import { IsNumber, IsOptional, IsString } from 'class-validator'

export class EmitirBoletaDto {
  @IsNumber()
  ventaId: number

  @IsOptional()
  @IsString()
  dniCliente?: string

  @IsOptional()
  @IsString()
  nombreCliente?: string
}
