import { useNavigate, useParams } from 'react-router-dom';
import { usePermitStore } from '@/store/permitStore';
import { useToastStore } from '@/store/toastStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PermitGeneralForm from '@/components/forms/PermitGeneralForm';
import PermitHauteurForm from '@/components/forms/PermitHauteurForm';
import PermitElectriqueForm from '@/components/forms/PermitElectriqueForm';
import { ArrowLeft, FileText, Wrench, Zap, Building } from 'lucide-react';

export default function PermitFormPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { addPermisGeneral, addPermisHauteur, addPermisElectrique } = usePermitStore();
  const { success, error } = useToastStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleComplete = async (data: any) => {
    try {
      if (type === 'general') {
        addPermisGeneral(data);
        success('Permis général créé et soumis pour validation');
      } else if (type === 'hauteur') {
        addPermisHauteur(data);
        success('Permis hauteur créé et soumis pour validation');
      } else if (type === 'electrique') {
        addPermisElectrique(data);
        success('Permis électrique créé et soumis pour validation');
      }

      navigate('/permits');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      error('Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleCancel = () => {
    navigate('/permits');
  };

  // Si aucun type n'est spécifié, afficher la sélection
  if (!type) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/permits')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Créer un Permis de Travail</h2>
            <p className="mt-1 text-gray-600">Sélectionnez le type de permis à créer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/permits/new/general')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                Permis Général
              </CardTitle>
              <CardDescription>
                Permis de travail général pour tous types d'interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Utilisé pour les interventions standard nécessitant une autorisation de travail.
                Inclut l'évaluation des risques et les mesures de prévention générales.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/permits/new/hauteur')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building className="h-6 w-6 text-orange-600" />
                Permis Hauteur
              </CardTitle>
              <CardDescription>
                Permis spécialisé pour travaux en hauteur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Spécialement conçu pour les interventions à plus de 3 mètres de hauteur.
                Inclut l'évaluation des risques de chute et les équipements de protection.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/permits/new/electrique')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-600" />
                Permis Électrique
              </CardTitle>
              <CardDescription>
                Permis spécialisé pour travaux électriques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Pour les interventions sur installations électriques.
                Inclut la consignation énergétique et les mesures de protection électrique.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Afficher le formulaire correspondant au type
  if (type === 'general') {
    return <PermitGeneralForm onComplete={handleComplete} onCancel={handleCancel} />;
  } else if (type === 'hauteur') {
    return <PermitHauteurForm onComplete={handleComplete} onCancel={handleCancel} />;
  } else if (type === 'electrique') {
    return <PermitElectriqueForm onComplete={handleComplete} onCancel={handleCancel} />;
  }

  // Type non reconnu
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/permits')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Type de permis non reconnu</h2>
          <p className="mt-1 text-gray-600">Le type de permis demandé n'existe pas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Type de permis invalide
          </h3>
          <p className="text-gray-600 mb-4">
            Le type de permis "{type}" n'est pas reconnu.
          </p>
          <Button onClick={() => navigate('/permits/new')}>
            Retour à la sélection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

