'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { Producto, ResumenDia } from '@/lib/types'
import { ShoppingCart, TrendingUp, Package, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const [resumen, setResumen] = useState<ResumenDia | null>(null)
  const [stockBajo, setStockBajo] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, stockRes] = await Promise.allSettled([
          api.get<ResumenDia>('/reportes/resumen-dia'),
          api.get<Producto[]>('/reportes/stock-bajo'),
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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Productos con stock bajo
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-3 font-medium">Producto</th>
                      <th className="pb-3 font-medium">Stock actual</th>
                      <th className="pb-3 font-medium">Stock minimo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockBajo.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 font-medium text-gray-800">{p.nombre}</td>
                        <td className="py-3 text-red-600 font-semibold">{p.stock}</td>
                        <td className="py-3 text-gray-500">{p.stockMinimo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
