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
  
  // Valuation inputs
  blackBookCleanRetail: decimal("blackbook_clean_retail", { precision: 10, scale: 2 }),
  blackBookRoughRetail: decimal("blackbook_rough_retail", { precision: 10, scale: 2 }),
  thirdPartyPreAccidentValue: decimal("third_party_pre_accident_value", { precision: 10, scale: 2 }),
  thirdPartyPostAccidentValue: decimal("third_party_post_accident_value", { precision: 10, scale: 2 }),
  userNotes: text("user_notes"),
  marketNotes: text("market_notes"),
  compsJson: text("comps_json"), // JSON array of comparable vehicles
  
  // Valuation results
  preAccidentValue: decimal("pre_accident_value", { precision: 10, scale: 2 }),
  postAccidentValue: decimal("post_accident_value", { precision: 10, scale: 2 }),
  diminishedValueAmount: decimal("diminished_value_amount", { precision: 10, scale: 2 }),
  calculationDetails: text("calculation_details"),
  calculatedAt: timestamp("calculated_at"),
  
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
