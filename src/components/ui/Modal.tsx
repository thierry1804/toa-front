import { useEffect, useId, useRef, type ReactNode } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-6 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, description, size = 'md', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keep the latest onClose in a ref so the focus-trap effect below never
  // needs it as a dependency — callers that pass an inline onClose (a new
  // function identity on every render) must not re-trigger the trap.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Focus trap: move focus into the modal on open, cycle Tab within it,
  // close on Escape, and restore focus to the trigger element on close.
  // Depends only on `isOpen` so it runs once per open/close, not on every
  // parent re-render (which would steal focus back to the first focusable
  // element — the close button — while the user is typing).
  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const getFocusable = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])

    const first = getFocusable()[0]
    ;(first ?? panelRef.current)?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) return
      const currentIndex = items.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey) {
        if (currentIndex <= 0) {
          e.preventDefault()
          items[items.length - 1].focus()
        }
      } else if (currentIndex === items.length - 1 || currentIndex === -1) {
        e.preventDefault()
        items[0].focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[85vh] w-full ${SIZE_CLASSES[size]} flex-col rounded-xl bg-white p-6 shadow-xl`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default Modal
