import { useEffect, useState } from 'react'
import { localDay } from './model'

export function useToday() {
  const [today, setToday] = useState(localDay)
  useEffect(() => {
    const refresh = () => setToday(localDay())
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  return today
}
