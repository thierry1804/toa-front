import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useActivityPlannings, useCreateActivityPlanning, useUpdateActivityPlanning } from '@/features/planning/hooks/useActivityPlanning'
import { useUiStore } from '@/store/ui.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import type { ActivityPlanning } from '@/types'
import { ArrowLeft, Save, CalendarPlus, MapPin, Building2, Clock } from 'lucide-react'

const statusOptions = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'valide', label: 'Validé' },
  { value: 'annule', label: 'Annulé' },
]

export default function PlanningFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canAccessFeature } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const { data: plannings } = useActivityPlannings()
  const { mutate: createPlanning, isPending: isCreating } = useCreateActivityPlanning()
  const { mutate: updatePlanning, isPending: isUpdating } = useUpdateActivityPlanning()

  const isEditMode = !!id
  const existing = isEditMode ? plannings?.find((p) => String(p.id) === id) : null

  const lockedFields = (() => {
    if (!existing) return [] as string[]
    const fields: string[] = []
    const isLocked = existing.status === 'en_cours' || existing.status === 'valide'
    if (isLocked) fields.push('process', 'siteCode', 'siteNumber', 'siteName', 'region', 'theoreticalStartDate', 'expectedStartDate', 'expectedEndDate')
    if (existing.permitValidated) fields.push('provider', 'projectDescription')
    return fields
  })()

  const [formData, setFormData] = useState({
    process: '',
    provider: '',
    providerEmail: '',
    projectDescription: '',
    siteCode: '',
    siteNumber: '',
    siteName: '',
    region: '',
    theoreticalStartDate: '',
    expectedStartDate: '',
    expectedEndDate: '',
    status: 'brouillon',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) {
      setFormData({
        process: existing.process,
        provider: existing.provider,
        providerEmail: existing.providerEmail ?? '',
        projectDescription: existing.projectDescription,
        siteCode: existing.siteCode,
        siteNumber: existing.siteNumber,
        siteName: existing.siteName,
        region: existing.region,
        theoreticalStartDate: existing.theoreticalStartDate.slice(0, 16),
        expectedStartDate: existing.expectedStartDate.slice(0, 16),
        expectedEndDate: existing.expectedEndDate.slice(0, 16),
        status: existing.status,
      })
    }
  }, [existing])

  useEffect(() => {
    if (!canAccessFeature(isEditMode ? 'edit_planning' : 'create_planning')) {
      navigate('/planning')
      addToast({ message: 'Permission refusée', type: 'error' })
    }
  }, [isEditMode, navigate, addToast, canAccessFeature])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.process.trim()) newErrors.process = 'Le procédé est obligatoire'
    if (!formData.provider.trim()) newErrors.provider = 'Le prestataire est obligatoire'
    if (!formData.projectDescription.trim()) newErrors.projectDescription = 'La description est obligatoire'
    if (!formData.siteCode.trim()) newErrors.siteCode = 'Le code site est obligatoire'
    if (!formData.siteNumber.trim()) newErrors.siteNumber = 'Le numéro site est obligatoire'
    if (!formData.siteName.trim()) newErrors.siteName = 'Le nom du site est obligatoire'
    if (!formData.region.trim()) newErrors.region = 'La région est obligatoire'
    if (!formData.theoreticalStartDate) newErrors.theoreticalStartDate = 'La date théorique est obligatoire'
    if (!formData.expectedStartDate) newErrors.expectedStartDate = 'La date prévue de début est obligatoire'
    if (!formData.expectedEndDate) newErrors.expectedEndDate = 'La date prévue de fin est obligatoire'

    if (formData.expectedStartDate && formData.expectedEndDate) {
      if (new Date(formData.expectedEndDate) < new Date(formData.expectedStartDate)) {
        newErrors.expectedEndDate = 'La date de fin ne peut pas être antérieure à la date de début'
      }
    }
    if (formData.theoreticalStartDate && formData.expectedStartDate) {
      if (new Date(formData.expectedStartDate) < new Date(formData.theoreticalStartDate)) {
        newErrors.expectedStartDate = 'Doit être postérieure ou égale à la date théorique'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      addToast({ message: 'Veuillez corriger les erreurs du formulaire', type: 'error' })
      return
    }

    const payload = {
      process: formData.process.trim(),
      provider: formData.provider.trim(),
      providerEmail: formData.providerEmail.trim() || undefined,
      projectDescription: formData.projectDescription.trim(),
      siteCode: formData.siteCode.trim(),
      siteNumber: formData.siteNumber.trim(),
      siteName: formData.siteName.trim(),
      region: formData.region.trim(),
      theoreticalStartDate: new Date(formData.theoreticalStartDate).toISOString(),
      expectedStartDate: new Date(formData.expectedStartDate).toISOString(),
      expectedEndDate: new Date(formData.expectedEndDate).toISOString(),
      status: formData.status as ActivityPlanning['status'],
    }

    if (isEditMode && existing) {
      // Override locked fields with original values so they're never sent modified
      for (const field of lockedFields) {
        ;(payload as any)[field] = (existing as any)[field]
      }

      updatePlanning(
        { id: existing.id, data: payload },
        {
          onSuccess: () => addToast({ message: 'Planification modifiée avec succès', type: 'success' }),
          onError: () => addToast({ message: "Erreur lors de la modification", type: 'error' }),
        },
      )
    } else {
      createPlanning(payload, {
        onSuccess: () => addToast({ message: 'Planification créée avec succès', type: 'success' }),
        onError: () => addToast({ message: 'Erreur lors de la création', type: 'error' }),
      })
    }
  }

  const set = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <div className= "space-y-6" >
    <div className="flex items-center justify-between" >
      <div className="flex items-center gap-4" >
        <Link to="/planning" >
          <Button variant="outline" size = "sm" >
            <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
              </Button>
              </Link>
              < div >
              <h2 className="text-3xl font-bold text-gray-900" >
                { isEditMode? "Modifier la planification": 'Nouvelle planification' }
                </h2>
                < p className = "mt-1 text-gray-600" >
                {
                  isEditMode
                  ? "Modifier les détails de l'activité planifiée"
                    : 'Planifier une nouvelle activité sur site'
                }
                  </p>
                  </div>
                  </div>
                  </div>

                  < form onSubmit = { handleSubmit } className = "space-y-6" >
                    <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900" >
                      <Building2 className="h-5 w-5 text-blue-600" />
                        Informations générales
                          </CardTitle>
                          </CardHeader>
                          < CardContent className = "space-y-4" >
               <Input
                label="Procédé *"
  value = { formData.process }
  onChange = {(e) => set('process', e.target.value)
}
error = { errors.process }
placeholder = "Ex: Maintenance groupe électrogène"
required
  disabled = { lockedFields.includes('process') } />
   <Textarea
   className='text-gray-900'
                label = "Description du projet *"
