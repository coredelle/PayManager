import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, DollarSign, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/professional_automotive_financial_abstract_background.png";

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src={heroImage} alt="Abstract Automotive Background" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-in slide-in-from-left-4 duration-700 fade-in">
            <Badge variant="outline" className="text-blue-200 border-blue-400/30 mb-6 py-1 px-3 text-sm">
              Accepted by Major Insurers
            </Badge>
            <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight mb-6">
              Recover Your Car's <span className="text-blue-400">Lost Value</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Don't settle for the insurance company's first offer. We generate professional diminished value appraisals and demand letters that help you get paid what you deserve.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8 h-12">
                  Start Your Appraisal
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-12">
                  Login to Account
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required to start
            </p>
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
