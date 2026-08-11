import { ClipboardCheck } from 'lucide-react'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

interface PvValiderModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isValiderPv: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<{ signatureElectronique?: string }>
}

export default function PvValiderModal({
  isOpen,
  permitId,
  permitReference,
  isValiderPv,
  onClose,
  onValider,
}: PvValiderModalProps) {
  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Valider le PV — ${permitReference}`}
      description={
        <>
          Confirmer la validation du PV de réception pour le permis{' '}
          <span className="font-semibold text-blue-700">{permitReference}</span>.
        </>
      }
      commentPlaceholder="Observations de réception..."
      confirmLabel="Valider le PV"
      confirmVariant="success"
      confirmIcon={<ClipboardCheck className="mr-2 h-4 w-4" />}
      isSubmitting={isValiderPv}
      onConfirm={async (commentaire) => {
        const result = await onValider(permitId, commentaire || undefined)
        const signature = result.signatureElectronique ?? null
        if (signature === null) return undefined

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ClipboardCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">PV de réception validé avec succès.</span>
            </div>
            {signature && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Signature électronique
                </p>
                <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                  {signature}
                </p>
              </div>
            )}
          </div>
        )
      }}
      getErrorMessage={(err) => {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
        if (detail.includes('not_cloture') || detail.includes('Permis non clôturé')) {
          return "Le permis n'est pas clôturé."
        }
        if (detail.includes('pv_not_genere') || detail.includes('PV non généré')) {
          return "Le PV de réception n'est pas encore généré. Attendez la fin de la génération."
        }
        if (detail.includes('suivi_journalier_manquant')) {
          return 'Aucun suivi journalier trouvé pour ce permis.'
        }
        if (detail.includes('evaluation_risque_manquante')) {
          return 'Aucune évaluation des risques trouvée pour ce permis.'
        }
        return 'Erreur lors de la validation du PV de réception.'
      }}
    />
  )
}
