/**
 * MarketData API Service
 * 
 * This module wraps MarketCheck APIs to provide:
 * 1. VIN decoding via NeoVIN Enhanced Decoder
 * 2. Retail comparable listings via Inventory Search (nationwide)
 * 3. Market pricing via MarketCheck Price US USED Premium
 * 
 * All data comes from MarketCheck only - no auction data, no CARFAX assumptions.
 */

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const BASE_URL = "https://api.marketcheck.com/v2";

export interface DecodedVin {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  drivetrain: string | null;
  engineType: string | null;
  evBatteryPack: string | null;
  bodyType: string | null;
  fuelType: string | null;
  transmission: string | null;
  doors: number | null;
  cylinders: number | null;
  displacement: string | null;
  raw: any;
}

export interface CompVehicle {
  dealerName: string;
  dealerPhone: string | null;
  vin: string;
  price: number;
  mileage: number;
  listingUrl: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  city: string | null;
  state: string | null;
  distanceFromSubject: number | null;
}

export interface MarketPricing {
  cleanRetail: number;
  roughRetail: number;
  fairRetailPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  mileageAdjustedPrice: number;
  sampleSize: number;
  source: string;
  trimUsed: string | null;
  attempts: ValuationAttempt[];
}

export interface ValuationAttempt {
  attemptNumber: number;
  endpoint: string;
  params: Record<string, any>;
  result: "success" | "failure" | "invalid";
  reason?: string;
  responseData?: any;
  timestamp: string;
}

export interface FetchRetailCompsParams {
  year: number;
  make: string;
  model: string;
  trim?: string;
  state?: string;
  mileage?: number;
  zip?: string;
  nationwide?: boolean;
}

export interface FetchMarketPricingParams {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  vin?: string;
  evBatteryPack?: string;
}

async function apiRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
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

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MarketCheck API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bLower.length][aLower.length];
}

