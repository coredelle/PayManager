import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CarFront } from "lucide-react";
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
  );
}
