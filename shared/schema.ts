import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Case types and status enums
export const caseTypeEnum = ["diminished_value", "total_loss"] as const;
export const caseStatusEnum = ["draft", "ready_for_download", "completed"] as const;
export const stateEnum = ["GA", "FL", "NC"] as const;

// Cases table - main appraisal cases
export const cases = sqliteTable("cases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseType: text("case_type").notNull(),
  state: text("state").notNull(),
  status: text("status").notNull().default("draft"),
  
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
  totalRepairCost: real("total_repair_cost"),
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
  marketCheckPrice: real("marketcheck_price"),
  marketPriceRangeLow: real("market_price_range_low"),
  marketPriceRangeHigh: real("market_price_range_high"),
  mileageAdjustedPrice: real("mileage_adjusted_price"),
  
  // Comparable listings from MarketData API
  compsJson: text("comps_json"),
  compMedianPrice: real("comp_median_price"),
  
  // Legacy valuation inputs (retained for compatibility)
  blackBookCleanRetail: real("blackbook_clean_retail"),
  blackBookRoughRetail: real("blackbook_rough_retail"),
  thirdPartyPreAccidentValue: real("third_party_pre_accident_value"),
  thirdPartyPostAccidentValue: real("third_party_post_accident_value"),
  userNotes: text("user_notes"),
  marketNotes: text("market_notes"),
  
  // Valuation results
  preAccidentValue: real("pre_accident_value"),
  postAccidentValue: real("post_accident_value"),
  diminishedValueAmount: real("diminished_value_amount"),
  stigmaDeduction: real("stigma_deduction"),
  calculationDetails: text("calculation_details"),
  valuationSummaryJson: text("valuation_summary_json"),
  calculatedAt: integer("calculated_at", { mode: 'timestamp' }),
  
  // AI-generated content
  appraisalNarrative: text("appraisal_narrative"),
  demandLetter: text("demand_letter"),
  narrativeGeneratedAt: integer("narrative_generated_at", { mode: 'timestamp' }),
  
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
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
export const prequalLeads = sqliteTable("prequal_leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  mileage: integer("mileage").notNull(),
  state: text("state").notNull(),
  fault: text("fault").notNull(), // "not_at_fault", "at_fault", "unsure"
  
  // Calculated estimate
  estimateMin: real("estimate_min"),
  estimateMax: real("estimate_max"),
  
  // Optional - if they convert to full case
  convertedToCaseId: text("converted_to_case_id").references(() => cases.id),
  
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertPrequalLeadSchema = createInsertSchema(prequalLeads).omit({
  id: true,
  createdAt: true,
});

export type InsertPrequalLead = z.infer<typeof insertPrequalLeadSchema>;
export type PrequalLead = typeof prequalLeads.$inferSelect;

// Wizard appraisals - from the appraisal wizard flow
export const wizardAppraisals = sqliteTable("wizard_appraisals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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
  
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertWizardAppraisalSchema = createInsertSchema(wizardAppraisals).omit({
  id: true,
  createdAt: true,
});

export type InsertWizardAppraisal = z.infer<typeof insertWizardAppraisalSchema>;
export type WizardAppraisal = typeof wizardAppraisals.$inferSelect;

// Password reset tokens
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: 'timestamp' }).notNull(),
  usedAt: integer("used_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Negotiation chat messages
export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Georgia appraisals - new professional appraisal system
export const accidentHistoryEnum = ["clean", "prior_damage", "unknown"] as const;

export const georgiaAppraisals = sqliteTable("georgia_appraisals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

  ownerName: text("owner_name").notNull(),
  ownerAddress: text("owner_address").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  ownerEmail: text("owner_email").notNull(),

  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  trim: text("trim").notNull(),
  vin: text("vin").notNull(),
  licensePlate: text("license_plate"),
  stateOfRegistration: text("state_of_registration").notNull(),
  mileage: integer("mileage").notNull(),
  accidentHistory: text("accident_history").notNull().default("unknown"),
  isLeased: integer("is_leased").notNull().default(0),
  ownershipType: text("ownership_type").default("owner"),

  insuranceCompany: text("insurance_company").notNull(),
  claimNumber: text("claim_number").notNull(),
  adjusterName: text("adjuster_name"),
  adjusterEmail: text("adjuster_email"),
  adjusterPhone: text("adjuster_phone"),
  dateOfLoss: text("date_of_loss").notNull(),

  repairCenterName: text("repair_center_name"),
  repairCenterPhone: text("repair_center_phone"),
  repairCenterAddress: text("repair_center_address"),
  repairDropOffDate: text("repair_drop_off_date"),
  repairPickupDate: text("repair_pickup_date"),
  totalRepairCost: real("total_repair_cost"),

  damageDescription: text("damage_description"),
  keyImpactAreas: text("key_impact_areas"),

  cleanRetailPreAccident: real("clean_retail_pre_accident"),
  roughRetailPostAccident: real("rough_retail_post_accident"),
  comparablesAvgRetail: real("comparables_avg_retail"),
  finalPreAccidentValue: real("final_pre_accident_value"),
  postAccidentValue: real("post_accident_value"),
  diminishedValue: real("diminished_value"),

  comparablesJson: text("comparables_json"),
  mileageBandDescription: text("mileage_band_description"),
  comparableFilterNotes: text("comparable_filter_notes"),

  calculatedAt: integer("calculated_at", { mode: 'timestamp' }),
  pdfGeneratedAt: integer("pdf_generated_at", { mode: 'timestamp' }),

  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentStatus: text("stripe_payment_status"),

  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const insertGeorgiaAppraisalSchema = createInsertSchema(georgiaAppraisals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  calculatedAt: true,
  pdfGeneratedAt: true,
});

export type InsertGeorgiaAppraisal = z.infer<typeof insertGeorgiaAppraisalSchema>;
export type GeorgiaAppraisal = typeof georgiaAppraisals.$inferSelect;
