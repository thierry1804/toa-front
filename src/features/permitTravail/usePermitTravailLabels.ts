import { useTranslation } from 'react-i18next'
import type { ProcessusPermit, TypePermit } from '@/types/permitTravail'

export function usePermitTravailLabels() {
  const { t } = useTranslation()

  return {
    typeLabel: (type: TypePermit) => t(`permitTravail.types.${type}`),
    processusLabel: (processus: ProcessusPermit) =>
      t(`permitTravail.processus.${processus}`),
    statutLabel: (statut: string) => t(`permitTravail.statut.${statut}`),
  }
}
