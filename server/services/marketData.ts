/**
 * MarketData API Service
 * 
 * This module wraps MarketCheck APIs to provide:
 * 1. VIN decoding via NeoVIN Enhanced Decoder
 * 2. Retail comparable listings via Inventory Search
 * 3. Market pricing via MarketCheck Price US USED Premium
 * 
 * All data comes from MarketCheck only - no auction data, no CARFAX assumptions.
 */

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const BASE_URL = "https://mc-api.marketcheck.com/v2";

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
  fairRetailPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  mileageAdjustedPrice: number;
  sampleSize: number;
}

export interface FetchRetailCompsParams {
  year: number;
  make: string;
  model: string;
  trim?: string;
  state?: string;
  mileage?: number;
  zip?: string;
}

export interface FetchMarketPricingParams {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  vin?: string;
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

/**
 * Decode a VIN using MarketCheck's NeoVIN Enhanced Decoder API
 * Returns vehicle attributes including year, make, model, trim, drivetrain, etc.
 * 
 * How it works:
 * - Calls /vin/{vin}/specs endpoint
 * - Extracts key vehicle attributes from the response
 * - Normalizes the data into a typed DecodedVin object
 */
export async function decodeVin(vin: string): Promise<DecodedVin> {
  const data = await apiRequest<any>(`/vin/${vin}/specs`);
  
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
}

/**
 * Fetch retail comparable listings from MarketCheck Inventory Search
 * 
 * How comps are chosen:
 * 1. Filter by year, make, model (exact match)
 * 2. Filter by trim if provided
 * 3. Filter by state if provided
 * 4. Only include RETAIL listings (excludes wholesale/auction)
 * 5. Sort by mileage proximity to subject vehicle
 * 6. Return 3-5 closest matches
 * 
 * These comps are used to validate market value estimates.
 */
export async function fetchRetailComps(params: FetchRetailCompsParams): Promise<CompVehicle[]> {
  const searchParams: Record<string, any> = {
    year: params.year,
    make: params.make,
    model: params.model,
    car_type: "used",
    seller_type: "dealer",
    rows: 20,
  };

  if (params.trim) {
    searchParams.trim = params.trim;
  }
  if (params.state) {
    searchParams.state = params.state;
  }
  if (params.zip) {
    searchParams.zip = params.zip;
  }

  const data = await apiRequest<any>("/search/car/active", searchParams);
  
  const listings = data.listings || [];
  
  let comps: CompVehicle[] = listings.map((listing: any) => ({
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
  }));

  if (params.mileage) {
    comps.sort((a, b) => 
      Math.abs(a.mileage - params.mileage!) - Math.abs(b.mileage - params.mileage!)
    );
  }

  return comps.slice(0, 5);
}

/**
 * Get market pricing from MarketCheck Price US USED Premium API
 * This replaces BlackBook values with MarketCheck retail pricing.
 * 
 * How pre-accident FMV is computed:
 * 1. Query MarketCheck for base retail price
 * 2. Get price range (low to high) based on market data
 * 3. Apply mileage adjustment factor
 * 4. Return the mileage-adjusted price as fair market value
 */
export async function fetchMarketPricing(params: FetchMarketPricingParams): Promise<MarketPricing> {
  const searchParams: Record<string, any> = {
    car_type: "used",
  };

  if (params.vin) {
    searchParams.vin = params.vin;
  } else {
    searchParams.year = params.year;
    searchParams.make = params.make;
    searchParams.model = params.model;
    if (params.trim) {
      searchParams.trim = params.trim;
    }
  }
  if (params.mileage) {
    searchParams.mileage = params.mileage;
  }

  const data = await apiRequest<any>("/valuate/car/stats", searchParams);
  
  const mean = parseFloat(data.mean) || 0;
  const median = parseFloat(data.median) || mean;
  const min = parseFloat(data.min) || mean * 0.85;
  const max = parseFloat(data.max) || mean * 1.15;
  const count = parseInt(data.count) || 0;

  let mileageAdjustedPrice = median;
  if (params.mileage && data.mileage_mean) {
    const avgMileage = parseFloat(data.mileage_mean);
    const mileageDiff = params.mileage - avgMileage;
    const mileageAdjustment = mileageDiff * 0.05;
    mileageAdjustedPrice = Math.max(min, Math.min(max, median - mileageAdjustment));
  }

  return {
    fairRetailPrice: Math.round(median),
    priceRangeLow: Math.round(min),
    priceRangeHigh: Math.round(max),
    mileageAdjustedPrice: Math.round(mileageAdjustedPrice),
    sampleSize: count,
  };
}

/**
 * Combined function to get all vehicle data at once
 * Useful for the full appraisal workflow
 */
export async function getFullVehicleData(vin: string, state?: string, mileage?: number) {
  const decoded = await decodeVin(vin);
  
  const [comps, pricing] = await Promise.all([
    fetchRetailComps({
      year: decoded.year,
      make: decoded.make,
      model: decoded.model,
      trim: decoded.trim || undefined,
      state,
      mileage,
    }),
    fetchMarketPricing({
      year: decoded.year,
      make: decoded.make,
      model: decoded.model,
      trim: decoded.trim || undefined,
      mileage,
      vin,
    }),
  ]);

  return {
    decoded,
    comps,
    pricing,
  };
}
