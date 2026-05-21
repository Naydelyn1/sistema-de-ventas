import { IsNumber, IsString } from 'class-validator'

export class EmitirFacturaDto {
  @IsNumber()
  ventaId: number

  @IsString()
  ruc: string

  @IsString()
  razonSocial: string
}