value = { formData.projectDescription }
onChange = {(e) => set('projectDescription', e.target.value)}
error = { errors.projectDescription }
placeholder = "Décrire les travaux à réaliser..."
required
  disabled = { lockedFields.includes('projectDescription') } />
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
    <Input
                label="Prestataire *"
value = { formData.provider }
onChange = {(e) => set('provider', e.target.value)}
error = { errors.provider }
placeholder = "Nom de l'entreprise"
required
  disabled = { lockedFields.includes('provider') } />
  <Input
                label="Email prestataire"
type = "email"
value = { formData.providerEmail }
onChange = {(e) => set('providerEmail', e.target.value)}
placeholder = "contact@prestataire.mg"
  />
  </div>
  </CardContent>
  </Card>

  < Card >
  <CardHeader>
  <CardTitle className="flex items-center gap-2 text-gray-900" >
    <MapPin className="h-5 w-5 text-blue-600" />
      Site
      </CardTitle>
      </CardHeader>
      < CardContent className = "space-y-4" >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" >
          <Input
                label="Code site *"
value = { formData.siteCode }
onChange = {(e) => set('siteCode', e.target.value)}
error = { errors.siteCode }
placeholder = "Ex: TNR-001"
required
  disabled = { lockedFields.includes('siteCode') } />
   <Input
                label="Numéro site *"
