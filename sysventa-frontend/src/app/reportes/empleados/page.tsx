'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import {
  ShoppingCart, ShoppingBag, Users, TrendingUp,
  Search, ChevronDown, ChevronUp, UserCog,
} from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

const FORMAS_CONFIG: Record<string, { label: string; emoji: string; color: string; text: string }> = {
  EFECTIVO:      { label: 'Efectivo',      emoji: '💵', color: 'bg-green-50',  text: 'text-green-700' },
  YAPE_PLIN:     { label: 'Yape / Plin',   emoji: '📱', color: 'bg-pink-50',   text: 'text-pink-700'  },
  TARJETA:       { label: 'Tarjeta',       emoji: '💳', color: 'bg-blue-50',   text: 'text-blue-700'  },
  TRANSFERENCIA: { label: 'Transferencia', emoji: '🏦', color: 'bg-indigo-50', text: 'text-indigo-700'},
}

interface VentasCajero {
  usuario: { id: number; nombre: string; rol: string }
  cantidadVentas: number
  totalVentas: number
  ticketPromedio: number
  ventasPorFormaPago: Record<string, number>
}

interface ComprasAlmacenero {
  usuario: { id: number; nombre: string; rol: string }
  cantidadCompras: number
  totalCompras: number
  comprasPorProveedor: { nombre: string; total: number }[]
}

function today() { return new Date().toISOString().split('T')[0] }
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function InicialBadge({ nombre, rol }: { nombre: string; rol: string }) {
  const color = rol === 'ADMIN' ? 'bg-purple-600' : rol === 'CAJERO' ? 'bg-blue-600' : 'bg-emerald-600'
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

function RolBadge({ rol }: { rol: string }) {
  const styles: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    CAJERO: 'bg-blue-100 text-blue-700',
    ALMACENERO: 'bg-emerald-100 text-emerald-700',
  }
  const labels: Record<string, string> = { ADMIN: 'Admin', CAJERO: 'Cajero', ALMACENERO: 'Almacenero' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[rol] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[rol] ?? rol}
    </span>
  )
}

