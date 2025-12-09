import { useState } from 'react';

export type CaseStatus = "draft" | "ready_for_download" | "completed";
export type CaseType = "diminished_value" | "total_loss";

export interface Case {
  id: string;
  userId: string;
  caseType: CaseType;
  state: string;
  status: CaseStatus;
  year: number;
  make: string;
  model: string;
  trim: string;
  claimNumber: string;
  insurer: string;
  dateOfLoss: string;
  repairCost?: number;
  preAccidentValue?: number;
  postAccidentValue?: number;
  diminishedValue?: number;
  updatedAt: string;
}

export const MOCK_USER = {
  id: "u1",
  name: "Alex Driver",
  email: "alex@example.com"
};

export const MOCK_CASES: Case[] = [
  {
    id: "c1",
    userId: "u1",
    caseType: "diminished_value",
    state: "GA",
    status: "completed",
    year: 2022,
    make: "Honda",
    model: "Accord",
    trim: "Sport",
    claimNumber: "CLM-2024-8892",
    insurer: "State Farm",
    dateOfLoss: "2024-11-15",
    repairCost: 4500,
    preAccidentValue: 28500,
    postAccidentValue: 24200,
    diminishedValue: 4300,
    updatedAt: "2024-12-01"
  },
  {
    id: "c2",
    userId: "u1",
    caseType: "diminished_value",
    state: "FL",
    status: "draft",
    year: 2023,
    make: "Tesla",
    model: "Model 3",
    trim: "Long Range",
    claimNumber: "GEICO-9921",
    insurer: "GEICO",
    dateOfLoss: "2025-01-10",
    updatedAt: "2025-01-12"
  }
];

export function calculateDiminishedValue(preValue: number, repairCost: number, mileage: number) {
  // Simplified 17c formula mockup for demo purposes
  const baseLoss = preValue * 0.10;
  
  // Damage modifier (based on repair cost ratio, simplified)
  let damageMod = 0.0;
  const ratio = repairCost / preValue;
  if (ratio < 0.1) damageMod = 0.25;
  else if (ratio < 0.4) damageMod = 0.50;
  else if (ratio < 0.7) damageMod = 0.75;
  else damageMod = 1.0;

  // Mileage modifier
  let mileageMod = 1.0;
  if (mileage < 20000) mileageMod = 1.0;
  else if (mileage < 40000) mileageMod = 0.8;
  else if (mileage < 60000) mileageMod = 0.6;
  else if (mileage < 80000) mileageMod = 0.4;
  else mileageMod = 0.2;

  return Math.round(baseLoss * damageMod * mileageMod);
}
