'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, X, AlertTriangle } from 'lucide-react'
import { getUsuario, clearAuth } from '@/lib/auth'
import { Usuario } from '@/lib/types'
import api from '@/lib/axios'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/productos': 'Productos',
  '/categorias': 'Categorias',
  '/clientes': 'Clientes',
  '/proveedores': 'Proveedores',
  '/ventas': 'Ventas',
  '/compras': 'Compras',
  '/usuarios': 'Usuarios',
  '/reportes': 'Reportes',
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [checking, setChecking] = useState(false)
  const [cajaAbierta, setCajaAbierta] = useState(false)

  useEffect(() => {
    setUsuario(getUsuario())
  }, [])

  const handleLogout = async () => {
    setChecking(true)
    try {
      const res = await api.get('/caja/actual')
      if (res.data) {
        setCajaAbierta(true)
        return
      }
    } catch {
      // si falla la consulta, permitimos el logout igual
    } finally {
      setChecking(false)
    }
    clearAuth()
    router.push('/login')
  }

  const title = titles[pathname] ?? 'PharmaCore'

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center gap-4">
          {usuario && (
            <span className="text-sm text-gray-500">
              Hola, <span className="font-medium text-gray-700">{usuario.nombre}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={checking}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {checking ? 'Verificando...' : 'Cerrar sesion'}
          </button>
        </div>
      </header>

      {cajaAbierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Caja abierta</h3>
              </div>
              <button onClick={() => setCajaAbierta(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Tienes un turno de caja abierto. Debes <strong>cerrar la caja</strong> antes de cerrar sesión.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCajaAbierta(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setCajaAbierta(false); router.push('/caja') }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
              >
                Ir a Caja
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
