import { ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permitTravail.components.pvValiderModal.title', { reference: permitReference })}
      description={
        <>
          {t('permitTravail.components.pvValiderModal.descriptionPrefix')}{' '}
          <span className="font-semibold text-blue-700">{permitReference}</span>.
        </>
      }
      commentPlaceholder={t('permitTravail.components.pvValiderModal.commentPlaceholder')}
      confirmLabel={t('permitTravail.components.pvValiderModal.confirmLabel')}
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
              <span className="text-sm font-medium">
                {t('permitTravail.components.pvValiderModal.successMessage')}
              </span>
            </div>
            {signature && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t('permitTravail.components.pvValiderModal.signatureLabel')}
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
          return t('permitTravail.components.pvValiderModal.errorNotCloture')
        }
        if (detail.includes('pv_not_genere') || detail.includes('PV non généré')) {
          return t('permitTravail.components.pvValiderModal.errorPvNotGenere')
        }
        if (detail.includes('suivi_journalier_manquant')) {
          return t('permitTravail.components.pvValiderModal.errorSuiviManquant')
        }
        if (detail.includes('evaluation_risque_manquante')) {
          return t('permitTravail.components.pvValiderModal.errorEvaluationManquante')
        }
        return t('permitTravail.components.pvValiderModal.errorGeneric')
      }}
    />
  )
}