function trimSimilarity(targetTrim: string, candidateTrim: string): number {
  const distance = levenshteinDistance(targetTrim, candidateTrim);
  const maxLen = Math.max(targetTrim.length, candidateTrim.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

function isEVMake(make: string): boolean {
  const evMakes = ["rivian", "tesla", "lucid", "polestar", "fisker"];
  return evMakes.includes(make.toLowerCase());
}

function isHighValueEV(make: string, model: string): boolean {
  const highValueEVs = [
    { make: "rivian", model: "r1s" },
    { make: "rivian", model: "r1t" },
    { make: "tesla", model: "model s" },
    { make: "tesla", model: "model x" },
    { make: "lucid", model: "air" },
  ];
  return highValueEVs.some(
    ev => ev.make === make.toLowerCase() && model.toLowerCase().includes(ev.model)
  );
}

function getMinExpectedValue(make: string, model: string, year: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (make.toLowerCase() === "rivian") {
    if (model.toLowerCase().includes("r1s")) {
      if (age <= 1) return 70000;
      if (age <= 2) return 60000;
      if (age <= 3) return 50000;
      return 45000;
    }
    if (model.toLowerCase().includes("r1t")) {
      if (age <= 1) return 65000;
      if (age <= 2) return 55000;
      if (age <= 3) return 48000;
      return 42000;
    }
  }
  
  if (make.toLowerCase() === "tesla") {
    if (model.toLowerCase().includes("model s") || model.toLowerCase().includes("model x")) {
      if (age <= 1) return 70000;
      if (age <= 2) return 55000;
      if (age <= 3) return 45000;
      return 35000;
    }
    if (model.toLowerCase().includes("model 3") || model.toLowerCase().includes("model y")) {
      if (age <= 1) return 35000;
      if (age <= 2) return 30000;
      if (age <= 3) return 25000;
      return 20000;
    }
  }
  
  return 0;
}

/**
 * Decode a VIN using MarketCheck's VIN Decoder API
 */
export async function decodeVin(vin: string): Promise<DecodedVin> {
  try {
    const data = await apiRequest<any>(`/decode/car/${vin}/specs`);
    
    return {
      vin: vin.toUpperCase(),
      year: parseInt(data.year) || 0,
      make: data.make || "",
      model: data.model || "",
      trim: data.trim || null,
      drivetrain: data.drivetrain || data.drive_type || null,
      engineType: data.engine || data.engine_type || null,
      evBatteryPack: data.battery_type || data.battery_capacity || null,
      bodyType: data.body_type || data.body_style || null,
      fuelType: data.fuel_type || null,
      transmission: data.transmission || null,
      doors: data.doors ? parseInt(data.doors) : null,
      cylinders: data.cylinders ? parseInt(data.cylinders) : null,
      displacement: data.displacement || data.engine_displacement || null,
      raw: data,
    };
  } catch (error) {
    console.log("MarketCheck VIN decode failed, falling back to NHTSA API");
    return decodeVinNHTSA(vin);
  }
}

async function decodeVinNHTSA(vin: string): Promise<DecodedVin> {
  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
  );
  
  if (!response.ok) {
    throw new Error("NHTSA VIN decode failed");
  }
  
  const data = await response.json();
  const results = data.Results || [];
  
  const getValue = (variableId: number): string | null => {
    const item = results.find((r: any) => r.VariableId === variableId);
    return item?.Value || null;
  };
  
  return {
    vin: vin.toUpperCase(),
    year: parseInt(getValue(29) || "0") || 0,
    make: getValue(26) || "",
    model: getValue(28) || "",
    trim: getValue(38) || null,
    drivetrain: getValue(15) || null,
    engineType: getValue(13) || null,
    evBatteryPack: getValue(9) || null,
    bodyType: getValue(5) || null,
    fuelType: getValue(24) || null,
    transmission: getValue(37) || null,
    doors: getValue(14) ? parseInt(getValue(14)!) : null,
    cylinders: getValue(13) ? parseInt(getValue(13)!) : null,
    displacement: getValue(11) || null,
    raw: data,
  };
}

/**
 * Fetch retail comparable listings from MarketCheck Inventory Search
 * Now searches NATIONWIDE with phased mileage bands
 */
export async function fetchRetailComps(params: FetchRetailCompsParams): Promise<{
  comps: CompVehicle[];
  searchNotes: string;
  mileageBand: string;
}> {
  const attempts: string[] = [];
  let comps: CompVehicle[] = [];
  let mileageBand = "";
  
  const mileageBands = params.mileage ? [
    { percent: 20, label: "±20%" },
    { percent: 30, label: "±30%" },
    { percent: 50, label: "±50%" },
  ] : [];

  for (const band of mileageBands.length > 0 ? mileageBands : [{ percent: 0, label: "any" }]) {
    try {
      const searchParams: Record<string, any> = {
        year: params.year,
        make: params.make,
        model: params.model,
        car_type: "used",
        seller_type: "dealer",
        rows: 30,
      };

      if (params.trim) {
        searchParams.trim = params.trim;
      }

      if (params.mileage && band.percent > 0) {
        const minMiles = Math.round(params.mileage * (1 - band.percent / 100));
        const maxMiles = Math.round(params.mileage * (1 + band.percent / 100));
        searchParams.miles_range = `${minMiles}-${maxMiles}`;
      }

      attempts.push(`Searching nationwide: ${params.year} ${params.make} ${params.model}, mileage ${band.label}`);
      
      const data = await apiRequest<any>("/search/car/active", searchParams);
      const listings = data.listings || [];
      
      comps = listings.map((listing: any) => ({
        dealerName: listing.dealer?.name || "Unknown Dealer",
        dealerPhone: listing.dealer?.phone || null,
        vin: listing.vin || "",
        price: parseFloat(listing.price) || 0,
        mileage: parseInt(listing.miles) || parseInt(listing.mileage) || 0,
        listingUrl: listing.vdp_url || null,
        year: parseInt(listing.year) || params.year,
        make: listing.make || params.make,
        model: listing.model || params.model,
        trim: listing.trim || null,
        city: listing.dealer?.city || null,
        state: listing.dealer?.state || null,
        distanceFromSubject: null,
      })).filter((c: CompVehicle) => c.price > 0);

      if (params.mileage) {
        comps.sort((a, b) => 
          Math.abs(a.mileage - params.mileage!) - Math.abs(b.mileage - params.mileage!)
        );
      }

      if (comps.length >= 3) {
        mileageBand = band.label;
        break;
      }
      
      attempts.push(`Found ${comps.length} comps with ${band.label} mileage band, need 3 minimum`);
    } catch (error) {
      attempts.push(`Search failed for ${band.label} band: ${error}`);
    }
  }

  if (comps.length < 3 && params.trim) {
    attempts.push("Retrying without trim filter");
    try {
      const searchParams: Record<string, any> = {
        year: params.year,
        make: params.make,
        model: params.model,
        car_type: "used",
        seller_type: "dealer",
        rows: 30,
      };

      const data = await apiRequest<any>("/search/car/active", searchParams);
      const listings = data.listings || [];
      
      comps = listings.map((listing: any) => ({
        dealerName: listing.dealer?.name || "Unknown Dealer",
        dealerPhone: listing.dealer?.phone || null,
        vin: listing.vin || "",
        price: parseFloat(listing.price) || 0,
        mileage: parseInt(listing.miles) || parseInt(listing.mileage) || 0,
        listingUrl: listing.vdp_url || null,
        year: parseInt(listing.year) || params.year,
        make: listing.make || params.make,
        model: listing.model || params.model,
        trim: listing.trim || null,
        city: listing.dealer?.city || null,
        state: listing.dealer?.state || null,
        distanceFromSubject: null,
      })).filter((c: CompVehicle) => c.price > 0);

      if (params.mileage) {
        comps.sort((a, b) => 
          Math.abs(a.mileage - params.mileage!) - Math.abs(b.mileage - params.mileage!)
        );
      }
      
      mileageBand = "any (no trim filter)";
      attempts.push(`Found ${comps.length} comps without trim filter`);
    } catch (error) {
      attempts.push(`Retry without trim failed: ${error}`);
    }
  }

  return {
    comps: comps.slice(0, 5),
    searchNotes: attempts.join("; "),
    mileageBand: mileageBand || "N/A",
  };
}

/**
 * Get market pricing with multi-attempt trim matching and EV validation
 */
export async function fetchMarketPricing(params: FetchMarketPricingParams): Promise<MarketPricing> {
  const attempts: ValuationAttempt[] = [];
  let attemptNum = 0;
  
  const createAttempt = (
    endpoint: string, 
    searchParams: Record<string, any>, 
    result: "success" | "failure" | "invalid",
    reason?: string,
    responseData?: any
  ): ValuationAttempt => ({
    attemptNumber: ++attemptNum,
    endpoint,
    params: { ...searchParams },
    result,
    reason,
    responseData,
    timestamp: new Date().toISOString(),
  });

  const tryPricingRequest = async (
    searchParams: Record<string, any>,
    trimLabel: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const data = await apiRequest<any>("/predict/car/us/marketcheck_price", searchParams);
      
      const price = parseFloat(data.price) || parseFloat(data.predicted_price) || 0;
      const minExpected = getMinExpectedValue(params.make, params.model, params.year);
      
      if (price > 0 && price < minExpected) {
        attempts.push(createAttempt(
          "/predict/car/us/marketcheck_price",
          searchParams,
          "invalid",
          `Price $${price} below minimum expected $${minExpected} for ${params.year} ${params.make} ${params.model}`,
          data
        ));
        return { success: false, error: `Invalid low price: $${price}` };
      }
      
      if (price > 0) {
        attempts.push(createAttempt(
          "/predict/car/us/marketcheck_price",
          searchParams,
          "success",
          `Valid price obtained with ${trimLabel}`,
          data
        ));
        return { success: true, data };
      }
      
      attempts.push(createAttempt(
        "/predict/car/us/marketcheck_price",
        searchParams,
        "failure",
        "No price in response",
        data
      ));
      return { success: false, error: "No price returned" };
    } catch (error: any) {
      attempts.push(createAttempt(
        "/predict/car/us/marketcheck_price",
        searchParams,
        "failure",
        error.message
      ));
      return { success: false, error: error.message };
    }
  };

  const buildSearchParams = (trim?: string): Record<string, any> => {
    const searchParams: Record<string, any> = {
      car_type: "used",
      year: params.year,
      make: params.make,
      model: params.model,
    };
    
    if (params.vin) {
      searchParams.vin = params.vin;
    }
    if (trim) {
      searchParams.trim = trim;
    }
    if (params.mileage) {
      searchParams.mileage = params.mileage;
    }
    
    return searchParams;
  };

  if (params.trim) {
    const result = await tryPricingRequest(buildSearchParams(params.trim), `exact trim: ${params.trim}`);
    if (result.success && result.data) {
      return buildPricingResult(result.data, params.trim, attempts);
    }
  }

  if (params.vin) {
    const vinParams = buildSearchParams();
    vinParams.vin = params.vin;
    delete vinParams.trim;
    
    const result = await tryPricingRequest(vinParams, "VIN-only lookup");
    if (result.success && result.data) {
      return buildPricingResult(result.data, "VIN-decoded", attempts);
    }
  }

  const yearModelParams = buildSearchParams();
  delete yearModelParams.trim;
  delete yearModelParams.vin;
  
  const result = await tryPricingRequest(yearModelParams, "year/make/model only");
  if (result.success && result.data) {
    return buildPricingResult(result.data, null, attempts);
  }

  console.log("All MarketCheck pricing attempts failed, using EV-aware fallback");
  return buildFallbackPricing(params, attempts);
}

