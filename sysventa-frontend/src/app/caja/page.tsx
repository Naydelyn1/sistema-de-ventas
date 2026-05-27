'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import api from '@/lib/axios'
import { TurnoCaja } from '@/lib/types'
import { DollarSign, Lock, Unlock, Clock, CheckCircle, AlertTriangle, History, CreditCard, Smartphone, ArrowLeftRight } from 'lucide-react'
import { getUsuario } from '@/lib/auth'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(s))

const FORMAS_CONFIG: Record<string, { label: string; emoji: string; color: string; text: string; sub: string }> = {
  EFECTIVO:      { label: 'Efectivo',      emoji: '💵', color: 'bg-green-50',  text: 'text-green-700',  sub: 'text-green-500' },
  YAPE_PLIN:     { label: 'Yape / Plin',   emoji: '📱', color: 'bg-pink-50',   text: 'text-pink-700',   sub: 'text-pink-400' },
  TARJETA:       { label: 'Tarjeta',       emoji: '💳', color: 'bg-blue-50',   text: 'text-blue-700',   sub: 'text-blue-400' },
  TRANSFERENCIA: { label: 'Transferencia', emoji: '🏦', color: 'bg-indigo-50', text: 'text-indigo-700', sub: 'text-indigo-400' },
}

export default function CajaPage() {
  const router = useRouter()
  const usuario = getUsuario()

  useEffect(() => {
    if (usuario?.rol === 'ALMACENERO') router.replace('/productos')
  }, [])

  const [turnoActual, setTurnoActual] = useState<TurnoCaja | null | undefined>(undefined)
  const [historial, setHistorial] = useState<TurnoCaja[]>([])
  const [loadingActual, setLoadingActual] = useState(true)
  const [montoInicial, setMontoInicial] = useState('')
  const [montoFinal, setMontoFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showHistorial, setShowHistorial] = useState(false)

  const cargarActual = async () => {
    setLoadingActual(true)
    try {
      const res = await api.get<TurnoCaja | null>('/caja/actual')
      setTurnoActual(res.data)
    } finally {
      setLoadingActual(false)
    }
  }

  const cargarHistorial = async () => {
    const res = await api.get<TurnoCaja[]>('/caja/historial')
    setHistorial(res.data)
  }

  useEffect(() => {
    cargarActual()
    if (usuario?.rol === 'ADMIN') cargarHistorial()
  }, [])

  const handleAbrir = async () => {
    if (!montoInicial) return
    setSaving(true); setError('')
    try {
      await api.post('/caja/abrir', { montoInicial: parseFloat(montoInicial) })
      setMontoInicial('')
      await cargarActual()
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al abrir turno')
    } finally { setSaving(false) }
  }

  const handleCerrar = async () => {
    if (!turnoActual || !montoFinal) return
    setSaving(true); setError('')
    try {
      await api.post(`/caja/${turnoActual.id}/cerrar`, {
        montoFinal: parseFloat(montoFinal),
        observaciones: observaciones || undefined,
      })
      setMontoFinal(''); setObservaciones('')
      await cargarActual()
      if (usuario?.rol === 'ADMIN') await cargarHistorial()
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al cerrar turno')
    } finally { setSaving(false) }
  }

  const diferencia = turnoActual?.montoEsperado != null && montoFinal
    ? parseFloat(montoFinal) - turnoActual.montoEsperado
    : null

  // Solo mostrar formas de pago que tienen ventas
  const formasConVentas = turnoActual?.ventasPorFormaPago
    ? Object.entries(turnoActual.ventasPorFormaPago).filter(([, v]) => v > 0)
    : []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Cuadre de Caja</h2>
            <p className="text-sm text-gray-400 mt-0.5">Control de turnos y medios de pago</p>
          </div>
          {usuario?.rol === 'ADMIN' && (
            <button onClick={() => setShowHistorial(!showHistorial)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <History className="w-4 h-4" />
              {showHistorial ? 'Ocultar historial' : 'Ver historial'}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {loadingActual ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : turnoActual ? (
          <div className="space-y-4">
            {/* Header turno */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Turno en curso</p>
                  <p className="text-xs text-gray-400">
                    Apertura: {fmtDate(turnoActual.fechaApertura)} · {turnoActual.usuario.nombre}
                  </p>
                </div>
                <span className="ml-auto px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  ABIERTO
                </span>
              </div>

              {/* Fila 1: monto inicial + efectivo esperado */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Monto inicial en caja</p>
                  <p className="text-2xl font-bold text-gray-800">{fmt(Number(turnoActual.montoInicial))}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 mb-1 font-medium">Efectivo esperado en caja</p>
                  <p className="text-2xl font-bold text-green-700">{fmt(turnoActual.montoEsperado ?? 0)}</p>
                  <p className="text-xs text-green-400 mt-0.5">Inicial + ventas efectivo</p>
                </div>
              </div>

              {/* Fila 2: contadores por forma de pago */}
              {formasConVentas.length > 0 ? (
                <div className={`grid gap-3 ${formasConVentas.length === 1 ? 'grid-cols-1' : formasConVentas.length === 2 ? 'grid-cols-2' : formasConVentas.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                  {formasConVentas.map(([fp, total]) => {
                    const cfg = FORMAS_CONFIG[fp] ?? { label: fp, emoji: '💰', color: 'bg-gray-50', text: 'text-gray-700', sub: 'text-gray-400' }
                    const cant = turnoActual.cantidadPorFormaPago?.[fp] ?? 0
                    return (
                      <div key={fp} className={`${cfg.color} rounded-xl p-4`}>
                        <p className={`text-xs font-medium mb-1 ${cfg.sub}`}>{cfg.emoji} {cfg.label}</p>
                        <p className={`text-xl font-bold ${cfg.text}`}>{fmt(total)}</p>
                        <p className={`text-xs mt-0.5 ${cfg.sub}`}>{cant} venta{cant !== 1 ? 's' : ''}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
                  Sin ventas registradas en este turno
                </div>
              )}

              {/* Total general */}
              {(turnoActual.cantidadVentas ?? 0) > 0 && (
                <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-500">
                    Total cobrado ({turnoActual.cantidadVentas} ventas)
                  </span>
                  <span className="text-lg font-bold text-gray-800">{fmt(turnoActual.totalVentasTodas ?? 0)}</span>
                </div>
              )}
            </div>

            {/* Cierre de turno */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                Cerrar turno
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Izquierda: conteo */}
                <div className="space-y-3">
                  {/* Efectivo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      💵 Efectivo contado en caja
                      <span className="ml-2 text-green-600 font-normal">esperado: {fmt(turnoActual.montoEsperado ?? 0)}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                      <input type="number" min="0" step="0.01" value={montoFinal}
                        onChange={(e) => setMontoFinal(e.target.value)} placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {diferencia !== null && (
                      <div className={`mt-1.5 rounded-lg px-3 py-2 flex items-center justify-between text-xs font-medium ${
                        Math.abs(diferencia) < 0.01 ? 'bg-green-50 text-green-700'
                        : diferencia > 0 ? 'bg-blue-50 text-blue-700'
                        : 'bg-red-50 text-red-700'
                      }`}>
                        <span>{Math.abs(diferencia) < 0.01 ? '✓ Efectivo cuadrado' : diferencia > 0 ? '↑ Sobrante' : '↓ Faltante'}</span>
                        <span className="font-bold">{diferencia >= 0 ? '+' : ''}{fmt(diferencia)}</span>
                      </div>
                    )}
                  </div>

                  {/* Digitales: solo lectura desde el sistema */}
                  {formasConVentas.filter(([fp]) => fp !== 'EFECTIVO').map(([fp, total]) => {
                    const cfg = FORMAS_CONFIG[fp] ?? { label: fp, emoji: '💰', color: 'bg-gray-50', text: 'text-gray-700', sub: 'text-gray-400' }
                    return (
                      <div key={fp}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {cfg.emoji} {cfg.label}
                          <span className="ml-2 text-gray-400 font-normal">(confirmado por el sistema)</span>
                        </label>
                        <div className={`${cfg.color} border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center`}>
                          <span className="text-xs text-gray-500">{turnoActual.cantidadPorFormaPago?.[fp] ?? 0} venta(s)</span>
                          <span className={`font-bold text-sm ${cfg.text}`}>{fmt(total)}</span>
                        </div>
                      </div>
                    )
                  })}

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Observaciones (opcional)</label>
                    <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                      rows={2} placeholder="Notas del cierre..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Derecha: resumen total */}
                <div className="flex flex-col justify-between">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen del turno</p>

                    {/* Efectivo */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">💵 Efectivo contado</span>
                      <span className="font-semibold text-gray-800">
                        {montoFinal ? fmt(parseFloat(montoFinal)) : '—'}
                      </span>
                    </div>

                    {/* Otros métodos */}
                    {formasConVentas.filter(([fp]) => fp !== 'EFECTIVO').map(([fp, total]) => {
                      const cfg = FORMAS_CONFIG[fp] ?? { label: fp, emoji: '💰', text: 'text-gray-700' }
                      return (
                        <div key={fp} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cfg.emoji} {cfg.label}</span>
                          <span className={`font-semibold ${cfg.text}`}>{fmt(total)}</span>
                        </div>
                      )
                    })}

                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="text-sm font-bold text-gray-800">Total ingresado</span>
                      <span className="text-lg font-bold text-gray-900">
                        {fmt(
                          (montoFinal ? parseFloat(montoFinal) : 0) +
                          formasConVentas.filter(([fp]) => fp !== 'EFECTIVO').reduce((s, [, v]) => s + v, 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <button onClick={handleCerrar} disabled={!montoFinal || saving}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                    <Lock className="w-4 h-4" />
                    {saving ? 'Cerrando...' : 'Cerrar turno'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sin turno abierto */
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Sin turno activo</p>
                <p className="text-xs text-gray-400">Abre un turno para comenzar a registrar ventas</p>
              </div>
            </div>
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto inicial en caja (efectivo)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                  <input type="number" min="0" step="0.01" value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)} placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button onClick={handleAbrir} disabled={!montoInicial || saving}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                <Unlock className="w-4 h-4" />
                {saving ? 'Abriendo...' : 'Abrir turno'}
              </button>
            </div>
          </div>
        )}

        {/* Historial */}
        {showHistorial && historial.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Historial de turnos
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Apertura</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cierre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cajero</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Inicial</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Efectivo final</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Diferencia</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historial.map((t) => {
                  const dif = Number(t.diferencia ?? 0)
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{fmtDate(t.fechaApertura)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {t.fechaCierre ? fmtDate(t.fechaCierre) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{t.usuario.nombre}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(Number(t.montoInicial))}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(Number(t.totalVentas))}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {t.montoFinal != null ? fmt(Number(t.montoFinal)) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        dif > 0.01 ? 'text-blue-600' : dif < -0.01 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {t.diferencia != null ? (dif >= 0 ? '+' : '') + fmt(dif) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.estado === 'ABIERTO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            <Unlock className="w-3 h-3" />ABIERTO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            <CheckCircle className="w-3 h-3" />CERRADO
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
