import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClickableCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'role'> {
  /** Destination ouverte au toucher de la carte. */
  to?: string
  /** Action exécutée au toucher quand la carte n'ouvre pas une page (ex. filtrer une vue). */
  onOpen?: () => void
  /** Libellé lu par les lecteurs d'écran (ex. la référence du dossier). */
  label: string
  children: ReactNode
  /** Affiche le chevron « ouvrir » à droite (défaut : oui). */
  chevron?: boolean
}

const INTERACTIVE = 'a,button,input,select,textarea,label,[data-no-card-nav]'

/**
 * Carte entièrement cliquable (liste mobile) : toute la surface ouvre le dossier, comme une ligne de tableau.
 * Les boutons d'action placés dans la carte gardent leur propre comportement (le toucher ne navigue pas).
 */
export function ClickableCard({ to, onOpen, label, children, className, chevron = true, ...rest }: ClickableCardProps) {
  const navigate = useNavigate()

  const open = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return
    go()
  }

  const go = () => {
    if (onOpen) onOpen()
    else if (to) navigate(to)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      go()
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

export default ClickableCard