export default function ReporteEmpleadosPage() {
  const [desde, setDesde] = useState(firstOfMonth())
  const [hasta, setHasta] = useState(today())
  const [cajeros, setCajeros] = useState<VentasCajero[]>([])
  const [almaceneros, setAlmaceneros] = useState<ComprasAlmacenero[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [expandedCajero, setExpandedCajero] = useState<number | null>(null)
  const [expandedAlmacenero, setExpandedAlmacenero] = useState<number | null>(null)

  const buscar = async () => {
    setLoading(true)
    setBuscado(false)
    try {
      const [resC, resA] = await Promise.all([
        api.get<VentasCajero[]>(`/reportes/ventas-por-cajero?desde=${desde}&hasta=${hasta}`),
        api.get<ComprasAlmacenero[]>(`/reportes/compras-por-almacenero?desde=${desde}&hasta=${hasta}`),
      ])
      setCajeros(resC.data)
      setAlmaceneros(resA.data)
      setBuscado(true)
    } finally {
      setLoading(false)
    }
  }

  const totalVentasGlobal = cajeros.reduce((s, c) => s + c.totalVentas, 0)
  const totalComprasGlobal = almaceneros.reduce((s, a) => s + a.totalCompras, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Reporte por Empleado
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Actividad de cajeros (ventas) y almaceneros (compras) en un rango de fechas
          </p>
        </div>

        {/* Filtro fecha */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={buscar} disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          {buscado && (
            <div className="ml-auto flex gap-4 text-sm">
              <span className="text-gray-500">
                Total ventas: <span className="font-semibold text-gray-800">{fmt(totalVentasGlobal)}</span>
              </span>
              <span className="text-gray-500">
                Total compras: <span className="font-semibold text-gray-800">{fmt(totalComprasGlobal)}</span>
              </span>
            </div>
          )}
        </div>

        {!buscado && !loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400 text-sm">
            <UserCog className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            Selecciona un rango de fechas y presiona Buscar
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {buscado && !loading && (
          <div className="space-y-6">

            {/* ── Cajeros ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Ventas por Cajero</h3>
                {cajeros.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {cajeros.length}
                  </span>
                )}
              </div>

              {cajeros.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">Sin ventas en el período seleccionado</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cajeros.map((c) => {
                    const isOpen = expandedCajero === c.usuario.id
                    const formas = Object.entries(c.ventasPorFormaPago).filter(([, v]) => v > 0)
                    return (
                      <div key={c.usuario.id}>
                        <button
                          onClick={() => setExpandedCajero(isOpen ? null : c.usuario.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <InicialBadge nombre={c.usuario.nombre} rol={c.usuario.rol} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800">{c.usuario.nombre}</p>
                              <RolBadge rol={c.usuario.rol} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {c.cantidadVentas} venta{c.cantidadVentas !== 1 ? 's' : ''} · ticket promedio {fmt(c.ticketPromedio)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-gray-800">{fmt(c.totalVentas)}</p>
                            <p className="text-xs text-gray-400">total vendido</p>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-3">Desglose por forma de pago</p>
                            {formas.length === 0 ? (
                              <p className="text-xs text-gray-400">Sin datos</p>
                            ) : (
                              <div className="flex flex-wrap gap-3">
                                {formas.map(([fp, total]) => {
                                  const cfg = FORMAS_CONFIG[fp] ?? { label: fp, emoji: '💰', color: 'bg-gray-50', text: 'text-gray-700' }
                                  const pct = c.totalVentas > 0 ? (total / c.totalVentas) * 100 : 0
                                  return (
                                    <div key={fp} className={`${cfg.color} rounded-xl px-4 py-3 min-w-[140px]`}>
                                      <p className={`text-xs font-medium ${cfg.text} mb-1`}>{cfg.emoji} {cfg.label}</p>
                                      <p className={`text-lg font-bold ${cfg.text}`}>{fmt(total)}</p>
                                      <div className="mt-1.5 bg-white/60 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full bg-current ${cfg.text}`} style={{ width: `${pct}%` }} />
                                      </div>
                                      <p className="text-xs mt-1 opacity-70">{pct.toFixed(0)}% del total</p>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Almaceneros ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Compras por Almacenero</h3>
                {almaceneros.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    {almaceneros.length}
                  </span>
                )}
              </div>

              {almaceneros.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">Sin compras en el período seleccionado</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {almaceneros.map((a) => {
                    const isOpen = expandedAlmacenero === a.usuario.id
                    return (
                      <div key={a.usuario.id}>
                        <button
                          onClick={() => setExpandedAlmacenero(isOpen ? null : a.usuario.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <InicialBadge nombre={a.usuario.nombre} rol={a.usuario.rol} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800">{a.usuario.nombre}</p>
                              <RolBadge rol={a.usuario.rol} />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {a.cantidadCompras} compra{a.cantidadCompras !== 1 ? 's' : ''} · {a.comprasPorProveedor.length} proveedor{a.comprasPorProveedor.length !== 1 ? 'es' : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-gray-800">{fmt(a.totalCompras)}</p>
                            <p className="text-xs text-gray-400">total comprado</p>
                          </div>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-3">Compras por proveedor</p>
                            {a.comprasPorProveedor.length === 0 ? (
                              <p className="text-xs text-gray-400">Sin datos</p>
                            ) : (
                              <div className="space-y-2">
                                {a.comprasPorProveedor.map((p) => {
                                  const pct = a.totalCompras > 0 ? (p.total / a.totalCompras) * 100 : 0
                                  return (
                                    <div key={p.nombre} className="bg-white rounded-lg px-4 py-2.5 border border-gray-100 flex items-center gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{p.nombre}</p>
                                        <div className="mt-1 bg-gray-100 rounded-full h-1.5">
                                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-emerald-700">{fmt(p.total)}</p>
                                        <p className="text-xs text-gray-400">{pct.toFixed(0)}%</p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
