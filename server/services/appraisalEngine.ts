/**
 * Appraisal Engine
 * 
 * Core valuation logic for diminished value calculations.
 * 
 * How to update valuation formulas later:
 * 1. Modify generatePreAccidentValue() to change how FMV is computed
 * 2. Modify generatePostRepairValue() to adjust stigma deduction factors
 * 3. Modify computeDVAmount() if the basic formula changes
 * 
 * All valuation steps rely ONLY on:
 * - User inputs (repair cost, prior accidents, mileage)
 * - MarketData APIs (pricing, comps)
 * - State law rules (adjustments by jurisdiction)
 */

import { type DecodedVin, type CompVehicle, type MarketPricing } from "./marketData";
import { getStateLaw } from "./stateLaw";

export interface AppraisalInput {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  state: "GA" | "FL" | "NC";
  repairCost: number;
  priorAccidents: number;
  isAtFault: boolean;
  vinData?: DecodedVin;
}

export interface PreAccidentValueResult {
  preAccidentValue: number;
  marketCheckPrice: number;
  compMedianPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  methodology: string;
}

export interface StigmaFactors {
  repairSeverityFactor: number;
  mileageFactor: number;
  ageFactor: number;
  priorAccidentsFactor: number;
  stateFactor: number;
}

export interface PostRepairValueResult {
  postRepairValue: number;
  stigmaDeduction: number;
  stigmaPercentage: number;
  factors: StigmaFactors;
  methodology: string;
}

export interface DVResult {
  preAccidentValue: number;
  postRepairValue: number;
  diminishedValue: number;
  stigmaDeduction: number;
  methodology: string;
  breakdown: {
    marketCheckPrice: number;
    compMedianPrice: number;
    priceRangeLow: number;
    priceRangeHigh: number;
    stigmaPercentage: number;
    factors: StigmaFactors;
  };
}

/**
 * Generate Pre-Accident Value
 * 
 * How pre-accident FMV is computed:
 * 1. Start with MarketCheck retail price (weighted 60%)
 * 2. Add comp median price (weighted 40%)
 * 3. If comps available, use average of comps within 10% mileage
 * 4. Apply VIN-specific option adjustments if available
 * 5. Return the blended value as pre-accident FMV
 */
export function generatePreAccidentValue(
  pricing: MarketPricing,
  comps: CompVehicle[],
  vinData?: DecodedVin
): PreAccidentValueResult {
  const marketCheckPrice = pricing.mileageAdjustedPrice || pricing.fairRetailPrice;
  
  let compMedianPrice = 0;
  if (comps.length > 0) {
    const sortedPrices = comps.map(c => c.price).sort((a, b) => a - b);
    const midIndex = Math.floor(sortedPrices.length / 2);
    compMedianPrice = sortedPrices.length % 2 === 0
      ? (sortedPrices[midIndex - 1] + sortedPrices[midIndex]) / 2
      : sortedPrices[midIndex];
  }

  let preAccidentValue: number;
  let methodology: string;

  if (compMedianPrice > 0 && marketCheckPrice > 0) {
    preAccidentValue = Math.round(marketCheckPrice * 0.6 + compMedianPrice * 0.4);
    methodology = "Blended: MarketCheck price (60%) + Comparable median (40%)";
  } else if (marketCheckPrice > 0) {
    preAccidentValue = marketCheckPrice;
    methodology = "MarketCheck mileage-adjusted retail price";
  } else if (compMedianPrice > 0) {
    preAccidentValue = compMedianPrice;
    methodology = "Median of comparable retail listings";
  } else {
    preAccidentValue = 0;
    methodology = "Unable to determine - insufficient market data";
  }

  return {
    preAccidentValue,
    marketCheckPrice,
    compMedianPrice,
    priceRangeLow: pricing.priceRangeLow,
    priceRangeHigh: pricing.priceRangeHigh,
    methodology,
  };
}

/**
 * Generate Post-Repair Value (Stigma Deduction Method)
 * 
 * Since we cannot use auction pricing and have no CARFAX, estimate post-repair FMV using:
 * 1. Repair cost severity (higher repairs = more stigma)
 * 2. Mileage (higher mileage = less stigma impact)
 * 3. Age of vehicle (newer cars lose more value from accident history)
 * 4. Prior accidents (additional accidents compound stigma)
 * 5. State adjustment (GA has stronger DV law support)
 * 
 * How stigma deduction works:
 * - Base stigma is a percentage of pre-accident value
 * - Each factor multiplies the base stigma up or down
 * - Final stigma is capped at 30% of pre-accident value
 * - Post-repair value = Pre-accident value - Stigma deduction
 */
