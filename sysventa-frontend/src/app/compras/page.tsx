'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Compra, Producto, Proveedor } from '@/lib/types'
import { Plus, Trash2, Package } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [loadingCompras, setLoadingCompras] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
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

  const comprasPag = compras.slice((page - 1) * 15, page * 15)

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
      await api.post('/compras', body)
      setCarrito([])
      setProveedorId('')
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panel nueva compra */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Nueva Compra
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor (opcional)
              </label>
              <SearchableSelect
                value={proveedorId}
                onChange={setProveedorId}
                emptyOption="Sin proveedor"
                options={proveedores.map((p) => ({
                  value: String(p.id),
                  label: p.nombre + (p.ruc ? ` — ${p.ruc}` : ''),
                }))}
              />
            </div>

            <div className="space-y-2 mb-4">
              <select
                value={productoSelId}
                onChange={(e) => setProductoSelId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (stock: {p.stock})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  placeholder="Precio unit."
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  inputMode="numeric"
                  placeholder="Cant."
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={agregarAlCarrito}
                  disabled={!productoSelId || !precioUnitario}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-24 mb-4">
              {carrito.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Carrito vacío</p>
              ) : (
                <div className="space-y-2">
                  {carrito.map((item) => (
                    <div
                      key={item.productoId}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          x{item.cantidad} × S/ {(Number(item.precioUnitario) || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">
                          S/ {((Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}
                        </span>
                        <button
                          onClick={() => quitarItem(item.productoId)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-purple-700">S/ {(Number(total) || 0).toFixed(2)}</span>
              </div>
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <button
                onClick={handleRegistrarCompra}
                disabled={saving || carrito.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {saving ? 'Registrando...' : 'Registrar Compra'}
              </button>
            </div>
          </div>
        </div>

        {/* Historial de compras */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 space-y-3">
              <h3 className="font-semibold text-gray-800">Historial de Compras</h3>
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
                {compras.length > 0 && (
                  <span className="text-xs text-gray-500 ml-auto self-end">
                    {compras.length} compra{compras.length !== 1 ? 's' : ''} —{' '}
                    <span className="font-semibold text-purple-700">
                      S/ {compras.reduce((s, c) => s + (Number(c.total) || 0), 0).toFixed(2)}
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
            ) : compras.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">No hay compras registradas</p>
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
                        <p className="text-purple-500 font-medium">Proveedor: {c.proveedor.nombre}</p>
                      )}
                      <p className="text-gray-400">Registrado por: {c.usuario?.nombre ?? '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={compras.length} page={page} pageSize={15} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
