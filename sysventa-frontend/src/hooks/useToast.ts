import { useState, useCallback } from 'react'
import { ToastType } from '@/components/Toast'

interface ToastState {
  message: string
  type: ToastType
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }, [])

  const closeToast = useCallback(() => setToast(null), [])

  return { toast, showToast, closeToast }
}
