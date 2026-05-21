'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Package, Tag, Users, Truck,
  ShoppingCart, ShoppingBag, UserCog, TrendingUp, Store, ClipboardList, Wallet,
} from 'lucide-react'
import { getUsuario } from '@/lib/auth'
import { Usuario } from '@/lib/types'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/productos', icon: Package, label: 'Productos' },
  { href: '/categorias', icon: Tag, label: 'Categorias' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/proveedores', icon: Truck, label: 'Proveedores' },
  { href: '/ventas', icon: ShoppingCart, label: 'Ventas' },
]

const almacenItems = [
  { href: '/compras', icon: ShoppingBag, label: 'Compras' },
  { href: '/kardex', icon: ClipboardList, label: 'Kardex' },
]

const adminItems = [
  { href: '/usuarios', icon: UserCog, label: 'Usuarios' },
  { href: '/reportes', icon: TrendingUp, label: 'Reportes' },
]

const cajaItems = [
  { href: '/caja', icon: Wallet, label: 'Caja' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    setUsuario(getUsuario())
  }, [])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <Store className="w-7 h-7 text-blue-300" />
          <h1 className="text-xl font-bold">SysVenta</h1>
        </div>
        <p className="text-blue-400 text-xs mt-1">Sistema de Ventas</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}

          {(usuario?.rol === 'ADMIN' || usuario?.rol === 'ALMACENERO') && (
            <>
              <p className="px-3 pt-4 pb-1 text-blue-400 text-xs uppercase tracking-wider font-semibold">
                Almacen
              </p>
              {almacenItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          )}

          {(usuario?.rol === 'ADMIN' || usuario?.rol === 'CAJERO') && (
            <>
              <p className="px-3 pt-4 pb-1 text-blue-400 text-xs uppercase tracking-wider font-semibold">
                Caja
              </p>
              {cajaItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          )}

          {usuario?.rol === 'ADMIN' && (
            <>
              <p className="px-3 pt-4 pb-1 text-blue-400 text-xs uppercase tracking-wider font-semibold">
                Administracion
              </p>
              {adminItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>
      </nav>

      {usuario && (
        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario.nombre}</p>
              <p className="text-xs text-blue-400">{usuario.rol}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
