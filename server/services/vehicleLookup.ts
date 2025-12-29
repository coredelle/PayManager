/**
 * Vehicle Lookup Service
 * 
 * Provides Make and Model lookups using NHTSA vPIC API (authoritative source)
 * Provides Trim lookups using MarketCheck API
 * Provides VIN decoding using NHTSA vPIC API
 * All endpoints use 24-hour in-memory caching.
 */

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const MARKETCHECK_BASE_URL = "https://api.marketcheck.com/v2";
const NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export interface DecodedVehicle {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
}

const makesCache = new Map<number, CacheEntry<string[]>>();
const modelsCache = new Map<string, CacheEntry<string[]>>();
const trimsCache = new Map<string, CacheEntry<string[]>>();
const vinCache = new Map<string, CacheEntry<DecodedVehicle>>();

const CANONICAL_MAKES: Record<string, string> = {
  "rivian": "Rivian",
  "lucid": "Lucid",
  "polestar": "Polestar",
  "vinfast": "VinFast",
  "fisker": "Fisker",
  "bmw": "BMW",
  "gmc": "GMC",
  "ram": "RAM",
  "mini": "MINI",
};

function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(/[\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

function normalizeString(str: string): string {
  if (!str) return str;
  const normalized = toTitleCase(str.replace(/\s+/g, ' ').trim());
  const lowerKey = normalized.toLowerCase();
  return CANONICAL_MAKES[lowerKey] || normalized;
}

async function marketCheckRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  if (!MARKETCHECK_API_KEY) {
    throw new Error("MARKETCHECK_API_KEY is not configured");
  }

  const url = new URL(`${MARKETCHECK_BASE_URL}${endpoint}`);
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

async function nhtsaRequest<T>(endpoint: string): Promise<T> {
  const url = `${NHTSA_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NHTSA API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function fetchNhtsaMakes(year: number): Promise<Set<string>> {
  const makesSet = new Set<string>();
  try {
    const response = await nhtsaRequest<any>(
      `/GetMakesForVehicleType/car?format=json&modelyear=${year}`
    );
    const results = response?.Results || [];
    for (const r of results) {
      const make = normalizeString(r.MakeName || r.Make_Name || "");
      if (make && make.length > 0) {
        makesSet.add(make);
      }
    }
  } catch (error) {
    console.error("[VehicleLookup] Error fetching makes from NHTSA:", error);
  }
  return makesSet;
}

async function fetchMarketCheckMakes(year: number): Promise<Set<string>> {
  const makesSet = new Set<string>();
  try {
    const response = await marketCheckRequest<any>("/search/car/active/facets", {
      year,
      facets: "make",
      rows: 0,
    });
    const makeFacets = response?.facets?.make || [];
    for (const f of makeFacets) {
      const make = normalizeString(f.item || "");
      if (make && make.length > 0) {
        makesSet.add(make);
      }
    }
  } catch (error) {
    console.error("[VehicleLookup] Error fetching makes from MarketCheck:", error);
  }
  return makesSet;
}

export async function getVehicleMakes(year: number): Promise<string[]> {
  const cached = makesCache.get(year);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const [nhtsaMakes, marketCheckMakes] = await Promise.all([
    fetchNhtsaMakes(year),
    fetchMarketCheckMakes(year),
  ]);

  const mergedSet = new Set<string>();
  nhtsaMakes.forEach(m => mergedSet.add(m));
  marketCheckMakes.forEach(m => mergedSet.add(m));
  const makes: string[] = Array.from(mergedSet).sort();

  makesCache.set(year, {
    data: makes,
    expiry: Date.now() + CACHE_TTL_MS,
  });

  return makes;
}

async function fetchNhtsaModels(year: number, make: string): Promise<Set<string>> {
  const modelsSet = new Set<string>();
  try {
    const encodedMake = encodeURIComponent(make);
    const response = await nhtsaRequest<any>(
      `/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
    );
    const results = response?.Results || [];
    for (const r of results) {
      const model = normalizeString(r.Model_Name || "");
      if (model && model.length > 0) {
        modelsSet.add(model);
      }
    }
  } catch (error) {
    console.error("[VehicleLookup] Error fetching models from NHTSA:", error);
  }
  return modelsSet;
}

