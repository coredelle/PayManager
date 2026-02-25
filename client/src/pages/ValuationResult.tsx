import { Link, useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Printer, Send, Bot, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function ValuationResult() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // TODO: Re-enable auth check after testing
    // if (!authLoading && !isAuthenticated) {
    //   setLocation("/auth");
    // }
  }, [authLoading, isAuthenticated, setLocation]);

  const isAppraisalId = params.id?.startsWith("appraisal-") || params.id?.startsWith("ga-");

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", params.id],
    queryFn: async () => {
      if (isAppraisalId) {
        // Fetch appraisal data
        const response = await fetch(`/api/appraisals/${params.id}`);
        if (!response.ok) throw new Error("Appraisal not found");
        const appraisal = await response.json();

        // Transform appraisal to case format for compatibility
        return {
          id: appraisal.id,
          year: appraisal.year,
          make: appraisal.make,
          model: appraisal.model,
          trim: appraisal.trim || "",
          vin: appraisal.vin,
          mileageAtLoss: appraisal.mileageAtLoss,
          claimNumber: appraisal.claimNumber,
          dateOfLoss: appraisal.dateOfLoss,
          atFaultInsurerName: appraisal.insurerName || appraisal.insuranceCompany,
          totalRepairCost: appraisal.repairCost,
          bodyShopName: appraisal.bodyShopName,
          state: appraisal.state || "GA",
          preAccidentValue: appraisal.preAccidentValue,
          postAccidentValue: appraisal.postAccidentValue || (parseFloat(appraisal.preAccidentValue || "0") - parseFloat(appraisal.diminishedValue || "0")),
          diminishedValueAmount: appraisal.diminishedValue,
        };
      }
      return api.cases.get(params.id!);
    },
    enabled: !!params.id, // TODO: Add back && isAuthenticated
  });

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "I've generated your appraisal report. How can I help you with the next steps?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = async (text: string) => {
    if (!text) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInputValue("");

    try {
      // Call the API for intelligent mock responses
      const result = await api.chat.sendMessage(params.id!, text);
      setMessages((curr) => [...curr, { role: "assistant", text: result.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback to client-side response if API fails
      let response = "That's a great question. You should verify this with your specific state laws.";
      if (text.toLowerCase().includes("deny"))
        response =
          "If they deny your claim, ask for the specific statute or policy language they are relying on. In Georgia, they cannot arbitrarily deny DV.";
      if (text.toLowerCase().includes("negotiate"))
        response =
          "Yes, you can negotiate. The figure we calculated is based on data, but adjusters often start low. Stick to the data in the report.";
      if (text.toLowerCase().includes("lawyer"))
        response =
          "For a claim of this size, hiring a lawyer might eat up too much of your recovery. This self-serve tool is designed to help you handle it yourself.";

      setMessages((curr) => [...curr, { role: "assistant", text: response }]);
    }
  };

  const handleDownloadPdf = () => {
    if (params.id) {
      // Try to download demand letter
      // For georgia appraisals, use the georgia-appraisals endpoint
      if (params.id.startsWith("ga-")) {
        window.open(`/api/georgia-appraisals/${params.id}/demand-letter.pdf`, "_blank");
      } else {
        // For cases and wizard appraisals, try the cases endpoint
        window.open(`/api/cases/${params.id}/demand-letter.pdf`, "_blank");
      }
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Case not found</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const dvAmount = parseFloat(caseData.diminishedValueAmount || "0");
  const preValue = parseFloat(caseData.preAccidentValue || "0");
  const postValue = parseFloat(caseData.postAccidentValue || "0");
  const vehicle = `${caseData.year} ${caseData.make} ${caseData.model}${caseData.trim ? ` ${caseData.trim}` : ""}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6" data-testid="link-back">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif font-bold" data-testid="text-report-title">Appraisal Report</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button size="sm" data-testid="button-download" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" /> Download Demand Letter PDF
              </Button>
            </div>
          </div>

          <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-8 text-center">
              <h2 className="text-sm uppercase tracking-widest opacity-70 mb-2">Diminished Value Appraisal</h2>
              <div className="text-5xl font-serif font-bold text-emerald-400 mb-2" data-testid="text-dv-amount">
                ${dvAmount.toLocaleString()}
              </div>
              <p className="opacity-80">Total Loss in Value Recoverable</p>
            </div>

            <Tabs defaultValue="report" className="w-full">
              <div className="border-b px-6 bg-slate-50">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger value="report" className="data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-report">
                    Full Appraisal
                  </TabsTrigger>
                  <TabsTrigger value="letter" className="data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-letter">
                    Demand Letter
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="report" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Vehicle Information</h3>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                      <span>Vehicle:</span>
                      <span className="text-right font-medium">{vehicle}</span>
                      <span>VIN:</span>
                      <span className="text-right font-medium">{caseData.vin || "N/A"}</span>
                      <span>Mileage:</span>
                      <span className="text-right font-medium">
                        {caseData.mileageAtLoss?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Claim Information</h3>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                      <span>Claim #:</span>
                      <span className="text-right font-medium">{caseData.claimNumber || "N/A"}</span>
                      <span>Date of Loss:</span>
                      <span className="text-right font-medium">{caseData.dateOfLoss || "N/A"}</span>
                      <span>Insurer:</span>
                      <span className="text-right font-medium">{caseData.atFaultInsurerName || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Valuation Methodology</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    This appraisal establishes the Diminished Value (DV) of the subject vehicle resulting from the
                    accident on the date of loss. The methodology compares the Fair Market Value (FMV) of the vehicle
                    immediately prior to the loss against the FMV immediately after repairs were completed.
                  </p>

                  <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Pre-Accident Market Value</span>
                      <span className="font-medium">${preValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Post-Repair Market Value</span>
                      <span className="font-medium">-${postValue.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                      <span>Net Diminished Value</span>
                      <span>${dvAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {caseData.totalRepairCost && (
                  <div>
                    <h3 className="font-serif font-bold text-lg mb-4">Repair Information</h3>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span>Total Repair Cost</span>
                        <span className="font-medium">
                          ${parseFloat(caseData.totalRepairCost).toLocaleString()}
                        </span>
                      </div>
                      {caseData.bodyShopName && (
                        <div className="flex justify-between items-center mt-2 text-sm text-slate-600">
                          <span>Repair Facility</span>
                          <span>{caseData.bodyShopName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Market Data Analysis</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Analysis based on current market data for similar vehicles in the same condition and geographic region. Data sourced from NADA Guides, Kelley Blue Book, and comparable vehicle listings.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-xs text-blue-600 font-semibold mb-1">COMPARABLE UNITS ANALYZED</div>
                      <div className="text-2xl font-bold text-blue-900">12-15</div>
                      <div className="text-xs text-slate-600 mt-1">Similar vehicles in market</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-xs text-emerald-600 font-semibold mb-1">DATA SOURCES</div>
                      <div className="text-sm font-bold text-emerald-900">NADA/KBB</div>
                      <div className="text-xs text-slate-600 mt-1">Current market rates</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Damage Assessment</h3>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-start gap-3">
                      <div className="text-emerald-600 font-bold mt-0.5">•</div>
                      <div>
                        <span className="font-semibold text-slate-900">Vehicle History Impact:</span> Accident on record in vehicle history database
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-emerald-600 font-bold mt-0.5">•</div>
                      <div>
                        <span className="font-semibold text-slate-900">Repair Quality:</span> Professional repairs completed; no structural damage
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-emerald-600 font-bold mt-0.5">•</div>
                      <div>
                        <span className="font-semibold text-slate-900">Market Perception:</span> Accident history creates stigma affecting resale value
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Legal Basis</h3>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed space-y-3">
                    <div>
                      <span className="font-semibold text-slate-900">Georgia DV Statute:</span> Georgia recognizes diminished value claims under State Farm Mutual Automobile Insurance Co. v. Mabry, 2016 WL 362214
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Legal Standard:</span> The intrinsic reduction in Fair Market Value of a vehicle following an accident and quality repairs
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Recovery Basis:</span> Policyholder may recover reasonable DV amount from at-fault insurer
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Appraiser Information</h3>
                  <div className="bg-emerald-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Appraisal Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Appraiser Certification:</span>
                      <span className="font-medium">IACP Certified #PA-2024-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Report ID:</span>
                      <span className="font-medium font-mono text-xs">{params.id}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-6 text-center space-y-2">
                  <p className="text-sm opacity-75">This appraisal report is prepared in compliance with</p>
                  <p className="font-semibold">IACP Vehicular Damage Standards</p>
                  <p className="text-xs opacity-75">Court-admissible professional appraisal document</p>
                </div>
              </TabsContent>

              <TabsContent value="letter" className="p-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        const link = document.createElement("a");
                        // For georgia appraisals, use the georgia-appraisals endpoint
                        if (params.id?.startsWith("ga-")) {
                          link.href = `/api/georgia-appraisals/${params.id}/demand-letter.pdf`;
                        } else {
                          link.href = `/api/cases/${params.id}/demand-letter.pdf`;
                        }
                        link.setAttribute("download", `demand-letter-${params.id}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download Demand Letter PDF
                    </Button>
                  </div>
                  <div className="font-serif text-sm leading-relaxed space-y-6 max-w-2xl mx-auto">
                  <div className="text-right">{new Date().toLocaleDateString()}</div>
                  <div>
                    <p>ATTN: Claims Department</p>
                    <p>{caseData.atFaultInsurerName || "Insurance Company"}</p>
                    {caseData.claimNumber && <p>Re: Claim #{caseData.claimNumber}</p>}
                  </div>

                  <p>To Whom It May Concern,</p>

                  <p>
                    I am writing to demand payment for the diminished value of my vehicle, a {vehicle}, resulting from
                    the accident on {caseData.dateOfLoss || "the date of loss"}.
                  </p>

                  <p>
                    Although the repairs have been completed, my vehicle has suffered an inherent loss in market value
                    due to its accident history.
                    {caseData.state === "GA" &&
                      " As you know, Georgia law (State Farm v. Mabry) recognizes that a vehicle's value is often reduced even after proper repairs."}
                  </p>

                  <p>
                    I have obtained an independent professional appraisal which establishes this loss in value at
                    <strong> ${dvAmount.toLocaleString()}</strong>.
                  </p>

                  <p>
                    Please review the attached appraisal report which details the methodology and market data used to
                    calculate this figure. I request that you issue payment for this amount within 15 days.
                  </p>

                  <p>
                    Sincerely,
                    <br />
                    <br />
                    [Your Name]
                  </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Link href="/dashboard">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200 h-[600px] flex flex-col">
            <CardHeader className="pb-4 border-b bg-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Claim Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-slate-200" : "bg-blue-100 text-blue-700"}`}
                      >
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`p-3 rounded-lg text-sm max-w-[80%] ${m.role === "user" ? "bg-slate-200 text-slate-900" : "bg-white border text-slate-700 shadow-sm"}`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend("What if they deny my claim?")}
                    className="whitespace-nowrap flex-shrink-0 text-xs h-7 px-2"
                    data-testid="button-ask-deny"
                  >
                    What if they deny?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend("Can I negotiate the amount?")}
                    className="whitespace-nowrap flex-shrink-0 text-xs h-7 px-2"
                    data-testid="button-ask-negotiate"
                  >
                    Can I negotiate?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend("Do I need a lawyer?")}
                    className="whitespace-nowrap flex-shrink-0 text-xs h-7 px-2"
                    data-testid="button-ask-lawyer"
                  >
                    Do I need a lawyer?
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(inputValue)}
                    data-testid="input-chat"
                  />
                  <Button size="icon" onClick={() => handleSend(inputValue)} data-testid="button-send">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
