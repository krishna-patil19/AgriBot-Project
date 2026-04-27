import { type NextRequest, NextResponse } from "next/server"
import type { FarmerData } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.name || !data.age || !data.language || !data.email || !data.password) {
      return NextResponse.json(
        { error: "Missing required fields: name, age, language, email, and password are required" },
        { status: 400 },
      )
    }

    // Check if email already exists in Supabase
    const { data: existing } = await supabase
      .from("farmers")
      .select("email")
      .eq("email", data.email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists. Please use a different email or sign in." },
        { status: 409 },
      )
    }

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
      createdAt: new Date().toISOString(),
    }

    // Insert into Supabase farmers table
    const { error: insertError } = await supabase.from("farmers").insert({
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
    })

    if (insertError) {
      console.error("Supabase insert error:", insertError)
      return NextResponse.json({ error: "Failed to register farmer" }, { status: 500 })
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
