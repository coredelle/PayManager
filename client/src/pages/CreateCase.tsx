import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronRight, ChevronLeft, Car, FileText, Wrench, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { VehicleSelector } from "@/components/VehicleSelector";

const STEPS = [
  { id: 1, title: "Claim Info", icon: FileText },
  { id: 2, title: "Vehicle", icon: Car },
  { id: 3, title: "Repairs", icon: Wrench },
  { id: 4, title: "Valuation", icon: DollarSign },
  { id: 5, title: "Review", icon: Check },
];

export default function CreateCase() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    caseType: "diminished_value" as "diminished_value" | "total_loss",
    state: "GA" as "GA" | "FL" | "NC",
    atFaultInsurerName: "",
    claimNumber: "",
    dateOfLoss: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    vin: "",
    mileageAtLoss: "",
    totalRepairCost: "",
    bodyShopName: "",
    keyImpactAreas: "",
  });
  
  const [caseId, setCaseId] = useState<string | null>(null);
  const [valuationData, setValuationData] = useState<{
    preAccidentValue: number | null;
    postAccidentValue: number | null;
    source: string;
    compsCount: number;
    searchNotes: string;
  } | null>(null);
  const [valuationError, setValuationError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Re-enable auth check after testing
    // if (!authLoading && !isAuthenticated) {
    //   setLocation("/auth");
    // }
  }, [authLoading, isAuthenticated, setLocation]);

  const updateData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const createCaseMutation = useMutation({
    mutationFn: api.cases.create,
    onSuccess: (data) => {
      setCaseId(data.id);
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save case",
        variant: "destructive",
      });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.cases.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update case",
        variant: "destructive",
      });
    },
  });

  const calculateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.cases.calculate(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setLocation(`/result/${data.case.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate value",
        variant: "destructive",
      });
    },
  });

  const fetchValuationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/appraisal/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(formData.year),
          make: formData.make,
          model: formData.model,
          trim: formData.trim || undefined,
          mileage: parseInt(formData.mileageAtLoss) || 50000,
          vin: formData.vin || undefined,
          state: formData.state,
          repairCost: parseFloat(formData.totalRepairCost) || 5000,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to fetch valuation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setValuationData({
        preAccidentValue: data.pricing?.fairRetailPrice || data.dvResult?.preAccidentValue || null,
        postAccidentValue: data.pricing?.roughRetail || data.dvResult?.postRepairValue || null,
        source: data.pricing?.source || "MarketCheck",
        compsCount: data.comps?.length || 0,
        searchNotes: data.compsSearchNotes || "",
      });
      setValuationError(null);
      toast({
        title: "Valuation Retrieved",
        description: `Found market value from ${data.pricing?.source || "MarketCheck"}`,
      });
    },
    onError: (error: Error) => {
      setValuationError(error.message);
      toast({
        title: "Valuation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    // Step 1: Create case with basic info
    if (step === 1 && !caseId) {
      const caseData = {
        caseType: formData.caseType,
        state: formData.state,
        atFaultInsurerName: formData.atFaultInsurerName || null,
        claimNumber: formData.claimNumber || null,
        dateOfLoss: formData.dateOfLoss || null,
        year: parseInt(formData.year) || new Date().getFullYear(),
        make: formData.make || "Vehicle",
        model: formData.model || "Model",
      };
      createCaseMutation.mutate(caseData, {
        onSuccess: () => setStep(2),
      });
      return;
    }

    // All other steps: just move forward (no validation needed for now)
    setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const finish = async () => {
    if (!caseId) {
      toast({
        title: "Error",
        description: "Please complete all previous steps first",
        variant: "destructive",
      });
      return;
    }

    // Use fetched valuation or generate mock data
    const preValue = valuationData?.preAccidentValue || 30000;
    const repairCost = formData.totalRepairCost ? parseFloat(formData.totalRepairCost) : 5000;
    const mileage = formData.mileageAtLoss ? parseInt(formData.mileageAtLoss) : 15000;

    calculateMutation.mutate({
      id: caseId,
      data: {
        preAccidentValue: preValue,
        repairCost: repairCost,
        mileage: mileage,
      },
    });
  };

  const isLoading = createCaseMutation.isPending || updateCaseMutation.isPending || calculateMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center bg-background px-2">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200",
                  step >= s.id
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 text-slate-400 bg-white"
                )}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium",
                  step >= s.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="shadow-lg border-slate-200 min-h-[500px] flex flex-col">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            {step === 1 && "Claim Details"}
            {step === 2 && "Vehicle Information"}
            {step === 3 && "Repair Details"}
            {step === 4 && "Valuation Inputs"}
            {step === 5 && "Review & Calculate"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Start by telling us about your insurance claim."}
            {step === 2 && "Enter your vehicle details exactly as they appear on your title."}
            {step === 3 && "Provide details about the damage and repairs."}
            {step === 4 && "We need some market data to establish the value."}
            {step === 5 && "Review your information before generating the report."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-6">
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>State of Loss</Label>
                <Select
                  value={formData.state}
                  onValueChange={(v) => updateData("state", v)}
                >
                  <SelectTrigger data-testid="select-state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Case Type</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(v) => updateData("caseType", v)}
                >
                  <SelectTrigger data-testid="select-case-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diminished_value">Diminished Value</SelectItem>
                    <SelectItem value="total_loss">Total Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Insurance Company (At Fault)</Label>
                <Input
                  placeholder="e.g. State Farm"
                  value={formData.atFaultInsurerName}
                  onChange={(e) => updateData("atFaultInsurerName", e.target.value)}
                  data-testid="input-insurer"
                />
              </div>
              <div className="space-y-2">
                <Label>Claim Number</Label>
                <Input
                  placeholder="e.g. 55-9281-X2"
                  value={formData.claimNumber}
                  onChange={(e) => updateData("claimNumber", e.target.value)}
                  data-testid="input-claim-number"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Loss</Label>
                <Input
                  type="date"
                  value={formData.dateOfLoss}
                  onChange={(e) => updateData("dateOfLoss", e.target.value)}
                  data-testid="input-date-of-loss"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <VehicleSelector
                year={formData.year}
                make={formData.make}
                model={formData.model}
                trim={formData.trim}
                vin={formData.vin}
                onYearChange={(v) => updateData("year", v)}
                onMakeChange={(v) => updateData("make", v)}
                onModelChange={(v) => updateData("model", v)}
                onTrimChange={(v) => updateData("trim", v)}
                onVinChange={(v) => updateData("vin", v)}
                showTrim={true}
                showVin={true}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mileage at Loss</Label>
                  <Input
                    type="number"
                    placeholder="25000"
                    value={formData.mileageAtLoss}
                    onChange={(e) => updateData("mileageAtLoss", e.target.value)}
                    data-testid="input-mileage"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Total Repair Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                    <Input
                      className="pl-7"
                      type="number"
                      placeholder="4500.00"
                      value={formData.totalRepairCost}
                      onChange={(e) => updateData("totalRepairCost", e.target.value)}
                      data-testid="input-repair-cost"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Body Shop Name</Label>
                  <Input
                    placeholder="Joe's Collision Center"
                    value={formData.bodyShopName}
                    onChange={(e) => updateData("bodyShopName", e.target.value)}
                    data-testid="input-body-shop"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Impact Areas</Label>
                <Textarea
                  placeholder="Rear bumper, trunk lid, quarter panel..."
                  value={formData.keyImpactAreas}
                  onChange={(e) => updateData("keyImpactAreas", e.target.value)}
                  data-testid="input-impact-areas"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4">
                <strong>Automatic Valuation:</strong> We'll fetch current market values for your vehicle using real-time dealer pricing data.
              </div>
              
              {!valuationData && !fetchValuationMutation.isPending && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Click below to retrieve market values for your {formData.year} {formData.make} {formData.model}
                  </p>
                  <Button 
                    onClick={() => fetchValuationMutation.mutate()}
                    className="bg-primary"
                    data-testid="button-fetch-valuation"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Get Market Valuation
                  </Button>
                  {valuationError && (
                    <p className="text-red-600 text-sm mt-4">{valuationError}</p>
                  )}
                </div>
              )}
              
              {fetchValuationMutation.isPending && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-muted-foreground">Fetching market data...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
                </div>
              )}
              
              {valuationData && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                    <h3 className="font-semibold text-emerald-800 mb-4">Market Valuation Retrieved</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-emerald-700">Pre-Accident Value (Clean Retail)</Label>
                        <p className="text-2xl font-bold text-emerald-900" data-testid="text-pre-value">
                          ${valuationData.preAccidentValue?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-emerald-700">Post-Accident Value (Rough Retail)</Label>
                        <p className="text-2xl font-bold text-emerald-900" data-testid="text-post-value">
                          ${valuationData.postAccidentValue?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-200 text-sm text-emerald-700">
                      <p>Source: {valuationData.source}</p>
                      {valuationData.compsCount > 0 && (
                        <p>{valuationData.compsCount} comparable vehicles analyzed</p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => fetchValuationMutation.mutate()}
                    className="w-full"
                    data-testid="button-refresh-valuation"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Valuation
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center">
                <h3 className="font-serif text-xl font-bold text-emerald-800 mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-emerald-700">
                  We have everything we need to generate your Diminished Value Appraisal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vehicle:</span>
                  <div className="font-medium">
                    {formData.year} {formData.make} {formData.model} {formData.trim}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Claim:</span>
                  <div className="font-medium">
                    {formData.atFaultInsurerName || "Not specified"}{" "}
                    {formData.claimNumber && `#${formData.claimNumber}`}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Repair Cost:</span>
                  <div className="font-medium">
                    {formData.totalRepairCost
                      ? `$${parseFloat(formData.totalRepairCost).toLocaleString()}`
                      : "Not specified"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <div className="font-medium">
                    {formData.state === "GA"
                      ? "Georgia"
                      : formData.state === "FL"
                        ? "Florida"
                        : "North Carolina"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Pre-Accident Value:</span>
                  <div className="font-medium">
                    {valuationData?.preAccidentValue
                      ? `$${valuationData.preAccidentValue.toLocaleString()}`
                      : "Not fetched yet"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mileage:</span>
                  <div className="font-medium">
                    {formData.mileageAtLoss
                      ? parseInt(formData.mileageAtLoss).toLocaleString()
                      : "Not specified"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6 bg-slate-50 rounded-b-lg">
          <Button variant="outline" onClick={prevStep} disabled={step === 1 || isLoading} data-testid="button-back">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {step < 5 ? (
            <Button onClick={nextStep} className="bg-primary hover:bg-primary/90" disabled={isLoading} data-testid="button-next">
              {isLoading ? "Saving..." : "Next Step"} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={finish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              disabled={isLoading}
              data-testid="button-generate"
            >
              {isLoading ? "Calculating..." : "Generate Appraisal Report"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
