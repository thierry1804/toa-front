interface PlanReferenceProps {
  reference: string | null | undefined
  className?: string
}

export default function PlanReference({ reference, className = '' }: PlanReferenceProps) {
  if (!reference) return null

  return (
    <div className={`inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 ${className}`}>
      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Réf.</span>
      <span className="font-mono text-sm font-semibold text-blue-900">{reference}</span>
    </div>
  )
}
