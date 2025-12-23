import type {
  AppraisalInput,
  ThirdPartyValuations,
  ComparableListing,
  AppraisalComputationResult,
  AccidentHistoryFlag,
} from "@shared/types/appraisal";
import { fetchMarketPricing, fetchRetailComps, type CompVehicle } from "./marketData";

export async function fetchThirdPartyValuations(
  input: AppraisalInput
): Promise<ThirdPartyValuations> {
  const pricing = await fetchMarketPricing({
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim || undefined,
    mileage: input.mileage,
    vin: input.vin,
  });

  return {
    cleanRetailPreAccident: pricing.cleanRetail,
    roughRetailPostAccident: pricing.roughRetail,
    source: pricing.source,
    retrievedAt: new Date(),
  };
}

export async function fetchMarketComparables(
  input: AppraisalInput
): Promise<{ comparables: ComparableListing[]; filterNotes: string; mileageBand: string }> {
  const { comps, searchNotes, mileageBand } = await fetchRetailComps({
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim || undefined,
    mileage: input.mileage,
    nationwide: true,
  });

  const mileageVariance = Math.max(5000, input.mileage * 0.2);
  const minMiles = input.mileage - mileageVariance;
  const maxMiles = input.mileage + mileageVariance;

  const filtered = comps.filter(c => 
    c.mileage >= minMiles && c.mileage <= maxMiles && c.price > 0
  );

  const topComps = filtered.length >= 3 ? filtered.slice(0, 3) : comps.slice(0, 3);

  const comparables: ComparableListing[] = topComps.map(c => ({
    sourceDealerName: c.dealerName,
    sourceDealerPhone: c.dealerPhone || undefined,
    sourceDealerCity: c.city || undefined,
    sourceDealerState: c.state || undefined,
    year: c.year,
    make: c.make,
    model: c.model,
    trim: c.trim || "",
    vin: c.vin,
    mileage: c.mileage,
    listedPrice: c.price,
    listingUrl: c.listingUrl || undefined,
    accidentHistory: "unknown" as AccidentHistoryFlag,
    distanceMiles: c.distanceFromSubject || undefined,
  }));

  let filterNotes = `Searched nationwide for ${input.year} ${input.make} ${input.model}`;
  if (input.trim) filterNotes += ` ${input.trim}`;
  filterNotes += ` with mileage between ${Math.round(minMiles).toLocaleString()} and ${Math.round(maxMiles).toLocaleString()} miles.`;

  if (comparables.length < 3) {
    filterNotes += ` Only ${comparables.length} qualifying comparable(s) found in nationwide market.`;
  } else {
    filterNotes += ` ${comparables.length} comparable vehicles selected from nationwide search.`;
  }
  
  if (searchNotes) {
    filterNotes += ` Search details: ${searchNotes}`;
  }

  return { comparables, filterNotes, mileageBand };
}

export function computePreAccidentValue(
  thirdParty: ThirdPartyValuations,
  comparables: ComparableListing[]
): { comparablesAvgRetail: number; finalPreAccidentValue: number } {
  const prices = comparables.map(c => c.listedPrice).filter(p => p > 0);
  
  const comparablesAvgRetail = prices.length > 0 
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) 
    : 0;

  let finalPreAccidentValue: number;
  if (comparablesAvgRetail > 0) {
    finalPreAccidentValue = Math.round(
      (thirdParty.cleanRetailPreAccident + comparablesAvgRetail) / 2
    );
  } else {
    finalPreAccidentValue = thirdParty.cleanRetailPreAccident;
  }

  return { comparablesAvgRetail, finalPreAccidentValue };
}

export function computeDiminishedValue(
  preAccidentValue: number,
  thirdParty: ThirdPartyValuations
): { postAccidentValue: number; diminishedValue: number } {
  const postAccidentValue = Math.round(thirdParty.roughRetailPostAccident);
  const rawDv = preAccidentValue - postAccidentValue;
  const diminishedValue = rawDv > 0 ? rawDv : 0;
  return { postAccidentValue, diminishedValue };
}

export function getMileageBandDescription(mileage: number): string {
  if (mileage < 15000) return "Low mileage (under 15,000 miles) - premium market position";
  if (mileage < 30000) return "Below average mileage (15,000-30,000 miles) - strong market position";
  if (mileage < 50000) return "Average mileage (30,000-50,000 miles) - typical market position";
  if (mileage < 75000) return "Above average mileage (50,000-75,000 miles) - moderate market position";
  if (mileage < 100000) return "High mileage (75,000-100,000 miles) - value-conscious market segment";
  return "Very high mileage (over 100,000 miles) - economy market segment";
}

export async function runFullAppraisalCalculation(
  input: AppraisalInput
): Promise<AppraisalComputationResult> {
  const thirdParty = await fetchThirdPartyValuations(input);
  
  const { comparables, filterNotes, mileageBand } = await fetchMarketComparables(input);
  
  const { comparablesAvgRetail, finalPreAccidentValue } = computePreAccidentValue(
    thirdParty,
    comparables
  );
  
  const { postAccidentValue, diminishedValue } = computeDiminishedValue(
    finalPreAccidentValue,
    thirdParty
  );

  return {
    appraisalId: input.id,
    thirdParty,
    comparables,
    comparablesAvgRetail,
    finalPreAccidentValue,
    postAccidentValue,
    diminishedValue,
    mileageBandDescription: mileageBand || getMileageBandDescription(input.mileage),
    comparableFilterNotes: filterNotes,
    createdAt: new Date(),
  };
}
