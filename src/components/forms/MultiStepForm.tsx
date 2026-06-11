import React, { useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ReactNode | ((formData: any, updateFormData: (data: any) => void) => ReactNode);
  isValid?: boolean;
}

interface MultiStepFormProps {
  steps: Step[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete: (data: any) => void;
  onCancel?: () => void;
  title: string;
  description?: string;
  submitLabel?: string;
  loading?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFormData?: (data: any) => void;
}

export default function MultiStepForm({
  steps,
  onComplete,
  title,
  description,
  submitLabel = 'Soumettre',
  loading = false,
  formData = {},
  updateFormData,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const currentStepData = steps[currentStep] || steps[0];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };



  const canProceed = currentStepData?.isValid !== false;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-gray-600">{description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full pb-2">
        <div className="flex items-start w-full">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className="flex flex-col items-center relative z-10 flex-1 min-w-0 px-1 cursor-pointer"
                onClick={() => setCurrentStep(index)}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200 hover:scale-105 ${
                    index < currentStep
                    ? 'bg-green-500 text-white hover:bg-green-600'
                      : index === currentStep
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p className={`mt-2 text-xs font-medium text-center whitespace-normal w-full px-1 leading-tight ${
                  index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div 
                  className={`h-0.5 flex-1 mt-4 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            {currentStepData.title}
          </CardTitle>
          {currentStepData.description && (
            <p className="text-sm text-gray-600 mt-1">{currentStepData.description}</p>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 pt-0">
          <div className="space-y-4 sm:space-y-6">
            {typeof currentStepData.component === 'function'
              ? currentStepData.component(formData, updateFormData || (() => {}))
              : currentStepData.component}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2 sm:pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep || loading}
          className="w-full sm:w-auto min-w-[120px]"
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Précédent</span>
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed || loading}
          loading={loading}
          className="w-full sm:w-auto min-w-[120px]"
          size="lg"
        >
          {isLastStep ? (
            <span>{submitLabel}</span>
          ) : (
            <>
              <span>Suivant</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
