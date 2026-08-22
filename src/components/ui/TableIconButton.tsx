import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TableIconButtonVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning'

const variantClasses: Record<TableIconButtonVariant, string> = {
  default: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  primary: 'text-gray-600 hover:bg-blue-50 hover:text-blue-600',
  success: 'text-gray-600 hover:bg-green-50 hover:text-green-600',
  danger: 'text-gray-600 hover:bg-red-50 hover:text-red-600',
  warning: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700',
}

export interface TableIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  variant?: TableIconButtonVariant
  children: ReactNode
}

export function TableIconButton({
  title,
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...props
}: TableIconButtonProps) {
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
