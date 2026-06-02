'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Compra, Producto, Proveedor } from '@/lib/types'
import { Plus, Trash2, Package, History, Search, X } from 'lucide-react'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import Pagination from '@/components/Pagination'
import SearchableSelect from '@/components/SearchableSelect'

interface ItemCarrito {
  productoId: number
  nombre: string
  precioUnitario: number
  cantidad: number
}

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [productoSelId, setProductoSelId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [serieComprobante, setSerieComprobante] = useState('')
  const [numeroComprobante, setNumeroComprobante] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingCompras, setLoadingCompras] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [tab, setTab] = useState<'compra' | 'historial'>('compra')
  const [busquedaProveedor, setBusquedaProveedor] = useState('')
  const { toast, showToast, closeToast } = useToast()

  const loadData = async () => {
    try {
      const [prodRes, provRes] = await Promise.allSettled([
        api.get<Producto[]>('/productos'),
        api.get<Proveedor[]>('/proveedores'),
      ])
      if (prodRes.status === 'fulfilled') setProductos(prodRes.value.data.filter((p) => p.activo))
      if (provRes.status === 'fulfilled') setProveedores(provRes.value.data.filter((p) => p.activo))
    } finally {
      setLoading(false)
    }
  }

  const buscarCompras = async (d = desde, h = hasta) => {
    setLoadingCompras(true)
    try {
      const params = d && h ? `?desde=${d}&hasta=${h}` : ''
      const res = await api.get<Compra[]>(`/compras${params}`)
      setCompras(res.data)
      setPage(1)
    } finally {
      setLoadingCompras(false)
    }
  }

  useEffect(() => { loadData(); buscarCompras() }, [])

  const agregarAlCarrito = () => {
    const prod = productos.find((p) => p.id === parseInt(productoSelId))
    if (!prod) return
    const cant = Math.max(1, parseInt(cantidad) || 1)
    const precio = parseFloat(precioUnitario) || 0
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === prod.id)
      if (existente) {
        return prev.map((i) =>
          i.productoId === prod.id ? { ...i, cantidad: i.cantidad + cant } : i
        )
      }
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precioUnitario: precio, cantidad: cant }]
    })
    setProductoSelId('')
    setCantidad('1')
    setPrecioUnitario('')
  }

  const quitarItem = (productoId: number) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const total = carrito.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)

  const comprasFiltradas = busquedaProveedor
    ? compras.filter((c) =>
        c.proveedor?.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        c.proveedor?.ruc?.includes(busquedaProveedor)
      )
    : compras
  const comprasPag = comprasFiltradas.slice((page - 1) * 15, page * 15)

  const handleRegistrarCompra = async () => {
    if (carrito.length === 0) { setError('Agrega productos al carrito'); return }
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        detalles: carrito.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioCompra: i.precioUnitario,
        })),
      }
      if (proveedorId) body.proveedorId = parseInt(proveedorId)
      if (serieComprobante) body.serieComprobante = serieComprobante.toUpperCase()
      if (numeroComprobante) body.numeroComprobante = numeroComprobante
      await api.post('/compras', body)
      setCarrito([])
      setProveedorId('')
      setSerieComprobante('')
      setNumeroComprobante('')
      buscarCompras()
      showToast('Compra registrada correctamente')
    } catch {
      setError('Error al registrar la compra')
      showToast('Error al registrar la compra', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">

        {/* Pestañas */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 w-fit">
          <button
            onClick={() => setTab('compra')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'compra' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Nueva Compra
          </button>
          <button
            onClick={() => { setTab('historial'); buscarCompras() }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'historial' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
        </div>

        {/* Nueva Compra — horizontal top panel */}
        {tab === 'compra' && <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Nueva Compra</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[260px_260px_1fr_210px] divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            {/* Col 1: Proveedor + Comprobante */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Proveedor</p>
              <div className="space-y-3">
                <SearchableSelect
                  value={proveedorId}
                  onChange={setProveedorId}
                  emptyOption="Sin proveedor"
                  options={proveedores.map((p) => ({
                    value: String(p.id),
                    label: p.nombre + (p.ruc ? ` — ${p.ruc}` : ''),
                  }))}
                />
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Comprobante <span className="text-gray-400">(opcional)</span>
                  </p>
                  <div className="flex gap-2 min-w-0">
                    <input
                      type="text"
                      value={serieComprobante}
                      onChange={(e) => setSerieComprobante(e.target.value)}
                      placeholder="F001"
                      maxLength={4}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={numeroComprobante}
                      onChange={(e) => setNumeroComprobante(e.target.value.replace(/\D/g, ''))}
                      placeholder="00001234"
                      maxLength={8}
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {serieComprobante && numeroComprobante && (
                    <p className="text-xs text-purple-600 mt-1 font-medium">
                      {serieComprobante.toUpperCase()}-{numeroComprobante.padStart(8, '0')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Col 2: Producto + Precio + Cantidad */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Producto</p>
              <div className="space-y-2">
                <SearchableSelect
                  value={productoSelId}
                  onChange={setProductoSelId}
                  options={[...productos].sort((a, b) => a.stock - b.stock).map((p) => ({ value: String(p.id), label: `${p.nombre} (stock: ${p.stock})` }))}
                  placeholder="Seleccionar producto..."
                />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Precio unitario <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 bg-white">
                    <span className="pl-3 pr-2 text-sm font-semibold text-purple-600 select-none shrink-0">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={precioUnitario}
                      onChange={(e) => setPrecioUnitario(e.target.value)}
                      className="flex-1 min-w-0 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none rounded-r-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={agregarAlCarrito}
                  disabled={!productoSelId || !precioUnitario}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg disabled:opacity-40 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Agregar al carrito
                </button>
              </div>
            </div>

            {/* Col 3: Carrito */}
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Carrito {carrito.length > 0 && <span className="text-purple-600">({carrito.length})</span>}
              </p>
              {carrito.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Carrito vacío</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {carrito.map((item) => (
                    <div key={item.productoId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          x{item.cantidad} × S/ {(Number(item.precioUnitario) || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-sm font-semibold text-gray-800">
                          S/ {((Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}
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

            {/* Col 4: Total + Registrar */}
            <div className="p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Total</p>
                <p className="text-2xl font-bold text-purple-700 mb-1 break-all">S/ {(Number(total) || 0).toFixed(2)}</p>
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
              </div>
              <button
                onClick={handleRegistrarCompra}
                disabled={saving || carrito.length === 0}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {saving ? 'Registrando...' : 'Registrar Compra'}
              </button>
            </div>

          </div>
        </div>}

        {/* Historial de Compras */}
        {tab === 'historial' && <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-gray-800">Historial de Compras</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  value={busquedaProveedor}
                  onChange={(e) => { setBusquedaProveedor(e.target.value); setPage(1) }}
                  placeholder="Buscar por proveedor..."
                  className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {busquedaProveedor && (
                  <button
                    onClick={() => { setBusquedaProveedor(''); setPage(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={() => buscarCompras()}
                disabled={loadingCompras}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loadingCompras ? 'Buscando...' : 'Buscar'}
              </button>
              {(desde || hasta) && (
                <button
                  onClick={() => { setDesde(''); setHasta(''); buscarCompras('', '') }}
                  className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1.5"
                >
                  Limpiar
                </button>
              )}
              {comprasFiltradas.length > 0 && (
                <span className="text-xs text-gray-500 ml-auto self-end">
                  {comprasFiltradas.length} compra{comprasFiltradas.length !== 1 ? 's' : ''} —{' '}
                  <span className="font-semibold text-purple-700">
                    S/ {comprasFiltradas.reduce((s, c) => s + (Number(c.total) || 0), 0).toFixed(2)}
                  </span>
                </span>
              )}
            </div>
          </div>
          {loadingCompras ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : comprasFiltradas.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              {busquedaProveedor ? `Sin resultados para "${busquedaProveedor}"` : 'No hay compras registradas'}
            </p>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {comprasPag.map((c) => (
                  <div key={c.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">Compra #{c.id}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(c.fecha).toLocaleDateString('es-PE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="font-bold text-purple-700">S/ {(Number(c.total) || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {c.detalles?.map((d) => (
                        <p key={d.id}>
                          {d.producto?.nombre} x{d.cantidad} — S/ {(Number(d.subtotal) || 0).toFixed(2)}
                        </p>
                      ))}
                      {c.proveedor && (
                        <p className="text-purple-500 font-medium">Proveedor: {c.proveedor.nombre}{c.proveedor.ruc ? ` (${c.proveedor.ruc})` : ''}</p>
                      )}
                      {c.serieComprobante && c.numeroComprobante && (
                        <p className="text-green-600 font-medium">
                          Comprobante: {c.serieComprobante}-{c.numeroComprobante.padStart(8, '0')}
                        </p>
                      )}
                      <p className="text-gray-400">Registrado por: {c.usuario?.nombre ?? '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={comprasFiltradas.length} page={page} pageSize={15} onChange={setPage} />
            </>
          )}
        </div>}

      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
