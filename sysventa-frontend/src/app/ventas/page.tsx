'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Venta, Producto, Cliente, Categoria } from '@/lib/types'
import { Plus, Trash2, ShoppingCart, Printer, X, Search, Loader2, UserCheck, ArrowLeft, FileText, Receipt, ExternalLink, QrCode, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import Pagination from '@/components/Pagination'
import QRCode from 'react-qr-code'
import { generarQRPago } from '@/lib/qr-pago'
import Image from 'next/image'

interface ItemCarrito {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
}

interface ClienteReniec {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  numeroDocumento: string
}

interface ComprobanteResult {
  enlace_del_pdf?: string
  aceptada_por_sunat?: boolean
  sunat_description?: string
  enlace_del_xml?: string
  codigo_hash?: string
  serie?: string
  numero?: number
  error?: string
  ventaId?: number
}

type ModalStep = 'qr' | 'choose' | 'boleta' | 'factura' | 'result'
type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE_PLIN'

// ── Componente QR Yape/Plin ───────────────────────────────────────────────────
function YapeQrStep({
  total, pct, descuentoMonto, onConfirmar, onCerrar,
}: {
  total: number
  pct: number
  descuentoMonto: number
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const phone = process.env.NEXT_PUBLIC_YAPE_PHONE ?? ''
  const nombre = process.env.NEXT_PUBLIC_NOMBRE_NEGOCIO ?? 'NEGOCIO'
  const [useStaticImg, setUseStaticImg] = useState(true)

  const qrValue = phone ? generarQRPago(phone, total, nombre) : ''

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-pink-600" />
          Pago con Yape / Plin
        </h3>
        <button onClick={onCerrar}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
      </div>
      <div className="p-6 space-y-4">
        {/* Monto */}
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto a pagar</p>
          <p className="text-5xl font-bold text-pink-600 tracking-tight">S/ {total.toFixed(2)}</p>
          {descuentoMonto > 0 && (
            <p className="text-xs text-green-600 mt-1">Descuento {pct}% aplicado</p>
          )}
        </div>

        {/* QR */}
        {phone ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative p-3 bg-white border-2 border-pink-200 rounded-2xl shadow-sm">
              {/* Imagen estática del QR personal de Yape (generado desde la app) */}
              {useStaticImg ? (
                <Image
                  src="/yape-qr.png"
                  alt="QR Yape"
                  width={200}
                  height={200}
                  className="rounded-lg"
                  onError={() => setUseStaticImg(false)}
                />
              ) : (
                /* Fallback: QR generado dinámicamente */
                <QRCode value={qrValue} size={200} level="M" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-800">📱 {phone}</p>
              <p className="text-xs text-gray-400 mt-0.5">Escanea con Yape o Plin</p>
              {!useStaticImg && (
                <p className="text-xs text-pink-500 mt-1 font-medium">
                  Ingresa el monto exacto: S/ {total.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-700 font-medium">Número no configurado</p>
            <p className="text-xs text-yellow-600 mt-1">
              Agrega <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_YAPE_PHONE</code> en .env.local
            </p>
          </div>
        )}

        <button
          onClick={onConfirmar}
          className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Pago recibido — continuar
        </button>
      </div>
    </>
  )
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [productoSelId, setProductoSelId] = useState('')
  const [cantidad, setCantidad] = useState('1')

  // Cliente por DNI
  const [dniInput, setDniInput] = useState('')
  const [dniLoading, setDniLoading] = useState(false)
  const [dniError, setDniError] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [clienteReniec, setClienteReniec] = useState<ClienteReniec | null>(null)
  const [registrandoCliente, setRegistrandoCliente] = useState(false)

  // Descuento y forma de pago
  const [descuentoPct, setDescuentoPct] = useState('')
  const [formaPago, setFormaPago] = useState<FormaPago>('EFECTIVO')

  // Modal confirmar venta
  const [showModalVenta, setShowModalVenta] = useState(false)
  const [modalStep, setModalStep] = useState<ModalStep>('choose')
  const [saving, setSaving] = useState(false)
  const [emitiendo, setEmitiendo] = useState(false)

  // Boleta
  const [boletaDni, setBoletaDni] = useState('')
  const [boletaNombre, setBoletaNombre] = useState('')
  const [boletaDniLoading, setBoletaDniLoading] = useState(false)
  const [boletaDniError, setBoletaDniError] = useState('')

  // Factura
  const [facturaRuc, setFacturaRuc] = useState('')
  const [facturaRazonSocial, setFacturaRazonSocial] = useState('')
  const [facturaRucLoading, setFacturaRucLoading] = useState(false)
  const [facturaRucError, setFacturaRucError] = useState('')

  // Resultado comprobante
  const [comprobanteResult, setComprobanteResult] = useState<ComprobanteResult | null>(null)

  const [turnoAbierto, setTurnoAbierto] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [error, setError] = useState('')
  const [ventaImpresion, setVentaImpresion] = useState<Venta | null>(null)
  const [page, setPage] = useState(1)
  const today = new Date().toISOString().split('T')[0]
  const [desde, setDesde] = useState(today)
  const [hasta, setHasta] = useState(today)
  const { toast, showToast, closeToast } = useToast()

  const loadData = async () => {
    try {
      const [prodRes, catRes, cajaRes] = await Promise.allSettled([
        api.get<Producto[]>('/productos'),
        api.get<Categoria[]>('/categorias'),
        api.get<{ estado?: string } | null>('/caja/actual'),
      ])
      if (prodRes.status === 'fulfilled') setProductos(prodRes.value.data.filter((p) => p.activo))
      if (catRes.status === 'fulfilled') setCategorias(catRes.value.data)
      if (cajaRes.status === 'fulfilled') setTurnoAbierto(cajaRes.value.data?.estado === 'ABIERTO')
      else setTurnoAbierto(false)
    } finally {
      setLoading(false)
    }
  }

  const buscarVentas = async (d = desde, h = hasta) => {
    setLoadingVentas(true)
    try {
      const res = await api.get<{ ventas: Venta[] }>(`/ventas/hoy?desde=${d}&hasta=${h}`)
      setVentas([...(res.data.ventas ?? [])])
      setPage(1)
    } finally {
      setLoadingVentas(false)
    }
  }

  useEffect(() => { loadData(); buscarVentas() }, [])

  // ── Cliente por DNI ──────────────────────────────────────────────────────────

  const limpiarCliente = () => {
    setClienteSeleccionado(null)
    setClienteReniec(null)
    setDniInput('')
    setDniError('')
  }

  const buscarClientePorDni = async () => {
    const dni = dniInput.trim()
    if (dni.length !== 8) { setDniError('El DNI debe tener 8 dígitos'); return }
    setDniLoading(true)
    setDniError('')
    setClienteReniec(null)
    try {
      const localRes = await api.get<Cliente | null>(`/clientes/buscar?dni=${dni}`)
      if (localRes.data) { setClienteSeleccionado(localRes.data); setDniInput(''); return }
      const reniecRes = await api.get<ClienteReniec>(`/clientes/reniec/${dni}`)
      setClienteReniec({ ...reniecRes.data, numeroDocumento: dni })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDniError(status === 404 ? (msg ?? 'DNI no encontrado en RENIEC') : (msg ?? 'Error al consultar el DNI'))
    } finally {
      setDniLoading(false)
    }
  }

  const confirmarRegistroCliente = async () => {
    if (!clienteReniec) return
    setRegistrandoCliente(true)
    try {
      const res = await api.post<Cliente>('/clientes', {
        nombre: clienteReniec.nombre,
        dni: clienteReniec.numeroDocumento,
      })
      setClienteSeleccionado(res.data)
      setClienteReniec(null)
      setDniInput('')
      showToast('Cliente registrado y seleccionado')
    } catch {
      showToast('Error al registrar el cliente', 'error')
    } finally {
      setRegistrandoCliente(false)
    }
  }

  // ── Boleta: buscar DNI ───────────────────────────────────────────────────────

  const buscarDniBoleta = async () => {
    if (boletaDni.length !== 8) return
    setBoletaDniLoading(true)
    setBoletaDniError('')
    try {
      const res = await api.get<ClienteReniec>(`/clientes/reniec/${boletaDni}`)
      setBoletaNombre(res.data.nombre)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setBoletaDniError(msg ?? 'DNI no encontrado')
    } finally {
      setBoletaDniLoading(false)
    }
  }

  // ── Factura: buscar RUC ──────────────────────────────────────────────────────

  const buscarRuc = async () => {
    if (facturaRuc.length !== 11) return
    setFacturaRucLoading(true)
    setFacturaRucError('')
    try {
      const res = await api.get<{ razonSocial: string }>(`/facturacion/ruc/${facturaRuc}`)
      setFacturaRazonSocial(res.data.razonSocial)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFacturaRucError(msg ?? 'RUC no encontrado')
    } finally {
      setFacturaRucLoading(false)
    }
  }

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const abrirModalVenta = () => {
    if (carrito.length === 0) { setError('Agrega productos al carrito'); return }
    setError('')
    setBoletaDni(clienteSeleccionado?.dni ?? '')
    setBoletaNombre(clienteSeleccionado?.nombre ?? '')
    setBoletaDniError('')
    setFacturaRuc('')
    setFacturaRazonSocial('')
    setFacturaRucError('')
    setComprobanteResult(null)
    setModalStep(formaPago === 'YAPE_PLIN' ? 'qr' : 'choose')
    setShowModalVenta(true)
  }

  const cerrarModalVenta = () => {
    if (saving || emitiendo) return
    setShowModalVenta(false)
  }

  // ── Crear venta (común) ──────────────────────────────────────────────────────

  const crearVenta = async () => {
    const res = await api.post<Venta>('/ventas', {
      clienteId: clienteSeleccionado?.id,
      descuentoPct: parseFloat(descuentoPct) || 0,
      formaPago,
      detalles: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    })
    setCarrito([])
    setDescuentoPct('')
    setFormaPago('EFECTIVO')
    limpiarCliente()
    buscarVentas()
    return res.data
  }

  const handleSinComprobante = async () => {
    setSaving(true)
    try {
      await crearVenta()
      setShowModalVenta(false)
      showToast('Venta registrada correctamente')
    } catch {
      showToast('Error al registrar la venta', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarBoleta = async () => {
    setSaving(true)
    try {
      const venta = await crearVenta()
      setSaving(false)
      setEmitiendo(true)
      try {
        const res = await api.post<ComprobanteResult>('/facturacion/boleta', {
          ventaId: venta.id,
          dniCliente: boletaDni || undefined,
          nombreCliente: boletaNombre || undefined,
        })
        setComprobanteResult({ ...res.data, ventaId: venta.id })
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setComprobanteResult({
          error: msg ?? 'Error al emitir la boleta',
          ventaId: venta.id,
        })
      } finally {
        setEmitiendo(false)
      }
      setModalStep('result')
    } catch {
      showToast('Error al registrar la venta', 'error')
      setSaving(false)
    }
  }

  const handleConfirmarFactura = async () => {
    if (!facturaRuc || !facturaRazonSocial) return
    setSaving(true)
    try {
      const venta = await crearVenta()
      setSaving(false)
      setEmitiendo(true)
      try {
        const res = await api.post<ComprobanteResult>('/facturacion/factura', {
          ventaId: venta.id,
          ruc: facturaRuc,
          razonSocial: facturaRazonSocial,
        })
        setComprobanteResult({ ...res.data, ventaId: venta.id })
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setComprobanteResult({
          error: msg ?? 'Error al emitir la factura',
          ventaId: venta.id,
        })
      } finally {
        setEmitiendo(false)
      }
      setModalStep('result')
    } catch {
      showToast('Error al registrar la venta', 'error')
      setSaving(false)
    }
  }

  // ── Carrito ──────────────────────────────────────────────────────────────────

  const ventasPag = ventas.slice((page - 1) * 10, page * 10)

  const productosFiltrados = categoriaFiltro
    ? productos.filter((p) => String(p.categoriaId) === categoriaFiltro)
    : productos

  const agregarAlCarrito = () => {
    const prod = productos.find((p) => p.id === parseInt(productoSelId))
    if (!prod) return
    const cant = Math.max(1, parseInt(cantidad) || 1)
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === prod.id)
      if (existente) return prev.map((i) => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + cant } : i)
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: Number(prod.precio) || 0, cantidad: cant }]
    })
    setProductoSelId('')
    setCantidad('1')
  }

  const quitarItem = (productoId: number) => setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  const subtotalBruto = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const pct = Math.min(100, Math.max(0, parseFloat(descuentoPct) || 0))
  const descuentoMonto = Math.round(subtotalBruto * pct) / 100
  const total = subtotalBruto - descuentoMonto

  const handleImprimir = (v: Venta) => setVentaImpresion(v)
  const imprimirComprobante = () => window.print()

  // ── Resumen del modal ────────────────────────────────────────────────────────

  const ResumenVenta = () => (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Total a cobrar</span>
        <span className="text-xl font-bold text-blue-700">S/ {total.toFixed(2)}</span>
      </div>
      {descuentoMonto > 0 && (
        <p className="text-xs text-green-600 mt-0.5">Descuento {pct}%: −S/ {descuentoMonto.toFixed(2)}</p>
      )}
      <div className="flex items-center justify-between mt-1">
        {clienteSeleccionado
          ? <p className="text-xs text-gray-500">Cliente: {clienteSeleccionado.nombre}</p>
          : <span />
        }
        <span className="text-xs font-medium text-blue-600">
          {formaPago === 'EFECTIVO' ? '💵 Efectivo' : formaPago === 'TARJETA' ? '💳 Tarjeta' : formaPago === 'YAPE_PLIN' ? '📱 Yape/Plin' : '🏦 Transferencia'}
        </span>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* Aviso turno cerrado */}
        {turnoAbierto === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">No hay turno de caja abierto</p>
                <p className="text-xs text-amber-600 mt-0.5">Debes abrir un turno antes de registrar ventas</p>
              </div>
            </div>
            <Link href="/caja"
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Abrir turno
            </Link>
          </div>
        )}

        {/* Nueva Venta — horizontal top panel */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Nueva Venta</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[260px_260px_1fr_210px] divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            {/* Col 1: Cliente por DNI */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Cliente</p>
              {clienteSeleccionado ? (
                <div className="flex items-start justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 leading-tight">{clienteSeleccionado.nombre}</p>
                      {clienteSeleccionado.dni && <p className="text-xs text-gray-500">DNI: {clienteSeleccionado.dni}</p>}
                    </div>
                  </div>
                  <button onClick={limpiarCliente} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={(e) => { e.preventDefault(); buscarClientePorDni() }} className="flex gap-2 w-full min-w-0">
                    <input
                      type="text" inputMode="numeric" maxLength={8} value={dniInput}
                      onChange={(e) => { setDniInput(e.target.value.replace(/\D/g, '')); setDniError(''); setClienteReniec(null) }}
                      placeholder="Buscar por DNI..."
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={dniLoading || dniInput.length !== 8}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 flex items-center">
                      {dniLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </form>
                  {dniError && <p className="text-xs text-red-500 mt-1">{dniError}</p>}
                  {clienteReniec && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-yellow-700 mb-1">Encontrado en RENIEC — no registrado</p>
                      <p className="text-sm font-medium text-gray-800">{clienteReniec.nombre}</p>
                      <p className="text-xs text-gray-500 mb-2">DNI: {clienteReniec.numeroDocumento}</p>
                      <div className="flex gap-2">
                        <button onClick={confirmarRegistroCliente} disabled={registrandoCliente}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                          {registrandoCliente ? 'Registrando...' : 'Registrar y seleccionar'}
                        </button>
                        <button onClick={() => setClienteReniec(null)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {!clienteReniec && !dniError && (
                    <p className="text-xs text-gray-400 mt-1">Sin cliente — Consumidor final</p>
                  )}
                </>
              )}
            </div>

            {/* Col 2: Selección de producto */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Producto</p>
              <div className="space-y-2">
                <select value={categoriaFiltro} onChange={(e) => { setCategoriaFiltro(e.target.value); setProductoSelId('') }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas las categorías</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select value={productoSelId} onChange={(e) => setProductoSelId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{productosFiltrados.length === 0 ? 'Sin productos' : 'Seleccionar producto...'}</option>
                  {productosFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (stock: {p.stock})
                    </option>
                  ))}
                </select>
                {productoSelId && (() => {
                  const prod = productos.find((p) => p.id === parseInt(productoSelId))
                  return prod ? (
                    <p className="text-sm font-semibold text-blue-700 px-1">
                      S/ {(Number(prod.precio) || 0).toFixed(2)}
                      <span className="text-xs font-normal text-gray-400 ml-2">stock: {prod.stock}</span>
                    </p>
                  ) : null
                })()}
                <div className="flex gap-2">
                  <input inputMode="numeric" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Cant."
                    className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={agregarAlCarrito} disabled={!productoSelId}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg disabled:opacity-40 flex items-center justify-center gap-1 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Col 3: Carrito */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Carrito {carrito.length > 0 && <span className="text-blue-600">({carrito.length})</span>}
              </p>
              {carrito.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Carrito vacío</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {carrito.map((item) => (
                    <div key={item.productoId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-500">x{item.cantidad} × S/ {(Number(item.precio) || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-sm font-semibold text-gray-800">
                          S/ {((Number(item.precio) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}
                        </span>
                        <button onClick={() => quitarItem(item.productoId)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Col 4: Descuento + Forma de pago + Total + Confirmar */}
            <div className="p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Descuento</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0" max="100" step="0.5"
                      value={descuentoPct}
                      onChange={(e) => setDescuentoPct(e.target.value)}
                      placeholder="0"
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    {descuentoMonto > 0 && (
                      <span className="text-xs text-green-600 font-medium ml-1">−S/ {descuentoMonto.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Forma de pago</p>
                  <div className="flex flex-col gap-1">
                    {([
                      { key: 'EFECTIVO', label: '💵 Efectivo' },
                      { key: 'TARJETA', label: '💳 Tarjeta' },
                      { key: 'YAPE_PLIN', label: '📱 Yape / Plin' },
                      { key: 'TRANSFERENCIA', label: '🏦 Transferencia' },
                    ] as const).map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => setFormaPago(key)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium text-left transition-colors ${
                          formaPago === key
                            ? key === 'YAPE_PLIN'
                              ? 'bg-pink-600 text-white'
                              : 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total</p>
                  {descuentoMonto > 0 && (
                    <p className="text-xs text-gray-400 line-through">S/ {subtotalBruto.toFixed(2)}</p>
                  )}
                  <p className="text-3xl font-bold text-blue-700">S/ {(Number(total) || 0).toFixed(2)}</p>
                  {clienteSeleccionado && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{clienteSeleccionado.nombre}</p>
                  )}
                  {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>
              </div>
              <button
                onClick={abrirModalVenta}
                disabled={carrito.length === 0 || turnoAbierto === false}
                title={turnoAbierto === false ? 'Abre el turno de caja primero' : undefined}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {turnoAbierto === false ? 'Turno cerrado' : 'Confirmar Venta'}
              </button>
            </div>

          </div>
        </div>

        {/* Historial de Ventas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800">Historial de Ventas</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={() => buscarVentas()} disabled={loadingVentas}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {loadingVentas ? 'Buscando...' : 'Buscar'}
              </button>
              {(desde !== today || hasta !== today) && (
                <button onClick={() => { setDesde(today); setHasta(today); buscarVentas(today, today) }}
                  className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1.5">
                  Hoy
                </button>
              )}
              {ventas.length > 0 && (
                <span className="text-xs text-gray-400 ml-auto self-end">
                  {ventas.length} venta{ventas.length !== 1 ? 's' : ''} — Total S/ {ventas.reduce((s, v) => s + (Number(v.total) || 0), 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          {loadingVentas ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : ventas.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay ventas en ese rango de fechas</p>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {ventasPag.map((v) => (
                  <div key={v.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">Venta #{v.id}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {desde === hasta
                            ? new Date(v.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                            : new Date(v.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-700">S/ {(Number(v.total) || 0).toFixed(2)}</span>
                        <button onClick={() => handleImprimir(v)} title="Imprimir comprobante"
                          className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {v.detalles?.map((d) => (
                        <p key={d.id}>{d.producto?.nombre} x{d.cantidad} — S/ {(Number(d.subtotal) || 0).toFixed(2)}</p>
                      ))}
                      {v.cliente && <p className="text-blue-500 font-medium">Cliente: {v.cliente.nombre}</p>}
                      <p className="text-gray-400 flex flex-wrap gap-x-2">
                        <span>Vendedor: {v.usuario?.nombre}</span>
                        {v.formaPago && v.formaPago !== 'EFECTIVO' && (
                          <span className={`font-medium ${v.formaPago === 'YAPE_PLIN' ? 'text-pink-600' : 'text-indigo-500'}`}>
                            {v.formaPago === 'TARJETA' ? '💳 Tarjeta' : v.formaPago === 'YAPE_PLIN' ? '📱 Yape/Plin' : '🏦 Transferencia'}
                          </span>
                        )}
                        {Number(v.descuentoPct) > 0 && (
                          <span className="text-green-600 font-medium">Desc. {Number(v.descuentoPct)}%</span>
                        )}
                      </p>
                      {v.tipoComprobante && v.serieComprobante && v.numeroComprobante && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${v.tipoComprobante === 'FACTURA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {v.tipoComprobante === 'FACTURA' ? <FileText className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                            {v.serieComprobante}-{String(v.numeroComprobante).padStart(8, '0')}
                          </span>
                          {v.aceptadaSunat && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              SUNAT ✓
                            </span>
                          )}
                          {v.enlacePdf && (
                            <a href={v.enlacePdf} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                              <ExternalLink className="w-3 h-3" /> Ver PDF
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={ventas.length} page={page} pageSize={10} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* ── Modal confirmar venta ────────────────────────────────────────────── */}
      {showModalVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            {/* STEP: QR Yape/Plin */}
            {modalStep === 'qr' && (
              <YapeQrStep
                total={total}
                pct={pct}
                descuentoMonto={descuentoMonto}
                onConfirmar={() => setModalStep('choose')}
                onCerrar={cerrarModalVenta}
              />
            )}

            {/* STEP: elegir tipo */}
            {modalStep === 'choose' && (
              <>
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
                  <h3 className="font-semibold text-gray-800">Confirmar Venta</h3>
                  <button onClick={cerrarModalVenta}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6">
                  <ResumenVenta />
                  <p className="text-sm font-medium text-gray-700 mb-3">¿Desea emitir comprobante?</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleSinComprobante}
                      disabled={saving}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <X className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Sin comprobante</p>
                        <p className="text-xs text-gray-500">Registrar venta directamente</p>
                      </div>
                      {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-auto" />}
                    </button>
                    <button
                      onClick={() => setModalStep('boleta')}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-blue-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Boleta de Venta</p>
                        <p className="text-xs text-gray-500">Para clientes con DNI o consumidor final</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setModalStep('factura')}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-purple-100 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Factura</p>
                        <p className="text-xs text-gray-500">Para empresas con RUC</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP: boleta */}
            {modalStep === 'boleta' && (
              <>
                <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b">
                  <button onClick={() => setModalStep('choose')} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-semibold text-gray-800">Boleta de Venta</h3>
                </div>
                <div className="p-6 space-y-4">
                  <ResumenVenta />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI del cliente <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text" inputMode="numeric" maxLength={8} value={boletaDni}
                        onChange={(e) => { setBoletaDni(e.target.value.replace(/\D/g, '')); setBoletaDniError(''); if (!e.target.value) setBoletaNombre('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') buscarDniBoleta() }}
                        placeholder="99999999"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={buscarDniBoleta} disabled={boletaDniLoading || boletaDni.length !== 8}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 flex items-center">
                        {boletaDniLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                    {boletaDniError && <p className="text-xs text-red-500 mt-1">{boletaDniError}</p>}
                    {boletaNombre && !boletaDniError && (
                      <p className="text-xs text-green-600 mt-1 font-medium">{boletaNombre}</p>
                    )}
                    {!boletaDni && (
                      <p className="text-xs text-gray-400 mt-1">Sin DNI: se emitirá a "CLIENTE VARIOS"</p>
                    )}
                  </div>
                  <button
                    onClick={handleConfirmarBoleta}
                    disabled={saving || emitiendo}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creando venta...</>
                    ) : emitiendo ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Emitiendo boleta...</>
                    ) : (
                      <><Receipt className="w-4 h-4" /> Emitir Boleta</>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* STEP: factura */}
            {modalStep === 'factura' && (
              <>
                <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b">
                  <button onClick={() => setModalStep('choose')} className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-semibold text-gray-800">Factura</h3>
                </div>
                <div className="p-6 space-y-4">
                  <ResumenVenta />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC del cliente</label>
                    <div className="flex gap-2">
                      <input
                        type="text" inputMode="numeric" maxLength={11} value={facturaRuc}
                        onChange={(e) => { setFacturaRuc(e.target.value.replace(/\D/g, '')); setFacturaRucError('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') buscarRuc() }}
                        placeholder="20100113135"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={buscarRuc} disabled={facturaRucLoading || facturaRuc.length !== 11}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 flex items-center">
                        {facturaRucLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                    {facturaRucError && <p className="text-xs text-red-500 mt-1">{facturaRucError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                    <input
                      type="text" value={facturaRazonSocial}
                      onChange={(e) => setFacturaRazonSocial(e.target.value)}
                      placeholder="EMPRESA S.A.C."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleConfirmarFactura}
                    disabled={!facturaRuc || !facturaRazonSocial || saving || emitiendo}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creando venta...</>
                    ) : emitiendo ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Emitiendo factura...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Emitir Factura</>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* STEP: resultado */}
            {modalStep === 'result' && comprobanteResult && (
              <>
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
                  <h3 className="font-semibold text-gray-800">Resultado</h3>
                  <button onClick={() => setShowModalVenta(false)}>
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <div className="p-6">
                  {comprobanteResult.error ? (
                    // Error emitiendo comprobante (venta ya fue creada)
                    <div className="text-center">
                      <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-1">Venta registrada</p>
                      <p className="text-xs text-gray-500 mb-3">Venta #{comprobanteResult.ventaId} creada exitosamente</p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left mb-4">
                        <p className="text-xs font-semibold text-red-700 mb-1">Error al emitir comprobante</p>
                        <p className="text-xs text-red-600">{comprobanteResult.error}</p>
                      </div>
                      <p className="text-xs text-gray-400">Puedes reintentar la emisión desde el panel de Nubefact</p>
                    </div>
                  ) : (
                    // Comprobante emitido exitosamente
                    <div className="text-center">
                      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">✅</span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-1">Comprobante emitido</p>
                      {comprobanteResult.serie && comprobanteResult.numero && (
                        <p className="text-sm text-blue-600 font-mono font-bold mb-1">
                          {comprobanteResult.serie}-{String(comprobanteResult.numero).padStart(8, '0')}
                        </p>
                      )}
                      {comprobanteResult.aceptada_por_sunat && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-3">
                          Aceptada por SUNAT
                        </span>
                      )}
                      {comprobanteResult.sunat_description && (
                        <p className="text-xs text-gray-500 mb-4">{comprobanteResult.sunat_description}</p>
                      )}
                      {comprobanteResult.enlace_del_pdf && (
                        <a
                          href={comprobanteResult.enlace_del_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"
                        >
                          <Printer className="w-4 h-4" />
                          Ver / Descargar PDF
                        </a>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setShowModalVenta(false)}
                    className="w-full mt-4 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal comprobante impresión */}
      {ventaImpresion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b print:hidden">
              <h3 className="font-semibold text-gray-800">Comprobante de Venta</h3>
              <button onClick={() => setVentaImpresion(null)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div id="comprobante" className="p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="text-lg font-bold">SysVenta</p>
                <p className="text-xs text-gray-500">Comprobante de Venta</p>
                <p className="text-xs text-gray-400">
                  {new Date(ventaImpresion.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <p className="text-xs text-gray-500 mb-1">Venta #{ventaImpresion.id}</p>
              {ventaImpresion.cliente && <p className="text-xs mb-1">Cliente: <span className="font-medium">{ventaImpresion.cliente.nombre}</span></p>}
              {ventaImpresion.usuario && <p className="text-xs mb-3">Vendedor: <span className="font-medium">{ventaImpresion.usuario.nombre}</span></p>}
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="space-y-1 mb-3">
                {ventaImpresion.detalles?.map((d) => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="flex-1 truncate pr-2">{d.producto?.nombre}</span>
                    <span className="text-gray-500 mr-3">x{d.cantidad}</span>
                    <span className="font-medium">S/ {(Number(d.subtotal) || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>S/ {(Number(ventaImpresion.total) || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <p className="text-center text-xs text-gray-400">¡Gracias por su compra!</p>
            </div>
            <div className="px-6 pb-5 flex gap-3 print:hidden">
              <button onClick={() => setVentaImpresion(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cerrar
              </button>
              <button onClick={imprimirComprobante}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
