import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Car } from "lucide-react";
import { AppraisalFormData } from "@/types/appraisal";
import { VehicleSelector } from "@/components/VehicleSelector";

interface StepVehicleProps {
  formData: AppraisalFormData;
  updateFormData: (updates: Partial<AppraisalFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepVehicle({ formData, updateFormData, onNext, onBack }: StepVehicleProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.year) {
      newErrors.year = "Year is required";
    } else {
      const yearNum = typeof formData.year === "string" ? parseInt(formData.year) : formData.year;
      if (yearNum < 1980 || yearNum > currentYear + 1) {
        newErrors.year = `Year must be between 1980 and ${currentYear + 1}`;
      }
    }

    if (!formData.make || formData.make.trim() === "") {
      newErrors.make = "Make is required";
    }

    if (!formData.model || formData.model.trim() === "") {
      newErrors.model = "Model is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      onNext();
    }
  } 

  const isValid = () => {
    if (!formData.year) return false;
    const yearNum = typeof formData.year === "string" ? parseInt(formData.year) : formData.year;
    if (yearNum < 1980 || yearNum > currentYear + 1) return false;
    if (!formData.make || formData.make.trim() === "") return false;
    if (!formData.model || formData.model.trim() === "") return false;
    return true;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Vehicle Details</h2>
        <p className="text-muted-foreground">Tell us about your vehicle</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <VehicleSelector
          year={formData.year?.toString() || ""}
          make={formData.make || ""}
          model={formData.model || ""}
          trim={formData.trim || ""}
          onYearChange={(v) => updateFormData({ year: v ? parseInt(v) : "" })}
          onMakeChange={(v) => updateFormData({ make: v })}
          onModelChange={(v) => updateFormData({ model: v })}
          onTrimChange={(v) => updateFormData({ trim: v })}
          showTrim={true}
        />
        {(errors.year || errors.make || errors.model) && (
          <p className="text-sm text-red-500">Please select Year, Make, and Model</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage (Optional)</Label>
          <Input
            id="mileage"
            type="number"
            placeholder="45000"
            value={formData.mileage}
            onChange={(e) => updateFormData({ mileage: e.target.value ? parseInt(e.target.value) : "" })}
            data-testid="input-mileage"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1" data-testid="button-back-vehicle">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            data-testid="button-continue-vehicle"
            disabled={!isValid()}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
