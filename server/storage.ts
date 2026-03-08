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

// =====================
// DATABASE STORAGE (used when better-sqlite3 is available, i.e. local dev)
// =====================

export class DatabaseStorage implements IStorage {
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

  async createPrequalLead(lead: InsertPrequalLead): Promise<PrequalLead> {
    const [newLead] = await db.insert(prequalLeads).values(lead).returning();
    return newLead;
  }

  async getPrequalLead(id: string): Promise<PrequalLead | undefined> {
    const [lead] = await db.select().from(prequalLeads).where(eq(prequalLeads.id, id)).limit(1);
    return lead;
  }

  async getChatMessagesByCase(caseId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.caseId, caseId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

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

// =====================
// MEMORY STORAGE (used on Vercel / serverless where native addons are unavailable)
// =====================

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private cases = new Map<string, Case>();
  private prequalLeads = new Map<string, PrequalLead>();
  private chatMessages = new Map<string, ChatMessage>();
  private wizardAppraisals = new Map<string, WizardAppraisal>();
  private passwordResetTokens = new Map<string, PasswordResetToken>();
  private georgiaAppraisals = new Map<string, GeorgiaAppraisal>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      name: insertUser.name ?? null,
      password: insertUser.password ?? null,
      email: insertUser.email,
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCasesByUser(userId: string): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const newCase: Case = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...caseData,
    } as Case;
    this.cases.set(newCase.id, newCase);
    return newCase;
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined> {
    const existing = this.cases.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() } as Case;
    this.cases.set(id, updated);
    return updated;
  }

  async createPrequalLead(lead: InsertPrequalLead): Promise<PrequalLead> {
    const newLead: PrequalLead = {
      id: randomUUID(),
      createdAt: new Date(),
      ...lead,
    } as PrequalLead;
    this.prequalLeads.set(newLead.id, newLead);
    return newLead;
  }

  async getPrequalLead(id: string): Promise<PrequalLead | undefined> {
    return this.prequalLeads.get(id);
  }

  async getChatMessagesByCase(caseId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.caseId === caseId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      id: randomUUID(),
      createdAt: new Date(),
      ...message,
    } as ChatMessage;
    this.chatMessages.set(newMsg.id, newMsg);
    return newMsg;
  }

  async createWizardAppraisal(appraisal: InsertWizardAppraisal): Promise<WizardAppraisal> {
    const newAppraisal: WizardAppraisal = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...appraisal,
    } as WizardAppraisal;
    this.wizardAppraisals.set(newAppraisal.id, newAppraisal);
    return newAppraisal;
  }

  async getWizardAppraisal(id: string): Promise<WizardAppraisal | undefined> {
    return this.wizardAppraisals.get(id);
  }

  async updateWizardAppraisal(id: string, updates: Partial<InsertWizardAppraisal>): Promise<WizardAppraisal | undefined> {
    const existing = this.wizardAppraisals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() } as WizardAppraisal;
    this.wizardAppraisals.set(id, updated);
    return updated;
  }

  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const newToken: PasswordResetToken = {
      id: randomUUID(),
      createdAt: new Date(),
      usedAt: null,
      ...token,
    } as PasswordResetToken;
    this.passwordResetTokens.set(token.token, newToken);
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.get(token);
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    const existing = this.passwordResetTokens.get(token);
    if (existing) {
      this.passwordResetTokens.set(token, { ...existing, usedAt: new Date() });
    }
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const existing = this.users.get(userId);
    if (existing) {
      this.users.set(userId, { ...existing, password: hashedPassword });
    }
  }

  async createGeorgiaAppraisal(appraisal: InsertGeorgiaAppraisal): Promise<GeorgiaAppraisal> {
    const newAppraisal: GeorgiaAppraisal = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      calculatedAt: null,
      pdfGeneratedAt: null,
      ...appraisal,
    } as GeorgiaAppraisal;
    this.georgiaAppraisals.set(newAppraisal.id, newAppraisal);
    return newAppraisal;
  }

  async getGeorgiaAppraisal(id: string): Promise<GeorgiaAppraisal | undefined> {
    return this.georgiaAppraisals.get(id);
  }

  async updateGeorgiaAppraisal(id: string, updates: Partial<InsertGeorgiaAppraisal> & { calculatedAt?: Date; pdfGeneratedAt?: Date }): Promise<GeorgiaAppraisal | undefined> {
    const existing = this.georgiaAppraisals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date() } as GeorgiaAppraisal;
    this.georgiaAppraisals.set(id, updated);
    return updated;
  }

  async getGeorgiaAppraisalsByUser(userId: string): Promise<GeorgiaAppraisal[]> {
    return Array.from(this.georgiaAppraisals.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
}

// Use MemoryStorage when DB is unavailable (Vercel), DatabaseStorage otherwise
export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
