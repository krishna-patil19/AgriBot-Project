import { type NextRequest, NextResponse } from "next/server"
import type { FarmerData } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { fallbackFarmers, isSupabaseConnectionError } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.name || !data.age || !data.language || !data.email || !data.password) {
      return NextResponse.json(
        { error: "Missing required fields: name, age, language, email, and password are required" },
        { status: 400 },
      )
    }

    const emailLower = data.email.toLowerCase()
    let isDbOffline = false

    try {
      // Check if email already exists in Supabase
      const { data: existing, error: checkError } = await supabase
        .from("farmers_signups")
        .select("email")
        .eq("email", data.email)
        .maybeSingle()

      if (checkError) {
        if (isSupabaseConnectionError(checkError)) {
          console.warn("[Supabase Warning] Database unreachable on signup check. Using local fallback.")
          isDbOffline = true
        } else {
          console.error("Email check error:", checkError)
          return NextResponse.json({ error: "Failed to verify email. Please try again." }, { status: 500 })
        }
      } else if (existing) {
        return NextResponse.json(
          { error: "Email already exists. Please use a different email or sign in." },
          { status: 409 },
        )
      }
    } catch (err) {
      console.warn("[Supabase Warning] Database fetch exception during signup. Using local fallback.")
      isDbOffline = true
    }

    if (fallbackFarmers.has(emailLower)) {
      return NextResponse.json(
        { error: "Email already exists. Please use a different email or sign in." },
        { status: 409 },
      )
    }

    // Calculate IST time for DB display purposes (UTC + 5:30)
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset)

    // Build new farmer record
    const newFarmer: FarmerData = {
      id: crypto.randomUUID(),
      name: data.name,
      age: Number.parseInt(data.age),
      country: data.country || "India",
      phoneNumber: data.phoneNumber,
      email: data.email,
      language: data.language,
      farmingType: data.farmingType || "single",
      crops: data.crops || [],
      farmLocation: data.farmLocation,
      soilType: data.soilType,
      farmAreaAcres: data.farmAreaAcres ? Number.parseFloat(data.farmAreaAcres) : undefined,
      irrigationType: data.irrigationType,
      createdAt: istTime.toISOString(),
    }

    // Always keep fallback in-memory store updated
    fallbackFarmers.set(emailLower, {
      id: newFarmer.id,
      name: newFarmer.name,
      age: newFarmer.age,
      country: newFarmer.country,
      phone: newFarmer.phoneNumber,
      email: data.email,
      password: data.password,
      language: newFarmer.language,
      farming_type: newFarmer.farmingType,
      crops: newFarmer.crops,
      state: data.farmLocation?.state,
      district: data.farmLocation?.district,
      soil_type: newFarmer.soilType,
      farm_area_acres: newFarmer.farmAreaAcres,
      irrigation_type: newFarmer.irrigationType,
      created_at: newFarmer.createdAt,
      enhanced_profile_complete: true,
      ai_personalization_ready: true,
    })

    if (!isDbOffline) {
      // Insert into Supabase farmers table
      const { error: insertError } = await supabase.from("farmers_signups").insert({
        id: newFarmer.id,
        name: newFarmer.name,
        age: newFarmer.age,
        country: newFarmer.country,
        phone: newFarmer.phoneNumber,
        email: newFarmer.email,
        password: data.password,
        language: newFarmer.language,
        farming_type: newFarmer.farmingType,
        crops: newFarmer.crops,
        state: data.farmLocation?.state || null,
        district: data.farmLocation?.district || null,
        soil_type: newFarmer.soilType || null,
        farm_area_acres: newFarmer.farmAreaAcres || null,
        irrigation_type: newFarmer.irrigationType || null,
        created_at: newFarmer.createdAt,
        enhanced_profile_complete: true,
        ai_personalization_ready: true,
      })

      if (insertError) {
        if (isSupabaseConnectionError(insertError)) {
          console.warn("[Supabase Warning] Insert failed due to connection error. Saved to local store.")
        } else {
          console.error("Supabase insert error:", insertError)
          return NextResponse.json({ error: "Failed to register farmer" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      farmer: newFarmer,
      message: "Farmer registered successfully",
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

