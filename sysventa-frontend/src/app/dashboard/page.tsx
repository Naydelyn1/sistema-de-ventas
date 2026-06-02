'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { getUsuario } from '@/lib/auth'
import { Producto, ResumenDia } from '@/lib/types'
import {
  ShoppingCart, TrendingUp, Package, AlertTriangle,
  ArrowRight, DollarSign, TrendingDown, Activity,
} from 'lucide-react'

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenDia | null>(null)
  const [stockBajo, setStockBajo] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  const usuario = getUsuario()
  const rol = usuario?.rol ?? 'CAJERO'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, stockRes] = await Promise.allSettled([
          api.get<ResumenDia>('/reportes/resumen-dia'),
          api.get<Producto[]>('/productos/stock-bajo'),
        ])
        if (resRes.status === 'fulfilled') setResumen(resRes.value.data)
        if (stockRes.status === 'fulfilled') setStockBajo(stockRes.value.data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const now = new Date()
  const fechaLegible = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} ${now.getFullYear()}`

  const totalVentas = Number(resumen?.totalVentas) || 0
  const totalCompras = Number(resumen?.totalCompras) || 0
  const ganancia = Number(resumen?.ganancia) || 0

  // KPIs según rol
  type Kpi = { title: string; value: string | number; sub: string; icon: typeof ShoppingCart; gradient: string }

  const kpisAdmin: Kpi[] = [
    { title: 'Ventas del día', value: resumen?.cantidadVentas ?? 0, sub: 'transacciones', icon: ShoppingCart, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Ingresos del día', value: `S/ ${totalVentas.toFixed(2)}`, sub: 'en ventas', icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
    { title: 'Compras del día', value: resumen?.cantidadCompras ?? 0, sub: `S/ ${totalCompras.toFixed(2)} invertido`, icon: Package, gradient: 'from-violet-500 to-violet-600' },
    { title: 'Productos críticos', value: stockBajo.length, sub: stockBajo.length === 0 ? 'todo en orden' : 'requieren atención', icon: AlertTriangle, gradient: stockBajo.length > 0 ? 'from-amber-500 to-orange-500' : 'from-gray-400 to-gray-500' },
  ]

  const kpisCajero: Kpi[] = [
    { title: 'Mis ventas del día', value: resumen?.cantidadVentas ?? 0, sub: 'transacciones', icon: ShoppingCart, gradient: 'from-blue-500 to-blue-600' },
    { title: 'Mis ingresos del día', value: `S/ ${totalVentas.toFixed(2)}`, sub: 'en ventas', icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
    { title: 'Productos críticos', value: stockBajo.length, sub: stockBajo.length === 0 ? 'todo en orden' : 'requieren atención', icon: AlertTriangle, gradient: stockBajo.length > 0 ? 'from-amber-500 to-orange-500' : 'from-gray-400 to-gray-500' },
  ]

  const kpisAlmacenero: Kpi[] = [
    { title: 'Productos críticos', value: stockBajo.length, sub: stockBajo.length === 0 ? 'todo en orden' : 'requieren atención', icon: AlertTriangle, gradient: stockBajo.length > 0 ? 'from-amber-500 to-orange-500' : 'from-gray-400 to-gray-500' },
  ]

  const kpis = rol === 'ADMIN' ? kpisAdmin : rol === 'CAJERO' ? kpisCajero : kpisAlmacenero

  const gridColsClass = rol === 'ADMIN'
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
    : rol === 'CAJERO'
    ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 max-w-sm'

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Banner */}
          <div className="bg-linear-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
            <div>
              <p className="text-blue-200 text-sm mb-1">{fechaLegible}</p>
              <h2 className="text-2xl font-bold">
                {rol === 'ALMACENERO' ? 'Resumen de inventario' : 'Resumen del día'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {rol === 'ALMACENERO'
                  ? 'Aquí tienes el estado actual del inventario.'
                  : 'Aquí tienes un vistazo rápido de cómo va el negocio hoy.'}
              </p>
            </div>
            {rol !== 'ALMACENERO' && (
              <div className="hidden md:flex items-center gap-3 bg-white/10 rounded-xl px-5 py-4">
                <Activity className="w-6 h-6 text-blue-200" />
                <div className="text-right">
                  <p className="text-xs text-blue-200">
                    {rol === 'CAJERO' ? 'Mis ventas hoy' : 'Ganancia neta hoy'}
                  </p>
                  <p className={`text-xl font-bold ${(rol === 'CAJERO' ? totalVentas : ganancia) >= 0 ? 'text-white' : 'text-red-300'}`}>
                    S/ {(rol === 'CAJERO' ? totalVentas : ganancia).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* KPI cards */}
          <div className={`grid ${gridColsClass} gap-4`}>
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.title} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`bg-linear-to-r ${kpi.gradient} px-5 py-3 flex items-center justify-between`}>
                    <p className="text-white text-xs font-semibold uppercase tracking-wider opacity-90">
                      {kpi.title}
                    </p>
                    <div className="bg-white/20 rounded-lg p-1.5">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-3xl font-bold text-gray-800">{kpi.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Fila inferior */}
          <div className={`grid grid-cols-1 ${rol !== 'ALMACENERO' ? 'lg:grid-cols-3' : ''} gap-4`}>

            {/* Stock bajo */}
            <div className={`${rol !== 'ALMACENERO' ? 'lg:col-span-2' : ''} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Productos con stock bajo</h3>
                  {stockBajo.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {stockBajo.length}
                    </span>
                  )}
                </div>
                <Link href="/kardex" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                  Ver Kardex <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {stockBajo.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Package className="w-10 h-10 mb-2 text-gray-300" />
                  <p className="text-sm">Todos los productos tienen stock suficiente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stockBajo.map((p) => {
                    const pct = p.stockMinimo > 0 ? Math.min(100, (p.stock / p.stockMinimo) * 100) : 0
                    const critico = p.stock === 0
                    return (
                      <div key={p.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${critico ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-400">{p.categoria?.nombre}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${critico ? 'bg-red-500' : 'bg-amber-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-right w-16">
                            <span className={`text-sm font-bold ${critico ? 'text-red-600' : 'text-amber-600'}`}>
                              {p.stock}
                            </span>
                            <span className="text-xs text-gray-400"> / {p.stockMinimo}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Resumen financiero — solo ADMIN y CAJERO */}
            {rol !== 'ALMACENERO' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {rol === 'CAJERO' ? 'Mis ventas de hoy' : 'Resumen financiero'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Cifras del día de hoy</p>
                </div>
                <div className="px-6 py-4 space-y-4">

                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">
                        {rol === 'CAJERO' ? 'Total ventas' : 'Ingresos ventas'}
                      </p>
                      <p className="text-sm font-semibold text-gray-800">S/ {totalVentas.toFixed(2)}</p>
                    </div>
                  </div>

                  {rol === 'ADMIN' && (
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-50 rounded-lg p-2">
                        <TrendingDown className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Gasto en compras</p>
                        <p className="text-sm font-semibold text-gray-800">S/ {totalCompras.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${ganancia >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <DollarSign className={`w-4 h-4 ${ganancia >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          {rol === 'CAJERO' ? 'Número de ventas' : 'Ganancia neta'}
                        </p>
                        {rol === 'CAJERO' ? (
                          <p className="text-lg font-bold text-blue-600">{resumen?.cantidadVentas ?? 0} transacciones</p>
                        ) : (
                          <p className={`text-lg font-bold ${ganancia >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            S/ {ganancia.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
