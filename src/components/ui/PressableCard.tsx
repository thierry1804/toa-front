import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PressableCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'role'> {
  /** Action exécutée au toucher de la carte (ouvrir, afficher…). */
  onOpen?: () => void
  /** Libellé lu par les lecteurs d'écran. */
  label: string
  children: ReactNode
  /** Affiche le chevron « ouvrir » à droite (défaut : oui). */
  chevron?: boolean
}

const INTERACTIVE = 'a,button,input,select,textarea,label,[data-no-card-nav]'

/**
 * Carte entièrement tactile, sans dépendance au routeur. Les boutons placés à l'intérieur gardent leur propre
 * comportement : toucher un bouton n'ouvre pas la carte.
 */
export function PressableCard({ onOpen, label, children, className, chevron = true, ...rest }: PressableCardProps) {
  const open = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return
    onOpen?.()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen?.()
    }
  }

  return (
    <div
      {...rest}
      role="link"
      tabIndex={0}
      aria-label={label}
      onClick={open}
      onKeyDown={onKeyDown}
      className={cn(
        'relative flex cursor-pointer items-stretch gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left',
        'transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600',
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {chevron && <ChevronRight className="h-5 w-5 shrink-0 self-center text-gray-400" aria-hidden />}
    </div>
  )
}

export default PressableCard
