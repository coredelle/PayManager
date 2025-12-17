import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Shield, FileText, MessageSquare, Zap, Lock } from "lucide-react";
import { AppraisalFormData, initialAppraisalFormData } from "@/types/appraisal";
import { isGuaranteeEligible } from "@/utils/eligibility";
import StepEmail from "@/components/wizard/StepEmail";
import StepVehicle from "@/components/wizard/StepVehicle";
import StepAccident from "@/components/wizard/StepAccident";
import StepPreview from "@/components/wizard/StepPreview";
import StepPayment from "@/components/wizard/StepPayment";

const STEPS = [
  { id: 1, title: "Email", description: "Save your progress" },
  { id: 2, title: "Vehicle", description: "Vehicle details" },
  { id: 3, title: "Accident", description: "Accident information" },
  { id: 4, title: "Preview", description: "Review your appraisal" },
  { id: 5, title: "Payment", description: "Complete your order" },
];

export default function AppraisalWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AppraisalFormData>(initialAppraisalFormData);
  const [appraisalId, setAppraisalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (updates: Partial<AppraisalFormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates };
      if (updates.preAccidentValueBucket !== undefined) {
        newData.guaranteeEligible = isGuaranteeEligible(updates.preAccidentValueBucket || "");
      }
      return newData;
    });
  };

  const goNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepEmail formData={formData} updateFormData={updateFormData} onNext={goNext} />;
      case 2:
        return <StepVehicle formData={formData} updateFormData={updateFormData} onNext={goNext} onBack={goBack} />;
      case 3:
        return <StepAccident formData={formData} updateFormData={updateFormData} onNext={goNext} onBack={goBack} />;
      case 4:
        return (
          <StepPreview
            formData={formData}
            onNext={goNext}
            onBack={goBack}
            setAppraisalId={setAppraisalId}
            setIsSubmitting={setIsSubmitting}
            isSubmitting={isSubmitting}
          />
        );
      case 5:
        return <StepPayment formData={formData} appraisalId={appraisalId} onBack={goBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            IACP Certified Appraisal
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Generate Your Certified Appraisal</h1>
          <p className="text-muted-foreground">Complete the form below to receive your court-ready appraisal package</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id <= currentStep ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                    step.id < currentStep
                      ? "bg-emerald-500 text-white"
                      : step.id === currentStep
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">{renderStep()}</CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>IACP Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-500" />
            <span>Secure & Private</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            <span>Instant Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
