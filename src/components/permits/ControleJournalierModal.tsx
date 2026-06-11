import Modal from '@/components/ui/Modal';
import ControleJournalierElectrique from './ControleJournalierElectrique';
import ControleJournalierHauteur from './ControleJournalierHauteur';
import type { ControleJournalierPermis } from '@/types';

interface ControleJournalierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ControleJournalierPermis) => void;
  permisType: 'travaux_electrique' | 'travaux_hauteur';
  permisId: string;
}

export default function ControleJournalierModal({
  isOpen,
  onClose,
  onSubmit,
  permisType,
  permisId,
}: ControleJournalierModalProps) {
  const handleElectriqueSubmit = (data: any) => {
    const controleData: ControleJournalierPermis = {
      id: `CONT-${Date.now()}`,
      permisId,
      date: new Date(data.date),
      codeSite: data.codeSite,
      intervenants: data.intervenants,
      confirmationMesures: data.confirmationMesures,
      signatureDemandeur: data.signatureDemandeur,
      signatureIntervenant: data.signatureIntervenant,
      signatureClotureDemandeur: data.signatureClotureDemandeur,
      signatureClotureIntervenant: data.signatureClotureIntervenant,
      createdAt: new Date(),
    };
    onSubmit(controleData);
  };

  const handleHauteurSubmit = (data: any) => {
    const controleData: ControleJournalierPermis = {
      id: `CONT-${Date.now()}`,
      permisId,
      date: new Date(data.date),
      codeSite: data.codeSite,
      intervenants: data.intervenants,
      confirmationMesures: data.confirmationMesures,
      signatureDemandeur: data.signatureDemandeur,
      signatureIntervenant: data.signatureIntervenant,
      signatureClotureDemandeur: data.signatureClotureDemandeur,
      signatureClotureIntervenant: data.signatureClotureIntervenant,
      vitesseVent: data.vitesseVent,
      createdAt: new Date(),
    };
    onSubmit(controleData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Contrôle Journalier">
      <div className="max-h-[90vh] overflow-y-auto">
        {permisType === 'travaux_electrique' ? (
          <ControleJournalierElectrique
            permisId={permisId}
            onSubmit={handleElectriqueSubmit}
            onCancel={onClose}
          />
        ) : (
          <ControleJournalierHauteur
            permisId={permisId}
            onSubmit={handleHauteurSubmit}
            onCancel={onClose}
          />
        )}
      </div>
    </Modal>
  );
}