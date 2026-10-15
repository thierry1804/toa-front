import { useNavigate } from 'react-router-dom'
import { PressableCard, type PressableCardProps } from '@/components/ui/PressableCard'

interface ClickableCardProps extends Omit<PressableCardProps, 'onOpen'> {
  /** Destination ouverte au toucher de la carte. */
  to?: string
  /** Action exécutée au toucher quand la carte n'ouvre pas une page (ex. filtrer une vue). */
  onOpen?: () => void
}

/** Carte entièrement cliquable (liste mobile) : toute la surface ouvre le dossier, comme une ligne de tableau. */
export function ClickableCard({ to, onOpen, ...rest }: ClickableCardProps) {
  const navigate = useNavigate()
  return <PressableCard {...rest} onOpen={onOpen ?? (to ? () => navigate(to) : undefined)} />
}

export default ClickableCard
