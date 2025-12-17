import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Shield, FileText, MessageSquare, Zap, Lock, CreditCard, CheckCircle, Info, Award, TrendingUp, Scale } from "lucide-react";
import { AppraisalFormData } from "@/types/appraisal";

interface StepPaymentProps {
  formData: AppraisalFormData;
  appraisalId: string | null;
  onBack: () => void;
}

export default function StepPayment({ formData, appraisalId, onBack }: StepPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!appraisalId) {
      setError("Appraisal not found. Please go back and try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appraisalId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create checkout session");
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Get Instant Access to Your Certified Appraisal Package</h2>
        <p className="text-muted-foreground">
          Your certified diminished value appraisal and demand letter are ready. You will also receive complete negotiation support to help you secure the highest possible payout.
        </p>
      </div>

      {/* Value Stack */}
      <Card className="border-2 border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Certified diminished value appraisal report</span>
            </div>
            <span className="text-slate-500 line-through">$499</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Custom demand letter tailored to your adjuster</span>
            </div>
            <span className="text-slate-500 line-through">$99</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Negotiation support from a trained diminished value agent</span>
            </div>
            <span className="text-slate-500 line-through">$99</span>
          </div>
          
          <div className="flex justify-between items-center pb-3 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">Instant delivery and full support until you receive your diminished value check</span>
            </div>
            <span className="text-slate-500 italic">Priceless</span>
          </div>
          
          <div className="pt-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total value:</span>
              <span className="text-slate-500 line-through">$699</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Your price today:</span>
              <span className="text-3xl font-bold text-emerald-600">$299</span>
            </div>
            <p className="text-sm text-emerald-700 text-right font-medium">Limited time offer</p>
          </div>
        </CardContent>
      </Card>

      {/* Guarantee Block */}
      <Card className="bg-slate-900 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-emerald-400" />
            <h3 className="text-lg font-semibold">You are fully protected</h3>
          </div>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
              <span>100 percent money back guarantee</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
              <span>Support until your diminished value check arrives</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
              <div className="flex items-center gap-2">
                <span>If your payout is not at least three times what you pay us, you get a full refund</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>To qualify for a refund, simply submit insurer responses and allow us to support you throughout the negotiation. If your final payout after a complete negotiation cycle is not at least three times the cost of our service, we will refund you 100 percent.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-full">
          <Award className="h-4 w-4 text-emerald-500" />
          <span>IACP Certified</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-full">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>Market Data Verified</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-full">
          <Scale className="h-4 w-4 text-emerald-500" />
          <span>Court Ready</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-full">
          <Lock className="h-4 w-4 text-emerald-500" />
          <span>Secure Payment via Stripe</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-full">
          <Zap className="h-4 w-4 text-emerald-500" />
          <span>Instant Digital Delivery</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1" data-testid="button-back-payment">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleCheckout}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 h-14 text-lg"
          disabled={isLoading}
          data-testid="button-checkout"
        >
          {isLoading ? (
            "Processing..."
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Get My Certified Appraisal and Demand Letter
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
