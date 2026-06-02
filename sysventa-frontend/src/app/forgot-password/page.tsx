'use client'
import { useState } from 'react'
import api from '@/lib/axios'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Ocurrió un error. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-130">

        {/* Panel izquierdo */}
        <div className="relative bg-linear-to-b from-blue-500 to-blue-700 md:w-5/12 flex flex-col items-center justify-center p-10 text-white overflow-hidden">
          <svg
            className="absolute right-0 top-0 h-full w-16 text-white"
            viewBox="0 0 60 520"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M60,0 C30,80 0,120 0,180 C0,240 30,260 30,320 C30,380 0,420 0,480 C0,500 20,510 60,520 L60,0 Z" opacity="0.15" />
            <path d="M60,0 C40,100 10,140 10,200 C10,260 40,280 40,340 C40,400 10,440 10,500 C10,515 30,518 60,520 L60,0 Z" opacity="0.1" />
          </svg>

          <p className="text-sm font-light tracking-widest uppercase mb-4 opacity-80">
            Bienvenido a
          </p>

          <div className="mb-4 rounded-full overflow-hidden w-32 h-32 border-4 border-white border-opacity-30 shadow-lg">
            <img src="/farmacia.png" alt="Farmacia" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-3xl font-bold tracking-wide mb-2">FarmaSystem</h1>
          <p className="text-sm text-center text-blue-100 max-w-xs leading-relaxed">
            Sistema de gestión para farmacias. Controla ventas, inventario y clientes desde un solo lugar.
          </p>

          {/* Pastillas decorativas */}
          <svg className="absolute bottom-8 left-6 opacity-20" width="50" height="24" viewBox="0 0 50 24">
            <rect x="0" y="4" width="50" height="16" rx="8" fill="white" />
            <line x1="25" y1="4" x2="25" y2="20" stroke="#3B82F6" strokeWidth="2" />
          </svg>
          <svg className="absolute top-10 right-10 opacity-15" width="36" height="18" viewBox="0 0 36 18">
            <rect x="0" y="2" width="36" height="14" rx="7" fill="white" />
            <line x1="18" y1="2" x2="18" y2="16" stroke="#3B82F6" strokeWidth="1.5" />
          </svg>
          <svg className="absolute top-1/3 left-4 opacity-15" width="20" height="20" viewBox="0 0 20 20">
            <rect x="7" y="0" width="6" height="20" rx="3" fill="white" />
            <rect x="0" y="7" width="20" height="6" rx="3" fill="white" />
          </svg>
        </div>

        {/* Panel derecho */}
        <div className="md:w-7/12 flex flex-col justify-center px-10 py-12">

          {sent ? (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">¡Correo enviado!</h2>
                <p className="text-sm text-gray-400 mt-2">
                  Si el correo está registrado, recibirás un enlace en los próximos minutos.
                  El enlace expira en <span className="font-medium text-gray-600">30 minutos</span>.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block mt-4 text-sm text-blue-600 hover:underline"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              {/* Ícono sobre */}
              <div className="mb-6 w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-sm text-gray-400 mb-8">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@farmacia.com"
                    className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none px-1 py-2 text-gray-700 transition-colors bg-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-full transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>

                <div className="text-center pt-1">
                  <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    ← Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
