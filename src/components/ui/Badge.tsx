import type { ReactNode } from 'react'
import { badgeVariants } from '@/data/constant/ui'

export interface BadgeProps {
  children: ReactNode
  variant?: keyof typeof badgeVariants
  size?: string
  className?: string
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
