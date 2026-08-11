import { useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'
import Checkbox from '@/components/ui/Checkbox'

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
  const [accordClient, setAccordClient] = useState(false)

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Clôturer le permis"
      description={permitReference}
      banner={
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <p className="text-xs text-orange-800 leading-relaxed">
            <strong>Action irréversible.</strong> Le permis passera en statut CLÔTURÉ et un PV de
            réception sera généré automatiquement.
          </p>
        </div>
      }
      commentPlaceholder="Motif de clôture, remarques de réception…"
      extraContent={
        <Checkbox
          label="Accord client obtenu"
          checked={accordClient}
          onChange={(e) => setAccordClient(e.target.checked)}
          disabled={isCloturer}
        />
      }
      confirmLabel="Confirmer la clôture"
      confirmVariant="danger"
      confirmIcon={<Lock className="mr-2 h-4 w-4" />}
      isSubmitting={isCloturer}
      onConfirm={async (commentaire) => {
        await onCloturer(permitId, commentaire || undefined, accordClient)
      }}
      errorMessage="Erreur lors de la clôture — vérifiez les droits ou le statut du permis."
    />
  )
}
