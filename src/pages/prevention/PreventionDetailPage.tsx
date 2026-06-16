import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePreventionStore } from '@/store/preventionStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ValidationChefModal from '@/components/prevention/ValidationChefModal';
import ValidationHSEModal from '@/components/prevention/ValidationHSEModal';
import { ArrowLeft, Edit, Printer, Download, Shield, AlertTriangle, Clock, MapPin, Building, FileText, CheckCircle, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';

export default function PreventionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getPlanPreventionById,
    soumettreValidationChef,
    validerParChef,
    refuserParChef,
    validerParHSE,
    refuserParHSE
  } = usePreventionStore();
  const { user, canAccessFeature } = useAuthStore();

  const [showValidationChefModal, setShowValidationChefModal] = useState(false);
  const [showValidationHSEModal, setShowValidationHSEModal] = useState(false);

  const plan = getPlanPreventionById(id || '');

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Shield className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Plan de prévention non trouvé</h3>
        <p className="text-gray-500 mt-2">Le plan demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/prevention')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const getRisqueLevel = (niveau: string) => {
    switch (niveau) {
      case 'critique':
        return { label: 'Critique', color: 'bg-red-100 text-red-800' };
      case 'eleve':
        return { label: 'Élevé', color: 'bg-orange-100 text-orange-800' };
      case 'moyen':
        return { label: 'Moyen', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { label: 'Faible', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleSoumettre = () => {
    if (confirm('Voulez-vous soumettre ce plan pour validation par le Chef de Projet ?')) {
      soumettreValidationChef(plan.id);
    }
  };

  const handleValiderChef = (commentaires?: string) => {
    validerParChef(plan.id, user?.email || '', commentaires);
    setShowValidationChefModal(false);
  };

  const handleRefuserChef = (motif: string) => {
    refuserParChef(plan.id, user?.email || '', motif);
    setShowValidationChefModal(false);
  };

  const handleValiderHSE = (reference: string, commentaires?: string) => {
    validerParHSE(plan.id, user?.email || '', reference, commentaires);
    setShowValidationHSEModal(false);
  };

  const handleRefuserHSE = (motif: string) => {
    refuserParHSE(plan.id, user?.email || '', motif);
    setShowValidationHSEModal(false);
  };

  // Gestion de la modification du plan
  const handleEdit = () => {
    if (!plan) {
      console.error('Aucun plan à modifier');
      return;
    }
    
    console.log('Début de la modification du plan:', plan.id);
    
    try {
      // Données de test complètes pour le formulaire
      const mockFormData = {
        // Informations de base
        reference: plan.reference || 'REF-' + Math.floor(1000 + Math.random() * 9000),
        
        // Entreprise Prestataire
        entreprisePrestataire: plan.entreprisePrestataire || 'Entreprise Test SARL',
        siret: plan.siret || '12345678901234',
        representantPrestataire: plan.representantPrestataire || 'Jean Dupont',
        fonctionPrestataire: plan.fonctionPrestataire || 'Responsable Chantier',
        
        // Maître d'Ouvrage
        maitreOuvrage: plan.maitreOuvrage || 'Mairie de Paris',
        representantMaitreOuvrage: plan.representantMaitreOuvrage || 'Marie Martin',
        contactMaitreOuvrage: plan.contactMaitreOuvrage || '01 23 45 67 89',
        emailMaitreOuvrage: plan.emailMaitreOuvrage || 'contact@mairiedeparis.fr',
        
        // Localisation
        nomSite: plan.nomSite || 'Siège Social',
        adresseSite: plan.adresseSite || '1 Rue de la Paix',
        codePostal: plan.codePostal || '75001',
        ville: plan.ville || 'Paris',
        coordonneesGPS: plan.coordonneesGPS || '48.8566° N, 2.3522° E',
        
        // Description des Travaux
        natureIntervention: plan.natureIntervention || 'Travaux électriques',
        descriptionTravaux: plan.descriptionTravaux || 'Remplacement des installations électriques du bâtiment A',
        nombreIntervenants: plan.nombreIntervenants || 3,
        dureeEstimee: plan.dureeEstimee || 5,
        
        // Planning
        dateDebut: plan.dateDebut || new Date().toISOString().split('T')[0],
        dateFin: plan.dateFin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        horairesTravail: plan.horairesTravail || {
          debut: '08:00',
          fin: '17:00',
          pause: '12:00-13:00'
        },
        
        // Risques Identifiés
        risquesIdentifies: Array.isArray(plan.risquesIdentifies) && plan.risquesIdentifies.length > 0 
          ? plan.risquesIdentifies 
          : [{
              risque: 'Électrocution',
              niveau: 'élevé',
              mesures: 'Coupure générale avant intervention, vérification d\'absence de tension',
              id: 'risk-1'
            }],
        
        // Mesures de prévention
        mesuresPrevention: Array.isArray(plan.mesuresPrevention) && plan.mesuresPrevention.length > 0
          ? plan.mesuresPrevention
          : [
              'Port des EPI obligatoire',
              'Mise en place de balisage de sécurité',
              'Vérification des outils avant utilisation'
            ],
            
        // Équipements de sécurité
        equipementsSecurite: [
          { type: 'Gants isolants', quantite: 3, conforme: true },
          { type: 'Écran facial', quantite: 2, conforme: true },
          { type: 'Harnais', quantite: 2, conforme: true }
        ],
        
        // Consignes de sécurité
        consignesSecurite: 'Toute intervention doit être précédée d\'une analyse des risques. Les EPI doivent être portés en permanence sur le chantier.',
        consignesUrgence: 'En cas d\'accident, composer le 18 ou le 112 et prévenir le responsable sécurité.',
        
        // Formation et documents
        formationSecurite: true,
        dateFormation: new Date().toISOString().split('T')[0],
        nomFormateur: 'Pierre Durand',
        commentaires: 'Aucun commentaire particulier',
        documentsFournis: ['Plan d\'implantation', 'Notice de sécurité'],
        accordResponsable: true
      };
      
      console.log('Données du formulaire préparées:', mockFormData);
      
      // Stocker les données dans le localStorage pour les récupérer dans le formulaire
      const dataToStore = {
        id: plan.id,
        ...mockFormData
      };
      
      console.log('Données à stocker dans localStorage:', dataToStore);
      
      localStorage.setItem('editingPreventionPlan', JSON.stringify(dataToStore));
      console.log('Données stockées avec succès dans localStorage');
      
      // Vérifier que les données ont bien été stockées
      const storedData = localStorage.getItem('editingPreventionPlan');
      console.log('Données vérifiées dans localStorage:', storedData);
      
      // Naviguer vers la page d'ajout avec les données préremplies
      console.log('Navigation vers /prevention/new avec données mock');
      navigate('/prevention/new');
      
    } catch (error) {
      console.error('Erreur lors de la préparation des données de modification:', error);
      showNotification('Une erreur est survenue lors de la préparation de la modification', 'error');
    }
  };

  // Fonction utilitaire pour afficher des notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-lg text-white ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 2700);
  };

  // Gestion du téléchargement du PDF
  const handleDownloadPDF = async () => {
    if (!plan) return;

    showNotification('Préparation du téléchargement...', 'info');
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // En-tête du document
      doc.setFontSize(20);
      doc.text('PLAN DE PRÉVENTION', 105, 20, { align: 'center' });
      
      // Informations de base
      doc.setFontSize(12);
      doc.text(`Référence: ${plan.reference || 'N/A'}`, 20, 40);
      doc.text(`Date de création: ${new Date(plan.createdAt).toLocaleDateString('fr-FR')}`, 20, 50);
      
      // Enregistrer le PDF
      doc.save(`Plan_Prevention_${plan.reference || 'sans_reference'}.pdf`);
      
      showNotification('Téléchargement du PDF terminé', 'success');
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
    }
  };

  // Gestion de l'impression
  const handlePrint = () => {
    if (!plan) return;

    showNotification('Préparation de l\'impression...', 'info');
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Plan de Prévention - ${plan.reference || 'Sans référence'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1e40af; text-align: center; }
              .info { margin-bottom: 20px; }
              .section { margin-top: 30px; }
              .section-title { 
                background-color: #1e40af; 
                color: white; 
                padding: 5px 10px; 
                margin-bottom: 10px;
              }
              @media print {
                @page { margin: 1cm; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>PLAN DE PRÉVENTION</h1>
            
            <div class="info">
              <p><strong>Référence:</strong> ${plan.reference || 'N/A'}</p>
              <p><strong>Date de création:</strong> ${new Date(plan.createdAt).toLocaleDateString('fr-FR')}</p>
              ${plan.updatedAt ? `<p><strong>Dernière mise à jour:</strong> ${new Date(plan.updatedAt).toLocaleDateString('fr-FR')}</p>` : ''}
            </div>
            
            ${plan.entreprisePrestataire ? `
              <div class="section">
                <div class="section-title">ENTREPRISE PRESTATAIRE</div>
                <p><strong>Entreprise:</strong> ${plan.entreprisePrestataire}</p>
                ${plan.representantPrestataire ? `<p><strong>Représentant:</strong> ${plan.representantPrestataire}</p>` : ''}
              </div>
            ` : ''}
            
            ${plan.descriptionTravaux ? `
              <div class="section">
                <div class="section-title">DESCRIPTION DES TRAVAUX</div>
                <p>${plan.descriptionTravaux.replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
            
            <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
              Document généré le ${new Date().toLocaleDateString('fr-FR')} - TOA Platform
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Erreur lors de la préparation de l\'impression:', error);
      showNotification('Erreur lors de la préparation de l\'impression', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
          {user?.role === 'prestataire' && plan.status === 'brouillon' && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}

          {/* Boutons de workflow selon le statut et le rôle */}
          {plan.status === 'brouillon' && user?.role === 'prestataire' && (
            <Button onClick={handleSoumettre}>
              <Send className="h-4 w-4 mr-2" />
              Soumettre pour validation
            </Button>
          )}

          {plan.status === 'soumis_validation_chef' && user?.role === 'chef_projet' && canAccessFeature('validate_prevention_plans_chef') && (
            <Button onClick={() => setShowValidationChefModal(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider
            </Button>
          )}

          {plan.status === 'valide_chef_attente_hse' && user?.role === 'hse' && canAccessFeature('validate_prevention_plans_hse') && (
            <Button onClick={() => setShowValidationHSEModal(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Valider (HSE)
            </Button>
          )}

          {plan.status === 'valide' && (
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary-600" />
                <CardTitle className="text-2xl">{plan.reference}</CardTitle>
              </div>
              <p className="text-gray-500 mt-1">
                Créé le {formatDate(plan.createdAt)} • Dernière mise à jour le {formatDate(plan.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.status === 'valide' 
                  ? 'bg-green-100 text-green-800' 
                  : plan.status === 'en_cours' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.status === 'valide' ? 'Validé' : plan.status === 'en_cours' ? 'En cours' : 'Brouillon'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Informations générales */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Building className="h-5 w-5 text-gray-500 mr-2" />
                  Entreprise prestataire
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{plan.entreprisePrestataire}</p>
                  <p className="text-sm text-gray-600">Numéro RCS: {plan.numeroRCS}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Représentant:</span> {plan.representantPrestataire}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Fonction:</span> {plan.qualiteFonctionRepresentant}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                  Localisation
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{plan.nomSite}</p>
                  <p className="text-sm">{plan.siegeSocial}</p>
                  <p className="text-sm">
                    {plan.localite}, {plan.commune}, {plan.region}
                  </p>
                  {plan.coordonneesGPS && (
                    <p className="text-sm text-gray-500 mt-1">
                      Coordonnées GPS: {plan.coordonneesGPS}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  Période d'intervention
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date de début</p>
                      <p>{formatDate(plan.dateDebut)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date de fin</p>
                      <p>{formatDate(plan.dateFin)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Horaires de travail</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Début</p>
                        <p>{plan.horairesTravail?.debut || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fin</p>
                        <p>{plan.horairesTravail?.fin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pause</p>
                        <p>{plan.horairesTravail?.pause || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nature des travaux et risques */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  Nature de l'intervention
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">{plan.natureIntervention}</p>
                  <p className="text-sm text-gray-700">{plan.descriptionTravaux}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm">
                      <span className="font-medium">Nombre d'intervenants:</span> {plan.nombreIntervenants}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Durée estimée:</span> {plan.dureeEstimee} heures
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  Risques identifiés
                </h3>
                <div className="space-y-3">
                  {plan.risques.map((risque, index) => {
                    const niveau = getRisqueLevel(risque.niveauGravite || 'faible');
                    return (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{risque.description}</p>
                            <p className="text-sm text-gray-600 mt-1">{risque.categorie}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${niveau.color}`}>
                            {niveau.label}
                          </span>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">Mesures de prévention:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {(risque.mesuresPrevention || []).map((mesure, i) => (
                              <li key={i} className="flex items-start">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                                <span>{mesure}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {risque.equipementsNecessaires && risque.equipementsNecessaires.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Équipements nécessaires:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {risque.equipementsNecessaires.map((equipement, i) => (
                                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {equipement}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals de validation */}
      <ValidationChefModal
        isOpen={showValidationChefModal}
        onClose={() => setShowValidationChefModal(false)}
        onValidate={handleValiderChef}
        onReject={handleRefuserChef}
        plan={plan}
      />

      <ValidationHSEModal
        isOpen={showValidationHSEModal}
        onClose={() => setShowValidationHSEModal(false)}
        onValidate={handleValiderHSE}
        onReject={handleRefuserHSE}
        plan={plan}
      />
    </div>
  );
}
