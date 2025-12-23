import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertCaseSchema, insertPrequalLeadSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomBytes } from "crypto";
import { decodeVin, fetchRetailComps, fetchMarketPricing, getFullVehicleData } from "./services/marketData";
import { computeDVAmount, quickEstimate, type AppraisalInput } from "./services/appraisalEngine";
import { getStateLaw } from "./services/stateLaw";
import { generateAppraisalNarrative, generateDemandLetter, generateNegotiationResponse } from "./services/aiNarratives";
import { sendPasswordResetEmail } from "./services/email";

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

  // Forgot password - request reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists with that email, a reset link has been sent" });
      }
      
      // Generate secure token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
      });
      
      // Get base URL for reset link
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:5000";
      const baseUrl = `${protocol}://${host}`;
      
      try {
        await sendPasswordResetEmail(email, token, baseUrl);
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        return res.status(500).json({ message: "Failed to send reset email. Please try again later." });
      }
      
      res.json({ message: "If an account exists with that email, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
      
      if (resetToken.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markPasswordResetTokenUsed(token);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
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

  // =====================
  // VIN DECODE ROUTE
  // =====================
  
  app.post("/api/vin/decode", requireAuth, async (req, res) => {
    try {
      const { vin } = req.body;
      
      if (!vin || vin.length !== 17) {
        return res.status(400).json({ message: "Valid 17-character VIN is required" });
      }
      
      const decoded = await decodeVin(vin);
      res.json(decoded);
    } catch (error) {
      console.error("VIN decode error:", error);
      res.status(500).json({ message: "Failed to decode VIN" });
    }
  });

  // =====================
  // COMPS ROUTE
  // =====================
  
  app.post("/api/comps", requireAuth, async (req, res) => {
    try {
      const { year, make, model, trim, state, mileage, zip } = req.body;
      
      if (!year || !make || !model) {
        return res.status(400).json({ message: "Year, make, and model are required" });
      }
      
      const comps = await fetchRetailComps({
        year: parseInt(year),
        make,
        model,
        trim,
        state,
        mileage: mileage ? parseInt(mileage) : undefined,
        zip,
      });
      
      res.json({ comps });
    } catch (error) {
      console.error("Comps fetch error:", error);
      res.status(500).json({ message: "Failed to fetch comparable listings" });
    }
  });

  // =====================
  // APPRAISAL ESTIMATE ROUTE (Quick, no AI)
  // =====================
  
  app.post("/api/appraisal/estimate", requireAuth, async (req, res) => {
    try {
      const { year, make, model, mileage, state, repairCost, priorAccidents } = req.body;
      
      if (!year || !make || !model || !mileage || !state) {
        return res.status(400).json({ message: "Vehicle information is required" });
      }
      
      const pricing = await fetchMarketPricing({
        year: parseInt(year),
        make,
        model,
        mileage: parseInt(mileage),
      });
      
      const comps = await fetchRetailComps({
        year: parseInt(year),
        make,
        model,
        state,
        mileage: parseInt(mileage),
      });
      
      const input: AppraisalInput = {
        year: parseInt(year),
        make,
        model,
        mileage: parseInt(mileage),
        state: state as "GA" | "FL" | "NC",
        repairCost: parseFloat(repairCost) || 5000,
        priorAccidents: parseInt(priorAccidents) || 0,
        isAtFault: false,
      };
      
      const dvResult = computeDVAmount(pricing, comps, input);
      
      res.json({
        pricing,
        comps,
        dvResult,
      });
    } catch (error) {
      console.error("Appraisal estimate error:", error);
      res.status(500).json({ message: "Failed to calculate estimate" });
    }
  });

  // =====================
  // FULL APPRAISAL ROUTE (with AI narrative)
  // =====================
  
  app.post("/api/appraisal/full", requireAuth, async (req, res) => {
    try {
      const { caseId } = req.body;
      
      if (!caseId) {
        return res.status(400).json({ message: "Case ID is required" });
      }
      
      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      if (caseData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      let vinData = null;
      if (caseData.vin) {
        try {
          vinData = await decodeVin(caseData.vin);
        } catch (e) {
          console.error("VIN decode failed:", e);
        }
      }
      
      const pricing = await fetchMarketPricing({
        year: caseData.year,
        make: caseData.make,
        model: caseData.model,
        trim: caseData.trim || undefined,
        mileage: caseData.mileageAtLoss || undefined,
        vin: caseData.vin || undefined,
      });
      
      const comps = await fetchRetailComps({
        year: caseData.year,
        make: caseData.make,
        model: caseData.model,
        trim: caseData.trim || undefined,
        state: caseData.state,
        mileage: caseData.mileageAtLoss || undefined,
      });
      
      const input: AppraisalInput = {
        year: caseData.year,
        make: caseData.make,
        model: caseData.model,
        trim: caseData.trim || undefined,
        mileage: caseData.mileageAtLoss || 0,
        state: caseData.state as "GA" | "FL" | "NC",
        repairCost: parseFloat(caseData.totalRepairCost?.toString() || "0"),
        priorAccidents: caseData.priorAccidents || 0,
        isAtFault: false,
        vinData: vinData || undefined,
      };
      
      const dvResult = computeDVAmount(pricing, comps, input, vinData || undefined);
      
      const narrative = await generateAppraisalNarrative({
        claimantName: undefined,
        vehicleYear: caseData.year,
        vehicleMake: caseData.make,
        vehicleModel: caseData.model,
        vehicleTrim: caseData.trim || undefined,
        vin: caseData.vin || undefined,
        mileage: caseData.mileageAtLoss || 0,
        state: caseData.state as "GA" | "FL" | "NC",
        dateOfLoss: caseData.dateOfLoss || undefined,
        repairCost: parseFloat(caseData.totalRepairCost?.toString() || "0"),
        insurerName: caseData.atFaultInsurerName || undefined,
        claimNumber: caseData.claimNumber || undefined,
        dvResult,
        vinData: vinData || undefined,
      }, comps);
      
      const demandLetter = await generateDemandLetter({
        vehicleYear: caseData.year,
        vehicleMake: caseData.make,
        vehicleModel: caseData.model,
        vehicleTrim: caseData.trim || undefined,
        vin: caseData.vin || undefined,
        mileage: caseData.mileageAtLoss || 0,
        state: caseData.state as "GA" | "FL" | "NC",
        dateOfLoss: caseData.dateOfLoss || undefined,
        repairCost: parseFloat(caseData.totalRepairCost?.toString() || "0"),
        insurerName: caseData.atFaultInsurerName || undefined,
        claimNumber: caseData.claimNumber || undefined,
        dvResult,
      });
      
      const compMedianPrice = comps.length > 0
        ? comps.map(c => c.price).sort((a, b) => a - b)[Math.floor(comps.length / 2)]
        : null;
      
      const updated = await storage.updateCase(caseId, {
        vinDecodeJson: vinData ? JSON.stringify(vinData) : null,
        drivetrain: vinData?.drivetrain || null,
        engineType: vinData?.engineType || null,
        evBatteryPack: vinData?.evBatteryPack || null,
        marketCheckPrice: pricing.fairRetailPrice.toString(),
        marketPriceRangeLow: pricing.priceRangeLow.toString(),
        marketPriceRangeHigh: pricing.priceRangeHigh.toString(),
        mileageAdjustedPrice: pricing.mileageAdjustedPrice.toString(),
        compsJson: JSON.stringify(comps),
        compMedianPrice: compMedianPrice?.toString() || null,
        preAccidentValue: dvResult.preAccidentValue.toString(),
        postAccidentValue: dvResult.postRepairValue.toString(),
        diminishedValueAmount: dvResult.diminishedValue.toString(),
        stigmaDeduction: dvResult.stigmaDeduction.toString(),
        calculationDetails: dvResult.methodology,
        valuationSummaryJson: JSON.stringify(dvResult.breakdown),
        appraisalNarrative: narrative,
        demandLetter: demandLetter,
        narrativeGeneratedAt: new Date(),
        status: "ready_for_download",
      });
      
      res.json({
        case: updated,
        pricing,
        comps,
        dvResult,
        narrative,
        demandLetter,
      });
    } catch (error) {
      console.error("Full appraisal error:", error);
      res.status(500).json({ message: "Failed to generate full appraisal" });
    }
  });

  // =====================
  // NEGOTIATION CHAT ROUTE
  // =====================
  
  app.post("/api/chat/negotiation", requireAuth, async (req, res) => {
    try {
      const { caseId, message, tone } = req.body;
      
      if (!caseId || !message) {
        return res.status(400).json({ message: "Case ID and message are required" });
      }
      
      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      if (caseData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.createChatMessage({
        caseId,
        role: "user",
        content: message,
      });
      
      const previousMessages = await storage.getChatMessagesByCase(caseId);
      const conversationHistory = previousMessages.slice(-10).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      
      const response = await generateNegotiationResponse(
        {
          caseId,
          state: caseData.state as "GA" | "FL" | "NC",
          vehicleYear: caseData.year,
          vehicleMake: caseData.make,
          vehicleModel: caseData.model,
          dvAmount: parseFloat(caseData.diminishedValueAmount?.toString() || "0"),
          preAccidentValue: parseFloat(caseData.preAccidentValue?.toString() || "0"),
          repairCost: parseFloat(caseData.totalRepairCost?.toString() || "0"),
          insurerName: caseData.atFaultInsurerName || undefined,
          conversationHistory,
        },
        message,
        tone || "professional"
      );
      
      const assistantMessage = await storage.createChatMessage({
        caseId,
        role: "assistant",
        content: response,
      });
      
      res.json({
        message: assistantMessage,
        response,
      });
    } catch (error) {
      console.error("Negotiation chat error:", error);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // =====================
  // CHAT HISTORY ROUTE
  // =====================
  
  app.get("/api/chat/:caseId/history", requireAuth, async (req, res) => {
    try {
      const caseData = await storage.getCase(req.params.caseId);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      if (caseData.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getChatMessagesByCase(req.params.caseId);
      res.json({ messages });
    } catch (error) {
      console.error("Chat history error:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // =====================
  // WIZARD APPRAISAL ROUTES
  // =====================

  app.post("/api/appraisals/init", async (req, res) => {
    try {
      const {
        email,
        year,
        make,
        model,
        trim,
        mileage,
        vin,
        accidentDate,
        accidentState,
        otherDriverAtFault,
        damageLocation,
        repairStatus,
        repairEstimateFileId,
        repairEstimateUploaded,
        preAccidentValueBucket,
        guaranteeEligible,
        referralSource,
        referralName,
        bodyShopName,
        bodyShopLocation,
        atFaultInsuranceCompany,
        claimNumber,
      } = req.body;

      if (!email || !year || !make || !model || !accidentDate || !accidentState || !damageLocation || !repairStatus || !preAccidentValueBucket || !referralSource || !atFaultInsuranceCompany) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const serverGuaranteeEligible = preAccidentValueBucket !== "<5000";

      const appraisal = await storage.createWizardAppraisal({
        email,
        year: String(year),
        make,
        model,
        trim: trim || null,
        mileage: mileage ? String(mileage) : null,
        vin: vin || null,
        accidentDate,
        accidentState,
        otherDriverAtFault: otherDriverAtFault ? 1 : 0,
        damageLocation,
        repairStatus,
        repairEstimateFileId: repairEstimateFileId || null,
        repairEstimateUploaded: repairEstimateUploaded ? 1 : 0,
        preAccidentValueBucket,
        guaranteeEligible: serverGuaranteeEligible ? 1 : 0,
        referralSource,
        referralName: referralName || null,
        bodyShopName: bodyShopName || null,
        bodyShopLocation: bodyShopLocation || null,
        atFaultInsuranceCompany,
        claimNumber: claimNumber || null,
        stripePaymentStatus: "pending",
      });

      res.status(201).json({ id: appraisal.id });
    } catch (error) {
      console.error("Appraisal init error:", error);
      res.status(500).json({ message: "Failed to initialize appraisal" });
    }
  });

  app.post("/api/payments/create-checkout-session", async (req, res) => {
    try {
      const { appraisalId } = req.body;

      if (!appraisalId) {
        return res.status(400).json({ message: "Appraisal ID is required" });
      }

      const appraisal = await storage.getWizardAppraisal(appraisalId);
      if (!appraisal) {
        return res.status(404).json({ message: "Appraisal not found" });
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        console.log("Stripe not configured - returning mock checkout URL");
        return res.json({ 
          checkoutUrl: `/dashboard?payment=success&appraisalId=${appraisalId}`,
          message: "Stripe not configured"
        });
      }

      res.json({ 
        checkoutUrl: `/dashboard?payment=pending&appraisalId=${appraisalId}`,
        message: "Stripe checkout session created"
      });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
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
