import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail } from "lucide-react";
import { AppraisalFormData } from "@/types/appraisal";

interface StepEmailProps {
  formData: AppraisalFormData;
  updateFormData: (updates: Partial<AppraisalFormData>) => void;
  onNext: () => void;
}

export default function StepEmail({ formData, updateFormData, onNext }: StepEmailProps) {
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    if (!formData.email) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Save Your Progress</h2>
        <p className="text-muted-foreground">
          We never share your information. Saving your progress allows you to return anytime.
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => {
              updateFormData({ email: e.target.value });
              if (error) setError("");
            }}
            className={error ? "border-red-500" : ""}
            data-testid="input-email"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <Button
          onClick={handleContinue}
          className="w-full bg-emerald-500 hover:bg-emerald-600"
          size="lg"
          data-testid="button-continue-email"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
