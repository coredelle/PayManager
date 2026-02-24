/**
 * MarketCheck API Client
 * 
 * Typed service layer for MarketCheck APIs:
 * 1. MarketCheck Price™ with Comparables - Premium endpoint
 * 2. VINData AAMVA/NMVTIS reports - Title history verification
 * 3. Inventory Search backup - Fallback comp source
 */

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const BASE_URL = "https://api.marketcheck.com/v2";

export const POST_ACCIDENT_FACTOR = 0.90;
export const MILEAGE_TOLERANCE_STEPS = [10, 15, 20];

export interface MarketCheckPriceResult {
  marketcheck_price: number;
  price_low: number;
  price_high: number;
  confidence_score: number;
  sample_size: number;
  comparables: ComparableListing[];
  raw: any;
}

export interface ComparableListing {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number;
  price: number;
  dealerName: string;
  dealerPhone: string | null;
  dealerCity: string | null;
  dealerState: string | null;
  listingUrl: string | null;
  distanceFromSubject: number | null;
  vinDataReport?: VINDataReport | null;
  historyMatchStatus?: "exact" | "similar" | "no_data";
}

export interface VINDataReport {
  vin: string;
  titleBrands: string[];
  hasJunkSalvageRecord: boolean;
  hasTotalLossRecord: boolean;
  odometerConsistent: boolean;
  reportId: string;
  reportType: "aamva" | "generated";
  raw: any;
}

export interface ValuationResult {
  marketcheckPricePre: number;
  compPrices: number[];
  avgCompPrice: number;
  finalPreAccidentValue: number;
  postAccidentValue: number;
  diminishedValue: number;
  selectedComps: ComparableListing[];
  subjectVinData: VINDataReport | null;
  methodology: string;
  filteringLog: string[];
}

function computeMockValuation(params: {
  vin: string;
  miles: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  zip?: string;
  repairCost?: number;
}): ValuationResult {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - params.year);

  let basePrice = 35000;
  if (age > 12) basePrice = 10000;
  else if (age > 10) basePrice = 13000;
  else if (age > 7) basePrice = 17000;
  else if (age > 5) basePrice = 22000;
  else if (age > 3) basePrice = 28000;

  if (params.miles > 120000) basePrice *= 0.6;
  else if (params.miles > 90000) basePrice *= 0.7;
  else if (params.miles > 70000) basePrice *= 0.8;
  else if (params.miles > 50000) basePrice *= 0.9;
  else if (params.miles < 20000) basePrice *= 1.05;

  const marketcheckPricePre = Math.round(basePrice);

  const comp1 = Math.round(marketcheckPricePre * 0.95);
  const comp2 = Math.round(marketcheckPricePre * 1.0);
  const comp3 = Math.round(marketcheckPricePre * 1.05);
  const compPrices = [comp1, comp2, comp3];
  const avgCompPrice = Math.round(
    (comp1 + comp2 + comp3) / 3
  );

  const finalPreAccidentValue = Math.round(
    (marketcheckPricePre + avgCompPrice) / 2
  );

  const postAccidentValue = Math.round(marketcheckPricePre * POST_ACCIDENT_FACTOR);
  const diminishedValue = Math.max(0, finalPreAccidentValue - postAccidentValue);

  const selectedComps: ComparableListing[] = compPrices.map((price, index) => ({
    vin: `${params.vin || "MOCKVIN"}-C${index + 1}`,
    year: params.year,
    make: params.make,
    model: params.model,
    trim: params.trim || null,
    mileage: params.miles,
    price,
    dealerName: "Mock Dealer",
    dealerPhone: null,
    dealerCity: "Atlanta",
    dealerState: "GA",
    listingUrl: null,
    distanceFromSubject: null,
  }));

  const filteringLog: string[] = [
    "Using mock MarketCheck valuation because MARKETCHECK_API_KEY is not configured.",
    `Base price derived from year ${params.year} and ${params.miles.toLocaleString()} miles.`,
    `Generated 3 synthetic comparable vehicles around $${marketcheckPricePre.toLocaleString()}.`,
  ];

  const methodology = [
    "Mock valuation for development/testing:",
    "- Pre-accident value based on age and mileage heuristics.",
    "- Three synthetic comparable retail listings generated around the heuristic value.",
    `- Post-accident value computed as MarketCheck price × POST_ACCIDENT_FACTOR (${POST_ACCIDENT_FACTOR}).`,
  ].join("\n");

  return {
    marketcheckPricePre,
    compPrices,
    avgCompPrice,
    finalPreAccidentValue,
    postAccidentValue,
    diminishedValue,
    selectedComps,
    subjectVinData: null,
    methodology,
    filteringLog,
  };
}

