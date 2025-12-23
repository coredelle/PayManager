import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, CheckCircle, Download, Car, Shield, Scale } from "lucide-react";

type DamageCode = 
  | "front_bumper" | "rear_bumper" | "left_front_fender" | "right_front_fender"
  | "left_rear_quarter" | "right_rear_quarter" | "hood" | "trunk" | "roof"
  | "left_door" | "right_door" | "windshield" | "rear_glass";

const DAMAGE_OPTIONS: { code: DamageCode; label: string }[] = [
  { code: "front_bumper", label: "Front Bumper" },
  { code: "hood", label: "Hood" },
  { code: "windshield", label: "Windshield" },
  { code: "roof", label: "Roof" },
  { code: "trunk", label: "Trunk/Liftgate" },
  { code: "rear_bumper", label: "Rear Bumper" },
  { code: "left_front_fender", label: "Left Front Fender" },
  { code: "right_front_fender", label: "Right Front Fender" },
  { code: "left_door", label: "Left Door(s)" },
  { code: "right_door", label: "Right Door(s)" },
  { code: "left_rear_quarter", label: "Left Rear Quarter" },
  { code: "right_rear_quarter", label: "Right Rear Quarter" },
  { code: "rear_glass", label: "Rear Glass" },
];

type Step = "owner" | "vehicle" | "accident" | "damage" | "review" | "result";

