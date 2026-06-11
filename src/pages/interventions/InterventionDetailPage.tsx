import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInterventionStore } from '@/store/interventionStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DailyValidationModal from '@/components/interventions/DailyValidationModal';
import Take5Form from '@/components/interventions/Take5Form';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Plus,
  Eye,
  WifiOff,
  XCircle,
  Play,
  Pause,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { ValidationInterventionJournaliere, Take5Record } from '@/types';

export default function InterventionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    interventions,
    addValidationJournaliere,
    addTake5Record,
    updateInterventionStatus,
    cloturerIntervention,
  } = useInterventionStore();
  const { user, canAccessFeature } = useAuthStore();

  const intervention = interventions.find((i) => i.id === id);

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showTake5Form, setShowTake5Form] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'validations' | 'take5' | 'documents'>(
    'overview'
  );

  if (!intervention) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Intervention non trouvée</h3>
        <Link to="/interventions">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    );
  }

  const handleAddValidation = (validation: Omit<ValidationInterventionJournaliere, 'id'>) => {
    const newValidation: ValidationInterventionJournaliere = {
      ...validation,
      id: `VAL-${Date.now()}`,
    };
    addValidationJournaliere(intervention.id, newValidation);

    // Mettre à jour le statut si c'est la première validation
    if (
      intervention.validationsJournalieres.length === 0 &&
      intervention.status === 'planifiee'
    ) {
      updateInterventionStatus(intervention.id, 'en_cours');
    }
  };

  const handleAddTake5 = (take5: Omit<Take5Record, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTake5: Take5Record = {
      ...take5,
      id: `T5-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addTake5Record(intervention.id, newTake5);
    setShowTake5Form(false);
  };

  const handleCloturer = () => {
    if (confirm('Êtes-vous sûr de vouloir clôturer cette intervention ?')) {
      cloturerIntervention(
        intervention.id,
        user?.email || '',
        'Intervention terminée avec succès',
        new Date()
      );
    }
  };

  const handleDemarrer = () => {
    if (confirm('Voulez-vous démarrer cette intervention maintenant ?')) {
      updateInterventionStatus(intervention.id, 'en_cours');
    }
  };

  const handleSuspendre = () => {
    const raison = prompt('Raison de la suspension :');
    if (raison) {
      updateInterventionStatus(intervention.id, 'suspendue');
      // Ajouter observation
      const observations = intervention.observations || [];
      observations.push(`Suspension le ${new Date().toLocaleDateString('fr-FR')} - Raison: ${raison}`);
      // Note: Il faudrait ajouter une fonction updateIntervention pour mettre à jour les observations
    }
  };

  const handleReprendre = () => {
    updateInterventionStatus(intervention.id, 'en_cours');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planifiee: { label: 'Planifiée', variant: 'secondary' as const, icon: Calendar },
      en_cours: { label: 'En cours', variant: 'primary' as const, icon: Clock },
      suspendue: { label: 'Suspendue', variant: 'warning' as const, icon: AlertTriangle },
      terminee: { label: 'Terminée', variant: 'success' as const, icon: CheckCircle2 },
      annulee: { label: 'Annulée', variant: 'error' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'secondary' as const,
      icon: Clock,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const calculateAvancement = () => {
    if (intervention.validationsJournalieres.length === 0) return 0;
    const latestValidation =
      intervention.validationsJournalieres[intervention.validationsJournalieres.length - 1];
    return latestValidation.avancementPourcentage || 0;
  };

  const avancement = calculateAvancement();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to="/interventions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{intervention.reference}</h2>
              {getStatusBadge(intervention.status)}
              {intervention.zoneEnclavee && (
                <Badge variant="warning">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Zone enclavée
                </Badge>
              )}
            </div>
            <p className="text-gray-600">{intervention.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Bouton Démarrer pour statut planifiee */}
          {intervention.status === 'planifiee' && canAccessFeature('start_interventions') && (
            <Button onClick={handleDemarrer}>
              <Play className="h-4 w-4 mr-2" />
              Démarrer l'intervention
            </Button>
          )}

          {/* Boutons pour statut en_cours */}
          {intervention.status === 'en_cours' && canAccessFeature('validate_interventions') && (
            <>
              <Button onClick={() => setShowValidationModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Validation journalière
              </Button>
              <Button variant="outline" onClick={() => setShowTake5Form(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Take 5
              </Button>
            </>
          )}

          {/* Bouton Suspendre pour statut en_cours */}
          {intervention.status === 'en_cours' && canAccessFeature('suspend_interventions') && (
            <Button variant="warning" onClick={handleSuspendre}>
              <Pause className="h-4 w-4 mr-2" />
              Suspendre
            </Button>
          )}

          {/* Bouton Reprendre pour statut suspendue */}
          {intervention.status === 'suspendue' && canAccessFeature('resume_interventions') && (
            <Button onClick={handleReprendre}>
              <Play className="h-4 w-4 mr-2" />
              Reprendre
            </Button>
          )}

          {/* Bouton Clôturer pour statut en_cours avec avancement 100% */}
          {intervention.status === 'en_cours' &&
            canAccessFeature('close_interventions') &&
            avancement >= 100 && (
              <Button variant="success" onClick={handleCloturer}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Clôturer
              </Button>
            )}
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600">Site</p>
                <p className="font-semibold text-gray-900">{intervention.codeSite}</p>
                <p className="text-xs text-gray-500">{intervention.nomSite}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Prestataire</p>
                <p className="font-semibold text-gray-900">{intervention.prestataire}</p>
                <p className="text-xs text-gray-500">
                  {intervention.nombreIntervenants} intervenant
                  {intervention.nombreIntervenants > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Période</p>
                <p className="font-semibold text-gray-900">{formatDate(intervention.dateDebut)}</p>
                <p className="text-xs text-gray-500">au {formatDate(intervention.dateFin)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avancement</p>
                <p className="font-semibold text-gray-900">{avancement}%</p>
                <p className="text-xs text-gray-500">
                  {intervention.validationsJournalieres.length} validation
                  {intervention.validationsJournalieres.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Progression de l'intervention</span>
            <span className="font-bold text-primary-600">{avancement}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-primary-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
              style={{ width: `${avancement}%` }}
            >
              {avancement > 10 && (
                <span className="text-xs text-white font-medium">{avancement}%</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Eye },
            {
              id: 'validations',
              label: `Validations (${intervention.validationsJournalieres.length})`,
              icon: CheckCircle2,
            },
            {
              id: 'take5',
              label: `Take 5 (${intervention.take5Records.length})`,
              icon: Shield,
            },
            {
              id: 'documents',
              label: `Documents (${intervention.documentsProgres.length})`,
              icon: FileText,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'validations' | 'take5' | 'documents')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails de l'intervention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-600">Référence:</span>
                <span className="font-medium">{intervention.reference}</span>

                <span className="text-gray-600">Permis associé:</span>
                <Link to={`/permits/${intervention.permisId}`} className="text-primary-600 hover:underline">
                  {intervention.permisReference}
                </Link>

                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{intervention.typeIntervention}</span>

                <span className="text-gray-600">Région:</span>
                <span className="font-medium">{intervention.region}</span>

                <span className="text-gray-600">Responsable chantier:</span>
                <span className="font-medium">{intervention.responsableChantier}</span>

                <span className="text-gray-600">Contact:</span>
                <span className="font-medium">{intervention.responsableContact}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Validations journalières</span>
                <span className="text-2xl font-bold text-primary-600">
                  {intervention.validationsJournalieres.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Take 5 effectués</span>
                <span className="text-2xl font-bold text-green-600">
                  {intervention.take5Records.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Incidents signalés</span>
                <span
                  className={cn(
                    'text-2xl font-bold',
                    (intervention.incidents?.length || 0) > 0 ? 'text-red-600' : 'text-gray-400'
                  )}
                >
                  {intervention.incidents?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Documents</span>
                <span className="text-2xl font-bold text-blue-600">
                  {intervention.documentsProgres.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {intervention.observations && intervention.observations.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Observations générales</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {intervention.observations.map((obs, index) => (
                    <li key={index}>{obs}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'validations' && (
        <div className="space-y-4">
          {intervention.validationsJournalieres.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune validation journalière enregistrée</p>
                {intervention.status === 'en_cours' && (
                  <Button className="mt-4" onClick={() => setShowValidationModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une validation
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            intervention.validationsJournalieres
              .slice()
              .reverse()
              .map((validation) => (
                <Card key={validation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {formatDate(validation.date)}
                        </CardTitle>
                        <CardDescription>
                          {validation.heureDebut} - {validation.heureFin || 'En cours'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={validation.validee ? 'success' : 'warning'}>
                          {validation.validee ? 'Validée' : 'En attente'}
                        </Badge>
                        {validation.take5Effectue && (
                          <Badge variant="primary">
                            <Shield className="h-3 w-3 mr-1" />
                            Take 5
                          </Badge>
                        )}
                        {validation.incidents && (
                          <Badge variant="error">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Incidents
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Personnel */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Personnel ({validation.nombrePersonnes})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {validation.listePersonnel.map((person, i) => (
                          <span
                            key={i}
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {person}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Conditions */}
                    {validation.conditionsMeteo && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Météo:</span>{' '}
                          <span className="font-medium">{validation.conditionsMeteo}</span>
                        </div>
                        {validation.temperatureC && (
                          <div>
                            <span className="text-gray-600">Température:</span>{' '}
                            <span className="font-medium">{validation.temperatureC}°C</span>
                          </div>
                        )}
                        {validation.vitesseVentKmh && (
                          <div>
                            <span className="text-gray-600">Vent:</span>{' '}
                            <span className="font-medium">{validation.vitesseVentKmh} km/h</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vérifications de sécurité */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Vérifications de sécurité</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(validation.verificationsSecurite).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            {value ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={value ? 'text-green-700' : 'text-red-700'}>
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Activités */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Activités réalisées</h4>
                      <p className="text-gray-700 text-sm">{validation.activitesRealisees}</p>
                    </div>

                    {/* Avancement */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Avancement: {validation.avancementPourcentage}%
                      </h4>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${validation.avancementPourcentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Incidents */}
                    {validation.incidents && validation.incidentsDetails && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Incidents signalés
                        </h4>
                        <p className="text-red-700 text-sm">{validation.incidentsDetails}</p>
                      </div>
                    )}

                    {/* Observations */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Observations</h4>
                      <p className="text-gray-700 text-sm">{validation.observationsJour}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}

      {activeTab === 'take5' && (
        <div className="space-y-4">
          {showTake5Form ? (
            <Take5Form
              interventionId={intervention.id}
              onSubmit={handleAddTake5}
              onCancel={() => setShowTake5Form(false)}
            />
          ) : (
            <>
              {intervention.take5Records.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun Take 5 enregistré</p>
                    {intervention.status === 'en_cours' && (
                      <Button className="mt-4" onClick={() => setShowTake5Form(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Effectuer un Take 5
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {intervention.status === 'en_cours' && (
                    <div className="flex justify-end">
                      <Button onClick={() => setShowTake5Form(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Take 5
                      </Button>
                    </div>
                  )}
                  {intervention.take5Records
                    .slice()
                    .reverse()
                    .map((take5) => (
                      <Card key={take5.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {formatDate(take5.date)} - {take5.heure}
                              </CardTitle>
                              <CardDescription>
                                Responsable: {take5.responsableNom}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              {take5.transmisHSE && (
                                <Badge variant="success">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Transmis HSE
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Tâche</h4>
                            <p className="text-gray-700 text-sm">{take5.tacheDescription}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Localisation: {take5.localisation}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Équipe ({take5.equipe.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {take5.equipe.map((membre, i) => (
                                <span
                                  key={i}
                                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                                >
                                  {membre}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { label: 'Arrêter', complete: take5.etape1_arreter.complete },
                              { label: 'Observer', complete: take5.etape2_observer.complete },
                              { label: 'Analyser', complete: take5.etape3_analyser.complete },
                              { label: 'Contrôler', complete: take5.etape4_controler.complete },
                              { label: 'Procéder', complete: take5.etape5_proceder.complete },
                            ].map((etape, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'p-2 rounded text-center text-xs',
                                  etape.complete
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                )}
                              >
                                <div className="font-medium">{i + 1}</div>
                                <div>{etape.label}</div>
                                {etape.complete && (
                                  <CheckCircle2 className="h-3 w-3 mx-auto mt-1" />
                                )}
                              </div>
                            ))}
                          </div>

                          {take5.etape3_analyser.risquesEvalues.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Risques identifiés ({take5.etape3_analyser.risquesEvalues.length})
                              </h4>
                              <div className="space-y-2">
                                {take5.etape3_analyser.risquesEvalues.map((risque, i) => (
                                  <div
                                    key={i}
                                    className="bg-gray-50 p-2 rounded text-sm flex items-center justify-between"
                                  >
                                    <span>{risque.danger}</span>
                                    <Badge
                                      variant={
                                        risque.niveauRisque === 'critique'
                                          ? 'error'
                                          : risque.niveauRisque === 'eleve'
                                          ? 'warning'
                                          : 'secondary'
                                      }
                                    >
                                      {risque.niveauRisque}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {take5.etape4_controler.mesuresControle.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Mesures de contrôle ({take5.etape4_controler.mesuresControle.length}
                                )
                              </h4>
                              <div className="space-y-1">
                                {take5.etape4_controler.mesuresControle.map((mesure, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <span>{mesure.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun document disponible</p>
            <p className="text-sm text-gray-400 mt-2">
              Fonctionnalité de gestion des documents à venir
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <DailyValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onSubmit={handleAddValidation}
        interventionRef={intervention.reference}
        codeSite={intervention.codeSite}
      />
    </div>
  );
}
