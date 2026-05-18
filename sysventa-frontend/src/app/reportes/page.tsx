'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Producto, ResumenDia, ProductoMasVendido } from '@/lib/types'
import { TrendingUp, AlertTriangle, Calendar } from 'lucide-react'

interface VentaFecha {
  fecha: string
  total: number
  cantidad: number
}

export default function ReportesPage() {
  const [resumen, setResumen] = useState<ResumenDia | null>(null)
  const [masVendidos, setMasVendidos] = useState<ProductoMasVendido[]>([])
  const [stockBajo, setStockBajo] = useState<Producto[]>([])
  const [ventasFecha, setVentasFecha] = useState<VentaFecha[]>([])
  const today = new Date().toISOString().split('T')[0]
  const [desde, setDesde] = useState(today)
  const [hasta, setHasta] = useState(today)
  const [loading, setLoading] = useState(true)
  const [loadingFecha, setLoadingFecha] = useState(false)
  const [buscado, setBuscado] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resRes, masRes, stockRes] = await Promise.allSettled([
          api.get<ResumenDia>('/reportes/resumen-dia'),
          api.get<ProductoMasVendido[]>('/reportes/productos-mas-vendidos'),
          api.get<Producto[]>('/reportes/stock-bajo'),
        ])
        if (resRes.status === 'fulfilled') setResumen(resRes.value.data)
        if (masRes.status === 'fulfilled') setMasVendidos(masRes.value.data)
        if (stockRes.status === 'fulfilled') setStockBajo(stockRes.value.data)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const buscarPorFecha = async () => {
    setLoadingFecha(true)
    setBuscado(false)
    try {
      const res = await api.get<VentaFecha[]>(
        `/reportes/ventas-por-fecha?desde=${desde}&hasta=${hasta}`
      )
      setVentasFecha(res.data)
    } finally {
      setLoadingFecha(false)
      setBuscado(true)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Resumen del día */}
        {resumen && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Ventas hoy', value: resumen.cantidadVentas, sub: 'ventas', color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Ingresos hoy', value: `S/ ${(Number(resumen.totalVentas) || 0).toFixed(2)}`, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Compras hoy', value: resumen.cantidadCompras, sub: 'compras', color: 'text-purple-700', bg: 'bg-purple-50' },
              { label: 'Gasto en compras', value: `S/ ${(Number(resumen.totalCompras) || 0).toFixed(2)}`, color: 'text-orange-700', bg: 'bg-orange-50' },
              { label: 'Ganancia del dia', value: `S/ ${(Number(resumen.ganancia) || 0).toFixed(2)}`, color: resumen.ganancia >= 0 ? 'text-green-700' : 'text-red-600', bg: resumen.ganancia >= 0 ? 'bg-green-50' : 'bg-red-50' },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
                <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Más vendidos */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Productos mas vendidos</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Producto', 'Unidades', 'Ingresos'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {masVendidos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-sm">
                      Sin datos disponibles
                    </td>
                  </tr>
                ) : (
                  masVendidos.map((p) => (
                    <tr key={p.producto?.id}>
                      <td className="px-6 py-3 font-medium text-gray-800">{p.producto?.nombre}</td>
                      <td className="px-6 py-3 text-gray-600">{Number(p.cantidadVendida).toLocaleString('es-PE')}</td>
                      <td className="px-6 py-3 font-semibold text-green-700">S/ {(Number(p.totalGenerado) || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Stock bajo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-800">Productos con stock bajo</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Producto', 'Stock', 'Minimo'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockBajo.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-sm">
                      Todo el stock esta en orden
                    </td>
                  </tr>
                ) : (
                  stockBajo.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-3 font-medium text-gray-800">{p.nombre}</td>
                      <td className="px-6 py-3 text-red-600 font-semibold">{p.stock}</td>
                      <td className="px-6 py-3 text-gray-500">{p.stockMinimo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Ventas por rango de fechas */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Ventas por rango de fechas</h3>
          </div>
          <div className="flex flex-wrap gap-3 items-end mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={buscarPorFecha}
              disabled={loadingFecha}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loadingFecha ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {ventasFecha.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Fecha', 'N. Ventas', 'Total'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventasFecha.map((v, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-gray-800">{v.fecha}</td>
                      <td className="px-4 py-3 text-gray-600">{Number(v.cantidad).toLocaleString('es-PE')}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">S/ {(Number(v.total) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ventasFecha.length === 0 && !loadingFecha && (
            <p className="text-sm text-gray-400 text-center py-4">
              {buscado ? 'No hay ventas en ese rango de fechas' : 'Selecciona un rango y presiona Buscar'}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
