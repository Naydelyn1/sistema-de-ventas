'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Producto, MovimientoStock } from '@/lib/types'
import { TrendingUp, TrendingDown, Search, Package, RefreshCw } from 'lucide-react'
import Pagination from '@/components/Pagination'
import { getUsuario } from '@/lib/auth'

export default function KardexPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState('')
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const usuario = getUsuario()

  useEffect(() => {
    api.get<Producto[]>('/productos?todos=true').then((res) => {
      setProductos(res.data)
    }).finally(() => setLoadingProductos(false))
  }, [])

  const handleBackfill = async () => {
    setBackfilling(true)
    setBackfillMsg('')
    try {
      const res = await api.post<{ ok: boolean; movimientosCreados: number }>('/productos/backfill-kardex')
      setBackfillMsg(`✓ Historial reconstruido: ${res.data.movimientosCreados} movimientos creados`)
      if (productoId) buscar()
    } catch {
      setBackfillMsg('Error al reconstruir el historial')
    } finally {
      setBackfilling(false)
    }
  }

  const buscar = async () => {
    if (!productoId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await api.get<MovimientoStock[]>(`/productos/${productoId}/kardex?${params}`)
      setMovimientos(res.data)
      setPage(1)
    } finally {
      setLoading(false)
    }
  }

  const productoSel = productos.find((p) => p.id === parseInt(productoId))
  const totalEntradas = movimientos.filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + m.cantidad, 0)
  const totalSalidas = movimientos.filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + m.cantidad, 0)
  const paginados = movimientos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Kardex de Stock</h2>
            <p className="text-sm text-gray-400 mt-0.5">Historial de movimientos por producto</p>
          </div>
          {usuario?.rol === 'ADMIN' && (
            <div className="text-right">
              <button onClick={handleBackfill} disabled={backfilling}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                <RefreshCw className={`w-4 h-4 ${backfilling ? 'animate-spin' : ''}`} />
                {backfilling ? 'Reconstruyendo...' : 'Reconstruir historial'}
              </button>
              {backfillMsg && (
                <p className={`text-xs mt-1 ${backfillMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                  {backfillMsg}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Producto</label>
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={buscar} disabled={!productoId || loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              <Search className="w-4 h-4" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* Resumen del producto */}
        {productoSel && movimientos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Producto</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{productoSel.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">{productoSel.categoria?.nombre}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Stock actual</p>
              <p className={`text-2xl font-bold ${productoSel.stock <= productoSel.stockMinimo ? 'text-red-600' : 'text-gray-800'}`}>
                {productoSel.stock}
              </p>
              <p className="text-xs text-gray-400">Mínimo: {productoSel.stockMinimo}</p>
            </div>
            <div className="bg-green-50 rounded-xl shadow-sm p-4">
              <p className="text-xs text-green-600 mb-1 font-medium">Entradas</p>
              <p className="text-2xl font-bold text-green-700">+{totalEntradas}</p>
              <p className="text-xs text-green-500">unidades ingresadas</p>
            </div>
            <div className="bg-red-50 rounded-xl shadow-sm p-4">
              <p className="text-xs text-red-600 mb-1 font-medium">Salidas</p>
              <p className="text-2xl font-bold text-red-700">−{totalSalidas}</p>
              <p className="text-xs text-red-500">unidades vendidas</p>
            </div>
          </div>
        )}

        {/* Tabla de movimientos */}
        {movimientos.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Motivo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock antes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock después</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ref.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginados.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(m.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      <span className="text-gray-400 ml-1 text-xs">
                        {new Date(m.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.tipo === 'ENTRADA'
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />}
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.motivo}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      m.tipo === 'ENTRADA' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {m.tipo === 'ENTRADA' ? '+' : '−'}{m.cantidad}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{m.stockAntes}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{m.stockDespues}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {m.ventaId ? `Venta #${m.ventaId}` : m.compraId ? `Compra #${m.compraId}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={movimientos.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        ) : productoId && !loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay movimientos para este producto en el período seleccionado</p>
          </div>
        ) : !productoId ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Selecciona un producto para ver su kardex</p>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
