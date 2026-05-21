import { Injectable, NotFoundException, BadGatewayException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'
import { EmitirBoletaDto } from './dto/emitir-boleta.dto'
import { EmitirFacturaDto } from './dto/emitir-factura.dto'

const r2 = (n: number) => Math.round(n * 100) / 100

interface NubefactItem {
  unidad_de_medida: string
  codigo: string
  descripcion: string
  cantidad: number
  valor_unitario: number
  precio_unitario: number
  descuento: string
  subtotal: number
  tipo_de_igv: number
  igv: number
  total: number
  anticipo_regularizacion: boolean
  anticipo_documento_serie: string
  anticipo_documento_numero: string
}

@Injectable()
export class FacturacionService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private async getVenta(ventaId: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id: ventaId },
      include: { detalles: { include: { producto: true } }, cliente: true },
    })
    if (!venta) throw new NotFoundException('Venta no encontrada')
    return venta
  }

  private buildItems(detalles: { productoId: number; cantidad: number; precioUnitario: any; producto: { nombre: string } }[]): NubefactItem[] {
    return detalles.map((d) => {
      const precioConIgv = r2(Number(d.precioUnitario))
      const valorUnit = r2(precioConIgv / 1.18)
      const igvUnit = r2(precioConIgv - valorUnit)
      const cant = d.cantidad
      return {
        unidad_de_medida: 'NIU',
        codigo: `P${String(d.productoId).padStart(3, '0')}`,
        descripcion: d.producto.nombre,
        cantidad: cant,
        valor_unitario: valorUnit,
        precio_unitario: precioConIgv,
        descuento: '',
        subtotal: r2(valorUnit * cant),
        tipo_de_igv: 1,
        igv: r2(igvUnit * cant),
        total: r2(precioConIgv * cant),
        anticipo_regularizacion: false,
        anticipo_documento_serie: '',
        anticipo_documento_numero: '',
      }
    })
  }

  private calcTotales(items: NubefactItem[]) {
    return {
      totalGravada: r2(items.reduce((s, i) => s + i.subtotal, 0)),
      totalIgv: r2(items.reduce((s, i) => s + i.igv, 0)),
      total: r2(items.reduce((s, i) => s + i.total, 0)),
    }
  }

  private fechaFormato(fecha: Date) {
    const d = String(fecha.getDate()).padStart(2, '0')
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    return `${d}/${m}/${fecha.getFullYear()}`
  }

  private async enviarNubefact(payload: object) {
    const url = this.configService.get<string>('NUBEFACT_URL')
    const token = this.configService.get<string>('NUBEFACT_TOKEN')
    try {
      const { data } = await axios.post(url!, payload, {
        headers: {
          Authorization: `Token token=${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })
      return data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errors ?? error.response?.data?.message ?? error.message
        throw new BadGatewayException(`Nubefact: ${JSON.stringify(msg)}`)
      }
      throw new BadGatewayException('Error al conectar con Nubefact')
    }
  }

  async emitirBoleta(dto: EmitirBoletaDto) {
    const venta = await this.getVenta(dto.ventaId)
    const items = this.buildItems(venta.detalles)
    const { totalGravada, totalIgv, total } = this.calcTotales(items)

    const payload = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: 2,
      serie: this.configService.get<string>('NUBEFACT_SERIE_BOLETA') ?? 'B001',
      numero: venta.id,
      sunat_transaction: 1,
      cliente_tipo_de_documento: 1,
      cliente_numero_de_documento: dto.dniCliente ?? venta.cliente?.dni ?? '99999999',
      cliente_denominacion: dto.nombreCliente ?? venta.cliente?.nombre ?? 'CLIENTE VARIOS',
      cliente_direccion: venta.cliente?.direccion ?? '',
      cliente_email: venta.cliente?.email ?? '',
      fecha_de_emision: this.fechaFormato(new Date(venta.fecha)),
      moneda: 1,
      tipo_de_cambio: '',
      porcentaje_de_igv: 18,
      descuento_global: '',
      total_descuento: '',
      total_anticipo: '',
      total_gravada: totalGravada,
      total_inafecta: '',
      total_exonerada: '',
      total_igv: totalIgv,
      total_gratuita: '',
      total_otros_cargos: '',
      total,
      percepcion_tipo: '',
      percepcion_base_imponible: '',
      total_percepcion: '',
      total_incluido_percepcion: '',
      detraccion: false,
      observaciones: '',
      documento_que_se_modifica_tipo: '',
      documento_que_se_modifica_serie: '',
      documento_que_se_modifica_numero: '',
      tipo_de_nota_de_credito: '',
      tipo_de_nota_de_debito: '',
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: false,
      items,
    }

    const result = await this.enviarNubefact(payload)
    await this.prisma.venta.update({
      where: { id: dto.ventaId },
      data: {
        tipoComprobante: 'BOLETA',
        serieComprobante: result.serie ?? null,
        numeroComprobante: result.numero ?? null,
        enlacePdf: result.enlace_del_pdf ?? null,
        aceptadaSunat: result.aceptada_por_sunat ?? null,
      },
    })
    return result
  }

  async emitirFactura(dto: EmitirFacturaDto) {
    const venta = await this.getVenta(dto.ventaId)
    const items = this.buildItems(venta.detalles)
    const { totalGravada, totalIgv, total } = this.calcTotales(items)

    const payload = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: 1,
      serie: this.configService.get<string>('NUBEFACT_SERIE_FACTURA') ?? 'F001',
      numero: venta.id,
      sunat_transaction: 1,
      cliente_tipo_de_documento: 6,
      cliente_numero_de_documento: dto.ruc,
      cliente_denominacion: dto.razonSocial,
      cliente_direccion: '',
      cliente_email: '',
      fecha_de_emision: this.fechaFormato(new Date(venta.fecha)),
      moneda: 1,
      tipo_de_cambio: '',
      porcentaje_de_igv: 18,
      descuento_global: '',
      total_descuento: '',
      total_anticipo: '',
      total_gravada: totalGravada,
      total_inafecta: '',
      total_exonerada: '',
      total_igv: totalIgv,
      total_gratuita: '',
      total_otros_cargos: '',
      total,
      percepcion_tipo: '',
      percepcion_base_imponible: '',
      total_percepcion: '',
      total_incluido_percepcion: '',
      detraccion: false,
      observaciones: '',
      documento_que_se_modifica_tipo: '',
      documento_que_se_modifica_serie: '',
      documento_que_se_modifica_numero: '',
      tipo_de_nota_de_credito: '',
      tipo_de_nota_de_debito: '',
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: false,
      items,
    }

    const result = await this.enviarNubefact(payload)
    await this.prisma.venta.update({
      where: { id: dto.ventaId },
      data: {
        tipoComprobante: 'FACTURA',
        serieComprobante: result.serie ?? null,
        numeroComprobante: result.numero ?? null,
        enlacePdf: result.enlace_del_pdf ?? null,
        aceptadaSunat: result.aceptada_por_sunat ?? null,
      },
    })
    return result
  }

  async consultarRuc(ruc: string) {
    const token = this.configService.get<string>('RENIEC_API_TOKEN')
    try {
      const { data } = await axios.get(
        `https://api.decolecta.com/api/ruc/${ruc}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
      )
      const d = data.data
      return {
        ruc: d.numero ?? ruc,
        razonSocial: d.nombre_o_razon_social ?? d.nombre_completo ?? '',
        direccion: d.direccion ?? '',
        estado: d.estado ?? '',
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) throw new NotFoundException('RUC no encontrado')
        if (error.response?.status === 401) throw new BadGatewayException('Token inválido')
      }
      throw new BadGatewayException('Error al consultar el RUC')
    }
  }
}
