import { AlertTriangle, ShieldX } from 'lucide-react'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

interface RefuserPermitModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isRefusing: boolean
  onClose: () => void
  onRefuser: (id: string, commentaire: string) => Promise<void>
}

export default function RefuserPermitModal({
  isOpen,
  permitId,
  permitReference,
  isRefusing,
  onClose,
  onRefuser,
}: RefuserPermitModalProps) {
  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Refuser le permis ${permitReference}`}
      banner={
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Le prestataire sera notifié par email et devra corriger son dossier puis soumettre à
            nouveau.
          </p>
        </div>
      }
      commentLabel="Motif du refus"
      commentRequired
      commentRequiredMessage="Le motif de refus est obligatoire."
      commentPlaceholder="Expliquez les raisons du refus..."
      confirmLabel="Refuser"
      confirmVariant="danger"
      confirmIcon={<ShieldX className="mr-2 h-4 w-4" />}
      isSubmitting={isRefusing}
      onConfirm={(commentaire) => onRefuser(permitId, commentaire)}
      errorMessage="Erreur lors du refus du permis."
    />
  )
}
