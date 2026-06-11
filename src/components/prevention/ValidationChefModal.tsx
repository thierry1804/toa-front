import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { PlanPrevention } from '@/types/prevention';

interface ValidationChefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (commentaires?: string) => void;
  onReject: (motif: string) => void;
  plan: PlanPrevention;
}

export default function ValidationChefModal({
  isOpen,
  onClose,
  onValidate,
  onReject,
  plan,
}: ValidationChefModalProps) {
  const [commentaires, setCommentaires] = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleValidate = () => {
    onValidate(commentaires.trim() || undefined);
    setCommentaires('');
    setShowRejectForm(false);
  };

  const handleReject = () => {
    if (!motifRefus.trim()) {
      alert('Veuillez indiquer le motif du refus');
      return;
    }
    onReject(motifRefus.trim());
    setMotifRefus('');
    setShowRejectForm(false);
  };

  const handleClose = () => {
    setCommentaires('');
    setMotifRefus('');
    setShowRejectForm(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" title="Validation Chef de Projet">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Validation du Plan de Prévention
            </h2>
            <p className="text-gray-600">
              Validation par le Chef de Projet - {plan.reference}
            </p>
          </div>

          {/* Récapitulatif du plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Récapitulatif du Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Projet/Activité</p>
                  <p className="font-medium">{plan.projetActivite}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Site</p>
                  <p className="font-medium">{plan.nomSite} ({plan.codeSite})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prestataire</p>
                  <p className="font-medium">{plan.entreprisePrestataire}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Période</p>
                  <p className="font-medium">
                    {plan.dateDebut ? (new Date(plan.dateDebut)).toLocaleDateString('fr-FR') : 'Non définie'} - {plan.dateFin ? (new Date(plan.dateFin)).toLocaleDateString('fr-FR') : 'Non définie'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description des travaux</p>
                <p className="text-sm">{plan.descriptionTravaux}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre d'intervenants</p>
                  <p className="font-medium">{plan.nombreIntervenants || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Durée estimée</p>
                  <p className="font-medium">{plan.dureeEstimee ? `${plan.dureeEstimee} heures` : 'Non spécifiée'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horaires</p>
                  <p className="font-medium">
                    {plan.horairesTravail ? `${plan.horairesTravail.debut || ''} - ${plan.horairesTravail.fin || ''}` : 'Non spécifiés'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risques identifiés */}
          <Card>
            <CardHeader>
              <CardTitle>Risques Identifiés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plan.risques.map((risque) => (
                  <div key={risque.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{risque.description}</p>
                      <p className="text-sm text-gray-600">
                        {risque.categorie} - Niveau: {risque.niveauGravite}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Probabilité: {risque.probabilite}</p>
                      <p className="text-sm text-gray-600">Impact: {risque.impact}</p>
                    </div>
                  </div>
                ))}
                {plan.risques.length === 0 && (
                  <p className="text-gray-500 italic">Aucun risque identifié</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions de validation */}
          {!showRejectForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaires (optionnel)
                  </label>
                  <Textarea
                    value={commentaires}
                    onChange={(e) => setCommentaires(e.target.value)}
                    placeholder="Ajoutez des commentaires sur votre validation..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                  <Button onClick={handleValidate} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Refus du Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif du refus *
                  </label>
                  <Textarea
                    value={motifRefus}
                    onChange={(e) => setMotifRefus(e.target.value)}
                    placeholder="Indiquez clairement les raisons du refus..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmer le refus
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Modal>
  );
}
