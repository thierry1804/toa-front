import { FileDown, FileCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePvReceptionPdf } from '@/features/permitTravail/hooks/usePermitTravail'
import Button from '@/components/ui/Button'

interface PvReceptionButtonProps {
  permitId: string
}

export default function PvReceptionButton({ permitId }: PvReceptionButtonProps) {
  const { t } = useTranslation()
  const { pvStatut, isPolling, pvMeta, pollError, downloadPv } =
    usePvReceptionPdf(permitId, { enabled: true })

  if (pvStatut === 'EN_COURS' || isPolling) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('permitTravail.components.pvReceptionButton.generating')}
      </Button>
    )
  }

  if (pvStatut === 'GENERE') {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => void downloadPv()}
        >
          <FileCheck className="mr-2 h-4 w-4" />
          {t('permitTravail.components.pvReceptionButton.download')}
        </Button>
        {pvMeta?.genereAt && (
          <span className="text-xs text-gray-500">
            {pvMeta.tailleFichier
              ? t('permitTravail.components.pvReceptionButton.generatedOnWithSize', {
                  date: new Date(pvMeta.genereAt).toLocaleString('fr-FR'),
                  size: Math.round(pvMeta.tailleFichier / 1024),
                })
              : t('permitTravail.components.pvReceptionButton.generatedOn', {
                  date: new Date(pvMeta.genereAt).toLocaleString('fr-FR'),
                })}
          </span>
        )}
      </div>
    )
  }

  if (pvStatut === 'ERREUR') {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant="danger" disabled>
          <AlertTriangle className="mr-2 h-4 w-4" />
          {t('permitTravail.components.pvReceptionButton.error')}
        </Button>
        {pollError && <span className="text-xs text-red-500">{pollError}</span>}
      </div>
    )
  }

  // null — no PV yet (just clôturé, queued)
  return (
    <Button disabled>
      <FileDown className="mr-2 h-4 w-4" />
      {t('permitTravail.components.pvReceptionButton.pending')}
    </Button>
  )
}
