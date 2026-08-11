import { ShieldCheck } from 'lucide-react'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'
import type { PermitTravail } from '@/types/permitTravail'

interface ValiderPermitModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isValidating: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<PermitTravail>
}

export default function ValiderPermitModal({
  isOpen,
  permitId,
  permitReference,
  isValidating,
  onClose,
  onValider,
}: ValiderPermitModalProps) {
  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Valider le permis ${permitReference}`}
      description={
        <>
          Confirmez la validation du permis de travail{' '}
          <span className="font-semibold text-blue-700">{permitReference}</span>.
        </>
      }
      commentPlaceholder="Observations ou remarques..."
      confirmLabel="Valider"
      confirmIcon={<ShieldCheck className="mr-2 h-4 w-4" />}
      isSubmitting={isValidating}
      errorMessage="Erreur lors de la validation du permis."
      onConfirm={async (commentaire) => {
        const updatedPermit = await onValider(permitId, commentaire || undefined)
        const latestDecision = updatedPermit.decisionsHse?.at(-1)
        if (!latestDecision?.signatureElectronique) return undefined

        const signature = latestDecision.signatureElectronique
        const exp = new Date(
          new Date(latestDecision.decidedAt).getTime() + 30 * 24 * 60 * 60 * 1000,
        )
        const dateExpiration = exp.toLocaleDateString('fr-FR')

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Permis validé avec succès.</span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Signature électronique
              </p>
              <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {signature}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Date d'expiration
              </p>
              <p className="text-sm font-medium text-gray-800">{dateExpiration}</p>
            </div>
          </div>
        )
      }}
    />
  )
}
