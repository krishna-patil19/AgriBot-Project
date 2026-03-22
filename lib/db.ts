import type { FarmerData } from "@/contexts/auth-context"

export const registeredEmails = new Set<string>()
export const farmerDatabase = new Map<string, FarmerData & { password: string }>()

// Pre-populate with test user
const testUser = {
    id: "test-farmer-1",
    name: "DevCon Hacker",
    age: 30,
    country: "India",
    phoneNumber: "+91-9876543210",
    email: "devconhack@gmail.com",
    password: "test123",
    language: "en" as const,
    farmingType: "multiple" as const,
    crops: ["wheat", "tomato", "cotton"],
    farmLocation: {
        state: "Maharashtra",
        district: "Pune",
    },
    soilType: "loamy",
    farmAreaAcres: 5.0,
    irrigationType: "drip",
    createdAt: "2024-01-01T00:00:00.000Z",
}

if (!farmerDatabase.has(testUser.email)) {
    registeredEmails.add(testUser.email)
    farmerDatabase.set(testUser.email, testUser)
}