async function apiRequest<T>(
  endpoint: string, 
  params: Record<string, any> = {},
  method: "GET" | "POST" = "GET"
): Promise<T> {
  if (!MARKETCHECK_API_KEY) {
    throw new Error("MARKETCHECK_API_KEY is not configured");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", MARKETCHECK_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  console.log(`[MarketCheck] ${method} ${url.pathname}?${url.searchParams.toString().replace(MARKETCHECK_API_KEY, "***")}`);

  const response = await fetch(url.toString(), {
    method,
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[MarketCheck] Error ${response.status}: ${errorText.substring(0, 200)}`);
    throw new Error(`MarketCheck API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Get MarketCheck Price™ with comparables
 * Uses the Premium tier endpoint to get both valuation and comparable listings
 */
export async function getMarketcheckPriceWithComparables(params: {
  vin: string;
  miles: number;
  zip?: string;
  city?: string;
  state?: string;
}): Promise<MarketCheckPriceResult> {
  const searchParams: Record<string, any> = {
    vin: params.vin,
    miles: params.miles,
    dealer_type: "retail",
  };

  if (params.zip) {
    searchParams.zip = params.zip;
  } else if (params.city && params.state) {
    searchParams.city = params.city;
    searchParams.state = params.state;
  } else {
    searchParams.state = "GA";
  }

  try {
    const data = await apiRequest<any>(
      "/predict/car/us/marketcheck_price/comparables",
      searchParams
    );

    const comparables: ComparableListing[] = (data.comparables?.listings || []).map((listing: any) => ({
      vin: listing.vin || "",
      year: parseInt(listing.year) || 0,
      make: listing.make || "",
      model: listing.model || "",
      trim: listing.trim || null,
      mileage: parseInt(listing.miles) || parseInt(listing.mileage) || 0,
      price: parseFloat(listing.price) || 0,
      dealerName: listing.dealer?.name || "Unknown Dealer",
      dealerPhone: listing.dealer?.phone || null,
      dealerCity: listing.dealer?.city || null,
      dealerState: listing.dealer?.state || null,
      listingUrl: listing.vdp_url || null,
      distanceFromSubject: listing.distance || null,
    }));

    return {
      marketcheck_price: parseFloat(data.marketcheck_price) || parseFloat(data.price) || 0,
      price_low: parseFloat(data.price_low) || parseFloat(data.low) || 0,
      price_high: parseFloat(data.price_high) || parseFloat(data.high) || 0,
      confidence_score: parseFloat(data.confidence_score) || 0,
      sample_size: parseInt(data.sample_size) || 0,
      comparables,
      raw: data,
    };
  } catch (error: any) {
    console.log("[MarketCheck] Price/comparables endpoint failed:", error.message);
    
    const fallbackData = await apiRequest<any>("/predict/car/us/marketcheck_price", {
      vin: params.vin,
      mileage: params.miles,
      car_type: "used",
    });

    return {
      marketcheck_price: parseFloat(fallbackData.price) || parseFloat(fallbackData.predicted_price) || 0,
      price_low: parseFloat(fallbackData.price_low) || parseFloat(fallbackData.low) || 0,
      price_high: parseFloat(fallbackData.price_high) || parseFloat(fallbackData.high) || 0,
      confidence_score: parseFloat(fallbackData.confidence_score) || 0,
      sample_size: parseInt(fallbackData.sample_size) || 0,
      comparables: [],
      raw: fallbackData,
    };
  }
}

/**
 * Get VINData AAMVA/NMVTIS report for a VIN
 * First tries access-report, falls back to generate-report if 422
 */
export async function getVinDataReport(vin: string): Promise<VINDataReport | null> {
  try {
    const data = await apiRequest<any>(`/vindata/access-report/aamva/${vin}`);
    return parseVinDataReport(vin, data, "aamva");
  } catch (error: any) {
    if (error.message.includes("422") || error.message.includes("404")) {
      console.log(`[VINData] No existing report for ${vin}, attempting to generate...`);
      try {
        const data = await apiRequest<any>(`/vindata/generate-report/aamva/${vin}`);
        return parseVinDataReport(vin, data, "generated");
      } catch (genError: any) {
        console.log(`[VINData] Generate report failed for ${vin}:`, genError.message);
        return null;
      }
    }
    console.log(`[VINData] Access report failed for ${vin}:`, error.message);
    return null;
  }
}

function parseVinDataReport(vin: string, data: any, reportType: "aamva" | "generated"): VINDataReport {
  const titleBrands: string[] = [];
  let hasJunkSalvageRecord = false;
  let hasTotalLossRecord = false;
  let odometerConsistent = true;

  if (data.title_history || data.brands) {
    const brands = data.brands || data.title_history?.brands || [];
    for (const brand of brands) {
      const brandName = typeof brand === "string" ? brand : brand.brand || brand.description;
      if (brandName) {
        titleBrands.push(brandName);
        const lowerBrand = brandName.toLowerCase();
        if (lowerBrand.includes("junk") || lowerBrand.includes("salvage")) {
          hasJunkSalvageRecord = true;
        }
        if (lowerBrand.includes("total loss") || lowerBrand.includes("totaled")) {
          hasTotalLossRecord = true;
        }
      }
    }
  }

  if (data.junk_salvage_records || data.nmvtis?.junk_salvage) {
    hasJunkSalvageRecord = true;
  }

  if (data.odometer_discrepancy || data.nmvtis?.odometer_problem) {
    odometerConsistent = false;
  }

  return {
    vin,
    titleBrands,
    hasJunkSalvageRecord,
    hasTotalLossRecord,
    odometerConsistent,
    reportId: data.report_id || data.id || vin,
    reportType,
    raw: data,
  };
}

/**
 * Search inventory as backup for comparables
 */
export async function searchInventoryBackup(params: {
  year: number;
  make: string;
  model: string;
  trim?: string;
  milesMin?: number;
  milesMax?: number;
  limit?: number;
}): Promise<ComparableListing[]> {
  const searchParams: Record<string, any> = {
    year: params.year,
    make: params.make,
    model: params.model,
    car_type: "used",
    seller_type: "dealer",
    rows: params.limit || 30,
  };

  if (params.trim) {
    searchParams.trim = params.trim;
  }

  if (params.milesMin !== undefined && params.milesMax !== undefined) {
    searchParams.miles_range = `${params.milesMin}-${params.milesMax}`;
  }

  const data = await apiRequest<any>("/search/car/active", searchParams);
  const listings = data.listings || [];

  return listings.map((listing: any) => ({
    vin: listing.vin || "",
    year: parseInt(listing.year) || params.year,
    make: listing.make || params.make,
    model: listing.model || params.model,
    trim: listing.trim || null,
    mileage: parseInt(listing.miles) || parseInt(listing.mileage) || 0,
    price: parseFloat(listing.price) || 0,
    dealerName: listing.dealer?.name || "Unknown Dealer",
    dealerPhone: listing.dealer?.phone || null,
    dealerCity: listing.dealer?.city || null,
    dealerState: listing.dealer?.state || null,
    listingUrl: listing.vdp_url || null,
    distanceFromSubject: null,
  })).filter((c: ComparableListing) => c.price > 0 && c.vin);
}

/**
 * Filter comparables to match subject history
 * Returns exactly 3 comps, relaxing criteria if needed
 */
export async function filterComparablesByHistory(
  subjectVin: string,
  subjectMiles: number,
  candidateComps: ComparableListing[],
  subjectVinData: VINDataReport | null
): Promise<{ comps: ComparableListing[]; filterLog: string[] }> {
  const filterLog: string[] = [];
  filterLog.push(`Starting with ${candidateComps.length} candidate comparables`);

  const subjectClean = subjectVinData ? 
    (!subjectVinData.hasJunkSalvageRecord && !subjectVinData.hasTotalLossRecord && subjectVinData.titleBrands.length === 0) :
    true;
  filterLog.push(`Subject vehicle history: ${subjectClean ? "Clean" : "Has history flags"}`);

  for (const comp of candidateComps) {
    if (comp.vin) {
      try {
        comp.vinDataReport = await getVinDataReport(comp.vin);
        if (comp.vinDataReport) {
          const compClean = !comp.vinDataReport.hasJunkSalvageRecord && 
                           !comp.vinDataReport.hasTotalLossRecord && 
                           comp.vinDataReport.titleBrands.length === 0;
          
          if (subjectClean && compClean) {
            comp.historyMatchStatus = "exact";
          } else if (!subjectClean && !compClean) {
            comp.historyMatchStatus = "exact";
          } else {
            comp.historyMatchStatus = "similar";
          }
        } else {
          comp.historyMatchStatus = "no_data";
        }
      } catch {
        comp.historyMatchStatus = "no_data";
      }
    }
  }

  for (const tolerancePercent of MILEAGE_TOLERANCE_STEPS) {
    const minMiles = subjectMiles * (1 - tolerancePercent / 100);
    const maxMiles = subjectMiles * (1 + tolerancePercent / 100);
    
    const mileageFiltered = candidateComps.filter(c => 
      c.mileage >= minMiles && c.mileage <= maxMiles
    );
    
    const exactHistoryMatches = mileageFiltered.filter(c => c.historyMatchStatus === "exact");
    filterLog.push(`±${tolerancePercent}% mileage: ${mileageFiltered.length} comps, ${exactHistoryMatches.length} exact history matches`);
    
    if (exactHistoryMatches.length >= 3) {
      return { 
        comps: exactHistoryMatches.slice(0, 3), 
        filterLog 
      };
    }

    if (mileageFiltered.length >= 3) {
      const sorted = mileageFiltered.sort((a, b) => {
        if (a.historyMatchStatus === "exact" && b.historyMatchStatus !== "exact") return -1;
        if (b.historyMatchStatus === "exact" && a.historyMatchStatus !== "exact") return 1;
        if (a.historyMatchStatus === "similar" && b.historyMatchStatus === "no_data") return -1;
        if (b.historyMatchStatus === "similar" && a.historyMatchStatus === "no_data") return 1;
        return Math.abs(a.mileage - subjectMiles) - Math.abs(b.mileage - subjectMiles);
      });
      filterLog.push(`Using ${tolerancePercent}% mileage tolerance with best available history matches`);
      return { comps: sorted.slice(0, 3), filterLog };
    }
  }

  filterLog.push("No exact-history matches available; using closest-title-history matches");
  const sorted = candidateComps.sort((a, b) => {
    if (a.historyMatchStatus === "exact" && b.historyMatchStatus !== "exact") return -1;
    if (b.historyMatchStatus === "exact" && a.historyMatchStatus !== "exact") return 1;
    return Math.abs(a.mileage - subjectMiles) - Math.abs(b.mileage - subjectMiles);
  });

  return { comps: sorted.slice(0, 3), filterLog };
}

/**
 * Full valuation pipeline with transparent calculations
 */
export async function computeFullValuation(params: {
  vin: string;
  miles: number;
  year: number;
  make: string;
  model: string;
  trim?: string;
  zip?: string;
  repairCost?: number;
}): Promise<ValuationResult> {
  if (!process.env.MARKETCHECK_API_KEY) {
    return computeMockValuation(params);
  }

  const filteringLog: string[] = [];
  filteringLog.push(`Starting valuation for VIN: ${params.vin}`);
  filteringLog.push(`Vehicle: ${params.year} ${params.make} ${params.model} ${params.trim || ""}`);
  filteringLog.push(`Mileage: ${params.miles.toLocaleString()}`);

  filteringLog.push("Fetching subject VINData report...");
  const subjectVinData = await getVinDataReport(params.vin);
  if (subjectVinData) {
    filteringLog.push(`Subject VINData: ${subjectVinData.titleBrands.length} title brands, Junk/Salvage: ${subjectVinData.hasJunkSalvageRecord}, Total Loss: ${subjectVinData.hasTotalLossRecord}`);
  } else {
    filteringLog.push("Subject VINData: No report available");
  }

  filteringLog.push("Fetching MarketCheck Price™ with comparables...");
  const priceResult = await getMarketcheckPriceWithComparables({
    vin: params.vin,
    miles: params.miles,
    zip: params.zip,
    state: "GA",
  });

  const marketcheckPricePre = priceResult.marketcheck_price;
  filteringLog.push(`MarketCheck Price™: $${marketcheckPricePre.toLocaleString()}`);
  filteringLog.push(`Price Range: $${priceResult.price_low.toLocaleString()} - $${priceResult.price_high.toLocaleString()}`);
  filteringLog.push(`Initial comparables from endpoint: ${priceResult.comparables.length}`);

  let candidateComps = priceResult.comparables;

  if (candidateComps.length < 3) {
    filteringLog.push("Insufficient comparables from price endpoint, searching inventory...");
    const backupComps = await searchInventoryBackup({
      year: params.year,
      make: params.make,
      model: params.model,
      trim: params.trim,
      milesMin: Math.round(params.miles * 0.7),
      milesMax: Math.round(params.miles * 1.3),
    });
    filteringLog.push(`Backup inventory search found: ${backupComps.length} listings`);
    
    const existingVins = new Set(candidateComps.map(c => c.vin));
    for (const comp of backupComps) {
      if (!existingVins.has(comp.vin)) {
        candidateComps.push(comp);
        existingVins.add(comp.vin);
      }
    }
    filteringLog.push(`Total candidate pool: ${candidateComps.length}`);
  }

  let { comps: selectedComps, filterLog } = await filterComparablesByHistory(
    params.vin,
    params.miles,
    candidateComps,
    subjectVinData
  );
  filteringLog.push(...filterLog);

  if (selectedComps.length < 3) {
    filteringLog.push(`Only ${selectedComps.length} comps after filtering, searching backup inventory...`);
    const backupComps = await searchInventoryBackup({
      year: params.year,
      make: params.make,
      model: params.model,
      milesMin: Math.round(params.miles * 0.5),
      milesMax: Math.round(params.miles * 1.5),
      limit: 50,
    });
    filteringLog.push(`Wide-range backup search found: ${backupComps.length} listings`);

    const existingVins = new Set(selectedComps.map(c => c.vin));
    for (const comp of backupComps) {
      if (!existingVins.has(comp.vin) && selectedComps.length < 3) {
        try {
          comp.vinDataReport = await getVinDataReport(comp.vin);
          comp.historyMatchStatus = comp.vinDataReport ? "similar" : "no_data";
        } catch {
          comp.historyMatchStatus = "no_data";
        }
        selectedComps.push(comp);
        existingVins.add(comp.vin);
        filteringLog.push(`Added backup comp: ${comp.vin} at $${comp.price.toLocaleString()}`);
      }
    }
    filteringLog.push(`Final comp count after backup: ${selectedComps.length}`);
  }

  if (selectedComps.length < 3) {
    filteringLog.push("WARNING: Could not find 3 comparable vehicles. Report will include available matches with disclosure.");
  }

  const compPrices = selectedComps.map(c => c.price);
  const avgCompPrice = compPrices.length > 0 
    ? Math.round(compPrices.reduce((a, b) => a + b, 0) / compPrices.length)
    : 0;

  filteringLog.push(`Selected ${selectedComps.length} comparables`);
  filteringLog.push(`Comp prices: ${compPrices.map(p => `$${p.toLocaleString()}`).join(", ")}`);
  filteringLog.push(`Average comp price: $${avgCompPrice.toLocaleString()}`);

  let finalPreAccidentValue: number;
  if (avgCompPrice > 0 && marketcheckPricePre > 0) {
    finalPreAccidentValue = Math.round((marketcheckPricePre + avgCompPrice) / 2);
    filteringLog.push(`Final Pre-Accident Value = (MarketCheck $${marketcheckPricePre.toLocaleString()} + Avg Comp $${avgCompPrice.toLocaleString()}) / 2 = $${finalPreAccidentValue.toLocaleString()}`);
  } else if (marketcheckPricePre > 0) {
    finalPreAccidentValue = marketcheckPricePre;
    filteringLog.push(`Final Pre-Accident Value = MarketCheck Price: $${finalPreAccidentValue.toLocaleString()}`);
  } else if (avgCompPrice > 0) {
    finalPreAccidentValue = avgCompPrice;
    filteringLog.push(`Final Pre-Accident Value = Average Comp Price: $${finalPreAccidentValue.toLocaleString()}`);
  } else {
    throw new Error("Unable to determine pre-accident value - no pricing data available");
  }

  const postAccidentValue = Math.round(marketcheckPricePre * POST_ACCIDENT_FACTOR);
  filteringLog.push(`Post-Accident Value = MarketCheck $${marketcheckPricePre.toLocaleString()} × ${POST_ACCIDENT_FACTOR} = $${postAccidentValue.toLocaleString()}`);
  filteringLog.push(`(Note: POST_ACCIDENT_FACTOR=${POST_ACCIDENT_FACTOR} is a temporary testing assumption)`);

  const diminishedValue = Math.max(0, finalPreAccidentValue - postAccidentValue);
  filteringLog.push(`Diminished Value = $${finalPreAccidentValue.toLocaleString()} - $${postAccidentValue.toLocaleString()} = $${diminishedValue.toLocaleString()}`);

  const methodology = `
Pre-Accident Fair Market Value derived from:
1. MarketCheck Price™ valuation: $${marketcheckPricePre.toLocaleString()}
2. Average of ${selectedComps.length} comparable retail listings: $${avgCompPrice.toLocaleString()}
3. Final Pre-Accident Value: ($${marketcheckPricePre.toLocaleString()} + $${avgCompPrice.toLocaleString()}) ÷ 2 = $${finalPreAccidentValue.toLocaleString()}

Post-Accident Value calculated using temporary testing factor (${POST_ACCIDENT_FACTOR}):
$${marketcheckPricePre.toLocaleString()} × ${POST_ACCIDENT_FACTOR} = $${postAccidentValue.toLocaleString()}

Diminished Value = Pre-Accident Value - Post-Accident Value
$${finalPreAccidentValue.toLocaleString()} - $${postAccidentValue.toLocaleString()} = $${diminishedValue.toLocaleString()}
  `.trim();

  console.log("\n========== VALUATION SUMMARY ==========");
  console.log("marketcheck_price_pre:", marketcheckPricePre);
  console.log("comp_prices:", compPrices);
  console.log("avg_comp_price:", avgCompPrice);
  console.log("final_pre:", finalPreAccidentValue);
  console.log("post_value:", postAccidentValue);
  console.log("dv:", diminishedValue);
  console.log("selected_comps:", selectedComps.map(c => ({ vin: c.vin, price: c.price, history: c.historyMatchStatus })));
  if (subjectVinData) {
    console.log("subject_vindata:", { brands: subjectVinData.titleBrands, salvage: subjectVinData.hasJunkSalvageRecord, totalLoss: subjectVinData.hasTotalLossRecord });
  }
  console.log("========================================\n");

  return {
    marketcheckPricePre,
    compPrices,
    avgCompPrice,
    finalPreAccidentValue,
    postAccidentValue,
    diminishedValue,
    selectedComps,
    subjectVinData,
    methodology,
    filteringLog,
  };
}
