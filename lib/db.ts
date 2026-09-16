// lib/db.ts
// In-memory fallback database for local dev when Supabase is unreachable or paused.

export interface FallbackFarmer {
  id: string
  name: string
  age: number
  country: string
  phone?: string
  email: string
  password: string
  language: string
  farming_type: string
  crops: string[]
  state?: string
  district?: string
  soil_type?: string
  farm_area_acres?: number
  irrigation_type?: string
  created_at: string
  enhanced_profile_complete?: boolean
  ai_personalization_ready?: boolean
}

export const registeredEmails = new Set<string>()
export const farmerDatabase = new Map<string, never>()

// In-memory fallback store
export const fallbackFarmers = new Map<string, FallbackFarmer>()

// Pre-seed a default demo farmer for offline testing
const demoFarmer: FallbackFarmer = {
  id: "demo-farmer-001",
  name: "Kisan Demo",
  age: 35,
  country: "India",
  phone: "9876543210",
  email: "demo@agribot.com",
  password: "password123",
  language: "en",
  farming_type: "multiple",
  crops: ["Wheat", "Rice", "Cotton"],
  state: "Maharashtra",
  district: "Pune",
  soil_type: "Black Soil",
  farm_area_acres: 5,
  irrigation_type: "Drip Irrigation",
  created_at: new Date().toISOString(),
  enhanced_profile_complete: true,
  ai_personalization_ready: true,
}

fallbackFarmers.set(demoFarmer.email.toLowerCase(), demoFarmer)

export function isSupabaseConnectionError(error: any): boolean {
  if (!error) return false
  const errStr = typeof error === "string" ? error : JSON.stringify(error)
  return (
    errStr.includes("ENOTFOUND") ||
    errStr.includes("fetch failed") ||
    errStr.includes("521") ||
    errStr.includes("Web server is down") ||
    errStr.includes("Failed to fetch") ||
    errStr.includes("getaddrinfo")
  )
}

