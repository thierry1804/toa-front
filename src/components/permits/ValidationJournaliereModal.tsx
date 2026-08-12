import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { usePermitStore } from "@/store/permitStore";
import { useToastStore } from "@/store/toastStore";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Calendar, Plus, X, Wind, User, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ValidationJournaliere } from "@/types";

interface ValidationJournaliereModalProps {
  isOpen: boolean;
  onClose: () => void;
  permisId: string;
  validations: ValidationJournaliere[];
}

// Schéma de validation pour une nouvelle validation journalière (messages traduits via t())
const makeValidationSchema = (t: TFunction) =>
  z.object({
    date: z.string().min(1, t("permits.validationJournaliereModal.validation.dateRequired")),
    codeSite: z.string().min(1, t("permits.validationJournaliereModal.validation.codeSiteRequired")),
    vitesseVent: z
      .number()
      .min(0, t("permits.validationJournaliereModal.validation.vitesseVentPositive"))
      .optional(),
    demandeurSignatureDebut: z
      .string()
      .min(1, t("permits.validationJournaliereModal.validation.demandeurSignatureDebutRequired")),
    utilisateurSignatureDebut: z
      .string()
      .min(1, t("permits.validationJournaliereModal.validation.utilisateurSignatureDebutRequired")),
    demandeurSignatureFin: z.string().optional(),
    utilisateurSignatureFin: z.string().optional(),
  });

type ValidationFormData = z.infer<ReturnType<typeof makeValidationSchema>>;

export default function ValidationJournaliereModal({
  isOpen,
  onClose,
  permisId,
  validations,
}: ValidationJournaliereModalProps) {
  const { t } = useTranslation();
  const { updatePermisHauteur } = usePermitStore();
  const toast = useToastStore;
  const [isAdding, setIsAdding] = useState(false);

  const validationSchema = useMemo(() => makeValidationSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ValidationFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      codeSite: "",
      vitesseVent: undefined,
      demandeurSignatureDebut: "",
      utilisateurSignatureDebut: "",
      demandeurSignatureFin: "",
      utilisateurSignatureFin: "",
    },
  });

  const onSubmit = (data: ValidationFormData) => {
    try {
      const newValidation: ValidationJournaliere = {
        date: data.date,
        codeSite: data.codeSite,
        vitesseVent: data.vitesseVent?.toString(),
        demandeurSignatureDebut: data.demandeurSignatureDebut,
        utilisateurSignatureDebut: data.utilisateurSignatureDebut,
        demandeurSignatureFin: data.demandeurSignatureFin,
        utilisateurSignatureFin: data.utilisateurSignatureFin,
      };

      // Ajouter la validation à la liste existante
      const updatedValidations = [...validations, newValidation];

      // Mettre à jour le permis dans le store
      updatePermisHauteur(permisId, {
        validationsJournalieres: updatedValidations,
      });

      toast.showSuccess(t("permits.validationJournaliereModal.toastSuccess"));
      reset();
      setIsAdding(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout de la validation:", err);
      toast.showError(t("permits.validationJournaliereModal.toastError"));
    }
  };

  const handleCancel = () => {
    reset();
    setIsAdding(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("permits.validationJournaliereModal.modalTitle")}
      size="xl"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("permits.validationJournaliereModal.modalTitle")}
            </h2>
            <p className="text-gray-600 mt-1">
              {t("permits.validationJournaliereModal.description")}
            </p>
          </div>
          <Button variant="outline" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Bouton pour ajouter une nouvelle validation */}
        {!isAdding && (
          <div className="mb-6">
            <Button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t("permits.validationJournaliereModal.addButton")}
            </Button>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {isAdding && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("permits.validationJournaliereModal.formTitle")}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("permits.validationJournaliereModal.dateLabel")}
                  type="date"
                  {...register("date")}
                  error={errors.date?.message}
                />
                <Input
                  label={t("permits.validationJournaliereModal.codeSiteLabel")}
                  {...register("codeSite")}
                  error={errors.codeSite?.message}
                  placeholder={t("permits.validationJournaliereModal.codeSitePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("permits.validationJournaliereModal.vitesseVentLabel")}
                  type="number"
                  {...register("vitesseVent", { valueAsNumber: true })}
                  error={errors.vitesseVent?.message}
                  placeholder={t("permits.validationJournaliereModal.vitesseVentPlaceholder")}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {t("permits.validationJournaliereModal.debutSignaturesTitle")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("permits.validationJournaliereModal.demandeurSignatureDebutLabel")}
                    {...register("demandeurSignatureDebut")}
                    error={errors.demandeurSignatureDebut?.message}
                    placeholder={t("permits.validationJournaliereModal.signaturePlaceholder")}
                  />
                  <Input
                    label={t("permits.validationJournaliereModal.utilisateurSignatureDebutLabel")}
                    {...register("utilisateurSignatureDebut")}
                    error={errors.utilisateurSignatureDebut?.message}
                    placeholder={t("permits.validationJournaliereModal.signaturePlaceholder")}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {t("permits.validationJournaliereModal.finSignaturesTitle")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("permits.validationJournaliereModal.demandeurSignatureFinLabel")}
                    {...register("demandeurSignatureFin")}
                    error={errors.demandeurSignatureFin?.message}
                    placeholder={t("permits.validationJournaliereModal.signaturePlaceholder")}
                  />
                  <Input
                    label={t("permits.validationJournaliereModal.utilisateurSignatureFinLabel")}
                    {...register("utilisateurSignatureFin")}
                    error={errors.utilisateurSignatureFin?.message}
                    placeholder={t("permits.validationJournaliereModal.signaturePlaceholder")}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button type="submit">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {t("permits.validationJournaliereModal.submitAddButton")}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {t("permits.validationJournaliereModal.cancelButton")}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des validations existantes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("permits.validationJournaliereModal.historyTitle", { count: validations.length })}
          </h3>

          {validations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {t("permits.validationJournaliereModal.emptyTitle")}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {t("permits.validationJournaliereModal.emptyText")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      {t("permits.validationJournaliereModal.tableHeaderDate")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      {t("permits.validationJournaliereModal.tableHeaderCodeSite")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <Wind className="h-4 w-4" />
                        {t("permits.validationJournaliereModal.tableHeaderVent")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {t("permits.validationJournaliereModal.tableHeaderDemandeurDebut")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {t("permits.validationJournaliereModal.tableHeaderUtilisateurDebut")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {t("permits.validationJournaliereModal.tableHeaderDemandeurFin")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {t("permits.validationJournaliereModal.tableHeaderUtilisateurFin")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validations.map((validation, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(validation.date || "")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {validation.codeSite}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.vitesseVent ? (
                          <span className="flex items-center gap-1">
                            <Wind className="h-4 w-4 text-blue-500" />
                            {validation.vitesseVent} km/h
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.demandeurSignatureDebut ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {t("permits.validationJournaliereModal.signedLabel")}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.utilisateurSignatureDebut ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {t("permits.validationJournaliereModal.signedLabel")}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.demandeurSignatureFin ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {t("permits.validationJournaliereModal.signedLabel")}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.utilisateurSignatureFin ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            {t("permits.validationJournaliereModal.signedLabel")}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions de fermeture */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("permits.validationJournaliereModal.closeButton")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
