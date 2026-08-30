import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'

export interface EntrepriseFormValues {
  nom: string
  numeroRegistreCommerce: string
  siegeSocial: string
  qualiteRepresentant: string
}

interface EntrepriseFormFieldsProps {
  values: EntrepriseFormValues
  onChange: (field: keyof EntrepriseFormValues, value: string) => void
  nomError?: string
  disabled?: boolean
  autoFocusNom?: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export function emptyEntrepriseFormValues(): EntrepriseFormValues {
  return {
    nom: '',
    numeroRegistreCommerce: '',
    siegeSocial: '',
    qualiteRepresentant: '',
  }
}

export default function EntrepriseFormFields({
  values,
  onChange,
  nomError,
  disabled = false,
  autoFocusNom = false,
}: EntrepriseFormFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Input
        label={t('users.entreprise.fields.nom')}
        value={values.nom}
        onChange={(e) => onChange('nom', e.target.value)}
        placeholder={t('users.entreprise.fields.nomPlaceholder')}
        error={nomError}
        disabled={disabled}
        maxLength={255}
        autoFocus={autoFocusNom}
        required
      />
      <Input
        label={t('users.entreprise.fields.numeroRegistreCommerce')}
        value={values.numeroRegistreCommerce}
        onChange={(e) => onChange('numeroRegistreCommerce', e.target.value)}
        placeholder={t('users.entreprise.fields.numeroRegistreCommercePlaceholder')}
        disabled={disabled}
      />
      <Input
        label={t('users.entreprise.fields.siegeSocial')}
        value={values.siegeSocial}
        onChange={(e) => onChange('siegeSocial', e.target.value)}
        placeholder={t('users.entreprise.fields.siegeSocialPlaceholder')}
        disabled={disabled}
      />
      <Input
        label={t('users.entreprise.fields.qualiteRepresentant')}
        value={values.qualiteRepresentant}
        onChange={(e) => onChange('qualiteRepresentant', e.target.value)}
        placeholder={t('users.entreprise.fields.qualiteRepresentantPlaceholder')}
        maxLength={100}
        disabled={disabled}
      />
    </div>
  )
}
