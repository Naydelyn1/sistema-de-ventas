'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/axios'
import { setAuth } from '@/lib/auth'
import { AuthResponse } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      setAuth(data.access_token, data.usuario)
      router.push('/dashboard')
    } catch {
      setError('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Panel izquierdo - azul, ocupa 50% */}
      <div className="relative bg-linear-to-b from-blue-500 to-blue-700 md:w-1/2 flex flex-col items-center justify-center p-12 text-white overflow-hidden min-h-64">
        {/* Ondas decorativas */}
        <svg
          className="absolute right-0 top-0 h-full w-20 text-white"
          viewBox="0 0 80 800"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M80,0 C40,120 0,180 0,280 C0,380 40,420 40,520 C40,620 0,680 0,760 C0,785 30,795 80,800 L80,0 Z" opacity="0.15" />
          <path d="M80,0 C55,150 15,210 15,310 C15,410 55,450 55,550 C55,650 15,710 15,780 C15,795 45,798 80,800 L80,0 Z" opacity="0.1" />
        </svg>

        <p className="text-sm font-black tracking-widest uppercase mb-6 opacity-90">
          Bienvenido a
        </p>

        <div className="relative mb-6 rounded-full overflow-hidden w-40 h-40 border-4 border-white border-opacity-30 shadow-2xl">
          <Image src="/farmacia.png" alt="Farmacia" fill className="object-cover" />
        </div>

        <h1 className="text-4xl font-black tracking-wide mb-3">PharmaCore</h1>
        <p className="text-base text-center text-blue-100 max-w-sm leading-relaxed">
          Sistema de gestión para farmacias. Controla ventas, inventario y clientes desde un solo lugar.
        </p>

        {/* Pastillas decorativas */}
        <svg className="absolute bottom-10 left-8 opacity-20" width="60" height="28" viewBox="0 0 60 28">
          <rect x="0" y="4" width="60" height="20" rx="10" fill="white" />
          <line x1="30" y1="4" x2="30" y2="24" stroke="#3B82F6" strokeWidth="2" />
        </svg>
        <svg className="absolute top-12 right-14 opacity-15" width="44" height="22" viewBox="0 0 44 22">
          <rect x="0" y="2" width="44" height="18" rx="9" fill="white" />
          <line x1="22" y1="2" x2="22" y2="20" stroke="#3B82F6" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-1/3 left-6 opacity-15" width="24" height="24" viewBox="0 0 24 24">
          <rect x="9" y="0" width="6" height="24" rx="3" fill="white" />
          <rect x="0" y="9" width="24" height="6" rx="3" fill="white" />
        </svg>
      </div>

      {/* Panel derecho - formulario, ocupa 50% */}
      <div className="md:w-1/2 flex flex-col justify-center px-12 py-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-gray-400 mb-10">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none px-1 py-2.5 text-gray-700 transition-colors bg-transparent"
                placeholder="usuario@farmacia.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-600">
                  Contraseña
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none px-1 py-2.5 text-gray-700 transition-colors bg-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}
