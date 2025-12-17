import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, AlertTriangle, Info, Upload } from "lucide-react";
import {
  AppraisalFormData,
  US_STATES,
  VALUE_BUCKET_OPTIONS,
  DAMAGE_LOCATION_OPTIONS,
  REPAIR_STATUS_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
} from "@/types/appraisal";

interface StepAccidentProps {
  formData: AppraisalFormData;
  updateFormData: (updates: Partial<AppraisalFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepAccident({ formData, updateFormData, onNext, onBack }: StepAccidentProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accidentDate) {
      newErrors.accidentDate = "Accident date is required";
    }
    if (!formData.accidentState) {
      newErrors.accidentState = "State is required";
    }
    if (!formData.damageLocation) {
      newErrors.damageLocation = "Damage location is required";
    }
    if (!formData.repairStatus) {
      newErrors.repairStatus = "Repair status is required";
    }
    if (!formData.preAccidentValueBucket) {
      newErrors.preAccidentValueBucket = "Pre-accident value is required";
    }
    if (!formData.referralSource) {
      newErrors.referralSource = "Referral source is required";
    }
    if (!formData.atFaultInsuranceCompany || formData.atFaultInsuranceCompany.trim() === "") {
      newErrors.atFaultInsuranceCompany = "At-fault insurance company is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      onNext();
    }
  };

  const showLowValueWarning = formData.preAccidentValueBucket === "<5000";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Accident Information</h2>
        <p className="text-muted-foreground">Tell us about the accident and damage</p>
      </div>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Accident Date and State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accidentDate">Accident Date *</Label>
            <Input
              id="accidentDate"
              type="date"
              value={formData.accidentDate}
              onChange={(e) => updateFormData({ accidentDate: e.target.value })}
              className={errors.accidentDate ? "border-red-500" : ""}
              data-testid="input-accident-date"
            />
            {errors.accidentDate && <p className="text-sm text-red-500">{errors.accidentDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accidentState">State *</Label>
            <Select
              value={formData.accidentState}
              onValueChange={(value) => updateFormData({ accidentState: value })}
            >
              <SelectTrigger className={errors.accidentState ? "border-red-500" : ""} data-testid="select-state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accidentState && <p className="text-sm text-red-500">{errors.accidentState}</p>}
          </div>
        </div>

        {/* At Fault Question */}
        <div className="space-y-2">
          <Label>Was the other driver at fault? *</Label>
          <RadioGroup
            value={formData.otherDriverAtFault ? "yes" : "no"}
            onValueChange={(value) => updateFormData({ otherDriverAtFault: value === "yes" })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="fault-yes" />
              <Label htmlFor="fault-yes" className="font-normal">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="fault-no" />
              <Label htmlFor="fault-no" className="font-normal">No</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Damage Location */}
        <div className="space-y-2">
          <Label>Where was your vehicle damaged? *</Label>
          <Select
            value={formData.damageLocation || ""}
            onValueChange={(value) => updateFormData({ damageLocation: value as typeof formData.damageLocation })}
          >
            <SelectTrigger className={errors.damageLocation ? "border-red-500" : ""} data-testid="select-damage">
              <SelectValue placeholder="Select damage location" />
            </SelectTrigger>
            <SelectContent>
              {DAMAGE_LOCATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.damageLocation && <p className="text-sm text-red-500">{errors.damageLocation}</p>}
        </div>

        {/* Repair Status */}
        <div className="space-y-2">
          <Label>Repair status *</Label>
          <RadioGroup
            value={formData.repairStatus || ""}
            onValueChange={(value) => updateFormData({ repairStatus: value as typeof formData.repairStatus })}
            className="space-y-2"
          >
            {REPAIR_STATUS_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`repair-${option.value}`} />
                <Label htmlFor={`repair-${option.value}`} className="font-normal">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-sm text-muted-foreground">
            Insurers typically process diminished value after repairs are authorized or completed, but you can continue now.
          </p>
          {errors.repairStatus && <p className="text-sm text-red-500">{errors.repairStatus}</p>}
        </div>

        {/* Repair Estimate Upload */}
        <div className="space-y-2">
          <Label>Repair Estimate (Optional)</Label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag and drop your repair estimate, or click to browse
            </p>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              id="repair-estimate"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  updateFormData({ repairEstimateUploaded: true });
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById("repair-estimate")?.click()}
            >
              Upload File
            </Button>
          </div>
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            Your final certified appraisal cannot be generated without a repair estimate. You can upload it now or add it later once your body shop provides it.
          </p>
        </div>

        {/* Pre-Accident Value */}
        <div className="space-y-2">
          <Label>What do you estimate as the value of your vehicle before the accident? *</Label>
          <Select
            value={formData.preAccidentValueBucket || ""}
            onValueChange={(value) => updateFormData({ preAccidentValueBucket: value as typeof formData.preAccidentValueBucket })}
          >
            <SelectTrigger className={errors.preAccidentValueBucket ? "border-red-500" : ""} data-testid="select-value">
              <SelectValue placeholder="Select value range" />
            </SelectTrigger>
            <SelectContent>
              {VALUE_BUCKET_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.preAccidentValueBucket && <p className="text-sm text-red-500">{errors.preAccidentValueBucket}</p>}
          
          {showLowValueWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
              <p className="text-sm text-amber-800">
                Based on the estimated pre-accident value of your vehicle, your diminished value amount may be lower than what we typically guarantee. You can still continue and receive your certified diminished value appraisal and demand letter, but the 3X money back guarantee does not apply for this vehicle.
              </p>
            </div>
          )}
        </div>

