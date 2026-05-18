'use client'
import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
}

const config = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    iconColor: 'text-yellow-500',
  },
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const { icon: Icon, bg, text, iconColor } = config[type]

  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${bg}`}>
      <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${text}`}>{message}</p>
      <button onClick={onClose} className={`shrink-0 ${text} opacity-50 hover:opacity-100`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
