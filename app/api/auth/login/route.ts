import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Look up farmer in Supabase
    const { data: storedFarmer, error } = await supabase
      .from("farmers")
      .select("*")
      .eq("email", email)
      .single()

    if (error || !storedFarmer || storedFarmer.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Log this login event → login_logs table
    await supabase.from("login_logs").insert({
      farmer_id: storedFarmer.id,
      name: storedFarmer.name,
      email: storedFarmer.email,
      state: storedFarmer.state || null,
      district: storedFarmer.district || null,
      logged_in_at: new Date().toISOString(),
    })

    // Build response (exclude password)
    const farmerData = {
      id: storedFarmer.id,
      name: storedFarmer.name,
      age: storedFarmer.age,
      country: storedFarmer.country,
      phoneNumber: storedFarmer.phone,
      email: storedFarmer.email,
      language: storedFarmer.language,
      farmingType: storedFarmer.farming_type,
      crops: storedFarmer.crops || [],
      farmLocation: storedFarmer.state
        ? { state: storedFarmer.state, district: storedFarmer.district }
        : undefined,
      soilType: storedFarmer.soil_type,
      farmAreaAcres: storedFarmer.farm_area_acres,
      irrigationType: storedFarmer.irrigation_type,
      createdAt: storedFarmer.created_at,
    }

    return NextResponse.json({
      success: true,
      farmer: farmerData,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
