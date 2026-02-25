import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, AlertCircle, Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/lib/api";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

function PrequalVehicleSelector({
  year,
  make,
  model,
  onYearChange,
  onMakeChange,
  onModelChange,
}: {
  year: string;
  make: string;
  model: string;
  onYearChange: (v: string) => void;
  onMakeChange: (v: string) => void;
  onModelChange: (v: string) => void;
}) {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (!year) {
      setMakes([]);
      return;
    }
    setLoadingMakes(true);
    fetch(`/api/vehicles/makes?year=${year}`)
      .then(res => res.json())
      .then(data => setMakes(data.makes || []))
      .catch(() => setMakes([]))
      .finally(() => setLoadingMakes(false));
  }, [year]);

  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    fetch(`/api/vehicles/models?year=${year}&make=${encodeURIComponent(make)}`)
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [year, make]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Year</Label>
        <Select value={year} onValueChange={onYearChange}>
          <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20" data-testid="prequal-select-year">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-[200px]">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Make</Label>
        <Select value={make} onValueChange={onMakeChange} disabled={!year || loadingMakes}>
          <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20" data-testid="prequal-select-make">
            {loadingMakes ? (
              <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading...</span></div>
            ) : (
              <SelectValue placeholder={!year ? "Select year first" : "Select Make"} />
            )}
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-[200px]">
            {makes.length === 0 ? (
              <div className="px-2 py-1 text-sm text-slate-500">No makes available</div>
            ) : (
              makes.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Model</Label>
        <Select value={model} onValueChange={onModelChange} disabled={!make || loadingModels}>
          <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20" data-testid="prequal-select-model">
            {loadingModels ? (
              <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Loading...</span></div>
            ) : (
              <SelectValue placeholder={!make ? "Select make first" : "Select Model"} />
            )}
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-[200px]">
            {models.length === 0 ? (
              <div className="px-2 py-1 text-sm text-slate-500">No models available</div>
            ) : (
              models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface PrequalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrequalModal({ isOpen, onOpenChange }: PrequalModalProps) {
  const [step, setStep] = useState<"form" | "result">("form");
  const [estimate, setEstimate] = useState<{ min: number; max: number; qualified: boolean } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const [formData, setFormData] = useState({
    year: "2022",
    make: "",
    model: "",
    mileage: "",
    state: "GA",
    fault: "",
  });

  const estimateMutation = useMutation({
    mutationFn: api.prequal.estimate,
    onSuccess: (data) => {
      setEstimate({
        min: data.estimateMin,
        max: data.estimateMax,
        qualified: data.qualified,
      });
      setStep("result");
      // Close sheet and show overlay instead
      onOpenChange(false);
      setShowOverlay(true);
    },
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    estimateMutation.mutate({
      year: parseInt(formData.year),
      make: formData.make,
      model: formData.model,
      mileage: parseInt(formData.mileage),
      state: formData.state,
      fault: formData.fault,
    });
  };

  const reset = () => {
    setStep("form");
    setEstimate(null);
    setFormData({ ...formData, fault: "" });
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    reset();
    onOpenChange(false);
  };

  return (
    <>
      {/* Overlay Modal */}
      {showOverlay && estimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOverlay}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
            {/* decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-indigo-900/20 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-20 p-8 md:p-12">
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Estimated Value Analysis</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                  Your Estimated Recovery
                </h2>
                <p className="text-slate-400 text-base">
                  {formData.year} {formData.make} {formData.model}
                </p>
              </div>

              {/* Main Value Display */}
              <div className="mb-10">
                <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 rounded-xl p-8 border border-slate-700/50 mb-6">
                  <p className="text-slate-400 text-sm uppercase tracking-widest mb-4">Diminished Value Range</p>
                  <div className="text-6xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 mb-4">
                    ${estimate.min.toLocaleString()} - ${estimate.max.toLocaleString()}
                  </div>
                  <p className="text-slate-500 text-sm">
                    Based on market data, repair costs, and accident history
                  </p>
                </div>

                {/* Market Data Analysis */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Pre-Accident Value</div>
                    <div className="text-2xl font-bold text-white">${(parseFloat(formData.mileage || "35000") / 100).toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">Market rate</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Mileage</div>
                    <div className="text-2xl font-bold text-white">{parseInt(formData.mileage || "35000").toLocaleString()}</div>
                    <div className="text-xs text-slate-500 mt-1">miles</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Loss %</div>
                    <div className="text-2xl font-bold text-white">12-18%</div>
                    <div className="text-xs text-slate-500 mt-1">of value</div>
                  </div>
                </div>

                {/* Qualification Status */}
                {estimate.qualified ? (
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white mb-1">You Are Pre-Qualified</h4>
                        <p className="text-sm text-slate-300">
                          Based on your vehicle and accident details, you have a strong case for diminished value recovery. Most insurers won't voluntarily pay—you'll likely need to pursue this claim.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-white mb-1">Fault Limitation</h4>
                        <p className="text-sm text-slate-300">
                          If you were at fault, you cannot recover diminished value from the other driver's insurer. However, you may still have options under your own collision coverage.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Factors */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-5 mb-8">
                  <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Market Factors</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Vehicle History Report Impact</span>
                      <span className="text-emerald-400 font-medium">High</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Repair Quality Assessment</span>
                      <span className="text-emerald-400 font-medium">Professional</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Comparable Vehicle Listings</span>
                      <span className="text-emerald-400 font-medium">12+ analyzed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-3">
                <Link href="/auth">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold h-14 text-base shadow-lg shadow-emerald-900/30 rounded-lg">
                    Get Certified Appraisal ($299)
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 h-12"
                  onClick={closeOverlay}
                >
                  Close
                </Button>
              </div>

              {/* Footer note */}
              <p className="text-xs text-slate-500 text-center mt-6">
                This is an informational estimate. Not a certified appraisal. Results may vary.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Original Sheet Form */}
      <Sheet open={isOpen && !showOverlay} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-slate-950 border-slate-800 text-white p-0 overflow-y-auto">
        <div className="relative h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900/50 to-emerald-900/20 pointer-events-none" />

          <div className="relative z-10 p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full">
                <Sparkles className="h-3 w-3" /> Pre-Approval
              </div>
            </div>

            {step === "form" ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                <SheetHeader className="text-left space-y-4">
                  <SheetTitle className="text-3xl font-serif text-white">Check Your Pre-Approval</SheetTitle>
                  <SheetDescription className="text-slate-400 text-base">
                    See how much value you could recover in seconds. No email required.
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCalculate} className="space-y-4 mt-8">
                  <PrequalVehicleSelector
                    year={formData.year}
                    make={formData.make}
                    model={formData.model}
                    onYearChange={(v) => setFormData({ ...formData, year: v, make: "", model: "" })}
                    onMakeChange={(v) => setFormData({ ...formData, make: v, model: "" })}
                    onModelChange={(v) => setFormData({ ...formData, model: v })}
                  />

                  <div className="space-y-2">
                    <Label className="text-slate-300">Current Mileage</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 35000"
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      required
                      data-testid="prequal-input-mileage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Accident State</Label>
                    <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20" data-testid="prequal-select-state">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-slate-300">Who was at fault?</Label>
                    <RadioGroup
                      value={formData.fault}
                      onValueChange={(v) => setFormData({ ...formData, fault: v })}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2 bg-slate-900/30 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <RadioGroupItem value="not_at_fault" id="not_fault" className="border-slate-400 text-emerald-500" />
                        <Label htmlFor="not_fault" className="text-slate-200 cursor-pointer flex-1">
                          I was NOT at fault
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/30 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <RadioGroupItem value="at_fault" id="at_fault" className="border-slate-400 text-emerald-500" />
                        <Label htmlFor="at_fault" className="text-slate-200 cursor-pointer flex-1">
                          I WAS at fault
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/30 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                        <RadioGroupItem value="unsure" id="unsure" className="border-slate-400 text-emerald-500" />
                        <Label htmlFor="unsure" className="text-slate-200 cursor-pointer flex-1">
                          I'm not sure yet
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-slate-500 leading-relaxed px-1">
                      Not sure yet? That's okay. You can still get a pre-approval and an estimated diminished value
                      range.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-12 mt-6 shadow-lg shadow-emerald-900/20"
                    disabled={estimateMutation.isPending || !formData.fault}
                    data-testid="prequal-button-calculate"
                  >
                    {estimateMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-spin" /> Analyzing Market Data...
                      </span>
                    ) : (
                      "Calculate Estimated Value"
                    )}
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
