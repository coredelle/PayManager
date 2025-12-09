import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Printer, Send, MessageSquare, Bot, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function ValuationResult() {
  const params = useParams();
  
  // Mock data for result
  const result = {
    preValue: 28500,
    postValue: 24200,
    dvAmount: 4300,
    vehicle: "2022 Honda Accord Sport",
    vin: "1HG...9921",
    claim: "CLM-2024-8892"
  };

  const [messages, setMessages] = useState([
    { role: "assistant", text: "I've generated your appraisal report. Based on the market data, you have a strong case for $4,300 in diminished value. How can I help you with the next steps?" }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSend = (text: string) => {
    if (!text) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInputValue("");

    // Mock response
    setTimeout(() => {
      let response = "That's a great question. You should verify this with your specific state laws.";
      if (text.includes("deny")) response = "If they deny your claim, ask for the specific statute or policy language they are relying on. In Georgia, they cannot arbitrarily deny DV.";
      if (text.includes("negotiate")) response = "Yes, you can negotiate. The figure we calculated is based on data, but adjusters often start low. Stick to the data in the report.";
      if (text.includes("lawyer")) response = "For a claim of this size ($4,300), hiring a lawyer might eat up too much of your recovery. This self-serve tool is designed to help you handle it yourself.";
      
      setMessages(curr => [...curr, { role: "assistant", text: response }]);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard">
        <a className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </a>
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif font-bold">Appraisal Report</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>

          <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-8 text-center">
              <h2 className="text-sm uppercase tracking-widest opacity-70 mb-2">Diminished Value Appraisal</h2>
              <div className="text-5xl font-serif font-bold text-emerald-400 mb-2">
                ${result.dvAmount.toLocaleString()}
              </div>
              <p className="opacity-80">Total Loss in Value Recoverable</p>
            </div>
            
            <Tabs defaultValue="report" className="w-full">
              <div className="border-b px-6 bg-slate-50">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger value="report" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Full Appraisal</TabsTrigger>
                  <TabsTrigger value="letter" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Demand Letter</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="report" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Vehicle Information</h3>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                      <span>Vehicle:</span> <span className="text-right font-medium">{result.vehicle}</span>
                      <span>VIN:</span> <span className="text-right font-medium">{result.vin}</span>
                      <span>Mileage:</span> <span className="text-right font-medium">25,400</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Claim Information</h3>
                    <div className="grid grid-cols-2 gap-y-1 text-slate-600">
                      <span>Claim #:</span> <span className="text-right font-medium">{result.claim}</span>
                      <span>Date of Loss:</span> <span className="text-right font-medium">Nov 15, 2024</span>
                      <span>Insurer:</span> <span className="text-right font-medium">State Farm</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Valuation Methodology</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    This appraisal establishes the Diminished Value (DV) of the subject vehicle resulting from the accident on the date of loss.
                    The methodology compares the Fair Market Value (FMV) of the vehicle immediately prior to the loss against the FMV immediately after repairs were completed.
                  </p>
                  
                  <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Pre-Accident Market Value</span>
                      <span className="font-medium">${result.preValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Post-Repair Market Value</span>
                      <span className="font-medium">-${result.postValue.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                      <span>Net Diminished Value</span>
                      <span>${result.dvAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-lg mb-4">Comparable Vehicles</h3>
                  <div className="text-sm text-slate-500 italic">
                    Market data derived from 3 comparable dealer listings within 50 miles.
                  </div>
                  {/* Mock Table */}
                  <div className="mt-4 border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-3 text-left font-medium">Vehicle</th>
                          <th className="p-3 text-right font-medium">Miles</th>
                          <th className="p-3 text-right font-medium">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3">2022 Honda Accord Sport</td>
                          <td className="p-3 text-right">22,000</td>
                          <td className="p-3 text-right">$28,900</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">2022 Honda Accord Sport</td>
                          <td className="p-3 text-right">28,500</td>
                          <td className="p-3 text-right">$27,995</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="letter" className="p-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="font-serif text-sm leading-relaxed space-y-6 max-w-2xl mx-auto">
                  <div className="text-right">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div>
                    <p>ATTN: Claims Department</p>
                    <p>State Farm Insurance</p>
                    <p>Re: Claim #{result.claim}</p>
                  </div>
                  
                  <p>To Whom It May Concern,</p>

                  <p>
                    I am writing to demand payment for the diminished value of my vehicle, a {result.vehicle}, 
                    resulting from the accident on November 15, 2024.
                  </p>

                  <p>
                    Although the repairs have been completed, my vehicle has suffered an inherent loss in market value 
                    due to its accident history. As you know, Georgia law (State Farm v. Mabry) recognizes that a 
                    vehicle's value is often reduced even after proper repairs.
                  </p>

                  <p>
                    I have obtained an independent professional appraisal which establishes this loss in value at 
                    <strong> ${result.dvAmount.toLocaleString()}</strong>.
                  </p>

                  <p>
                    Please review the attached appraisal report which details the methodology and market data used 
                    to calculate this figure. I request that you issue payment for this amount within 15 days.
                  </p>

                  <p>
                    Sincerely,<br/><br/>
                    Alex Driver
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Panel: Chat / Guidance */}
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
                     <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                       <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200' : 'bg-blue-100 text-blue-700'}`}>
                         {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                       </div>
                       <div className={`p-3 rounded-lg text-sm max-w-[80%] ${m.role === 'user' ? 'bg-slate-200 text-slate-900' : 'bg-white border text-slate-700 shadow-sm'}`}>
                         {m.text}
                       </div>
                     </div>
                   ))}
                 </div>
               </ScrollArea>
               <div className="p-4 border-t bg-white rounded-b-lg">
                 <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                    <Button variant="outline" size="sm" onClick={() => handleSend("What if they deny my claim?")} className="whitespace-nowrap flex-shrink-0 text-xs h-7 px-2">
                      What if they deny?
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSend("Can I negotiate the amount?")} className="whitespace-nowrap flex-shrink-0 text-xs h-7 px-2">
                      Can I negotiate?
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSend("Do I need a lawyer?")} className="whitespace-nowrap flex-shrink-0 text-xs h-7 px-2">
                      Do I need a lawyer?
                    </Button>
                 </div>
                 <div className="flex gap-2">
                   <Input 
                      placeholder="Ask a question..." 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                   />
                   <Button size="icon" onClick={() => handleSend(inputValue)}>
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
