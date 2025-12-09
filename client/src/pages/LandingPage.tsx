import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, DollarSign, FileText, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/professional_automotive_financial_abstract_background.png";
import aiHeroBg from "@assets/generated_images/dark_futuristic_financial_ai_abstract_background.png";
import { useState } from "react";
import { PrequalModal } from "@/components/features/PrequalModal";

export default function LandingPage() {
  const [showPrequal, setShowPrequal] = useState(false);

  return (
    <div className="flex flex-col gap-20 pb-20">
      <PrequalModal isOpen={showPrequal} onOpenChange={setShowPrequal} />

      {/* Hero Section */}
      <section className="relative pt-24 pb-36 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
           {/* Fallback color if image fails to load, plus the AI gradient image */}
           <div className="absolute inset-0 bg-slate-950" />
           <img src={aiHeroBg} alt="AI Technology Background" className="w-full h-full object-cover opacity-60" />
           {/* Gradient overlays for readability */}
           <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl animate-in slide-in-from-left-4 duration-700 fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Certified Auto Appraisal in minutes not days
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6 tracking-tight">
              See Your Car’s <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Lost Value</span> In Seconds
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
              Check if you’re pre-qualified for a diminished value payout with a free AI-powered estimate. Then upgrade to a certified appraisal and demand letter in minutes, not days.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Button 
                size="lg" 
                onClick={() => setShowPrequal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg px-8 h-14 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50"
              >
                Get My Free Estimate (30s)
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-14 text-base backdrop-blur-sm">
                  Start Full Appraisal ($299)
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-sm font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Average check: $3,400
              </div>
              <div className="h-4 w-px bg-slate-800"></div>
              <div>Specialized in GA, FL, NC</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-serif font-bold mb-4">Why you need a professional appraisal</h2>
          <p className="text-muted-foreground">
            After an accident, repairs fix the car, but they don't fix the value history. You are owed the difference.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-secondary/20 border-none shadow-none">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 text-blue-700">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Accurate Valuations</h3>
              <p className="text-muted-foreground">
                We use real market data, comparable listings, and Black Book values to calculate the exact loss in value for your specific VIN.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary/20 border-none shadow-none">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 text-blue-700">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Professional Reports</h3>
              <p className="text-muted-foreground">
                Get a comprehensive 15+ page PDF report that looks professional and cites the specific state statutes relevant to your claim.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-secondary/20 border-none shadow-none">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 text-blue-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Demand Letters</h3>
              <p className="text-muted-foreground">
                We auto-generate a strong legal demand letter tailored to the adjuster, ready for you to sign and send.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">$3,400</div>
              <div className="text-slate-400">Average Diminished Value Check</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
              <div className="text-slate-400">Money Back Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">3 States</div>
              <div className="text-slate-400">Specialized in GA, FL, NC</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