value = { formData.siteNumber }
onChange = {(e) => set('siteNumber', e.target.value)}
error = { errors.siteNumber }
placeholder = "Ex: 12345"
required
  disabled = { lockedFields.includes('siteNumber') } />
   <Input
                label="Nom du site *"
value = { formData.siteName }
onChange = {(e) => set('siteName', e.target.value)}
error = { errors.siteName }
placeholder = "Ex: Antananarivo Centre"
required
  disabled = { lockedFields.includes('siteName') } />
  </div>
  < Input
label = "Région *"
value = { formData.region }
onChange = {(e) => set('region', e.target.value)}
error = { errors.region }
placeholder = "Ex: Analamanga"
required
  disabled = { lockedFields.includes('region') } />
  </CardContent>
  </Card>

  < Card >
  <CardHeader>
  <CardTitle className="flex items-center gap-2 text-gray-900" >
    <Clock className="h-5 w-5 text-blue-600" />
      Dates
      </CardTitle>
      </CardHeader>
      < CardContent className = "space-y-4" >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3" >
          <p className="text-sm text-blue-800" >
            La date théorique est la date de début prévue initialement.Les dates prévues
                peuvent être ajustées tout en respectant la cohérence temporelle.
              </p>
  </div>
  < div className = "grid grid-cols-1 md:grid-cols-3 gap-4" >
    <Input
                label="Date théorique *"
type = "datetime-local"
value = { formData.theoreticalStartDate }
onChange = {(e) => set('theoreticalStartDate', e.target.value)}
error = { errors.theoreticalStartDate }
required
  disabled = { lockedFields.includes('theoreticalStartDate') } />
    <Input
                label="Début prévu *"
type = "datetime-local"
value = { formData.expectedStartDate }
onChange = {(e) => set('expectedStartDate', e.target.value)}
error = { errors.expectedStartDate }
required
  disabled = { lockedFields.includes('expectedStartDate') } />
    <Input
                label="Fin prévue *"
type = "datetime-local"
value = { formData.expectedEndDate }
onChange = {(e) => set('expectedEndDate', e.target.value)}
error = { errors.expectedEndDate }
required
  disabled = { lockedFields.includes('expectedEndDate') } />
  </div>
  </CardContent>
  </Card>

  < Card >
  <CardHeader>
  <CardTitle className="flex items-center gap-2 text-gray-900" >
    <CalendarPlus className="h-5 w-5 text-blue-600" />
      Statut
      </CardTitle>
      </CardHeader>
      < CardContent >
      <Select
              label="Statut"
options = { statusOptions }
value = { formData.status }
onChange = {(e) => set('status', e.target.value)}
            />
{
  formData.status === 'brouillon' && (
    <p className="mt-2 text-xs text-gray-500" >
      Les planifications en brouillon ne sont pas visibles dans le calendrier
        </p>
            )
}
</CardContent>
  </Card>

  < div className = "flex items-center justify-between gap-4 pt-4 border-t" >
    <Link to="/planning" >
      <Button type="button" variant = "outline" > Annuler </Button>
        </Link>
        < Button type = "submit" isLoading = { isCreating || isUpdating}>
        {
          isEditMode?(
              <>
          <Save className="h-4 w-4 mr-2" />
            Enregistrer les modifications
              </>
            ) : (
  <>
  <CalendarPlus className= "h-4 w-4 mr-2" />
  Créer la planification
    </>
            )}
</Button>
  </div>
  </form>
  </div>
  )
}