export default function GeorgiaAppraisalPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("owner");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [appraisalId, setAppraisalId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ownerName: "",
    ownerAddress: "",
    ownerPhone: "",
    ownerEmail: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    vin: "",
    licensePlate: "",
    stateOfRegistration: "GA",
    mileage: "",
    accidentHistory: "clean" as "clean" | "prior_damage" | "unknown",
    isLeased: false,
    insuranceCompany: "",
    claimNumber: "",
    adjusterName: "",
    adjusterEmail: "",
    adjusterPhone: "",
    dateOfLoss: "",
    repairCenterName: "",
    repairCenterPhone: "",
    repairCenterAddress: "",
    totalRepairCost: "",
    damageDescription: "",
    keyImpactAreas: [] as DamageCode[],
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleDamageArea = (code: DamageCode) => {
    setFormData(prev => ({
      ...prev,
      keyImpactAreas: prev.keyImpactAreas.includes(code)
        ? prev.keyImpactAreas.filter(c => c !== code)
        : [...prev.keyImpactAreas, code]
    }));
  };

  const handleSubmitAppraisal = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/georgia-appraisals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create appraisal");
      }

      const data = await response.json();
      setAppraisalId(data.id);

      setIsCalculating(true);
      const calcResponse = await fetch(`/api/georgia-appraisals/${data.id}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!calcResponse.ok) {
        const calcData = await calcResponse.json();
        throw new Error(calcData.message || "Failed to calculate appraisal");
      }

      const calcData = await calcResponse.json();
      setResult(calcData.result);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
      setIsCalculating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (appraisalId) {
      window.open(`/api/georgia-appraisals/${appraisalId}/report.pdf`, "_blank");
    }
  };

  const canProceed = () => {
    switch (step) {
      case "owner":
        return formData.ownerName && formData.ownerEmail && formData.ownerPhone;
      case "vehicle":
        return formData.year && formData.make && formData.model && formData.vin && formData.mileage;
      case "accident":
        return formData.insuranceCompany && formData.claimNumber && formData.dateOfLoss;
      case "damage":
        return formData.keyImpactAreas.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ["owner", "vehicle", "accident", "damage", "review"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ["owner", "vehicle", "accident", "damage", "review"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="page-title">
            Georgia Diminished Value Appraisal
          </h1>
          <p className="text-slate-600">
            Professional appraisal backed by Mabry v. State Farm case law
          </p>
        </div>

        {step !== "result" && (
          <div className="flex justify-between mb-8">
            {["owner", "vehicle", "accident", "damage", "review"].map((s, i) => (
              <div
                key={s}
                className={`flex items-center ${i < 4 ? "flex-1" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? "bg-emerald-500 text-white"
                      : ["owner", "vehicle", "accident", "damage", "review"].indexOf(step) > i
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ["owner", "vehicle", "accident", "damage", "review"].indexOf(step) > i
                        ? "bg-emerald-200"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" data-testid="error-message">
            {error}
          </div>
        )}

        {step === "owner" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Owner Information
              </CardTitle>
              <CardDescription>Your contact details for the appraisal report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ownerName">Full Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  placeholder="John Smith"
                  data-testid="input-owner-name"
                />
              </div>
              <div>
                <Label htmlFor="ownerEmail">Email Address *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => updateField("ownerEmail", e.target.value)}
                  placeholder="john@example.com"
                  data-testid="input-owner-email"
                />
              </div>
              <div>
                <Label htmlFor="ownerPhone">Phone Number *</Label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => updateField("ownerPhone", e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-owner-phone"
                />
              </div>
              <div>
                <Label htmlFor="ownerAddress">Address</Label>
                <Input
                  id="ownerAddress"
                  value={formData.ownerAddress}
                  onChange={(e) => updateField("ownerAddress", e.target.value)}
                  placeholder="123 Main St, Atlanta, GA 30301"
                  data-testid="input-owner-address"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === "vehicle" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
              <CardDescription>Details about your vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => updateField("year", e.target.value)}
                    placeholder="2022"
                    data-testid="input-year"
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => updateField("make", e.target.value)}
                    placeholder="Toyota"
                    data-testid="input-make"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    placeholder="Camry"
                    data-testid="input-model"
                  />
                </div>
                <div>
                  <Label htmlFor="trim">Trim</Label>
                  <Input
                    id="trim"
                    value={formData.trim}
                    onChange={(e) => updateField("trim", e.target.value)}
                    placeholder="XLE"
                    data-testid="input-trim"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vin">VIN (17 characters) *</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => updateField("vin", e.target.value.toUpperCase())}
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                  data-testid="input-vin"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mileage">Mileage at Loss *</Label>
                  <Input
                    id="mileage"
                    value={formData.mileage}
                    onChange={(e) => updateField("mileage", e.target.value)}
                    placeholder="35000"
                    data-testid="input-mileage"
                  />
                </div>
                <div>
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => updateField("licensePlate", e.target.value.toUpperCase())}
                    placeholder="ABC1234"
                    data-testid="input-plate"
                  />
                </div>
              </div>
              <div>
                <Label>Prior Accident History</Label>
                <RadioGroup
                  value={formData.accidentHistory}
                  onValueChange={(v) => updateField("accidentHistory", v)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clean" id="clean" />
                    <Label htmlFor="clean" className="font-normal">No prior accidents</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prior_damage" id="prior_damage" />
                    <Label htmlFor="prior_damage" className="font-normal">Prior accident on record</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unknown" id="unknown" />
                    <Label htmlFor="unknown" className="font-normal">Unknown</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLeased"
                  checked={formData.isLeased}
                  onCheckedChange={(checked) => updateField("isLeased", checked)}
                  data-testid="checkbox-leased"
                />
                <Label htmlFor="isLeased" className="font-normal">
                  This vehicle is leased (Perma Ad Ideas v. Mayville applies)
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "accident" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Accident & Insurance Information
              </CardTitle>
              <CardDescription>Details about the accident and insurance claim</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dateOfLoss">Date of Accident *</Label>
                <Input
                  id="dateOfLoss"
                  type="date"
                  value={formData.dateOfLoss}
                  onChange={(e) => updateField("dateOfLoss", e.target.value)}
                  data-testid="input-date-of-loss"
                />
              </div>
              <div>
                <Label htmlFor="insuranceCompany">At-Fault Insurance Company *</Label>
                <Input
                  id="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={(e) => updateField("insuranceCompany", e.target.value)}
                  placeholder="State Farm, GEICO, Progressive..."
                  data-testid="input-insurance-company"
                />
              </div>
              <div>
                <Label htmlFor="claimNumber">Claim Number *</Label>
                <Input
                  id="claimNumber"
                  value={formData.claimNumber}
                  onChange={(e) => updateField("claimNumber", e.target.value)}
                  placeholder="CLM-123456789"
                  data-testid="input-claim-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjusterName">Adjuster Name</Label>
                  <Input
                    id="adjusterName"
                    value={formData.adjusterName}
                    onChange={(e) => updateField("adjusterName", e.target.value)}
                    placeholder="Jane Doe"
                    data-testid="input-adjuster-name"
                  />
                </div>
                <div>
                  <Label htmlFor="adjusterPhone">Adjuster Phone</Label>
                  <Input
                    id="adjusterPhone"
                    value={formData.adjusterPhone}
                    onChange={(e) => updateField("adjusterPhone", e.target.value)}
                    placeholder="(555) 987-6543"
                    data-testid="input-adjuster-phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="repairCenterName">Repair Shop Name</Label>
                <Input
                  id="repairCenterName"
                  value={formData.repairCenterName}
                  onChange={(e) => updateField("repairCenterName", e.target.value)}
                  placeholder="ABC Body Shop"
                  data-testid="input-repair-center"
                />
              </div>
              <div>
                <Label htmlFor="totalRepairCost">Total Repair Cost</Label>
                <Input
                  id="totalRepairCost"
                  value={formData.totalRepairCost}
                  onChange={(e) => updateField("totalRepairCost", e.target.value)}
                  placeholder="5000"
                  data-testid="input-repair-cost"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === "damage" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Damage Information
              </CardTitle>
              <CardDescription>Select all areas that were damaged in the accident</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DAMAGE_OPTIONS.map((option) => (
                  <div
                    key={option.code}
                    onClick={() => toggleDamageArea(option.code)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.keyImpactAreas.includes(option.code)
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                    data-testid={`damage-${option.code}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          formData.keyImpactAreas.includes(option.code)
                            ? "bg-red-500"
                            : "bg-slate-200"
                        }`}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="damageDescription">Damage Description</Label>
                <Textarea
                  id="damageDescription"
                  value={formData.damageDescription}
                  onChange={(e) => updateField("damageDescription", e.target.value)}
                  placeholder="Describe the damage in detail..."
                  rows={4}
                  data-testid="input-damage-description"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Review Your Information
              </CardTitle>
              <CardDescription>Please review before generating your appraisal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Owner</h3>
                <p className="text-slate-600">{formData.ownerName}</p>
                <p className="text-slate-600">{formData.ownerEmail}</p>
                <p className="text-slate-600">{formData.ownerPhone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Vehicle</h3>
                <p className="text-slate-600">
                  {formData.year} {formData.make} {formData.model} {formData.trim}
                </p>
                <p className="text-slate-600">VIN: {formData.vin}</p>
                <p className="text-slate-600">Mileage: {parseInt(formData.mileage || "0").toLocaleString()} miles</p>
                {formData.isLeased && (
                  <p className="text-emerald-600 font-medium">Leased Vehicle (Perma Ad Ideas applies)</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Accident</h3>
                <p className="text-slate-600">Date: {formData.dateOfLoss}</p>
                <p className="text-slate-600">Insurance: {formData.insuranceCompany}</p>
                <p className="text-slate-600">Claim #: {formData.claimNumber}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Damage Areas</h3>
                <p className="text-slate-600">
                  {formData.keyImpactAreas.map(code => 
                    DAMAGE_OPTIONS.find(o => o.code === code)?.label
                  ).join(", ")}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800">
                  Your appraisal will be generated using Georgia-specific case law (Mabry v. State Farm, 
                  {formData.isLeased ? " Perma Ad Ideas v. Mayville," : ""} and Georgia Insurance Commissioner 
                  Directive 08-P&C-2) with third-party market data and comparable listings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "result" && result && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">Your Appraisal is Ready</CardTitle>
              <CardDescription>Georgia Diminished Value Appraisal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2" data-testid="result-dv-amount">
                  {formatCurrency(result.diminishedValue)}
                </div>
                <p className="text-slate-600">Calculated Diminished Value</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Third-Party Clean Retail:</span>
                  <span className="font-medium">{formatCurrency(result.thirdParty.cleanRetailPreAccident)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Comparables Average:</span>
                  <span className="font-medium">{formatCurrency(result.comparablesAvgRetail)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Final Pre-Accident Value:</span>
                  <span className="font-medium">{formatCurrency(result.finalPreAccidentValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Post-Accident Value:</span>
                  <span className="font-medium">{formatCurrency(result.postAccidentValue)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-slate-900 font-semibold">Diminished Value:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(result.diminishedValue)}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600">{result.mileageBandDescription}</p>
              <p className="text-sm text-slate-600">{result.comparableFilterNotes}</p>

              <Button 
                onClick={handleDownloadPdf} 
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                size="lg"
                data-testid="button-download-pdf"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Professional PDF Report
              </Button>

              <Button 
                variant="outline" 
                onClick={() => navigate("/")} 
                className="w-full"
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}

        {step !== "result" && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === "owner"}
              data-testid="button-prev"
            >
              Previous
            </Button>
            {step === "review" ? (
              <Button
                onClick={handleSubmitAppraisal}
                disabled={isSubmitting || isCalculating}
                className="bg-emerald-500 hover:bg-emerald-600"
                data-testid="button-generate"
              >
                {isSubmitting || isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCalculating ? "Calculating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Appraisal
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-emerald-500 hover:bg-emerald-600"
                data-testid="button-next"
              >
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
