import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Look up farmer in Supabase
    // Use .maybeSingle() to avoid PGRST116 errors when email doesn't exist
    const { data: storedFarmer, error } = await supabase
      .from("farmers_signups")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      // Log the raw error server-side only — never expose Supabase internals to the client
      console.error("Login DB error:", error)
      return NextResponse.json(
        { error: "Unable to connect to the database. Please try again in a moment." },
        { status: 503 }
      )
    }

    if (!storedFarmer || storedFarmer.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Calculate IST time for DB display purposes (UTC + 5:30)
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset)

    // Log this login event → login_logs table
    await supabase.from("login_logs").insert({
      farmer_id: storedFarmer.id,
      name: storedFarmer.name,
      email: storedFarmer.email,
      state: storedFarmer.state || null,
      district: storedFarmer.district || null,
      logged_in_at: istTime.toISOString(),
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