        {/* Referral Source */}
        <div className="space-y-2">
          <Label>How did you hear about us? *</Label>
          <Select
            value={formData.referralSource || ""}
            onValueChange={(value) => updateFormData({ referralSource: value as typeof formData.referralSource })}
          >
            <SelectTrigger className={errors.referralSource ? "border-red-500" : ""} data-testid="select-referral">
              <SelectValue placeholder="Select referral source" />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.referralSource && <p className="text-sm text-red-500">{errors.referralSource}</p>}

          {formData.referralSource === "someone_else" && (
            <Input
              placeholder="Who referred you? (Optional)"
              value={formData.referralName || ""}
              onChange={(e) => updateFormData({ referralName: e.target.value })}
              className="mt-2"
              data-testid="input-referral-name"
            />
          )}
        </div>

        {/* Body Shop Info */}
        {formData.referralSource === "body_shop" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bodyShopName">Body Shop Name</Label>
              <Input
                id="bodyShopName"
                placeholder="Shop name"
                value={formData.bodyShopName || ""}
                onChange={(e) => updateFormData({ bodyShopName: e.target.value })}
                data-testid="input-body-shop-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyShopLocation">Location</Label>
              <Input
                id="bodyShopLocation"
                placeholder="City, State"
                value={formData.bodyShopLocation || ""}
                onChange={(e) => updateFormData({ bodyShopLocation: e.target.value })}
                data-testid="input-body-shop-location"
              />
            </div>
          </div>
        )}

        {/* Insurance Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="atFaultInsurance">At-Fault Insurance Company *</Label>
            <Input
              id="atFaultInsurance"
              placeholder="State Farm, GEICO, etc."
              value={formData.atFaultInsuranceCompany}
              onChange={(e) => updateFormData({ atFaultInsuranceCompany: e.target.value })}
              className={errors.atFaultInsuranceCompany ? "border-red-500" : ""}
              data-testid="input-insurance-company"
            />
            {errors.atFaultInsuranceCompany && <p className="text-sm text-red-500">{errors.atFaultInsuranceCompany}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="claimNumber">Claim Number (Optional)</Label>
            <Input
              id="claimNumber"
              placeholder="CLM-123456"
              value={formData.claimNumber || ""}
              onChange={(e) => updateFormData({ claimNumber: e.target.value })}
              data-testid="input-claim-number"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1" data-testid="button-back-accident">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleContinue}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            data-testid="button-continue-accident"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