async function fetchMarketCheckModels(year: number, make: string): Promise<Set<string>> {
  const modelsSet = new Set<string>();
  try {
    const response = await marketCheckRequest<any>("/search/car/active/facets", {
      year,
      make,
      facets: "model",
      rows: 0,
    });
    const modelFacets = response?.facets?.model || [];
    for (const f of modelFacets) {
      const model = normalizeString(f.item || "");
      if (model && model.length > 0) {
        modelsSet.add(model);
      }
    }
  } catch (error) {
    console.error("[VehicleLookup] Error fetching models from MarketCheck:", error);
  }
  return modelsSet;
}

export async function getVehicleModels(year: number, make: string): Promise<string[]> {
  const cacheKey = `${year}-${make.toLowerCase()}`;
  const cached = modelsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const [nhtsaModels, marketCheckModels] = await Promise.all([
    fetchNhtsaModels(year, make),
    fetchMarketCheckModels(year, make),
  ]);

  const mergedSet = new Set<string>();
  nhtsaModels.forEach(m => mergedSet.add(m));
  marketCheckModels.forEach(m => mergedSet.add(m));
  const models: string[] = Array.from(mergedSet).sort();

  modelsCache.set(cacheKey, {
    data: models,
    expiry: Date.now() + CACHE_TTL_MS,
  });

  return models;
}

export async function getVehicleTrims(year: number, make: string, model: string): Promise<string[]> {
  const cacheKey = `${year}-${make.toLowerCase()}-${model.toLowerCase()}-trims`;
  const cached = trimsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const response = await marketCheckRequest<any>("/search/car/active/facets", {
      year,
      make,
      model,
      facets: "trim",
      rows: 0,
    });

    const trimFacets = response?.facets?.trim || [];
    const trimsSet = new Set<string>();
    for (const f of trimFacets) {
      const trim = normalizeString(f.item || "");
      if (trim && trim.length > 0) {
        trimsSet.add(trim);
      }
    }
    const trims: string[] = Array.from(trimsSet).sort();

    trimsCache.set(cacheKey, {
      data: trims,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return trims;
  } catch (error) {
    console.error("[VehicleLookup] Error fetching trims from MarketCheck:", error);
    return [];
  }
}

export async function decodeVin(vin: string): Promise<DecodedVehicle> {
  const normalizedVin = vin.toUpperCase().trim();
  
  if (normalizedVin.length !== 17) {
    throw new Error("VIN must be exactly 17 characters");
  }

  const cached = vinCache.get(normalizedVin);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const response = await nhtsaRequest<any>(
      `/DecodeVinValuesExtended/${normalizedVin}?format=json`
    );

    const result = response?.Results?.[0];
    if (!result) {
      throw new Error("No results returned from VIN decode");
    }

    const decoded: DecodedVehicle = {};

    if (result.ModelYear) {
      const year = parseInt(result.ModelYear, 10);
      if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1) {
        decoded.year = year;
      }
    }

    if (result.Make && result.Make.trim()) {
      decoded.make = normalizeString(result.Make);
    }

    if (result.Model && result.Model.trim()) {
      decoded.model = normalizeString(result.Model);
    }

    if (result.Trim && result.Trim.trim()) {
      decoded.trim = normalizeString(result.Trim);
    }

    const hasData = decoded.year || decoded.make || decoded.model || decoded.trim;
    if (hasData) {
      vinCache.set(normalizedVin, {
        data: decoded,
        expiry: Date.now() + CACHE_TTL_MS,
      });
    }

    return decoded;
  } catch (error) {
    console.error("[VehicleLookup] Error decoding VIN:", error);
    throw error;
  }
}
