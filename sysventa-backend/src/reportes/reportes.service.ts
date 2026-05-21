import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as ExcelJS from 'exceljs'

const r2 = (n: number) => Math.round(n * 100) / 100

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers fecha ────────────────────────────────────────────────────────────
  private rango(desde: string, hasta: string) {
    return {
      gte: new Date(desde + 'T00:00:00-05:00'),
      lte: new Date(hasta + 'T23:59:59.999-05:00'),
    }
  }

  private fmtFecha(d: Date) {
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d)
  }

  private estiloCabecera(ws: ExcelJS.Worksheet, cols: number) {
    const row = ws.getRow(1)
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    row.height = 22
    for (let i = 1; i <= cols; i++) {
      ws.getColumn(i).width = 20
    }
  }

  private filaAlterna(ws: ExcelJS.Worksheet, rowNum: number) {
    if (rowNum % 2 === 0) {
      ws.getRow(rowNum).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }
      })
    }
  }

  // ── Resumen día ──────────────────────────────────────────────────────────────
  async resumenDia() {
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
    const inicio = new Date(hoy + 'T00:00:00-05:00')
    const fin = new Date(hoy + 'T23:59:59.999-05:00')
    const ventas = await this.prisma.venta.findMany({ where: { fecha: { gte: inicio, lte: fin } }, include: { detalles: true } })
    const compras = await this.prisma.compra.findMany({ where: { fecha: { gte: inicio, lte: fin } } })
    const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0)
    const totalCompras = compras.reduce((s, c) => s + Number(c.total), 0)
    return { fecha: hoy, cantidadVentas: ventas.length, totalVentas, cantidadCompras: compras.length, totalCompras, ganancia: totalVentas - totalCompras }
  }

  async ventasPorFecha(desde: string, hasta: string) {
    const ventas = await this.prisma.venta.findMany({ where: { fecha: this.rango(desde, hasta) }, orderBy: { fecha: 'asc' } })
    const peruFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' })
    const grouped = new Map<string, { total: number; cantidad: number }>()
    for (const v of ventas) {
      const dateKey = peruFmt.format(v.fecha)
      const existing = grouped.get(dateKey) ?? { total: 0, cantidad: 0 }
      grouped.set(dateKey, { total: existing.total + Number(v.total), cantidad: existing.cantidad + 1 })
    }
    return Array.from(grouped.entries()).map(([fecha, data]) => ({ fecha, ...data }))
  }

  async productosMasVendidos() {
    const detalles = await this.prisma.detalleVenta.groupBy({
      by: ['productoId'], _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } }, take: 10,
    })
    return Promise.all(detalles.map(async (d) => {
      const producto = await this.prisma.producto.findUnique({ where: { id: d.productoId }, select: { id: true, nombre: true, precio: true } })
      return { producto, cantidadVendida: d._sum.cantidad, totalGenerado: d._sum.subtotal }
    }))
  }

  async stockBajo() {
    const productos = await this.prisma.producto.findMany({ where: { activo: true }, include: { categoria: true } })
    return productos.filter((p) => p.stock <= p.stockMinimo)
  }

  async resumenMensual(anio: number, mes: number) {
    const mm = String(mes).padStart(2, '0')
    const lastDay = new Date(anio, mes, 0).getDate()
    const inicio = new Date(`${anio}-${mm}-01T00:00:00-05:00`)
    const fin = new Date(`${anio}-${mm}-${lastDay}T23:59:59.999-05:00`)
    const ventas = await this.prisma.venta.findMany({ where: { fecha: { gte: inicio, lte: fin } } })
    const compras = await this.prisma.compra.findMany({ where: { fecha: { gte: inicio, lte: fin } } })
    const totalVentas = ventas.reduce((s, v) => s + Number(v.total), 0)
    const totalCompras = compras.reduce((s, c) => s + Number(c.total), 0)
    return { anio, mes, cantidadVentas: ventas.length, totalVentas, cantidadCompras: compras.length, totalCompras, ganancia: totalVentas - totalCompras }
  }

  // ── Excel: Ventas ────────────────────────────────────────────────────────────
  async excelVentas(desde: string, hasta: string): Promise<Buffer> {
    const ventas = await this.prisma.venta.findMany({
      where: { fecha: this.rango(desde, hasta) },
      include: { detalles: { include: { producto: true } }, cliente: true, usuario: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'desc' },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'SysVenta'

    // Hoja 1: Resumen por venta
    const wsVentas = wb.addWorksheet('Ventas')
    wsVentas.columns = [
      { header: 'ID', key: 'id' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Cliente', key: 'cliente' },
      { header: 'Forma de Pago', key: 'formaPago' },
      { header: 'Descuento %', key: 'descuento' },
      { header: 'Total (S/)', key: 'total' },
      { header: 'Comprobante', key: 'comprobante' },
      { header: 'Vendedor', key: 'vendedor' },
    ]
    this.estiloCabecera(wsVentas, 8)
    let totalGeneral = 0
    ventas.forEach((v, i) => {
      const total = Number(v.total)
      totalGeneral += total
      wsVentas.addRow({
        id: v.id,
        fecha: this.fmtFecha(v.fecha),
        cliente: v.cliente?.nombre ?? 'Consumidor final',
        formaPago: v.formaPago ?? 'EFECTIVO',
        descuento: Number(v.descuentoPct) > 0 ? `${Number(v.descuentoPct)}%` : '-',
        total: r2(total),
        comprobante: v.serieComprobante && v.numeroComprobante ? `${v.serieComprobante}-${String(v.numeroComprobante).padStart(8, '0')}` : '-',
        vendedor: v.usuario?.nombre ?? '-',
      })
      this.filaAlterna(wsVentas, i + 2)
    })
    const filaTotal = wsVentas.addRow({ cliente: 'TOTAL', total: r2(totalGeneral) })
    filaTotal.font = { bold: true }
    filaTotal.getCell('total').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }

    // Hoja 2: Detalle de productos vendidos
    const wsDetalle = wb.addWorksheet('Detalle productos')
    wsDetalle.columns = [
      { header: 'Venta ID', key: 'ventaId' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Producto', key: 'producto' },
      { header: 'Cantidad', key: 'cantidad' },
      { header: 'Precio Unit. (S/)', key: 'precio' },
      { header: 'Subtotal (S/)', key: 'subtotal' },
    ]
    this.estiloCabecera(wsDetalle, 6)
    let row = 2
    for (const v of ventas) {
      for (const d of v.detalles) {
        wsDetalle.addRow({ ventaId: v.id, fecha: this.fmtFecha(v.fecha), producto: d.producto.nombre, cantidad: d.cantidad, precio: r2(Number(d.precioUnitario)), subtotal: r2(Number(d.subtotal)) })
        this.filaAlterna(wsDetalle, row++)
      }
    }

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
  }

  // ── Excel: Compras ───────────────────────────────────────────────────────────
  async excelCompras(desde: string, hasta: string): Promise<Buffer> {
    const compras = await this.prisma.compra.findMany({
      where: { fecha: this.rango(desde, hasta) },
      include: { detalles: { include: { producto: true } }, proveedor: true, usuario: { select: { id: true, nombre: true } } },
      orderBy: { fecha: 'desc' },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'SysVenta'

    const ws = wb.addWorksheet('Compras')
    ws.columns = [
      { header: 'ID', key: 'id' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Proveedor', key: 'proveedor' },
      { header: 'Comprobante', key: 'comprobante' },
      { header: 'Total (S/)', key: 'total' },
      { header: 'Registrado por', key: 'usuario' },
    ]
    this.estiloCabecera(ws, 6)
    let totalGeneral = 0
    compras.forEach((c, i) => {
      const total = Number(c.total)
      totalGeneral += total
      ws.addRow({
        id: c.id,
        fecha: this.fmtFecha(c.fecha),
        proveedor: c.proveedor?.nombre ?? 'Sin proveedor',
        comprobante: c.serieComprobante && c.numeroComprobante ? `${c.serieComprobante}-${c.numeroComprobante.padStart(8, '0')}` : '-',
        total: r2(total),
        usuario: c.usuario?.nombre ?? '-',
      })
      this.filaAlterna(ws, i + 2)
    })
    const filaTotal = ws.addRow({ proveedor: 'TOTAL', total: r2(totalGeneral) })
    filaTotal.font = { bold: true }

    const wsDetalle = wb.addWorksheet('Detalle productos')
    wsDetalle.columns = [
      { header: 'Compra ID', key: 'compraId' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Producto', key: 'producto' },
      { header: 'Cantidad', key: 'cantidad' },
      { header: 'Precio Compra (S/)', key: 'precio' },
      { header: 'Subtotal (S/)', key: 'subtotal' },
    ]
    this.estiloCabecera(wsDetalle, 6)
    let row = 2
    for (const c of compras) {
      for (const d of c.detalles) {
        wsDetalle.addRow({ compraId: c.id, fecha: this.fmtFecha(c.fecha), producto: d.producto.nombre, cantidad: d.cantidad, precio: r2(Number(d.precioCompra)), subtotal: r2(Number(d.subtotal)) })
        this.filaAlterna(wsDetalle, row++)
      }
    }

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
  }

  // ── Excel: Stock actual ──────────────────────────────────────────────────────
  async excelStock(): Promise<Buffer> {
    const productos = await this.prisma.producto.findMany({
      include: { categoria: true },
      orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'SysVenta'
    const ws = wb.addWorksheet('Stock actual')
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Producto', key: 'nombre', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Stock actual', key: 'stock', width: 14 },
      { header: 'Stock mínimo', key: 'stockMinimo', width: 14 },
      { header: 'Precio (S/)', key: 'precio', width: 14 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Activo', key: 'activo', width: 10 },
    ]
    this.estiloCabecera(ws, 8)
    productos.forEach((p, i) => {
      const bajo = p.stock <= p.stockMinimo
      const rowData = ws.addRow({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre ?? '-',
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        precio: r2(Number(p.precio)),
        estado: p.stock === 0 ? 'AGOTADO' : bajo ? 'BAJO' : 'OK',
        activo: p.activo ? 'Sí' : 'No',
      })
      if (p.stock === 0) {
        rowData.getCell('estado').font = { bold: true, color: { argb: 'FFDC2626' } }
      } else if (bajo) {
        rowData.getCell('estado').font = { bold: true, color: { argb: 'FFD97706' } }
      } else {
        rowData.getCell('estado').font = { color: { argb: 'FF16A34A' } }
      }
      this.filaAlterna(ws, i + 2)
    })

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
  }
}
