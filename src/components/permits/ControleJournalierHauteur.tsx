import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Checkbox from '@/components/ui/Checkbox';
import { Calendar, Users, Wind, CheckCircle2, XCircle } from 'lucide-react';

interface ControleJournalierHauteurProps {
  permisId: string;
  onSubmit: (data: ControleJournalierHauteurData) => void;
  onCancel: () => void;
}

interface ControleJournalierHauteurData {
  date: string;
  codeSite: string;
  intervenants: string[];
  confirmationMesures: boolean;
  vitesseVent: number;
  signatureDemandeur: string;
  signatureIntervenant: string;
  signatureClotureDemandeur: string;
  signatureClotureIntervenant: string;
}

export default function ControleJournalierHauteur({
  onSubmit,
  onCancel,
}: ControleJournalierHauteurProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    codeSite: '',
    intervenants: [''],
    confirmationMesures: false,
    vitesseVent: 0,
    signatureDemandeur: '',
    signatureIntervenant: '',
    signatureClotureDemandeur: '',
    signatureClotureIntervenant: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleIntervenantChange = (index: number, value: string) => {
    const newIntervenants = [...formData.intervenants];
    newIntervenants[index] = value;
    setFormData(prev => ({
      ...prev,
      intervenants: newIntervenants,
    }));
  };

  const addIntervenant = () => {
    setFormData(prev => ({
      ...prev,
      intervenants: [...prev.intervenants, ''],
    }));
  };

  const removeIntervenant = (index: number) => {
    if (formData.intervenants.length > 1) {
      const newIntervenants = formData.intervenants.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        intervenants: newIntervenants,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.codeSite || formData.intervenants.some(i => !i.trim())) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.confirmationMesures) {
      alert('Vous devez confirmer la mise en œuvre des mesures de prévention');
      return;
    }

    if (formData.vitesseVent <= 0) {
      alert('La vitesse du vent doit être supérieure à 0 km/h');
      return;
    }

    // Vérification des limites de vent pour travaux en hauteur
    if (formData.vitesseVent > 50) {
      const confirm = window.confirm(
        `Attention : La vitesse du vent (${formData.vitesseVent} km/h) dépasse la limite recommandée de 50 km/h pour les travaux en hauteur. Voulez-vous continuer ?`
      );
      if (!confirm) return;
    }

    onSubmit({
      ...formData,
      intervenants: formData.intervenants.filter(i => i.trim()),
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Contrôle Journalier du Permis de Travail en Hauteur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codeSite">Code Site</Label>
              <Input
                id="codeSite"
                name="codeSite"
                value={formData.codeSite}
                onChange={handleChange}
                placeholder="Ex: ANA-001"
                required
              />
            </div>
          </div>

          {/* Vitesse du vent - Spécifique aux travaux en hauteur */}
          <div className="space-y-2">
            <Label htmlFor="vitesseVent" className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              Vitesse du vent (km/h) *
            </Label>
            <Input
              id="vitesseVent"
              name="vitesseVent"
              type="number"
              min="0"
              max="100"
              value={formData.vitesseVent}
              onChange={handleChange}
              placeholder="Ex: 15"
              required
            />
            <p className="text-xs text-gray-500">
              Limite recommandée : 50 km/h maximum pour les travaux en hauteur
            </p>
          </div>

          {/* Intervenants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Intervenants
            </Label>
            {formData.intervenants.map((intervenant, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={intervenant}
                  onChange={(e) => handleIntervenantChange(index, e.target.value)}
                  placeholder={`Intervenant ${index + 1}`}
                  required
                />
                {formData.intervenants.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIntervenant(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIntervenant}
            >
              <Users className="h-4 w-4 mr-2" />
              Ajouter un intervenant
            </Button>
          </div>

          {/* Confirmation des mesures */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmationMesures"
              name="confirmationMesures"
              checked={formData.confirmationMesures}
              onChange={handleChange}
              required
            />
            <Label htmlFor="confirmationMesures" className="text-sm font-medium">
              Je confirme la mise en œuvre des mesures de prévention mentionnées dans le permis
            </Label>
          </div>

          {/* Section Commencement des travaux */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Commencement des travaux</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signatureDemandeur">Signature Demandeur/Responsable contractant</Label>
                <Input
                  id="signatureDemandeur"
                  name="signatureDemandeur"
                  value={formData.signatureDemandeur}
                  onChange={handleChange}
                  placeholder="Nom et signature"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureIntervenant">Signature Utilisateur de permis</Label>
                <Input
                  id="signatureIntervenant"
                  name="signatureIntervenant"
                  value={formData.signatureIntervenant}
                  onChange={handleChange}
                  placeholder="Nom et signature"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section Clôture journalière */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Clôture journalière</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signatureClotureDemandeur">Signature Demandeur/Responsable contractant</Label>
                <Input
                  id="signatureClotureDemandeur"
                  name="signatureClotureDemandeur"
                  value={formData.signatureClotureDemandeur}
                  onChange={handleChange}
                  placeholder="Nom et signature"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureClotureIntervenant">Signature Utilisateur de permis</Label>
                <Input
                  id="signatureClotureIntervenant"
                  name="signatureClotureIntervenant"
                  value={formData.signatureClotureIntervenant}
                  onChange={handleChange}
                  placeholder="Nom et signature"
                  required
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Enregistrer le contrôle
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
