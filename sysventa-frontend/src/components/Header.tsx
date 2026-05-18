'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { getUsuario, clearAuth } from '@/lib/auth'
import { Usuario } from '@/lib/types'

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

  useEffect(() => {
    setUsuario(getUsuario())
  }, [])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const title = titles[pathname] ?? 'SysVenta'

  return (
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
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion
        </button>
      </div>
    </header>
  )
}
