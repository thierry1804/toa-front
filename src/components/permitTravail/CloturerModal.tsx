import { useState } from 'react'
import { AlertTriangle, Lock, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CloturerModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isCloturer: boolean
  onClose: () => void
  onCloturer: (id: string, commentaire?: string, accordClient?: boolean) => Promise<unknown>
}

export default function CloturerModal({
  isOpen,
  permitId,
  permitReference,
  isCloturer,
  onClose,
  onCloturer,
}: CloturerModalProps) {
  const [commentaire, setCommentaire]   = useState('')
  const [accordClient, setAccordClient] = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    try {
      await onCloturer(permitId, commentaire || undefined, accordClient)
      onClose()
    } catch {
      setError('Erreur lors de la clôture — vérifiez les droits ou le statut du permis.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800">
            <Lock className="h-4 w-4 text-white" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Clôturer le permis</h2>
            <p className="text-xs text-gray-500 font-mono">{permitReference}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
            <p className="text-xs text-orange-800 leading-relaxed">
              <strong>Action irréversible.</strong> Le permis passera en statut CLÔTURÉ et un PV de réception sera généré automatiquement.
            </p>
          </div>

          {/* Commentaire */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Commentaire <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              rows={3}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Motif de clôture, remarques de réception…"
              disabled={isCloturer}
              className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Accord client */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={accordClient}
              onChange={(e) => setAccordClient(e.target.checked)}
              disabled={isCloturer}
              className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-500"
            />
            <span className="text-sm text-gray-700">Accord client obtenu</span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isCloturer}>
            Annuler
          </Button>
          <Button
            className="bg-gray-800 text-white hover:bg-gray-900"
            onClick={() => void handleConfirm()}
            disabled={isCloturer}
          >
            {isCloturer ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clôture en cours…
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Confirmer la clôture
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
