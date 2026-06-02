'use client'
import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { getUsuario, setAuth } from '@/lib/auth'
import api from '@/lib/axios'
import { AuthResponse } from '@/lib/types'

interface Props {
  onUnlock: () => void
}

export default function LockScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const usuario = getUsuario()

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email: usuario.email, password })
      setAuth(data.access_token, data.usuario)
      onUnlock()
    } catch {
      setError('Contraseña incorrecta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">

        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Pantalla bloqueada</h2>
          <p className="text-sm text-gray-400 mt-1">Ingresa tu contraseña para continuar</p>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-center">
          <p className="text-sm font-semibold text-gray-800">{usuario?.nombre}</p>
          <p className="text-xs text-gray-400">{usuario?.email}</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none px-1 py-2.5 text-gray-700 transition-colors bg-transparent pr-8"
              placeholder="Contraseña"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-1 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Verificando...' : 'Desbloquear'}
          </button>
        </form>

      </div>
    </div>
  )
}
