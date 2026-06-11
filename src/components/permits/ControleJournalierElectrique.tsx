import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Checkbox from '@/components/ui/Checkbox';
import { Calendar, Users, CheckCircle2, XCircle } from 'lucide-react';

interface ControleJournalierElectriqueProps {
  permisId: string;
  onSubmit: (data: ControleJournalierData) => void;
  onCancel: () => void;
}

interface ControleJournalierData {
  date: string;
  codeSite: string;
  intervenants: string[];
  confirmationMesures: boolean;
  signatureDemandeur: string;
  signatureIntervenant: string;
  signatureClotureDemandeur: string;
  signatureClotureIntervenant: string;
}

export default function ControleJournalierElectrique({
  onSubmit,
  onCancel,
}: ControleJournalierElectriqueProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    codeSite: '',
    intervenants: [''],
    confirmationMesures: false,
    signatureDemandeur: '',
    signatureIntervenant: '',
    signatureClotureDemandeur: '',
    signatureClotureIntervenant: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
          Contrôle Journalier du Permis Électrique
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
                <Label htmlFor="signatureIntervenant">Signature Intervenant</Label>
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
                <Label htmlFor="signatureClotureIntervenant">Signature Intervenant</Label>
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
