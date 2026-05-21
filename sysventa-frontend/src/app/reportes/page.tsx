'use client'
import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { FileSpreadsheet, Download, Package, TrendingUp, ShoppingBag, Loader2 } from 'lucide-react'
import Cookies from 'js-cookie'

type DownloadState = 'idle' | 'loading' | 'done' | 'error'

function today() {
  return new Date().toISOString().split('T')[0]
}

function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

async function descargarExcel(url: string, filename: string) {
  const token = Cookies.get('token')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Error al generar el reporte')
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

interface ReporteCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onDescargar: () => Promise<void>
  estado: DownloadState
  children?: React.ReactNode
}

function ReporteCard({ icon, title, description, color, onDescargar, estado, children }: ReporteCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
      <button
        onClick={onDescargar}
        disabled={estado === 'loading'}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          estado === 'done'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : estado === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {estado === 'loading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
        ) : estado === 'done' ? (
          <><Download className="w-4 h-4" />Descargado</>
        ) : estado === 'error' ? (
          'Error — reintentar'
        ) : (
          <><Download className="w-4 h-4" />Descargar Excel</>
        )}
      </button>
    </div>
  )
}

export default function ReportesPage() {
  const [desdeVentas, setDesdeVentas] = useState(firstOfMonth())
  const [hastaVentas, setHastaVentas] = useState(today())
  const [desdeCompras, setDesdeCompras] = useState(firstOfMonth())
  const [hastaCompras, setHastaCompras] = useState(today())

  const [estadoVentas, setEstadoVentas] = useState<DownloadState>('idle')
  const [estadoCompras, setEstadoCompras] = useState<DownloadState>('idle')
  const [estadoStock, setEstadoStock] = useState<DownloadState>('idle')

  const base = process.env.NEXT_PUBLIC_API_URL!

  const handleVentas = async () => {
    setEstadoVentas('loading')
    try {
      await descargarExcel(
        `${base}/reportes/excel/ventas?desde=${desdeVentas}&hasta=${hastaVentas}`,
        `ventas-${desdeVentas}-${hastaVentas}.xlsx`,
      )
      setEstadoVentas('done')
      setTimeout(() => setEstadoVentas('idle'), 3000)
    } catch {
      setEstadoVentas('error')
      setTimeout(() => setEstadoVentas('idle'), 4000)
    }
  }

  const handleCompras = async () => {
    setEstadoCompras('loading')
    try {
      await descargarExcel(
        `${base}/reportes/excel/compras?desde=${desdeCompras}&hasta=${hastaCompras}`,
        `compras-${desdeCompras}-${hastaCompras}.xlsx`,
      )
      setEstadoCompras('done')
      setTimeout(() => setEstadoCompras('idle'), 3000)
    } catch {
      setEstadoCompras('error')
      setTimeout(() => setEstadoCompras('idle'), 4000)
    }
  }

  const handleStock = async () => {
    setEstadoStock('loading')
    try {
      await descargarExcel(`${base}/reportes/excel/stock`, `stock-${today()}.xlsx`)
      setEstadoStock('done')
      setTimeout(() => setEstadoStock('idle'), 3000)
    } catch {
      setEstadoStock('error')
      setTimeout(() => setEstadoStock('idle'), 4000)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reportes</h2>
          <p className="text-sm text-gray-400 mt-0.5">Exporta la información del sistema en formato Excel</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ReporteCard
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            title="Reporte de Ventas"
            description="Detalle de ventas con productos, clientes y formas de pago"
            color="bg-blue-50"
            onDescargar={handleVentas}
            estado={estadoVentas}
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={desdeVentas}
                  onChange={(e) => setDesdeVentas(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={hastaVentas}
                  onChange={(e) => setHastaVentas(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </ReporteCard>

          <ReporteCard
            icon={<ShoppingBag className="w-5 h-5 text-purple-600" />}
            title="Reporte de Compras"
            description="Registro de compras a proveedores con detalle de productos"
            color="bg-purple-50"
            onDescargar={handleCompras}
            estado={estadoCompras}
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={desdeCompras}
                  onChange={(e) => setDesdeCompras(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={hastaCompras}
                  onChange={(e) => setHastaCompras(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </ReporteCard>

          <ReporteCard
            icon={<Package className="w-5 h-5 text-green-600" />}
            title="Stock Actual"
            description="Inventario completo con estado de cada producto"
            color="bg-green-50"
            onDescargar={handleStock}
            estado={estadoStock}
          >
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500">
              Exporta el inventario completo a la fecha de hoy. Incluye estado: OK, Bajo stock y Agotado.
            </div>
          </ReporteCard>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Formato Excel (.xlsx)</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Los reportes incluyen encabezados coloreados, filas alternadas y fila de totales. Compatibles con Microsoft Excel, Google Sheets y LibreOffice Calc.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
