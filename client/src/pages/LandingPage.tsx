import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, ArrowRight, ShieldCheck, MessageSquare, TrendingUp, Clock, Zap, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { PrequalModal } from "@/components/features/PrequalModal";

export default function LandingPage() {
  const [showPrequal, setShowPrequal] = useState(false);

  return (
    <div className="flex flex-col">
      <PrequalModal isOpen={showPrequal} onOpenChange={setShowPrequal} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm" data-testid="badge-iacp">
              <ShieldCheck className="h-4 w-4" />
              IACP certified diminished value appraisal • Insurer and court recognized
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6 tracking-tight" data-testid="hero-title">
              Georgia's Diminished Value Experts
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto" data-testid="hero-subtitle">
              We specialize in one thing: helping Georgia drivers recover fair diminished value after an accident. Built specifically around Georgia's unique diminished value law. Backed by Georgia Supreme Court and Court of Appeals case law, including Mabry v. State Farm and Perma Ad Ideas v. Mayville. Powered by real market data, a third-party valuation provider, and live comparable listings – not guesswork or canned formulas.
            </p>

            {/* Statute of Limitations Block */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-6 py-4 mb-8 max-w-2xl mx-auto" data-testid="statute-block">
              <p className="text-slate-300 text-base">
                Georgia law allows you to pursue diminished value for up to 4 years after an accident. Even if your repair was months or years ago you may still be eligible to recover lost value. Currently serving Georgia claims only.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button 
                size="lg" 
                onClick={() => setShowPrequal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg px-8 h-14 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50"
                data-testid="button-free-estimate"
              >
                Check your eligibility + estimated compensation for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Link href="/georgia-appraisal">
                <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white/10 h-14 text-lg px-8 backdrop-blur-sm w-full sm:w-auto" data-testid="button-generate-appraisal">
                  Generate my Georgia DV appraisal
                </Button>
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-emerald-400 font-semibold text-lg mb-6" data-testid="trust-line">
              Instant. Certified. Court Ready.
            </p>
            
            {/* Badges */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-300 text-sm font-medium" data-testid="badge-states">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Georgia Diminished Value Specialists
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 text-slate-300 text-sm font-medium" data-testid="badge-instant">
                <Zap className="h-4 w-4 text-emerald-400" />
                Mabry v. State Farm Compliant
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why You Need a Professional Appraisal */}
      <section className="py-20 bg-white" data-testid="section-why-appraisal">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Why you need a professional appraisal</h2>
            <p className="text-lg text-muted-foreground">
              After an accident shops repair the damage. No one fixes the lost value. That is diminished value and that is what we recover so you are made whole.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow" data-testid="card-accurate-valuations">
              <CardContent className="pt-8 pb-8">
                <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 text-emerald-700">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Accurate valuations</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We use industry standard valuation data, comparable retail listings, and real time market insights to calculate the precise loss in value for your VIN. This ensures you receive maximum compensation for your vehicle's diminished value.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow" data-testid="card-professional-reports">
              <CardContent className="pt-8 pb-8">
                <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6 text-blue-700">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Professional reports</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get a comprehensive IACP certified appraisal that cites the specific statutes and case law for your state. Your appraisal is court ready and accepted by insurers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-none shadow-sm hover:shadow-md transition-shadow" data-testid="card-demand-letters">
              <CardContent className="pt-8 pb-8">
                <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6 text-purple-700">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Demand letters</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your package includes a strong demand letter tailored to your adjuster. Start your claim on solid legal and valuation footing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Speed Block */}
      <section className="py-12 bg-emerald-500" data-testid="section-speed">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-8 w-8 text-slate-950" />
            <p className="text-2xl md:text-3xl font-bold text-slate-950">
              Most appraisers take days. We deliver instantly.
            </p>
          </div>
        </div>
      </section>

      {/* End-to-End Support Section */}
      <section className="py-20 bg-slate-50" data-testid="section-end-to-end">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-6 text-white">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">We help you all the way to your diminished value check</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  Most appraisal companies hand you a report and disappear. We guide you end to end. When the insurer responds, upload their message. Our system drafts a clear response based on case law, valuation logic, and proven negotiation strategy.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We help you interpret low offers, choose the right tone, and send strong counters until your diminished value check arrives.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-2" />
                    <span className="text-emerald-800 font-semibold">Full Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900 py-16 text-white" data-testid="section-stats">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="py-4" data-testid="stat-average-recovery">
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">$3,400</div>
              <div className="text-slate-400">Average Georgia DV recovery</div>
            </div>
            <div className="py-4 md:border-l md:border-r border-slate-700" data-testid="stat-guarantee">
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">100%</div>
              <div className="text-slate-400">Money back guarantee</div>
            </div>
            <div className="py-4" data-testid="stat-states">
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">Georgia</div>
              <div className="text-slate-400">Mabry & Perma Case Law</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white" data-testid="section-how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">How it works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center" data-testid="step-1">
              <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="font-semibold text-xl mb-3">Check eligibility</h3>
              <p className="text-muted-foreground">
                Enter your vehicle and accident details to confirm you qualify.
              </p>
            </div>
            
            <div className="text-center" data-testid="step-2">
              <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="font-semibold text-xl mb-3">Generate your certified appraisal</h3>
              <p className="text-muted-foreground">
                Instantly receive your full appraisal package. Your appraisal includes valuation data, market comps, and a demand letter with state specific legal references.
              </p>
            </div>

            <div className="text-center" data-testid="step-3">
              <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="font-semibold text-xl mb-3">Negotiate with confidence</h3>
              <p className="text-muted-foreground">
                Upload insurer messages and get guided counter responses until your diminished value check is paid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50" data-testid="section-faq">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Frequently asked questions</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" data-testid="faq-iacp">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What does IACP certified mean
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  It means your appraisal is produced by an appraiser certified by the Bureau of Certified Auto Appraisers and follows accepted industry and legal standards used by insurers and courts.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" data-testid="faq-states">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Why is Georgia special for diminished value claims
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Georgia's Supreme Court ruled in Mabry v. State Farm (2001) that insurers must pay inherent diminished value when it exists. Georgia Insurance Commissioner Directive 08-P&C-2 prohibits insurers from using a one-size-fits-all formula. Our appraisals are built around this Georgia-specific legal framework.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" data-testid="faq-accepted">
                <AccordionTrigger className="text-left text-lg font-medium">
                  Will insurers accept this appraisal
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Our reports are designed for insurer review and court use. They cite valuation sources, comps, and state specific authority to substantiate the diminished value amount.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" data-testid="faq-recovery">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How much can I recover
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Payouts vary by vehicle, damage, and market conditions. Use the eligibility tool to receive an estimated range, then generate your certified appraisal to support your claim.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" data-testid="faq-lowball">
                <AccordionTrigger className="text-left text-lg font-medium">
                  What if the adjuster lowballs me
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Upload the offer. We generate a tailored counter with valuation logic and legal support so you can negotiate from a position of strength.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" data-testid="faq-speed">
                <AccordionTrigger className="text-left text-lg font-medium">
                  How fast is the process
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  Your appraisal is generated instantly. Eligibility is immediate, and negotiation timelines depend on insurer response cycles.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
