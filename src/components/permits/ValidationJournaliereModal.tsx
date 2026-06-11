import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePermitStore } from '@/store/permitStore';
import { useToastStore } from '@/store/toastStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Calendar, Plus, X, Wind, User, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ValidationJournaliere } from '@/types';

interface ValidationJournaliereModalProps {
  isOpen: boolean;
  onClose: () => void;
  permisId: string;
  validations: ValidationJournaliere[];
}

// Schéma de validation pour une nouvelle validation journalière
const validationSchema = z.object({
  date: z.string().min(1, 'Date requise'),
  codeSite: z.string().min(1, 'Code site requis'),
  vitesseVent: z.number().min(0, 'Vitesse du vent doit être positive').optional(),
  demandeurSignatureDebut: z.string().min(1, 'Signature demandeur début requise'),
  utilisateurSignatureDebut: z.string().min(1, 'Signature utilisateur début requise'),
  demandeurSignatureFin: z.string().optional(),
  utilisateurSignatureFin: z.string().optional(),
});

type ValidationFormData = z.infer<typeof validationSchema>;

export default function ValidationJournaliereModal({
  isOpen,
  onClose,
  permisId,
  validations,
}: ValidationJournaliereModalProps) {
  const { updatePermisHauteur } = usePermitStore();
  const { success, error } = useToastStore();
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ValidationFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      codeSite: '',
      vitesseVent: undefined,
      demandeurSignatureDebut: '',
      utilisateurSignatureDebut: '',
      demandeurSignatureFin: '',
      utilisateurSignatureFin: '',
    },
  });

  const onSubmit = (data: ValidationFormData) => {
    try {
      const newValidation: ValidationJournaliere = {
        date: new Date(data.date),
        codeSite: data.codeSite,
        vitesseVent: data.vitesseVent,
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

      success('Validation journalière ajoutée avec succès');
      reset();
      setIsAdding(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la validation:', err);
      error('Une erreur est survenue lors de l\'ajout de la validation');
    }
  };

  const handleCancel = () => {
    reset();
    setIsAdding(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Validation Journalière" size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Validation Journalière</h2>
            <p className="text-gray-600 mt-1">
              Gestion des validations journalières du permis de travail en hauteur
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="p-2"
          >
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
              Ajouter une validation journalière
            </Button>
          </div>
        )}

        {/* Formulaire d'ajout */}
        {isAdding && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nouvelle validation journalière
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date *"
                  type="date"
                  {...register('date')}
                  error={errors.date?.message}
                />
                <Input
                  label="Code Site *"
                  {...register('codeSite')}
                  error={errors.codeSite?.message}
                  placeholder="Ex: ANT-001"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Vitesse du vent (km/h)"
                  type="number"
                  {...register('vitesseVent', { valueAsNumber: true })}
                  error={errors.vitesseVent?.message}
                  placeholder="Ex: 15"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Signatures - Commencement des travaux</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Demandeur / Responsable contractant *"
                    {...register('demandeurSignatureDebut')}
                    error={errors.demandeurSignatureDebut?.message}
                    placeholder="Nom et signature"
                  />
                  <Input
                    label="Utilisateur de permis *"
                    {...register('utilisateurSignatureDebut')}
                    error={errors.utilisateurSignatureDebut?.message}
                    placeholder="Nom et signature"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Signatures - Clôture journalière</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Demandeur / Responsable contractant"
                    {...register('demandeurSignatureFin')}
                    error={errors.demandeurSignatureFin?.message}
                    placeholder="Nom et signature"
                  />
                  <Input
                    label="Utilisateur de permis"
                    {...register('utilisateurSignatureFin')}
                    error={errors.utilisateurSignatureFin?.message}
                    placeholder="Nom et signature"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button type="submit">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Ajouter la validation
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des validations existantes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historique des validations ({validations.length})
          </h3>
          
          {validations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune validation journalière enregistrée</p>
              <p className="text-sm text-gray-400 mt-1">
                Ajoutez la première validation pour commencer le suivi
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      Code Site
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <Wind className="h-4 w-4" />
                        Vent (km/h)
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Demandeur Début
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Utilisateur Début
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Demandeur Fin
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Utilisateur Fin
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validations.map((validation, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(validation.date)}
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
                            Signé
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.utilisateurSignatureDebut ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Signé
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.demandeurSignatureFin ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Signé
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {validation.utilisateurSignatureFin ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Signé
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
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
