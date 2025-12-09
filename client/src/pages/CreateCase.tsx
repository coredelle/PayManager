import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronRight, ChevronLeft, Car, FileText, Wrench, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Claim Info", icon: FileText },
  { id: 2, title: "Vehicle", icon: Car },
  { id: 3, title: "Repairs", icon: Wrench },
  { id: 4, title: "Valuation", icon: DollarSign },
  { id: 5, title: "Review", icon: Check },
];

export default function CreateCase() {
  const [step, setStep] = useState(1);
  const [_, setLocation] = useLocation();
  const [formData, setFormData] = useState<any>({
    caseType: "diminished_value",
    state: "GA"
  });

  const updateData = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  const finish = () => {
    // In a real app, this would save to backend
    // For mockup, we redirect to a mock result page
    setLocation("/result/new");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300" 
               style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center bg-background px-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200",
                step >= s.id ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-400 bg-white"
              )}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-xs mt-2 font-medium",
                step >= s.id ? "text-foreground" : "text-muted-foreground"
              )}>{s.title}</span>
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
                <Select value={formData.state} onValueChange={(v) => updateData("state", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Case Type</Label>
                <Select value={formData.caseType} onValueChange={(v) => updateData("caseType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diminished_value">Diminished Value</SelectItem>
                    <SelectItem value="total_loss">Total Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Insurance Company (At Fault)</Label>
                <Input placeholder="e.g. State Farm" value={formData.insurer} onChange={e => updateData("insurer", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Claim Number</Label>
                <Input placeholder="e.g. 55-9281-X2" value={formData.claimNumber} onChange={e => updateData("claimNumber", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Loss</Label>
                <Input type="date" value={formData.dateOfLoss} onChange={e => updateData("dateOfLoss", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" placeholder="2022" />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Input placeholder="Honda" />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input placeholder="Accord" />
              </div>
              <div className="space-y-2">
                <Label>Trim</Label>
                <Input placeholder="Sport 2.0T" />
              </div>
              <div className="space-y-2">
                <Label>Mileage at Loss</Label>
                <Input type="number" placeholder="25000" />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input placeholder="1HG..." />
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
                    <Input className="pl-7" type="number" placeholder="4500.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Body Shop Name</Label>
                  <Input placeholder="Joe's Collision Center" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Impact Areas</Label>
                <Textarea placeholder="Rear bumper, trunk lid, quarter panel..." />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4">
                <strong>Pro Tip:</strong> For the most accurate result, enter the NADA or Black Book value if you have it. Otherwise we will estimate.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pre-Accident Value (Clean Retail)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                    <Input className="pl-7" type="number" placeholder="28000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Post-Accident Value (Rough Trade-In)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                    <Input className="pl-7" type="number" placeholder="22000" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comparable Listings (Optional)</Label>
                <Card className="bg-slate-50">
                   <CardContent className="p-4 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                         <Input placeholder="Dealer Name" className="bg-white" />
                         <Input placeholder="Price" className="bg-white" />
                         <Input placeholder="Mileage" className="bg-white" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full text-xs">+ Add Comp</Button>
                   </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center">
                <h3 className="font-serif text-xl font-bold text-emerald-800 mb-2">Ready to Calculate</h3>
                <p className="text-emerald-700">We have everything we need to generate your Diminished Value Appraisal.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vehicle:</span>
                  <div className="font-medium">2022 Honda Accord Sport</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Claim:</span>
                  <div className="font-medium">State Farm #CLM-8821</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Repair Cost:</span>
                  <div className="font-medium">$4,500.00</div>
                </div>
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <div className="font-medium">Georgia</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6 bg-slate-50 rounded-b-lg">
          <Button variant="outline" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          {step < 5 ? (
            <Button onClick={nextStep} className="bg-primary hover:bg-primary/90">
              Next Step <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
             <Button onClick={finish} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              Generate Appraisal Report
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
