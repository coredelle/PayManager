import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CarFront, Bot, User, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // TODO: Re-enable auth check after testing
    // if (!authLoading && !isAuthenticated) {
    //   setLocation("/auth");
    // }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: api.cases.list,
    enabled: true,
  });

  // Mock data for demo purposes
  const mockCases = [
    {
      id: "case-demo-001",
      year: 2022,
      make: "Honda",
      model: "Civic",
      caseType: "diminished_value",
      state: "GA",
      claimNumber: "CLM-2024-001",
      status: "completed",
      diminishedValueAmount: "2850",
    },
    {
      id: "case-demo-002",
      year: 2021,
      make: "Toyota",
      model: "Camry",
      caseType: "diminished_value",
      state: "GA",
      claimNumber: "CLM-2024-002",
      status: "completed",
      diminishedValueAmount: "3200",
    },
    {
      id: "case-demo-003",
      year: 2023,
      make: "Ford",
      model: "F-150",
      caseType: "diminished_value",
      state: "GA",
      claimNumber: "CLM-2024-003",
      status: "completed",
      diminishedValueAmount: "4100",
    },
  ];

  // Use mock data if no real cases
  const displayCases = (cases && cases.length > 0) ? cases : mockCases;

  // Chat state for dashboard (hooks must be declared unconditionally)
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Welcome — ask me about your appraisal, negotiation, or next steps." },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleDashboardChatSend = async (text: string) => {
    if (!text) return;
    const newMessages = [...chatMessages, { role: "user", text }];
    setChatMessages(newMessages);
    setChatInput("");
    try {
      const result = await api.chat.sendMessage("dashboard", text);
      setChatMessages((curr) => [...curr, { role: "assistant", text: result.response }]);
    } catch (err) {
      let response = "That's a great question — check your state laws or upload insurer text for context.";
      if (text.toLowerCase().includes("deny")) response = "If they deny, request the policy language or statute they rely on.";
      if (text.toLowerCase().includes("negotiate")) response = "Yes — anchor with data from your appraisal and comparables.";
      setChatMessages((curr) => [...curr, { role: "assistant", text: response }]);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900" data-testid="text-dashboard-title">My Appraisals</h1>
          <p className="text-muted-foreground">Manage your vehicle value claims</p>
        </div>
        <Link href="/georgia-appraisal">
          <Button className="shadow-lg shadow-blue-500/20" data-testid="button-new-appraisal">
            <Plus className="mr-2 h-4 w-4" /> New Appraisal
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid gap-6">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : (
              displayCases.map((c: any) => (
                <Card key={c.id} className="group hover:shadow-md transition-shadow duration-200 border-slate-200" data-testid={`card-case-${c.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <CarFront className="h-8 w-8 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{c.year} {c.make} {c.model}</h3>
                            <Badge variant={c.status === "completed" || c.status === "ready_for_download" ? "default" : "secondary"} className="capitalize">
                              {c.status?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {c.caseType === "diminished_value" ? "Diminished Value Claim" : "Total Loss Claim"} - {c.state}
                          </p>
                          <p className="text-xs text-slate-400">
                            {c.claimNumber && `Claim: ${c.claimNumber}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 w-full md:w-auto text-right">
                        {(c.status === "completed" || c.status === "ready_for_download") && c.diminishedValueAmount && (
                          <>
                            <div className="text-sm text-muted-foreground">Estimated Value Loss</div>
                            <div className="text-2xl font-bold text-emerald-600" data-testid={`text-dv-${c.id}`}>
                              ${parseFloat(c.diminishedValueAmount).toLocaleString()}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                        {c.status === "completed" || c.status === "ready_for_download" ? (
                          <Link href={`/result/${c.id}`}>
                            <Button variant="outline" className="w-full md:w-auto" data-testid={`button-view-${c.id}`}>View Report</Button>
                          </Link>
                        ) : (
                          <Link href={`/georgia-appraisal`}>
                            <Button className="w-full md:w-auto" data-testid={`button-continue-${c.id}`}>Continue</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <Card className="bg-slate-50 border-slate-200 h-[400px] flex flex-col">
            <CardHeader className="pb-4 border-b bg-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Claim Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-slate-200" : "bg-blue-100 text-blue-700"}`}>
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`p-3 rounded-lg text-sm max-w-[80%] ${m.role === "user" ? "bg-slate-200 text-slate-900" : "bg-white border text-slate-700 shadow-sm"}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <Input placeholder="Ask a question..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDashboardChatSend(chatInput)} />
                  <Button size="icon" onClick={() => handleDashboardChatSend(chatInput)}>
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
