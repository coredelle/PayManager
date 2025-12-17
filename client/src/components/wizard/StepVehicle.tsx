import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Car } from "lucide-react";
import { AppraisalFormData } from "@/types/appraisal";

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
  };

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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              placeholder="2020"
              value={formData.year}
              onChange={(e) => updateFormData({ year: e.target.value ? parseInt(e.target.value) : "" })}
              className={errors.year ? "border-red-500" : ""}
              data-testid="input-year"
            />
            {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              type="text"
              placeholder="Toyota"
              value={formData.make}
              onChange={(e) => updateFormData({ make: e.target.value })}
              className={errors.make ? "border-red-500" : ""}
              data-testid="input-make"
            />
            {errors.make && <p className="text-sm text-red-500">{errors.make}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              type="text"
              placeholder="Camry"
              value={formData.model}
              onChange={(e) => updateFormData({ model: e.target.value })}
              className={errors.model ? "border-red-500" : ""}
              data-testid="input-model"
            />
            {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trim">Trim (Optional)</Label>
            <Input
              id="trim"
              type="text"
              placeholder="SE"
              value={formData.trim || ""}
              onChange={(e) => updateFormData({ trim: e.target.value })}
              data-testid="input-trim"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="vin">VIN (Optional)</Label>
            <Input
              id="vin"
              type="text"
              placeholder="1HGBH41..."
              value={formData.vin || ""}
              onChange={(e) => updateFormData({ vin: e.target.value })}
              data-testid="input-vin"
            />
          </div>
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
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
