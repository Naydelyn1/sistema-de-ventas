'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Producto, ResumenDia } from '@/lib/types'
import { ShoppingCart, TrendingUp, Package, AlertTriangle, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenDia | null>(null)
  const [stockBajo, setStockBajo] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

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

  const cards = [
    {
      title: 'Ventas hoy',
      value: resumen?.cantidadVentas ?? 0,
      sub: 'ventas',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Ingresos hoy',
      value: `S/ ${(Number(resumen?.totalVentas) || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Stock bajo',
      value: stockBajo.length,
      sub: 'productos',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Compras hoy',
      value: resumen?.cantidadCompras ?? 0,
      sub: 'compras',
      icon: Package,
      color: 'bg-purple-500',
    },
  ]

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <div className={`${card.color} p-2 rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                  {card.sub && <p className="text-sm text-gray-400 mt-1">{card.sub}</p>}
                </div>
              )
            })}
          </div>

          {stockBajo.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Productos con stock bajo
                  <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {stockBajo.length}
                  </span>
                </h3>
                <Link href="/kardex" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                  Ver Kardex <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stockBajo.map((p) => {
                  const pct = p.stockMinimo > 0 ? Math.min(100, (p.stock / p.stockMinimo) * 100) : 0
                  return (
                    <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.categoria?.nombre}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${p.stock === 0 ? 'bg-red-500' : 'bg-yellow-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold w-8 text-right ${p.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                          {p.stock}
                        </span>
                        <span className="text-xs text-gray-400">/ {p.stockMinimo}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
