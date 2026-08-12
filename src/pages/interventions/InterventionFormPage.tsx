import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import InterventionForm from '../../components/interventions/InterventionForm';

export default function InterventionFormPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/interventions')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('intervention.pages.shared.backToList')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t('intervention.pages.form.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <InterventionForm />
        </CardContent>
      </Card>
    </div>
  );
}
