import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Case types and status enums
export const caseTypeEnum = pgEnum("case_type", ["diminished_value", "total_loss"]);
export const caseStatusEnum = pgEnum("case_status", ["draft", "ready_for_download", "completed"]);
export const stateEnum = pgEnum("state", ["GA", "FL", "NC"]);

// Cases table - main appraisal cases
export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseType: caseTypeEnum("case_type").notNull(),
  state: stateEnum("state").notNull(),
  status: caseStatusEnum("status").notNull().default("draft"),
  
  // Claim information
  atFaultInsurerName: text("at_fault_insurer_name"),
  claimNumber: text("claim_number"),
  adjusterName: text("adjuster_name"),
  adjusterEmail: text("adjuster_email"),
  dateOfLoss: text("date_of_loss"),
  
  // Vehicle information
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  vin: text("vin"),
  mileageAtLoss: integer("mileage_at_loss"),
  plate: text("plate"),
  plateState: text("plate_state"),
  isEV: integer("is_ev").default(0), // boolean as int
  additionalOptions: text("additional_options"),
  
  // Repair information
  bodyShopName: text("body_shop_name"),
  bodyShopPhone: text("body_shop_phone"),
  bodyShopAddress: text("body_shop_address"),
  totalRepairCost: decimal("total_repair_cost", { precision: 10, scale: 2 }),
  keyImpactAreas: text("key_impact_areas"),
  repairSummary: text("repair_summary"),
  repairStartDate: text("repair_start_date"),
  repairEndDate: text("repair_end_date"),
  
  // User-provided accident history
  priorAccidents: integer("prior_accidents").default(0),
  
  // VIN decode data from MarketData API
  vinDecodeJson: text("vin_decode_json"),
  drivetrain: text("drivetrain"),
  engineType: text("engine_type"),
  evBatteryPack: text("ev_battery_pack"),
  
  // Market pricing from MarketCheck API
  marketCheckPrice: decimal("marketcheck_price", { precision: 10, scale: 2 }),
  marketPriceRangeLow: decimal("market_price_range_low", { precision: 10, scale: 2 }),
  marketPriceRangeHigh: decimal("market_price_range_high", { precision: 10, scale: 2 }),
  mileageAdjustedPrice: decimal("mileage_adjusted_price", { precision: 10, scale: 2 }),
  
  // Comparable listings from MarketData API
  compsJson: text("comps_json"),
  compMedianPrice: decimal("comp_median_price", { precision: 10, scale: 2 }),
  
  // Legacy valuation inputs (retained for compatibility)
  blackBookCleanRetail: decimal("blackbook_clean_retail", { precision: 10, scale: 2 }),
  blackBookRoughRetail: decimal("blackbook_rough_retail", { precision: 10, scale: 2 }),
  thirdPartyPreAccidentValue: decimal("third_party_pre_accident_value", { precision: 10, scale: 2 }),
  thirdPartyPostAccidentValue: decimal("third_party_post_accident_value", { precision: 10, scale: 2 }),
  userNotes: text("user_notes"),
  marketNotes: text("market_notes"),
  
  // Valuation results
  preAccidentValue: decimal("pre_accident_value", { precision: 10, scale: 2 }),
  postAccidentValue: decimal("post_accident_value", { precision: 10, scale: 2 }),
  diminishedValueAmount: decimal("diminished_value_amount", { precision: 10, scale: 2 }),
  stigmaDeduction: decimal("stigma_deduction", { precision: 10, scale: 2 }),
  calculationDetails: text("calculation_details"),
  valuationSummaryJson: text("valuation_summary_json"),
  calculatedAt: timestamp("calculated_at"),
  
  // AI-generated content
  appraisalNarrative: text("appraisal_narrative"),
  demandLetter: text("demand_letter"),
  narrativeGeneratedAt: timestamp("narrative_generated_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  calculatedAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

// Pre-qualification leads - from the free estimate form
export const prequalLeads = pgTable("prequal_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage").notNull(),
  state: stateEnum("state").notNull(),
  fault: text("fault").notNull(), // "not_at_fault", "at_fault", "unsure"
  
  // Calculated estimate
  estimateMin: decimal("estimate_min", { precision: 10, scale: 2 }),
  estimateMax: decimal("estimate_max", { precision: 10, scale: 2 }),
  
  // Optional - if they convert to full case
  convertedToCaseId: varchar("converted_to_case_id").references(() => cases.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrequalLeadSchema = createInsertSchema(prequalLeads).omit({
  id: true,
  createdAt: true,
});

export type InsertPrequalLead = z.infer<typeof insertPrequalLeadSchema>;
export type PrequalLead = typeof prequalLeads.$inferSelect;

// Wizard appraisals - from the appraisal wizard flow
export const wizardAppraisals = pgTable("wizard_appraisals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),

  year: text("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim"),
  mileage: text("mileage"),
  vin: text("vin"),

  accidentDate: text("accident_date").notNull(),
  accidentState: text("accident_state").notNull(),
  otherDriverAtFault: integer("other_driver_at_fault").notNull().default(1),

  damageLocation: text("damage_location").notNull(),
  repairStatus: text("repair_status").notNull(),

  repairEstimateFileId: text("repair_estimate_file_id"),
  repairEstimateUploaded: integer("repair_estimate_uploaded").default(0),

  preAccidentValueBucket: text("pre_accident_value_bucket").notNull(),
  guaranteeEligible: integer("guarantee_eligible").notNull().default(1),

  referralSource: text("referral_source").notNull(),
  referralName: text("referral_name"),
  bodyShopName: text("body_shop_name"),
  bodyShopLocation: text("body_shop_location"),

  atFaultInsuranceCompany: text("at_fault_insurance_company").notNull(),
  claimNumber: text("claim_number"),

  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentStatus: text("stripe_payment_status"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWizardAppraisalSchema = createInsertSchema(wizardAppraisals).omit({
  id: true,
  createdAt: true,
});

export type InsertWizardAppraisal = z.infer<typeof insertWizardAppraisalSchema>;
export type WizardAppraisal = typeof wizardAppraisals.$inferSelect;

// Negotiation chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
