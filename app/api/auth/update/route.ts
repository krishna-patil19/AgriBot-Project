import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.email) {
      return NextResponse.json({ error: "Email is required to identify user" }, { status: 400 })
    }

    // Build the update payload (only defined fields)
    const updatePayload: Record<string, unknown> = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.age !== undefined) updatePayload.age = Number(data.age)
    if (data.language !== undefined) updatePayload.language = data.language
    if (data.phoneNumber !== undefined) updatePayload.phone = data.phoneNumber
    if (data.country !== undefined) updatePayload.country = data.country
    if (data.farmingType !== undefined) updatePayload.farming_type = data.farmingType
    if (data.crops !== undefined) updatePayload.crops = data.crops
    if (data.farmLocation?.state !== undefined) updatePayload.state = data.farmLocation.state
    if (data.farmLocation?.district !== undefined) updatePayload.district = data.farmLocation.district
    if (data.soilType !== undefined) updatePayload.soil_type = data.soilType
    if (data.farmAreaAcres !== undefined) updatePayload.farm_area_acres = Number(data.farmAreaAcres)
    if (data.irrigationType !== undefined) updatePayload.irrigation_type = data.irrigationType
    if (data.enhancedProfileComplete !== undefined) updatePayload.enhanced_profile_complete = data.enhancedProfileComplete
    if (data.aiPersonalizationReady !== undefined) updatePayload.ai_personalization_ready = data.aiPersonalizationReady

    // Update in Supabase
    const { data: updatedRow, error } = await supabase
      .from("farmers")
      .update(updatePayload)
      .eq("email", data.email)
      .select("*")
      .single()

    if (error || !updatedRow) {
      console.error("Supabase update error:", error)
      return NextResponse.json({ error: "Failed to update farmer profile" }, { status: 500 })
    }

    // Build farmer response
    const farmerData = {
      id: updatedRow.id,
      name: updatedRow.name,
      age: updatedRow.age,
      country: updatedRow.country,
      phoneNumber: updatedRow.phone,
      email: updatedRow.email,
      language: updatedRow.language,
      farmingType: updatedRow.farming_type,
      crops: updatedRow.crops || [],
      farmLocation: updatedRow.state
        ? { state: updatedRow.state, district: updatedRow.district }
        : undefined,
      soilType: updatedRow.soil_type,
      farmAreaAcres: updatedRow.farm_area_acres,
      irrigationType: updatedRow.irrigation_type,
      createdAt: updatedRow.created_at,
      enhancedProfileComplete: updatedRow.enhanced_profile_complete,
      aiPersonalizationReady: updatedRow.ai_personalization_ready,
    }

    return NextResponse.json({
      success: true,
      farmer: farmerData,
      message: "Farmer profile updated successfully",
    })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
