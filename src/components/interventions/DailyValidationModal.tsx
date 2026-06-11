import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import ControleJournalierElectrique from '@/components/permits/ControleJournalierElectrique';
import ControleJournalierHauteur from '@/components/permits/ControleJournalierHauteur';
import { CheckCircle2, AlertCircle, Camera, FileText } from 'lucide-react';
import type { ValidationInterventionJournaliere, ControleJournalierPermis } from '@/types';

interface DailyValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (validation: Omit<ValidationInterventionJournaliere, 'id'>) => void;
  interventionRef: string;
  codeSite: string;
  initialData?: Partial<ValidationInterventionJournaliere>;
  permisAssocie?: {
    id: string;
    type: 'travaux_electrique' | 'travaux_hauteur';
  };
  onControlePermis?: (data: ControleJournalierPermis) => void;
}

export default function DailyValidationModal({
  isOpen,
  onClose,
  onSubmit,
  interventionRef,
  codeSite,
  initialData,
  permisAssocie,
  onControlePermis,
}: DailyValidationModalProps) {
  const [showControlePermis, setShowControlePermis] = useState(false);
  const [formData, setFormData] = useState<Partial<ValidationInterventionJournaliere>>({
    date: initialData?.date || new Date(),
    heureDebut: initialData?.heureDebut || '',
    heureFin: initialData?.heureFin || '',
    nombrePersonnes: initialData?.nombrePersonnes || 0,
    listePersonnel: initialData?.listePersonnel || [],
    conditionsMeteo: initialData?.conditionsMeteo || '',
    temperatureC: initialData?.temperatureC,
    vitesseVentKmh: initialData?.vitesseVentKmh,
    verificationsSecurite: initialData?.verificationsSecurite || {
      epiVerifies: false,
      outillageVerifie: false,
      zoneSecurisee: false,
      consignesRappelees: false,
      planSauvetageRevu: false,
    },
    activitesRealisees: initialData?.activitesRealisees || '',
    avancementPourcentage: initialData?.avancementPourcentage || 0,
    take5Effectue: initialData?.take5Effectue || false,
    take5Id: initialData?.take5Id,
    incidents: initialData?.incidents || false,
    incidentsDetails: initialData?.incidentsDetails || '',
    observationsJour: initialData?.observationsJour || '',
    photosAvancement: initialData?.photosAvancement || [],
    documents: initialData?.documents || [],
    validee: initialData?.validee || false,
  });

  const [nouveauPersonnel, setNouveauPersonnel] = useState('');

  const addPersonnel = () => {
    if (nouveauPersonnel.trim()) {
      setFormData({
        ...formData,
        listePersonnel: [...(formData.listePersonnel || []), nouveauPersonnel.trim()],
        nombrePersonnes: (formData.nombrePersonnes || 0) + 1,
      });
      setNouveauPersonnel('');
    }
  };

  const removePersonnel = (index: number) => {
    const newList = (formData.listePersonnel || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      listePersonnel: newList,
      nombrePersonnes: newList.length,
    });
  };

  const handleSubmit = () => {
    const validation: Omit<ValidationInterventionJournaliere, 'id'> = {
      date: formData.date!,
      heureDebut: formData.heureDebut!,
      heureFin: formData.heureFin,
      nombrePersonnes: formData.nombrePersonnes!,
      listePersonnel: formData.listePersonnel!,
      conditionsMeteo: formData.conditionsMeteo,
      temperatureC: formData.temperatureC,
      vitesseVentKmh: formData.vitesseVentKmh,
      verificationsSecurite: formData.verificationsSecurite!,
      activitesRealisees: formData.activitesRealisees!,
      avancementPourcentage: formData.avancementPourcentage!,
      take5Effectue: formData.take5Effectue!,
      take5Id: formData.take5Id,
      incidents: formData.incidents!,
      incidentsDetails: formData.incidentsDetails,
      observationsJour: formData.observationsJour!,
      photosAvancement: formData.photosAvancement!,
      documents: formData.documents!,
      validee: formData.validee!,
      dateValidation: formData.validee ? new Date() : undefined,
    };

    onSubmit(validation);
    onClose();
  };

  const isFormValid = () => {
    return (
      formData.heureDebut &&
      formData.nombrePersonnes &&
      formData.nombrePersonnes > 0 &&
      formData.listePersonnel &&
      formData.listePersonnel.length > 0 &&
      formData.activitesRealisees &&
      formData.observationsJour &&
      formData.avancementPourcentage !== undefined
    );
  };

  const allVerificationsChecked = () => {
    const verif = formData.verificationsSecurite;
    return (
      verif &&
      verif.epiVerifies &&
      verif.outillageVerifie &&
      verif.zoneSecurisee &&
      verif.consignesRappelees &&
      verif.planSauvetageRevu
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Validation journalière" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="font-semibold text-primary-900">
            Intervention: {interventionRef}
          </h3>
          <p className="text-sm text-primary-700">Site: {codeSite}</p>
          <p className="text-sm text-primary-700">
            Date: {formData.date && new Date(formData.date).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Horaires et Personnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horaires et Personnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Heure de début *"
                type="time"
                value={formData.heureDebut}
                onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                required
              />
              <Input
                label="Heure de fin"
                type="time"
                value={formData.heureFin}
                onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personnel présent * ({formData.nombrePersonnes || 0} personne
                {(formData.nombrePersonnes || 0) > 1 ? 's' : ''})
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={nouveauPersonnel}
                  onChange={(e) => setNouveauPersonnel(e.target.value)}
                  placeholder="Nom du personnel"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPersonnel())}
                />
                <Button type="button" onClick={addPersonnel} variant="outline">
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.listePersonnel || []).map((person, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {person}
                    <button
                      type="button"
                      onClick={() => removePersonnel(index)}
                      className="text-blue-900 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conditions de travail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Conditions météo"
                value={formData.conditionsMeteo}
                onChange={(e) => setFormData({ ...formData, conditionsMeteo: e.target.value })}
                placeholder="Ex: Ensoleillé"
              />
              <Input
                label="Température (°C)"
                type="number"
                value={formData.temperatureC || ''}
                onChange={(e) =>
                  setFormData({ ...formData, temperatureC: parseFloat(e.target.value) || undefined })
                }
                placeholder="28"
              />
              <Input
                label="Vitesse du vent (km/h)"
                type="number"
                value={formData.vitesseVentKmh || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vitesseVentKmh: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="15"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vérifications de sécurité */}
        <Card className={allVerificationsChecked() ? 'border-green-500' : 'border-orange-500'}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {allVerificationsChecked() ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              Vérifications de sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Checkbox
              label="EPI vérifiés et conformes"
              checked={formData.verificationsSecurite?.epiVerifies || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verificationsSecurite: {
                    ...formData.verificationsSecurite!,
                    epiVerifies: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label="Outillage vérifié et en bon état"
              checked={formData.verificationsSecurite?.outillageVerifie || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verificationsSecurite: {
                    ...formData.verificationsSecurite!,
                    outillageVerifie: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label="Zone de travail sécurisée et balisée"
              checked={formData.verificationsSecurite?.zoneSecurisee || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verificationsSecurite: {
                    ...formData.verificationsSecurite!,
                    zoneSecurisee: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label="Consignes de sécurité rappelées à l'équipe"
              checked={formData.verificationsSecurite?.consignesRappelees || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verificationsSecurite: {
                    ...formData.verificationsSecurite!,
                    consignesRappelees: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label="Plan de sauvetage revu et compris"
              checked={formData.verificationsSecurite?.planSauvetageRevu || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  verificationsSecurite: {
                    ...formData.verificationsSecurite!,
                    planSauvetageRevu: e.target.checked,
                  },
                })
              }
            />
          </CardContent>
        </Card>

        {/* Take 5 */}
        <Card>
          <CardContent className="p-4">
            <Checkbox
              label={
                <div>
                  <span className="font-medium">Take 5 effectué ce jour</span>
                  <p className="text-sm text-gray-600">
                    Une évaluation de sécurité Take 5 a été réalisée avant de commencer les travaux
                  </p>
                </div>
              }
              checked={formData.take5Effectue || false}
              onChange={(e) => setFormData({ ...formData, take5Effectue: e.target.checked })}
            />
          </CardContent>
        </Card>

        {/* Activités réalisées */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activités du jour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Activités réalisées *"
              value={formData.activitesRealisees}
              onChange={(e) => setFormData({ ...formData, activitesRealisees: e.target.value })}
              placeholder="Décrire en détail les activités réalisées aujourd'hui..."
              rows={4}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avancement global * ({formData.avancementPourcentage || 0}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.avancementPourcentage || 0}
                onChange={(e) =>
                  setFormData({ ...formData, avancementPourcentage: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card className={formData.incidents ? 'border-red-500' : ''}>
          <CardContent className="p-4 space-y-3">
            <Checkbox
              label={
                <span className="font-medium text-red-700">
                  Incidents ou situations dangereuses à signaler
                </span>
              }
              checked={formData.incidents || false}
              onChange={(e) => setFormData({ ...formData, incidents: e.target.checked })}
            />

            {formData.incidents && (
              <Textarea
                label="Détails des incidents"
                value={formData.incidentsDetails}
                onChange={(e) => setFormData({ ...formData, incidentsDetails: e.target.value })}
                placeholder="Décrire les incidents ou situations dangereuses..."
                rows={3}
                className="border-red-300"
              />
            )}
          </CardContent>
        </Card>

        {/* Observations */}
        <Card>
          <CardContent className="p-4">
            <Textarea
              label="Observations du jour *"
              value={formData.observationsJour}
              onChange={(e) => setFormData({ ...formData, observationsJour: e.target.value })}
              placeholder="Remarques générales, points d'attention, améliorations suggérées..."
              rows={3}
              required
            />
          </CardContent>
        </Card>

        {/* Photos et documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos et documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Fonctionnalité d'upload de photos à venir
              </p>
              <p className="text-xs text-gray-500">
                Photos de l'avancement, schémas, documents de référence
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contrôle journalier du permis associé */}
        {permisAssocie && !showControlePermis && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                Contrôle Journalier du Permis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">
                Un permis {permisAssocie.type === 'travaux_electrique' ? 'électrique' : 'de travail en hauteur'} est associé à cette intervention.
                Voulez-vous effectuer le contrôle journalier ?
              </p>
              <Button
                variant="outline"
                onClick={() => setShowControlePermis(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <FileText className="h-4 w-4 mr-2" />
                Effectuer le contrôle journalier
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Formulaire de contrôle journalier du permis */}
        {permisAssocie && showControlePermis && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="h-5 w-5" />
                Contrôle Journalier du Permis {permisAssocie.type === 'travaux_electrique' ? 'Électrique' : 'de Travail en Hauteur'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permisAssocie.type === 'travaux_electrique' ? (
                <ControleJournalierElectrique
                  permisId={permisAssocie.id}
                  onSubmit={(data) => {
                    const controleData: ControleJournalierPermis = {
                      id: `controle-${Date.now()}`,
                      permisId: permisAssocie.id,
                      createdAt: new Date(),
                      date: new Date(data.date),
                      codeSite: data.codeSite,
                      intervenants: data.intervenants,
                      confirmationMesures: data.confirmationMesures,
                      signatureDemandeur: data.signatureDemandeur,
                      signatureIntervenant: data.signatureIntervenant,
                      signatureClotureDemandeur: data.signatureClotureDemandeur,
                      signatureClotureIntervenant: data.signatureClotureIntervenant,
                    };
                    onControlePermis?.(controleData);
                    setShowControlePermis(false);
                  }}
                  onCancel={() => setShowControlePermis(false)}
                />
              ) : (
                <ControleJournalierHauteur
                  permisId={permisAssocie.id}
                  onSubmit={(data) => {
                    const controleData: ControleJournalierPermis = {
                      id: `controle-${Date.now()}`,
                      permisId: permisAssocie.id,
                      createdAt: new Date(),
                      date: new Date(data.date),
                      codeSite: data.codeSite,
                      intervenants: data.intervenants,
                      confirmationMesures: data.confirmationMesures,
                      signatureDemandeur: data.signatureDemandeur,
                      signatureIntervenant: data.signatureIntervenant,
                      signatureClotureDemandeur: data.signatureClotureDemandeur,
                      signatureClotureIntervenant: data.signatureClotureIntervenant,
                    };
                    onControlePermis?.(controleData);
                    setShowControlePermis(false);
                  }}
                  onCancel={() => setShowControlePermis(false)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Validation finale */}
        <Card className="bg-green-50 border-green-500">
          <CardContent className="p-4">
            <Checkbox
              label={
                <div>
                  <span className="font-medium text-green-900">
                    Je certifie l'exactitude des informations fournies
                  </span>
                  <p className="text-sm text-green-700">
                    En cochant cette case, je confirme que toutes les informations sont exactes et
                    complètes
                  </p>
                </div>
              }
              checked={formData.validee || false}
              onChange={(e) => setFormData({ ...formData, validee: e.target.checked })}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <div className="flex-1" />
          {!isFormValid() && (
            <p className="text-sm text-orange-600">Veuillez remplir tous les champs obligatoires</p>
          )}
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Valider la journée
          </Button>
        </div>
      </div>
    </Modal>
  );
}
