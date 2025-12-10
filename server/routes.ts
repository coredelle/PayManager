import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertCaseSchema, insertPrequalLeadSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "autovaluekey-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // =====================
  // AUTH ROUTES
  // =====================
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name: name || null,
      });
      
      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  });

  // =====================
  // CASE ROUTES
  // =====================
  
  app.get("/api/cases", requireAuth, async (req, res) => {
    try {
      const cases = await storage.getCasesByUser(req.session.userId!);
      res.json(cases);
    } catch (error) {
      console.error("Get cases error:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get("/api/cases/:id", requireAuth, async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      if (caseData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(caseData);
    } catch (error) {
      console.error("Get case error:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.post("/api/cases", requireAuth, async (req, res) => {
    try {
      const caseData = {
        ...req.body,
        userId: req.session.userId,
      };
      
      const newCase = await storage.createCase(caseData);
      res.status(201).json(newCase);
    } catch (error) {
      console.error("Create case error:", error);
      res.status(500).json({ message: "Failed to create case" });
    }
  });

  app.patch("/api/cases/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getCase(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Case not found" });
      }
      if (existing.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateCase(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update case error:", error);
      res.status(500).json({ message: "Failed to update case" });
    }
  });

  app.post("/api/cases/:id/calculate", requireAuth, async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.id);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      if (caseData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { preAccidentValue, repairCost, mileage } = req.body;
      
      if (!preAccidentValue || preAccidentValue <= 0) {
        return res.status(400).json({ message: "Valid pre-accident value is required" });
      }
      
      const result = calculateDiminishedValue(
        parseFloat(preAccidentValue),
        parseFloat(repairCost || caseData.totalRepairCost || 0),
        parseInt(mileage || caseData.mileageAtLoss || 0),
        caseData.year,
        caseData.state as "GA" | "FL" | "NC"
      );
      
      const updated = await storage.updateCase(req.params.id, {
        preAccidentValue: result.preAccidentValue.toString(),
        postAccidentValue: result.postAccidentValue.toString(),
        diminishedValueAmount: result.diminishedValue.toString(),
        calculationDetails: JSON.stringify(result.breakdown),
        status: "ready_for_download",
      });
      
      res.json({
        case: updated,
        values: result,
      });
    } catch (error) {
      console.error("Calculate DV error:", error);
      res.status(500).json({ message: "Failed to calculate diminished value" });
    }
  });

  // =====================
  // PRE-QUALIFICATION ROUTES
  // =====================
  
  app.post("/api/prequal/estimate", async (req, res) => {
    try {
      const { year, make, model, mileage, state, fault } = req.body;
      
      if (!year || !make || !model || !mileage || !state || !fault) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const vehicleAge = new Date().getFullYear() - parseInt(year);
      const mileageNum = parseInt(mileage);
      
      let baseValueEstimate = 25000;
      if (vehicleAge <= 2) baseValueEstimate = 35000;
      else if (vehicleAge <= 4) baseValueEstimate = 28000;
      else if (vehicleAge <= 6) baseValueEstimate = 20000;
      else if (vehicleAge <= 8) baseValueEstimate = 15000;
      else baseValueEstimate = 10000;
      
      if (mileageNum > 100000) baseValueEstimate *= 0.7;
      else if (mileageNum > 75000) baseValueEstimate *= 0.8;
      else if (mileageNum > 50000) baseValueEstimate *= 0.9;
      
      let discountMin = 0.08;
      let discountMax = 0.15;
      
      if (vehicleAge <= 3) {
        discountMin = 0.12;
        discountMax = 0.20;
      } else if (vehicleAge <= 6) {
        discountMin = 0.08;
        discountMax = 0.15;
      } else {
        discountMin = 0.05;
        discountMax = 0.10;
      }
      
      const estimateMin = Math.round(baseValueEstimate * discountMin);
      const estimateMax = Math.round(baseValueEstimate * discountMax);
      
      const lead = await storage.createPrequalLead({
        year: parseInt(year),
        make,
        model,
        mileage: mileageNum,
        state: state as "GA" | "FL" | "NC",
        fault,
        estimateMin: estimateMin.toString(),
        estimateMax: estimateMax.toString(),
      });
      
      res.json({
        id: lead.id,
        estimateMin,
        estimateMax,
        qualified: fault !== "at_fault",
      });
    } catch (error) {
      console.error("Prequal estimate error:", error);
      res.status(500).json({ message: "Failed to calculate estimate" });
    }
  });

  return httpServer;
}

function calculateDiminishedValue(
  preValue: number,
  repairCost: number,
  mileage: number,
  vehicleYear: number,
  state: "GA" | "FL" | "NC"
): {
  preAccidentValue: number;
  postAccidentValue: number;
  diminishedValue: number;
  breakdown: {
    baseValue: number;
    baseLoss: number;
    damageModifier: number;
    mileageModifier: number;
    stateAdjustment: number;
    formula: string;
  };
} {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicleYear;
  
  let baseDiscountPercent = 0.10;
  if (vehicleAge <= 3) baseDiscountPercent = 0.15;
  else if (vehicleAge <= 6) baseDiscountPercent = 0.10;
  else baseDiscountPercent = 0.07;
  
  const repairRatio = repairCost / preValue;
  let damageModifier = 1.0;
  if (repairRatio < 0.1) damageModifier = 0.25;
  else if (repairRatio < 0.25) damageModifier = 0.50;
  else if (repairRatio < 0.5) damageModifier = 0.75;
  else damageModifier = 1.0;
  
  let mileageModifier = 1.0;
  if (mileage < 20000) mileageModifier = 1.0;
  else if (mileage < 40000) mileageModifier = 0.8;
  else if (mileage < 60000) mileageModifier = 0.6;
  else if (mileage < 80000) mileageModifier = 0.4;
  else if (mileage < 100000) mileageModifier = 0.2;
  else mileageModifier = 0.1;
  
  let stateAdjustment = 1.0;
  if (state === "GA") stateAdjustment = 1.15;
  else if (state === "FL") stateAdjustment = 1.0;
  else if (state === "NC") stateAdjustment = 1.05;
  
  const baseLoss = preValue * baseDiscountPercent;
  const adjustedLoss = baseLoss * damageModifier * mileageModifier * stateAdjustment;
  const diminishedValue = Math.round(adjustedLoss);
  const postAccidentValue = Math.max(0, Math.round(preValue - diminishedValue));
  
  return {
    preAccidentValue: Math.round(preValue),
    postAccidentValue,
    diminishedValue,
    breakdown: {
      baseValue: Math.round(preValue),
      baseLoss: Math.round(baseLoss),
      damageModifier,
      mileageModifier,
      stateAdjustment,
      formula: `DV = Base Value (${preValue}) x Base % (${(baseDiscountPercent * 100).toFixed(0)}%) x Damage Mod (${damageModifier}) x Mileage Mod (${mileageModifier}) x State Adj (${stateAdjustment})`,
    },
  };
}