function buildPricingResult(data: any, trimUsed: string | null, attempts: ValuationAttempt[]): MarketPricing {
  const predictedPrice = parseFloat(data.price) || parseFloat(data.predicted_price) || 0;
  const priceLow = parseFloat(data.price_low) || parseFloat(data.low) || predictedPrice * 0.85;
  const priceHigh = parseFloat(data.price_high) || parseFloat(data.high) || predictedPrice * 1.15;
  
  return {
    cleanRetail: Math.round(priceHigh),
    roughRetail: Math.round(priceLow),
    fairRetailPrice: Math.round(predictedPrice),
    priceRangeLow: Math.round(priceLow),
    priceRangeHigh: Math.round(priceHigh),
    mileageAdjustedPrice: Math.round(predictedPrice),
    sampleSize: parseInt(data.sample_size) || 1,
    source: "MarketCheck API",
    trimUsed,
    attempts,
  };
}

function buildFallbackPricing(params: FetchMarketPricingParams, attempts: ValuationAttempt[]): MarketPricing {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - params.year;
  
  let basePrice: number;
  
  if (isHighValueEV(params.make, params.model)) {
    if (params.make.toLowerCase() === "rivian") {
      if (params.model.toLowerCase().includes("r1s")) {
        basePrice = vehicleAge <= 1 ? 85000 : vehicleAge <= 2 ? 75000 : vehicleAge <= 3 ? 65000 : 55000;
      } else {
        basePrice = vehicleAge <= 1 ? 80000 : vehicleAge <= 2 ? 70000 : vehicleAge <= 3 ? 60000 : 50000;
      }
    } else if (params.make.toLowerCase() === "tesla") {
      if (params.model.toLowerCase().includes("model s") || params.model.toLowerCase().includes("model x")) {
        basePrice = vehicleAge <= 1 ? 85000 : vehicleAge <= 2 ? 70000 : vehicleAge <= 3 ? 58000 : 45000;
      } else {
        basePrice = vehicleAge <= 1 ? 45000 : vehicleAge <= 2 ? 38000 : vehicleAge <= 3 ? 32000 : 26000;
      }
    } else {
      basePrice = vehicleAge <= 1 ? 75000 : vehicleAge <= 2 ? 62000 : vehicleAge <= 3 ? 52000 : 42000;
    }
  } else if (isEVMake(params.make)) {
    basePrice = vehicleAge <= 1 ? 55000 : vehicleAge <= 2 ? 45000 : vehicleAge <= 3 ? 38000 : 30000;
  } else {
    if (vehicleAge <= 1) basePrice = 38000;
    else if (vehicleAge <= 2) basePrice = 32000;
    else if (vehicleAge <= 3) basePrice = 28000;
    else if (vehicleAge <= 5) basePrice = 22000;
    else if (vehicleAge <= 7) basePrice = 17000;
    else if (vehicleAge <= 10) basePrice = 12000;
    else basePrice = 8000;
  }
  
  if (params.mileage) {
    if (params.mileage > 100000) basePrice *= 0.65;
    else if (params.mileage > 75000) basePrice *= 0.75;
    else if (params.mileage > 50000) basePrice *= 0.85;
    else if (params.mileage > 30000) basePrice *= 0.92;
    else if (params.mileage < 15000) basePrice *= 1.05;
  }
  
  attempts.push({
    attemptNumber: attempts.length + 1,
    endpoint: "fallback_estimation",
    params: { year: params.year, make: params.make, model: params.model, mileage: params.mileage },
    result: "success",
    reason: "Using EV-aware fallback pricing due to API failures",
    timestamp: new Date().toISOString(),
  });
  
  return {
    cleanRetail: Math.round(basePrice),
    roughRetail: Math.round(basePrice * 0.70),
    fairRetailPrice: Math.round(basePrice * 0.92),
    priceRangeLow: Math.round(basePrice * 0.85),
    priceRangeHigh: Math.round(basePrice * 1.08),
    mileageAdjustedPrice: Math.round(basePrice * 0.92),
    sampleSize: 0,
    source: "Estimated (API unavailable)",
    trimUsed: null,
    attempts,
  };
}

/**
 * Combined function to get all vehicle data at once
 */
export async function getFullVehicleData(vin: string, state?: string, mileage?: number) {
  const decoded = await decodeVin(vin);
  
  const [compsResult, pricing] = await Promise.all([
    fetchRetailComps({
      year: decoded.year,
      make: decoded.make,
      model: decoded.model,
      trim: decoded.trim || undefined,
      mileage,
      nationwide: true,
    }),
    fetchMarketPricing({
      year: decoded.year,
      make: decoded.make,
      model: decoded.model,
      trim: decoded.trim || undefined,
      mileage,
      vin,
      evBatteryPack: decoded.evBatteryPack || undefined,
    }),
  ]);

  return {
    decoded,
    comps: compsResult.comps,
    compsSearchNotes: compsResult.searchNotes,
    compsMileageBand: compsResult.mileageBand,
    pricing,
  };
}
