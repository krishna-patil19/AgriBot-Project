"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Language } from "@/lib/translations"

export interface FarmerData {
  id: string
  name: string
  age: number
  country: string
  phoneNumber?: string
  email?: string
  language: Language
  farmingType: "single" | "multiple"
  crops: string[]
  farmLocation?: {
    state: string
    district: string
  }
  soilType?: string
  farmAreaAcres?: number
  irrigationType?: string
  createdAt: string
  enhancedProfileComplete?: boolean
  contractCreatorProfileId?: string
  aiPersonalizationReady?: boolean
}

interface AuthContextType {
  farmer: FarmerData | null
  language: Language
  setLanguage: (lang: Language) => void
  login: (email: string, password: string) => Promise<{success: boolean, error?: string}>
  signup: (data: Omit<FarmerData, "id" | "createdAt"> & { password: string }) => Promise<boolean>
  updateFarmer: (data: Partial<FarmerData>) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farmer, setFarmer] = useState<FarmerData | null>(null)
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Load saved language and farmer data from localStorage
    const savedLanguage = localStorage.getItem("farmer-language") as Language
    const savedFarmer = localStorage.getItem("farmer-data")

    if (savedLanguage) {
      setLanguage(savedLanguage)
    }

    if (savedFarmer) {
      setFarmer(JSON.parse(savedFarmer))
    }
  }, [])

  const login = async (email: string, password: string): Promise<{success: boolean, error?: string}> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || "Server error" }
      }

      const data = await response.json()

      if (data.success && data.farmer) {
        setFarmer(data.farmer)
        localStorage.setItem("farmer-data", JSON.stringify(data.farmer))
        setLanguage(data.farmer.language)
        return { success: true }
      }

      return { success: false, error: data.message || "Invalid response" }
    } catch (error: any) {
      console.error("Login error:", error)
      return { success: false, error: error.message || "Network error" }
    }
  }

  const signup = async (data: Omit<FarmerData, "id" | "createdAt"> & { password: string }): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        return false
      }

      const result = await response.json()

      if (result.success && result.farmer) {
        const farmerWithEnhancedFlag = {
          ...result.farmer,
          enhancedProfileComplete: false,
          aiPersonalizationReady: false,
        }

        setFarmer(farmerWithEnhancedFlag)
        localStorage.setItem("farmer-data", JSON.stringify(farmerWithEnhancedFlag))
        setLanguage(data.language)
        return true
      }

      return false
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const updateFarmer = async (data: Partial<FarmerData>): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: farmer?.email, ...data }),
      })

      if (!response.ok) {
        return false
      }

      const result = await response.json()

      if (result.success && result.farmer) {
        setFarmer(result.farmer)
        localStorage.setItem("farmer-data", JSON.stringify(result.farmer))
        return true
      }

      return false
    } catch (error) {
      console.error("Update error:", error)
      return false
    }
  }

  const logout = () => {
    setFarmer(null)
    localStorage.removeItem("farmer-data")
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("farmer-language", lang)
  }

  return (
    <AuthContext.Provider
      value={{
        farmer,
        language,
        setLanguage: handleSetLanguage,
        login,
        signup,
        updateFarmer,
        logout,
        isAuthenticated: !!farmer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
