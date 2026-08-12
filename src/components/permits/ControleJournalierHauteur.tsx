import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Checkbox from "@/components/ui/Checkbox";
import { Calendar, Users, Wind, CheckCircle2, XCircle } from "lucide-react";

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
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    codeSite: "",
    intervenants: [""],
    confirmationMesures: false,
    vitesseVent: 0,
    signatureDemandeur: "",
    signatureIntervenant: "",
    signatureClotureDemandeur: "",
    signatureClotureIntervenant: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleIntervenantChange = (index: number, value: string) => {
    const newIntervenants = [...formData.intervenants];
    newIntervenants[index] = value;
    setFormData((prev) => ({
      ...prev,
      intervenants: newIntervenants,
    }));
  };

  const addIntervenant = () => {
    setFormData((prev) => ({
      ...prev,
      intervenants: [...prev.intervenants, ""],
    }));
  };

  const removeIntervenant = (index: number) => {
    if (formData.intervenants.length > 1) {
      const newIntervenants = formData.intervenants.filter(
        (_, i) => i !== index,
      );
      setFormData((prev) => ({
        ...prev,
        intervenants: newIntervenants,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.codeSite || formData.intervenants.some((i) => !i.trim())) {
      alert(t("permits.controleJournalierHauteur.validationFieldsAlert"));
      return;
    }

    if (!formData.confirmationMesures) {
      alert(t("permits.controleJournalierHauteur.validationConfirmationAlert"));
      return;
    }

    if (formData.vitesseVent <= 0) {
      alert(t("permits.controleJournalierHauteur.vitesseVentZeroAlert"));
      return;
    }

    // Vérification des limites de vent pour travaux en hauteur
    if (formData.vitesseVent > 50) {
      const confirm = window.confirm(
        t("permits.controleJournalierHauteur.windExceedConfirm", { vitesse: formData.vitesseVent }),
      );
      if (!confirm) return;
    }

    onSubmit({
      ...formData,
      intervenants: formData.intervenants.filter((i) => i.trim()),
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t("permits.controleJournalierHauteur.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t("permits.controleJournalierHauteur.dateLabel")}</Label>
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
              <Label htmlFor="codeSite">{t("permits.controleJournalierHauteur.codeSiteLabel")}</Label>
              <Input
                id="codeSite"
                name="codeSite"
                value={formData.codeSite}
                onChange={handleChange}
                placeholder={t("permits.controleJournalierHauteur.codeSitePlaceholder")}
                required
              />
            </div>
          </div>

          {/* Vitesse du vent - Spécifique aux travaux en hauteur */}
          <div className="space-y-2">
            <Label htmlFor="vitesseVent" className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              {t("permits.controleJournalierHauteur.vitesseVentLabel")}
            </Label>
            <Input
              id="vitesseVent"
              name="vitesseVent"
              type="number"
              min="0"
              max="100"
              value={formData.vitesseVent}
              onChange={handleChange}
              placeholder={t("permits.controleJournalierHauteur.vitesseVentPlaceholder")}
              required
            />
            <p className="text-xs text-gray-500">
              {t("permits.controleJournalierHauteur.vitesseVentHint")}
            </p>
          </div>

          {/* Intervenants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("permits.controleJournalierHauteur.intervenantsLabel")}
            </Label>
            {formData.intervenants.map((intervenant, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={intervenant}
                  onChange={(e) =>
                    handleIntervenantChange(index, e.target.value)
                  }
                  placeholder={t("permits.controleJournalierHauteur.intervenantPlaceholder", { number: index + 1 })}
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
              {t("permits.controleJournalierHauteur.addIntervenantButton")}
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
            <Label
              htmlFor="confirmationMesures"
              className="text-sm font-medium"
            >
              {t("permits.controleJournalierHauteur.confirmationMesuresLabel")}
            </Label>
          </div>

          {/* Section Commencement des travaux */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">
              {t("permits.controleJournalierHauteur.commencementTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signatureDemandeur">
                  {t("permits.controleJournalierHauteur.signatureDemandeurLabel")}
                </Label>
                <Input
                  id="signatureDemandeur"
                  name="signatureDemandeur"
                  value={formData.signatureDemandeur}
                  onChange={handleChange}
                  placeholder={t("permits.controleJournalierHauteur.signaturePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureIntervenant">
                  {t("permits.controleJournalierHauteur.signatureIntervenantLabel")}
                </Label>
                <Input
                  id="signatureIntervenant"
                  name="signatureIntervenant"
                  value={formData.signatureIntervenant}
                  onChange={handleChange}
                  placeholder={t("permits.controleJournalierHauteur.signaturePlaceholder")}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section Clôture journalière */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">{t("permits.controleJournalierHauteur.clotureTitle")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signatureClotureDemandeur">
                  {t("permits.controleJournalierHauteur.signatureDemandeurLabel")}
                </Label>
                <Input
                  id="signatureClotureDemandeur"
                  name="signatureClotureDemandeur"
                  value={formData.signatureClotureDemandeur}
                  onChange={handleChange}
                  placeholder={t("permits.controleJournalierHauteur.signaturePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureClotureIntervenant">
                  {t("permits.controleJournalierHauteur.signatureIntervenantLabel")}
                </Label>
                <Input
                  id="signatureClotureIntervenant"
                  name="signatureClotureIntervenant"
                  value={formData.signatureClotureIntervenant}
                  onChange={handleChange}
                  placeholder={t("permits.controleJournalierHauteur.signaturePlaceholder")}
                  required
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("permits.controleJournalierHauteur.cancelButton")}
            </Button>
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t("permits.controleJournalierHauteur.submitButton")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
