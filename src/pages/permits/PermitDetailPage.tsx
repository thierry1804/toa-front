import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermitStore } from '@/store/permitStore';
import { useAuthStore } from '@/store/authStore';
// import { useI18n } from '@/lib/i18n'; // Unused import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ValidationJournaliereModal from '@/components/permits/ValidationJournaliereModal';
import ControleJournalierModal from '@/components/permits/ControleJournalierModal';
import { ArrowLeft, Edit, CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin, ClipboardList } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { PermitStatus, ControleJournalierPermis } from '@/types';

export default function PermitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPermisGeneralById, getPlanPreventionById, getPermisHauteurById } = usePermitStore();
  const { canAccessFeature } = useAuthStore();
  // const { t } = useI18n(); // TODO: Use translations

  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [controleModalOpen, setControleModalOpen] = useState(false);

  const permis = id ? getPermisGeneralById(id) : null;
  const planPrevention = permis ? getPlanPreventionById(permis.planPreventionId) : null;
  
  // Vérifier si c'est un permis en hauteur
  const permisHauteur = id ? getPermisHauteurById(id) : null;

  if (!permis) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Permis non trouvé</h3>
        <p className="text-gray-600 mb-4">Ce permis n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/permits')}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: PermitStatus) => {
    const statusConfig = {
      brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
      en_attente_validation_chef: {
        label: 'En attente Chef',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      en_attente_validation_hse: {
        label: 'En attente HSE',
        color: 'bg-orange-100 text-orange-800',
        icon: Clock,
      },
      valide: { label: 'Validé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      refuse: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
      en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: FileText },
      cloture: { label: 'Clôturé', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      expire: { label: 'Expiré', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
      icon: FileText,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/permits')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Permis de Travail</h2>
            <p className="mt-1 text-gray-600">{permis.numero}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(permis.status)}
          {canAccessFeature('edit_permits') && permis.status === 'brouillon' && (
            <Button variant="outline" onClick={() => navigate(`/permits/${id}/edit`)}>
              <Edit className="h-5 w-5 mr-2" />
              Modifier
            </Button>
          )}
          {permisHauteur && permis.status === 'valide' && canAccessFeature('validate_permits_chef') && (
            <Button 
              variant="outline" 
              onClick={() => setValidationModalOpen(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              Validation journalière
            </Button>
          )}
          {permis.status === 'en_cours' && canAccessFeature('validate_interventions') && (
            <Button 
              variant="outline" 
              onClick={() => setControleModalOpen(true)}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Contrôle journalier
            </Button>
          )}
        </div>
      </div>

      {/* Référence et dates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Référence</p>
                <p className="font-semibold text-gray-900">{permis.reference || 'En attente'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Date début</p>
                <p className="font-semibold text-gray-900">{formatDate(permis.dateDebut)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Date fin</p>
                <p className="font-semibold text-gray-900">{formatDate(permis.dateFin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Intervenants</p>
                <p className="font-semibold text-gray-900">{permis.nombreIntervenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Détails de l'Intervention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Intitulé des travaux</p>
              <p className="text-gray-900 mt-1">{permis.intituleTravaux}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Localisation</p>
              <p className="text-gray-900 mt-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                {permis.localisation}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Code Site</p>
                <p className="text-gray-900 mt-1">{permis.codeSite}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contractant</p>
                <p className="text-gray-900 mt-1">{permis.contractant}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Travaux à Risques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {permis.travauxRisques.travauxChaud && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-900">Travaux à chaud</span>
                </div>
              )}
              {permis.travauxRisques.travauxHauteur && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-900">Travaux en hauteur</span>
                </div>
              )}
              {permis.travauxRisques.travauxElectrique && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-900">Travaux électriques</span>
                </div>
              )}
              {permis.travauxRisques.travauxEspaceConfine && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-900">Espace confiné</span>
                </div>
              )}
              {permis.travauxRisques.travauxExcavation && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-900">Travaux d'excavation</span>
                </div>
              )}
              {permis.travauxRisques.autres && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-900">Autres</span>
                  </div>
                  {permis.travauxRisques.autresDescription && (
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      {permis.travauxRisques.autresDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan de prévention associé */}
      {planPrevention && (
        <Card>
          <CardHeader>
            <CardTitle>Plan de Prévention Associé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{planPrevention.reference}</p>
                <p className="text-sm text-gray-600 mt-1">{planPrevention.natureIntervention}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {planPrevention.nomSite} ({planPrevention.codeSite || planPrevention.region})
                </p>
                <p className="text-xs text-gray-500">
                  {planPrevention.risques.length} risque(s) identifié(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow de validation */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow de Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Demandeur */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Demandeur</p>
                <p className="text-sm text-gray-600">{permis.demandeurNom}</p>
                {permis.demandeurDate && (
                  <p className="text-xs text-gray-500">{formatDateTime(permis.demandeurDate)}</p>
                )}
              </div>
            </div>

            {/* Chef de projet */}
            <div className="flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  permis.chefProjetDate ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                {permis.chefProjetDate ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Chef de Projet</p>
                {permis.chefProjetNom ? (
                  <>
                    <p className="text-sm text-gray-600">{permis.chefProjetNom}</p>
                    {permis.chefProjetDate && (
                      <p className="text-xs text-gray-500">
                        {formatDateTime(permis.chefProjetDate)}
                      </p>
                    )}
                    {permis.chefProjetCommentaire && (
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {permis.chefProjetCommentaire}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">En attente de validation</p>
                )}
              </div>
            </div>

            {/* HSE */}
            <div className="flex items-start gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  permis.hseDate ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                {permis.hseDate ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Responsable HSE</p>
                {permis.hseNom ? (
                  <>
                    <p className="text-sm text-gray-600">{permis.hseNom}</p>
                    {permis.hseDate && (
                      <p className="text-xs text-gray-500">{formatDateTime(permis.hseDate)}</p>
                    )}
                    {permis.hseCommentaire && (
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {permis.hseCommentaire}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">En attente de validation</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Créé par</p>
              <p className="text-gray-900 mt-1">{permis.creerPar}</p>
            </div>
            <div>
              <p className="text-gray-600">Date de création</p>
              <p className="text-gray-900 mt-1">{formatDateTime(permis.createdAt)}</p>
            </div>
            {permis.modifiePar && (
              <>
                <div>
                  <p className="text-gray-600">Modifié par</p>
                  <p className="text-gray-900 mt-1">{permis.modifiePar}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dernière modification</p>
                  <p className="text-gray-900 mt-1">{formatDateTime(permis.updatedAt)}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de validation journalière */}
      {permisHauteur && (
        <ValidationJournaliereModal
          isOpen={validationModalOpen}
          onClose={() => setValidationModalOpen(false)}
          permisId={id!}
          validations={permisHauteur.validationsJournalieres || []}
        />
      )}

      {/* Modal de contrôle journalier */}
      <ControleJournalierModal
        isOpen={controleModalOpen}
        onClose={() => setControleModalOpen(false)}
        onSubmit={handleControleSubmit}
        permisType={permis.travauxRisques.travauxElectrique ? 'travaux_electrique' : 'travaux_hauteur'}
        permisId={id!}
      />
    </div>
  );

  function handleControleSubmit(data: ControleJournalierPermis) {
    // Ici, on pourrait sauvegarder le contrôle journalier
    console.log('Contrôle journalier soumis:', data);
    setControleModalOpen(false);
    // TODO: Intégrer avec le store des permis pour sauvegarder
  }
}
