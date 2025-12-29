/**
 * Vehicle Lookup Service
 * 
 * Provides Make and Model lookups using MarketCheck API with 24-hour caching.
 */

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const BASE_URL = "https://api.marketcheck.com/v2";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const makesCache = new Map<number, CacheEntry<string[]>>();
const modelsCache = new Map<string, CacheEntry<string[]>>();
const trimsCache = new Map<string, CacheEntry<string[]>>();

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
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MarketCheck API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function getVehicleMakes(year: number): Promise<string[]> {
  const cached = makesCache.get(year);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const response = await apiRequest<any>("/search/car/active/facets", {
      year,
      facets: "make",
      rows: 0,
    });

    const makeFacets = response?.facets?.make || [];
    const makes: string[] = makeFacets
      .map((f: any) => f.item as string)
      .filter((m: string) => m && m.length > 0)
      .sort();

    makesCache.set(year, {
      data: makes,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return makes;
  } catch (error) {
    console.error("[VehicleLookup] Error fetching makes:", error);
    throw error;
  }
}

export async function getVehicleModels(year: number, make: string): Promise<string[]> {
  const cacheKey = `${year}-${make.toLowerCase()}`;
  const cached = modelsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const response = await apiRequest<any>("/search/car/active/facets", {
      year,
      make,
      facets: "model",
      rows: 0,
    });

    const modelFacets = response?.facets?.model || [];
    const models: string[] = modelFacets
      .map((f: any) => f.item as string)
      .filter((m: string) => m && m.length > 0)
      .sort();

    modelsCache.set(cacheKey, {
      data: models,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return models;
  } catch (error) {
    console.error("[VehicleLookup] Error fetching models:", error);
    throw error;
  }
}

export async function getVehicleTrims(year: number, make: string, model: string): Promise<string[]> {
  const cacheKey = `${year}-${make.toLowerCase()}-${model.toLowerCase()}-trims`;
  const cached = trimsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const response = await apiRequest<any>("/search/car/active/facets", {
      year,
      make,
      model,
      facets: "trim",
      rows: 0,
    });

    const trimFacets = response?.facets?.trim || [];
    const trims: string[] = trimFacets
      .map((f: any) => f.item as string)
      .filter((t: string) => t && t.length > 0)
      .sort();

    trimsCache.set(cacheKey, {
      data: trims,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return trims;
  } catch (error) {
    console.error("[VehicleLookup] Error fetching trims:", error);
    return [];
  }
}
