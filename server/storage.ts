import { 
  type User, 
  type InsertUser,
  type Case,
  type InsertCase,
  type PrequalLead,
  type InsertPrequalLead,
  type ChatMessage,
  type InsertChatMessage,
  type WizardAppraisal,
  type InsertWizardAppraisal,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type GeorgiaAppraisal,
  type InsertGeorgiaAppraisal,
  users,
  cases,
  prequalLeads,
  chatMessages,
  wizardAppraisals,
  passwordResetTokens,
  georgiaAppraisals,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Case methods
  getCase(id: string): Promise<Case | undefined>;
  getCasesByUser(userId: string): Promise<Case[]>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined>;
  
  // Prequal lead methods
  createPrequalLead(lead: InsertPrequalLead): Promise<PrequalLead>;
  getPrequalLead(id: string): Promise<PrequalLead | undefined>;
  
  // Chat message methods
  getChatMessagesByCase(caseId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Wizard appraisal methods
  createWizardAppraisal(appraisal: InsertWizardAppraisal): Promise<WizardAppraisal>;
  getWizardAppraisal(id: string): Promise<WizardAppraisal | undefined>;
  updateWizardAppraisal(id: string, updates: Partial<InsertWizardAppraisal>): Promise<WizardAppraisal | undefined>;

  // Password reset methods
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Georgia appraisal methods
  createGeorgiaAppraisal(appraisal: InsertGeorgiaAppraisal): Promise<GeorgiaAppraisal>;
  getGeorgiaAppraisal(id: string): Promise<GeorgiaAppraisal | undefined>;
  updateGeorgiaAppraisal(id: string, updates: Partial<InsertGeorgiaAppraisal> & { calculatedAt?: Date; pdfGeneratedAt?: Date }): Promise<GeorgiaAppraisal | undefined>;
  getGeorgiaAppraisalsByUser(userId: string): Promise<GeorgiaAppraisal[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Case methods
  async getCase(id: string): Promise<Case | undefined> {
    const [caseData] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
    return caseData;
  }

  async getCasesByUser(userId: string): Promise<Case[]> {
    return db.select().from(cases)
      .where(eq(cases.userId, userId))
      .orderBy(desc(cases.updatedAt));
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(caseData).returning();
    return newCase;
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined> {
    const [updated] = await db.update(cases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updated;
  }

  // Prequal lead methods
  async createPrequalLead(lead: InsertPrequalLead): Promise<PrequalLead> {
    const [newLead] = await db.insert(prequalLeads).values(lead).returning();
    return newLead;
  }

  async getPrequalLead(id: string): Promise<PrequalLead | undefined> {
    const [lead] = await db.select().from(prequalLeads).where(eq(prequalLeads.id, id)).limit(1);
    return lead;
  }

  // Chat message methods
  async getChatMessagesByCase(caseId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.caseId, caseId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Wizard appraisal methods
  async createWizardAppraisal(appraisal: InsertWizardAppraisal): Promise<WizardAppraisal> {
    const [newAppraisal] = await db.insert(wizardAppraisals).values(appraisal).returning();
    return newAppraisal;
  }

  async getWizardAppraisal(id: string): Promise<WizardAppraisal | undefined> {
    const [appraisal] = await db.select().from(wizardAppraisals).where(eq(wizardAppraisals.id, id)).limit(1);
    return appraisal;
  }

  async updateWizardAppraisal(id: string, updates: Partial<InsertWizardAppraisal>): Promise<WizardAppraisal | undefined> {
    const [updated] = await db.update(wizardAppraisals)
      .set(updates)
      .where(eq(wizardAppraisals.id, id))
      .returning();
    return updated;
  }

  // Password reset methods
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values(token).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Georgia appraisal methods
  async createGeorgiaAppraisal(appraisal: InsertGeorgiaAppraisal): Promise<GeorgiaAppraisal> {
    const [newAppraisal] = await db.insert(georgiaAppraisals).values(appraisal).returning();
    return newAppraisal;
  }

  async getGeorgiaAppraisal(id: string): Promise<GeorgiaAppraisal | undefined> {
    const [appraisal] = await db.select().from(georgiaAppraisals).where(eq(georgiaAppraisals.id, id)).limit(1);
    return appraisal;
  }

  async updateGeorgiaAppraisal(id: string, updates: Partial<InsertGeorgiaAppraisal> & { calculatedAt?: Date; pdfGeneratedAt?: Date }): Promise<GeorgiaAppraisal | undefined> {
    const [updated] = await db.update(georgiaAppraisals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(georgiaAppraisals.id, id))
      .returning();
    return updated;
  }

  async getGeorgiaAppraisalsByUser(userId: string): Promise<GeorgiaAppraisal[]> {
    return db.select().from(georgiaAppraisals)
      .where(eq(georgiaAppraisals.userId, userId))
      .orderBy(desc(georgiaAppraisals.updatedAt));
  }
}

export const storage = new DatabaseStorage();
