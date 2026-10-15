import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Liste « libellé / valeur » d'une fiche. Sur mobile : grille à deux colonnes, libellé en petit au-dessus de la valeur,
 * pour voir la fiche d'un coup d'œil au lieu de faire défiler une colonne unique. Dès `sm` : lignes libellé à gauche, valeur à droite.
 */
export function InfoList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-4 sm:block sm:space-y-3', className)}>{children}</dl>
}

export function InfoItem({
  label,
  value,
  wide = false,
}: {
  label: string
  value: ReactNode
  /** Valeur longue (texte libre, période, adresse) : occupe toute la largeur sur mobile. */
  wide?: boolean
}) {
  return (
    <div className={cn('min-w-0 sm:flex sm:gap-4', wide && 'col-span-2')}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:w-48 sm:shrink-0 sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-gray-900 sm:mt-0 sm:font-normal">{value ?? '—'}</dd>
    </div>
  )
}
