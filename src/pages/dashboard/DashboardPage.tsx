import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  TrendingUp,
  Activity,
  Calendar,
  User,
  HardHat,
  MapPin,
  AlertCircle,
  Clock as ClockIcon,
  ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal, { ModalFooter } from '@/components/ui/Modal';

// Données de démonstration
const demoStats = {
  totalPermis: 247,
  permisActifs: 12,
  permisEnAttente: 5,
  permisValides: 218,
  interventionsJour: 8,
  sitesActifs: 45,
  risquesCritiques: 3,
};

const recentPermits = [
  {
    id: '1',
    reference: 'PTW-20251013-001',
    type: 'travaux_hauteur',
    site: 'ANT-001',
    status: 'en_attente_validation_chef',
    date: new Date(),
  },
  {
    id: '2',
    reference: 'PTW-20251013-002',
    type: 'travaux_electrique',
    site: 'MAH-045',
    status: 'valide',
    date: new Date(),
  },
  {
    id: '3',
    reference: 'PTW-20251012-045',
    type: 'general',
    site: 'TOA-123',
    status: 'en_cours',
    date: new Date(Date.now() - 86400000),
  },
];

interface PermitDetailModalProps {
  permit: {
    id: string;
    reference: string;
    type: string;
    site: string;
    status: string;
    date: Date;
  } | null;
  onClose: () => void;
  t: (key: string) => string;
}

