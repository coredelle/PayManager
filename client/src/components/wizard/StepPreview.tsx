import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, CheckCircle, TrendingUp, Scale, MessageSquare } from "lucide-react";
import { AppraisalFormData } from "@/types/appraisal";

interface StepPreviewProps {
  formData: AppraisalFormData;
  onNext: () => void;
  onBack: () => void;
  setAppraisalId: (id: string) => void;
  setIsSubmitting: (loading: boolean) => void;
  isSubmitting: boolean;
}

export default function StepPreview({
  formData,
  onNext,
  onBack,
  setAppraisalId,
  setIsSubmitting,
  isSubmitting,
}: StepPreviewProps) {
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/appraisals/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save appraisal");
      }

      const data = await response.json();
      setAppraisalId(data.id);
      onNext();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Your Certified Diminished Value Appraisal Is Ready</h2>
        <p className="text-muted-foreground">
          We have prepared your personalized certified appraisal and demand letter based on the information you provided.
        </p>
      </div>

      {/* Preview Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 z-10" />
          <CardContent className="p-6 blur-sm">
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-20 bg-slate-100 rounded mt-4" />
            </div>
          </CardContent>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              Certified Appraisal
            </span>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80 z-10" />
          <CardContent className="p-6 blur-sm">
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-4/5" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded mt-4" />
            </div>
          </CardContent>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              Demand Letter
            </span>
          </div>
        </Card>
      </div>

      {/* What's Included */}
      <Card className="bg-slate-50 border-none">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Your package includes:</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span>Value impact summary: calculated</span>
            </li>
            <li className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span>Market comps included</span>
            </li>
            <li className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-emerald-500" />
              <span>State specific citations included</span>
            </li>
            <li className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              <span>Negotiation support included</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1" data-testid="button-back-preview">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          disabled={isSubmitting}
          data-testid="button-download-appraisal"
        >
          {isSubmitting ? (
            "Processing..."
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download My Certified Diminished Value Appraisal and Demand Letter
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
