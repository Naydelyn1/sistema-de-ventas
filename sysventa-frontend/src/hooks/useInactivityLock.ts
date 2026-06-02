import { useCallback, useEffect, useRef, useState } from 'react'

const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

export function useInactivityLock() {
  const [isLocked, setIsLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsLocked(true), TIMEOUT_MS)
  }, [])

  const unlock = useCallback(() => {
    setIsLocked(false)
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  return { isLocked, unlock }
}
