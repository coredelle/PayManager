import { queryClient } from "./queryClient";

async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

export const api = {
  auth: {
    async register(email: string, password: string, name?: string) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      return handleResponse(res);
    },

    async login(email: string, password: string) {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },

    async logout() {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      queryClient.clear();
      return handleResponse(res);
    },

    async getUser() {
      const res = await fetch("/api/auth/user");
      return handleResponse(res);
    },
  },

  cases: {
    async list() {
      const res = await fetch("/api/cases");
      return handleResponse(res);
    },

    async get(id: string) {
      const res = await fetch(`/api/cases/${id}`);
      return handleResponse(res);
    },

    async create(data: any) {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },

    async update(id: string, data: any) {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },

    async calculate(id: string, data: { preAccidentValue: number; repairCost?: number; mileage?: number }) {
      const res = await fetch(`/api/cases/${id}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },

  prequal: {
    async estimate(data: { year: number; make: string; model: string; mileage: number; state: string; fault: string }) {
      const res = await fetch("/api/prequal/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },

  vin: {
    async decode(vin: string) {
      const res = await fetch("/api/vin/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin }),
      });
      return handleResponse(res);
    },
  },

  comps: {
    async fetch(data: { year: number; make: string; model: string; trim?: string; state?: string; mileage?: number; zip?: string }) {
      const res = await fetch("/api/comps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },

  appraisal: {
    async estimate(data: { year: number; make: string; model: string; mileage: number; state: string; repairCost?: number; priorAccidents?: number }) {
      const res = await fetch("/api/appraisal/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },

    async full(caseId: string) {
      const res = await fetch("/api/appraisal/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      return handleResponse(res);
    },
  },

  chat: {
    async sendMessage(caseId: string, message: string, tone?: "professional" | "firm" | "conciliatory") {
      const res = await fetch("/api/chat/negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, message, tone }),
      });
      return handleResponse(res);
    },

    async getHistory(caseId: string) {
      const res = await fetch(`/api/chat/${caseId}/history`);
      return handleResponse(res);
    },
  },
};
