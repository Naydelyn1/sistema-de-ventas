'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Venta, Producto, Cliente, Categoria } from '@/lib/types'
import { Plus, Trash2, ShoppingCart, Printer, X } from 'lucide-react'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import Pagination from '@/components/Pagination'
import SearchableSelect from '@/components/SearchableSelect'

interface ItemCarrito {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [productoSelId, setProductoSelId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [clienteId, setClienteId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ventaImpresion, setVentaImpresion] = useState<Venta | null>(null)
  const [page, setPage] = useState(1)
  const today = new Date().toISOString().split('T')[0]
  const [desde, setDesde] = useState(today)
  const [hasta, setHasta] = useState(today)
  const { toast, showToast, closeToast } = useToast()

  const loadData = async () => {
    try {
      const [prodRes, clientesRes, catRes] = await Promise.allSettled([
        api.get<Producto[]>('/productos'),
        api.get<Cliente[]>('/clientes'),
        api.get<Categoria[]>('/categorias'),
      ])
      if (prodRes.status === 'fulfilled') setProductos(prodRes.value.data.filter((p) => p.activo))
      if (clientesRes.status === 'fulfilled') setClientes(clientesRes.value.data)
      if (catRes.status === 'fulfilled') setCategorias(catRes.value.data)
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
      if (existente) {
        return prev.map((i) =>
          i.productoId === prod.id ? { ...i, cantidad: i.cantidad + cant } : i
        )
      }
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: Number(prod.precio) || 0, cantidad: cant }]
    })
    setProductoSelId('')
    setCantidad('1')
  }

  const quitarItem = (productoId: number) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0)

  const handleCrearVenta = async () => {
    if (carrito.length === 0) { setError('Agrega productos al carrito'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/ventas', {
        clienteId: clienteId ? parseInt(clienteId) : undefined,
        detalles: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      })
      setCarrito([])
      setClienteId('')
      buscarVentas()
      showToast('Venta registrada correctamente')
    } catch {
      setError('Error al registrar la venta')
      showToast('Error al registrar la venta', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = (v: Venta) => {
    setVentaImpresion(v)
  }

  const imprimirComprobante = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Panel nueva venta */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Nueva Venta
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente (opcional)
              </label>
              <SearchableSelect
                value={clienteId}
                onChange={setClienteId}
                emptyOption="Consumidor final"
                options={clientes.map((c) => ({
                  value: String(c.id),
                  label: c.nombre + (c.dni ? ` — ${c.dni}` : ''),
                }))}
              />
            </div>

            <div className="space-y-2 mb-4">
              <select
                value={categoriaFiltro}
                onChange={(e) => { setCategoriaFiltro(e.target.value); setProductoSelId('') }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorias</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <select
                value={productoSelId}
                onChange={(e) => setProductoSelId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {productosFiltrados.length === 0 ? 'Sin productos en esta categoría' : 'Seleccionar producto...'}
                </option>
                {productosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — S/ {(Number(p.precio) || 0).toFixed(2)} (stock: {p.stock})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  inputMode="numeric"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Cant."
                  className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={agregarAlCarrito}
                  disabled={!productoSelId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg disabled:opacity-40 flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
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
                          x{item.cantidad} × S/ {(Number(item.precio) || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-800">
                          S/ {((Number(item.precio) || 0) * (Number(item.cantidad) || 0)).toFixed(2)}
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
                <span className="text-2xl font-bold text-blue-700">S/ {(Number(total) || 0).toFixed(2)}</span>
              </div>
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <button
                onClick={handleCrearVenta}
                disabled={saving || carrito.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {saving ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>

        {/* Historial ventas */}
        <div className="lg:col-span-3">
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
                <button
                  onClick={() => buscarVentas()}
                  disabled={loadingVentas}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loadingVentas ? 'Buscando...' : 'Buscar'}
                </button>
                {(desde !== today || hasta !== today) && (
                  <button
                    onClick={() => { setDesde(today); setHasta(today); buscarVentas(today, today) }}
                    className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1.5"
                  >
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
                        <button
                          onClick={() => handleImprimir(v)}
                          title="Imprimir comprobante"
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {v.detalles?.map((d) => (
                        <p key={d.id}>
                          {d.producto?.nombre} x{d.cantidad} — S/ {(Number(d.subtotal) || 0).toFixed(2)}
                        </p>
                      ))}
                      {v.cliente && (
                        <p className="text-blue-500 font-medium">Cliente: {v.cliente.nombre}</p>
                      )}
                      <p className="text-gray-400">Vendedor: {v.usuario?.nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination total={ventas.length} page={page} pageSize={10} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal comprobante */}
      {ventaImpresion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            {/* Cabecera modal (no se imprime) */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b print:hidden">
              <h3 className="font-semibold text-gray-800">Comprobante de Venta</h3>
              <button onClick={() => setVentaImpresion(null)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Contenido del comprobante */}
            <div id="comprobante" className="p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="text-lg font-bold">SysVenta</p>
                <p className="text-xs text-gray-500">Comprobante de Venta</p>
                <p className="text-xs text-gray-400">
                  {new Date(ventaImpresion.fecha).toLocaleString('es-PE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="border-t border-dashed border-gray-300 my-3" />

              <p className="text-xs text-gray-500 mb-1">Venta #{ventaImpresion.id}</p>
              {ventaImpresion.cliente && (
                <p className="text-xs mb-1">Cliente: <span className="font-medium">{ventaImpresion.cliente.nombre}</span></p>
              )}
              {ventaImpresion.usuario && (
                <p className="text-xs mb-3">Vendedor: <span className="font-medium">{ventaImpresion.usuario.nombre}</span></p>
              )}

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
              <button
                onClick={() => setVentaImpresion(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={imprimirComprobante}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </DashboardLayout>
  )
}
