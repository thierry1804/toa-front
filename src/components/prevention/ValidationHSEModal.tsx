import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle2, XCircle, FileText, Shield, AlertTriangle } from 'lucide-react';
import type { PlanPrevention } from '@/types/prevention';

interface ValidationHSEModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (reference: string, commentaires?: string) => void;
  onReject: (motif: string) => void;
  plan: PlanPrevention;
}

export default function ValidationHSEModal({
  isOpen,
  onClose,
  onValidate,
  onReject,
  plan,
}: ValidationHSEModalProps) {
  const [reference, setReference] = useState('');
  const [commentaires, setCommentaires] = useState('');
  const [motifRefus, setMotifRefus] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleValidate = () => {
    if (!reference.trim()) {
      alert('Veuillez attribuer une référence au plan');
      return;
    }
    onValidate(reference.trim(), commentaires.trim() || undefined);
    setReference('');
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
    setReference('');
    setCommentaires('');
    setMotifRefus('');
    setShowRejectForm(false);
    onClose();
  };

  // Vérifications de conformité ISO 14001/45001
  const verificationsConformite = [
    {
      item: 'Identification et évaluation des risques',
      conforme: plan.risques.length > 0,
      description: 'Les risques ont été identifiés et évalués',
    },
    {
      item: 'Mesures de prévention appropriées',
      conforme: plan.risques.every(r => r.mesuresPrevention.length > 0),
      description: 'Des mesures de prévention sont définies pour chaque risque',
    },
    {
      item: 'Formation du personnel',
      conforme: plan.formation.personnelForme && plan.formation.formationsRequises.length > 0,
      description: 'Le personnel est formé et les formations requises sont identifiées',
    },
    {
      item: 'Équipements de protection',
      conforme: plan.equipements.equipementsProtection.length > 0,
      description: 'Les équipements de protection nécessaires sont identifiés',
    },
    {
      item: 'Procédures d\'urgence',
      conforme: plan.proceduresUrgence.planEvacuation && plan.proceduresUrgence.numerosUrgence.length > 0,
      description: 'Les procédures d\'urgence sont définies',
    },
    {
      item: 'Surveillance et contrôle',
      conforme: plan.surveillance.controlesReguliers && plan.surveillance.responsableControle,
      description: 'Un système de surveillance est mis en place',
    },
  ];

  const conformiteGenerale = verificationsConformite.every(v => v.conforme);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" title="Validation HSE">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Validation HSE du Plan de Prévention
            </h2>
            <p className="text-gray-600">
              Validation finale et attribution de référence - {plan.reference}
            </p>
          </div>

          {/* Vérification de conformité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Vérification de Conformité ISO 14001/45001
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verificationsConformite.map((verification, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {verification.conforme ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{verification.item}</p>
                        <p className="text-sm text-gray-600">{verification.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        verification.conforme 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {verification.conforme ? 'Conforme' : 'Non conforme'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-4 p-4 rounded-lg ${
                conformiteGenerale 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {conformiteGenerale ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <p className={`font-medium ${
                    conformiteGenerale ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {conformiteGenerale 
                      ? 'Le plan est conforme aux exigences ISO 14001/45001' 
                      : 'Le plan présente des non-conformités aux exigences ISO 14001/45001'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-sm text-gray-600">Validation Chef</p>
                  <p className="font-medium">
                    {plan.validationChef?.valideePar || 'Non validé'} - {plan.validationChef?.dateValidation?.toLocaleDateString('fr-FR') || 'Non définie'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions de validation */}
          {!showRejectForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Validation HSE et Attribution de Référence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Référence attribuée *
                  </label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: PP-HSE-2025-001"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format recommandé: PP-HSE-YYYY-XXX
                  </p>
                </div>

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
                    disabled={!conformiteGenerale}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                  <Button 
                    onClick={handleValidate} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!conformiteGenerale}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider et Attribuer Référence
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