const PermitDetailModal = ({ permit, onClose, t }: PermitDetailModalProps) => {
  if (!permit) return null;

  const statusConfig = {
    en_attente_validation_chef: { label: t(`permits.statuses.${permit.status}`), color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    en_attente_validation_hse: { label: t(`permits.statuses.${permit.status}`), color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    valide: { label: t(`permits.statuses.${permit.status}`), color: 'bg-green-100 text-green-800 border-green-200' },
    en_cours: { label: t(`permits.statuses.${permit.status}`), color: 'bg-blue-100 text-blue-800 border-blue-200' },
    refuse: { label: t(`permits.statuses.${permit.status}`), color: 'bg-red-100 text-red-800 border-red-200' },
    cloture: { label: t(`permits.statuses.${permit.status}`), color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  const status = statusConfig[permit.status as keyof typeof statusConfig] || { label: permit.status, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  if (!permit) return null;

  return (
    <Modal
      isOpen={!!permit}
      onClose={onClose}
      title="Détails du permis"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with reference and status */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{permit.reference}</h3>
            <p className="text-sm text-gray-500">Permis de travail</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${status.color} ${status.color.includes('bg-') ? 'border-opacity-50' : ''}`}>
            {status.label}
          </span>
        </div>

          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Demandeur</p>
                  <p>John Doe</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <HardHat className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type de travaux</p>
                  <p>{t(`permits.types.${permit.type}`)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Site</p>
                  <p>{permit.site}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date de début</p>
                  <p>{new Date(permit.date).toLocaleDateString('fr-FR')} - 08:00</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Durée prévue</p>
                  <p>8 heures</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Risques identifiés</p>
                  <p>Travaux en hauteur, Risque électrique</p>
                </div>
              </div>
            </div>
          </div>

        {/* Actions */}
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button 
            onClick={async () => {
              try {
                // Create a new PDF document in portrait mode
                const doc = new jsPDF({
                  orientation: 'portrait',
                  unit: 'mm',
                  format: 'a4'
                });
                
                // Set document properties
                doc.setProperties({
                  title: `Permis de Travail - ${permit.reference}`,
                  subject: 'Permis de Travail',
                  author: 'TOA Platform',
                  keywords: 'permis, travail, sécurité, chantier',
                  creator: 'TOA Platform'
                });

                // Constants for layout
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 15;
                const lineHeight = 7;
                let yPos = 20;
                
                // Add company logo and header
                try {
                  // Logo integration placeholder
                } catch (e) {
                  console.warn('Could not load logo:', e);
                }  
                
                // Add main title with border
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(24);
                const titleText = 'PERMIS DE TRAVAIL';
                // Title width calculation (commented out as we're using center alignment)
                // const titleWidth = doc.getTextWidth(titleText);
                
                // Add background rectangle for title
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F');
                
                // Add title text
                doc.text(titleText, pageWidth / 2, yPos + 10, { align: 'center' });
                
                // Add reference and date below title
                yPos += 20;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.text(`Référence: ${permit.reference}`, margin, yPos);
                doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos, { align: 'right' });
                
                // Add company info in smaller text below
                yPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('TOA PLATFORM', margin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text('Sécurité au travail', margin, yPos + 4);
                
                // Add divider line
                yPos += 5;
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                
                // Section: Détails du permis
                const sectionSpacing = 10; // Define the section spacing
                yPos += sectionSpacing;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.text('DÉTAILS DU PERMIS', margin + 5, yPos + 5);
                
                // Add permit details in a table-like format with better spacing
                yPos += 12;
                const addDetailRow = (label: string, value: string, indent = 0) => {
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${label} :`, margin + 5 + (indent * 5), yPos);
                  doc.setFont('helvetica', 'normal');
                  const labelWidth = doc.getTextWidth(label + ' : ');
                  doc.text(value, margin + 10 + labelWidth + (indent * 5), yPos);
                  yPos += lineHeight;
                };
                
                addDetailRow('Type de travaux', t(`permits.types.${permit.type}`));
                addDetailRow('Site', permit.site);
                addDetailRow('Localisation', 'Zone principale');
                addDetailRow('Statut', t(`permits.statuses.${permit.status}`));
                addDetailRow('Date de début', permit.date.toLocaleDateString('fr-FR'));
                addDetailRow('Heure de début', '08:00');
                addDetailRow('Durée prévue', '8 heures');
                
                // Section: Responsables
                yPos += sectionSpacing / 2;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.text('RESPONSABLES', margin + 5, yPos + 5);
                
                // Add responsible persons with better spacing
                yPos += 12;
                const addResponsible = (role: string, name: string, phone: string) => {
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${role} :`, margin + 5, yPos);
                  doc.setFont('helvetica', 'normal');
                  const roleWidth = doc.getTextWidth(role + ' : ');
                  doc.text(name, margin + 10 + roleWidth, yPos);
                  doc.text(phone, margin + 100, yPos);
                  yPos += lineHeight;
                };
                
                addResponsible('Demandeur', 'Jean Dupont', '+261 34 12 345 67');
                addResponsible('Chef de chantier', 'Marie Martin', '+261 34 23 456 78');
                addResponsible('Responsable HSE', 'Paul Durand', '+261 34 34 567 89');
                
                // Section: Consignes de sécurité
                yPos += sectionSpacing / 2;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
                doc.text('CONSIGNES DE SÉCURITÉ', margin + 5, yPos + 5);
                
                // Add safety instructions with better bullet points
                yPos += 12;
                const safetyInstructions = [
                  'Port des EPI obligatoire dans la zone de travail',
                  'Zone de travail délimitée et signalée',
                  'Extincteur disponible à proximité',
                  'Premier secours disponibles au poste de sécurité',
                  'Arrêt d\'urgence accessible',
                  'Consignes spécifiques : Voir annexe sécurité'
                ];
                
                safetyInstructions.forEach(instruction => {
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(10);
                  // Split long text into multiple lines if needed
                  const maxWidth = pageWidth - 2 * margin - 10;
                  const lines = doc.splitTextToSize('• ' + instruction, maxWidth);
                  doc.text(lines, margin + 5, yPos);
                  yPos += (lines.length * lineHeight);
                });
                
                // Add page border
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.rect(margin - 5, 10, pageWidth - 2 * margin + 10, yPos + 20);
                
                // Add footer
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Document généré par TOA Platform', pageWidth / 2, 285, { align: 'center' });
                doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, 290, { align: 'center' });
                
                // Save the PDF with a proper filename
                doc.save(`Permis-Travail-${permit.reference}.pdf`);
              } catch (error) {
                console.error('Erreur lors de la génération du PDF:', error);
                alert('Une erreur est survenue lors de la génération du PDF');
              }
            }}
          >
            Télécharger le PDF <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selectedPermit, setSelectedPermit] = useState<typeof recentPermits[0] | null>(null);

  const statsCards = [
    {
      title: t('dashboard.totalPermits'),
      value: demoStats.totalPermis,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('dashboard.activePermits'),
      value: demoStats.permisActifs,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('dashboard.pendingPermits'),
      value: demoStats.permisEnAttente,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: t('dashboard.todayInterventions'),
      value: demoStats.interventionsJour,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('dashboard.activeSites'),
      value: demoStats.sitesActifs,
      icon: Building,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: t('dashboard.criticalRisks'),
      value: demoStats.risquesCritiques,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      en_attente_validation_chef: { label: t(`permits.statuses.${status}`), color: 'bg-yellow-100 text-yellow-800' },
      en_attente_validation_hse: { label: t(`permits.statuses.${status}`), color: 'bg-yellow-100 text-yellow-800' },
      valide: { label: t(`permits.statuses.${status}`), color: 'bg-green-100 text-green-800' },
      en_cours: { label: t(`permits.statuses.${status}`), color: 'bg-blue-100 text-blue-800' },
      refuse: { label: t(`permits.statuses.${status}`), color: 'bg-red-100 text-red-800' },
      cloture: { label: t(`permits.statuses.${status}`), color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {t('auth.welcome')}, {user?.prenom} !
        </h2>
        <p className="mt-1 text-gray-600">{t('dashboard.welcomeMessage')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent permits */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentPermits')}</CardTitle>
          <CardDescription>Derniers permis créés ou modifiés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPermits.map((permit) => (
              <div
                key={permit.id}
                onClick={() => setSelectedPermit(permit)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{permit.reference}</p>
                    <p className="text-sm text-gray-600">
                      {t(`permits.types.${permit.type}`)} - {permit.site}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {new Date(permit.date).toLocaleDateString('fr-FR')}
                  </span>
                  {getStatusBadge(permit.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/permits/new')}
              className="p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Nouveau permis</p>
              <p className="text-sm text-gray-600">Créer une demande de permis</p>
            </button>
            <button
              onClick={() => navigate('/prevention/new')}
              className="p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <FileText className="h-6 w-6 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Plan de prévention</p>
              <p className="text-sm text-gray-600">Créer un plan de prévention</p>
            </button>
            <button
              onClick={() => navigate('/interventions')}
              className="p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Mes interventions</p>
              <p className="text-sm text-gray-600">Voir mes interventions en cours</p>
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* Permit Detail Modal */}
      <PermitDetailModal 
        permit={selectedPermit} 
        onClose={() => setSelectedPermit(null)} 
        t={t} 
      />
    </div>
  );
}
