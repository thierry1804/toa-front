import { useEffect } from 'react'
import { useUiStore } from '@/store/ui.store'

const TOAST_DURATION_MS = 5000

const COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
}

interface ToastItemProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  onClose: (id: string) => void
}

function ToastItem({ id, message, type, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [id, onClose])

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${COLORS[type]} ${
        type === 'error' ? 'animate-pulse' : ''
      }`}
    >
      <p className="text-sm">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-2 rounded p-1 hover:bg-white/20"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  )
}

export default ToastContainer
