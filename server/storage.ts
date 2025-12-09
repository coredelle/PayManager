import { 
  type User, 
  type InsertUser,
  type Case,
  type InsertCase,
  type PrequalLead,
  type InsertPrequalLead,
  users,
  cases,
  prequalLeads,
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
}

export const storage = new DatabaseStorage();
