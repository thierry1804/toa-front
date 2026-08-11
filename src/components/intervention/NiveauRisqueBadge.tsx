interface NiveauRisqueBadgeProps {
  niveauRisque: number
  showLabel?: boolean
}

export default function NiveauRisqueBadge({ niveauRisque, showLabel = true }: NiveauRisqueBadgeProps) {
  let className: string
  let label: string

  if (niveauRisque >= 15) {
    className = 'bg-red-100 text-red-800'
    label = 'Élevé'
  } else if (niveauRisque >= 8) {
    className = 'bg-amber-200 text-amber-900'
    label = 'Modéré'
  } else {
    className = 'bg-green-100 text-green-800'
    label = 'Faible'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <span className="font-mono">{niveauRisque}</span>
      {showLabel && <span>— {label}</span>}
    </span>
  )
}