export function generatePostRepairValue(
  preAccidentValue: number,
  input: AppraisalInput
): PostRepairValueResult {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - input.year;

  const repairRatio = input.repairCost / preAccidentValue;
  let repairSeverityFactor = 1.0;
  if (repairRatio < 0.05) {
    repairSeverityFactor = 0.25;
  } else if (repairRatio < 0.10) {
    repairSeverityFactor = 0.50;
  } else if (repairRatio < 0.25) {
    repairSeverityFactor = 0.75;
  } else if (repairRatio < 0.50) {
    repairSeverityFactor = 1.0;
  } else {
    repairSeverityFactor = 1.25;
  }

  let mileageFactor = 1.0;
  if (input.mileage < 20000) {
    mileageFactor = 1.2;
  } else if (input.mileage < 40000) {
    mileageFactor = 1.0;
  } else if (input.mileage < 60000) {
    mileageFactor = 0.85;
  } else if (input.mileage < 80000) {
    mileageFactor = 0.70;
  } else if (input.mileage < 100000) {
    mileageFactor = 0.55;
  } else {
    mileageFactor = 0.40;
  }

  let ageFactor = 1.0;
  if (vehicleAge <= 1) {
    ageFactor = 1.5;
  } else if (vehicleAge <= 3) {
    ageFactor = 1.25;
  } else if (vehicleAge <= 5) {
    ageFactor = 1.0;
  } else if (vehicleAge <= 7) {
    ageFactor = 0.75;
  } else {
    ageFactor = 0.50;
  }

  let priorAccidentsFactor = 1.0;
  if (input.priorAccidents === 0) {
    priorAccidentsFactor = 1.0;
  } else if (input.priorAccidents === 1) {
    priorAccidentsFactor = 1.15;
  } else if (input.priorAccidents === 2) {
    priorAccidentsFactor = 1.30;
  } else {
    priorAccidentsFactor = 1.50;
  }

  let stateFactor = 1.0;
  if (input.state === "GA") {
    stateFactor = 1.15;
  } else if (input.state === "NC") {
    stateFactor = 1.05;
  } else {
    stateFactor = 1.0;
  }

  const baseStigmaPercent = 0.10;
  const adjustedStigmaPercent = baseStigmaPercent 
    * repairSeverityFactor 
    * mileageFactor 
    * ageFactor 
    * priorAccidentsFactor 
    * stateFactor;

  const cappedStigmaPercent = Math.min(0.30, adjustedStigmaPercent);
  const stigmaDeduction = Math.round(preAccidentValue * cappedStigmaPercent);
  const postRepairValue = Math.round(preAccidentValue - stigmaDeduction);

  const factors: StigmaFactors = {
    repairSeverityFactor,
    mileageFactor,
    ageFactor,
    priorAccidentsFactor,
    stateFactor,
  };

  return {
    postRepairValue,
    stigmaDeduction,
    stigmaPercentage: cappedStigmaPercent * 100,
    factors,
    methodology: `Stigma deduction: ${(cappedStigmaPercent * 100).toFixed(1)}% of pre-accident value based on repair severity (${repairSeverityFactor.toFixed(2)}), mileage (${mileageFactor.toFixed(2)}), age (${ageFactor.toFixed(2)}), prior accidents (${priorAccidentsFactor.toFixed(2)}), and state (${stateFactor.toFixed(2)})`,
  };
}

/**
 * Compute Diminished Value Amount
 * 
 * DV = Pre-Accident Value - Post-Repair Value
 * 
 * This is the core diminished value calculation, following the established
 * legal measure in Georgia (State Farm v. Mabry) and other states.
 */
export function computeDVAmount(
  pricing: MarketPricing,
  comps: CompVehicle[],
  input: AppraisalInput,
  vinData?: DecodedVin
): DVResult {
  const preAccidentResult = generatePreAccidentValue(pricing, comps, vinData);
  const postRepairResult = generatePostRepairValue(preAccidentResult.preAccidentValue, input);
  
  const diminishedValue = preAccidentResult.preAccidentValue - postRepairResult.postRepairValue;

  return {
    preAccidentValue: preAccidentResult.preAccidentValue,
    postRepairValue: postRepairResult.postRepairValue,
    diminishedValue,
    stigmaDeduction: postRepairResult.stigmaDeduction,
    methodology: `DV = Pre-Accident FMV ($${preAccidentResult.preAccidentValue.toLocaleString()}) - Post-Repair FMV ($${postRepairResult.postRepairValue.toLocaleString()}) = $${diminishedValue.toLocaleString()}`,
    breakdown: {
      marketCheckPrice: preAccidentResult.marketCheckPrice,
      compMedianPrice: preAccidentResult.compMedianPrice,
      priceRangeLow: preAccidentResult.priceRangeLow,
      priceRangeHigh: preAccidentResult.priceRangeHigh,
      stigmaPercentage: postRepairResult.stigmaPercentage,
      factors: postRepairResult.factors,
    },
  };
}

/**
 * Quick Estimate (for pre-qualification)
 * Without full MarketData API calls, provide a rough estimate based on:
 * - Vehicle year and mileage
 * - State
 * - Estimated vehicle value based on age
 */
export function quickEstimate(input: {
  year: number;
  mileage: number;
  state: "GA" | "FL" | "NC";
}): { estimateMin: number; estimateMax: number } {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - input.year;
  
  let baseValue = 25000;
  if (vehicleAge <= 2) baseValue = 38000;
  else if (vehicleAge <= 4) baseValue = 30000;
  else if (vehicleAge <= 6) baseValue = 22000;
  else if (vehicleAge <= 8) baseValue = 16000;
  else baseValue = 12000;

  if (input.mileage > 100000) baseValue *= 0.65;
  else if (input.mileage > 75000) baseValue *= 0.75;
  else if (input.mileage > 50000) baseValue *= 0.85;

  let stateMultiplier = 1.0;
  if (input.state === "GA") stateMultiplier = 1.15;
  else if (input.state === "NC") stateMultiplier = 1.05;

  let dvPercentMin = 0.06;
  let dvPercentMax = 0.12;
  
  if (vehicleAge <= 3) {
    dvPercentMin = 0.10;
    dvPercentMax = 0.18;
  } else if (vehicleAge <= 6) {
    dvPercentMin = 0.07;
    dvPercentMax = 0.14;
  }

  const estimateMin = Math.round(baseValue * dvPercentMin * stateMultiplier);
  const estimateMax = Math.round(baseValue * dvPercentMax * stateMultiplier);

  return { estimateMin, estimateMax };
}
