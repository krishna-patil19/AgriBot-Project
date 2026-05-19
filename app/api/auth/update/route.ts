import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id && !data.email) {
      return NextResponse.json({ error: "No identifier provided" }, { status: 400 })
    }

    // Build the row data for insert/update
    const rowData: Record<string, unknown> = {}
    if (data.name !== undefined) rowData.name = data.name
    if (data.age !== undefined) rowData.age = Number(data.age)
    if (data.language !== undefined) rowData.language = data.language
    if (data.phoneNumber !== undefined) rowData.phone = data.phoneNumber
    if (data.country !== undefined) rowData.country = data.country
    if (data.farmingType !== undefined) rowData.farming_type = data.farmingType
    if (data.crops !== undefined) rowData.crops = data.crops
    if (data.farmLocation?.state !== undefined) rowData.state = data.farmLocation.state
    if (data.farmLocation?.district !== undefined) rowData.district = data.farmLocation.district
    if (data.soilType !== undefined) rowData.soil_type = data.soilType
    if (data.farmAreaAcres !== undefined) rowData.farm_area_acres = Number(data.farmAreaAcres)
    if (data.irrigationType !== undefined) rowData.irrigation_type = data.irrigationType
    if (data.enhancedProfileComplete !== undefined) rowData.enhanced_profile_complete = data.enhancedProfileComplete
    if (data.aiPersonalizationReady !== undefined) rowData.ai_personalization_ready = data.aiPersonalizationReady

    // Try to find the farmer by id or email
    let existingFarmer: any = null

    if (data.id) {
      const { data: byId } = await supabase
        .from("farmers_signups")
        .select("*")
        .eq("id", data.id)
        .maybeSingle()
      existingFarmer = byId
    }

    if (!existingFarmer && data.email) {
      const { data: byEmail } = await supabase
        .from("farmers_signups")
        .select("*")
        .eq("email", data.email)
        .maybeSingle()
      existingFarmer = byEmail
    }

    let finalRow: any

    if (existingFarmer) {
      // UPDATE existing farmer
      const { error: updateError } = await supabase
        .from("farmers_signups")
        .update(rowData)
        .eq("id", existingFarmer.id)

      if (updateError) {
        console.error("Update error:", updateError.message)
        return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 })
      }

      // Fetch updated row
      const { data: updated } = await supabase
        .from("farmers_signups")
        .select("*")
        .eq("id", existingFarmer.id)
        .maybeSingle()

      finalRow = updated || existingFarmer
    } else {
      // UPSERT: farmer exists in localStorage but not in DB — create them
      const newId = data.id || crypto.randomUUID()
      const insertData = {
        id: newId,
        email: data.email || `farmer_${newId.substring(0, 8)}@agribot.local`,
        password: "agribot_default",
        created_at: new Date().toISOString(),
        enhanced_profile_complete: true,
        ai_personalization_ready: true,
        ...rowData,
      }

      const { error: insertError } = await supabase
        .from("farmers_signups")
        .insert(insertData)

      if (insertError) {
        console.error("Insert error:", insertError.message)
        return NextResponse.json({ error: `Save failed: ${insertError.message}` }, { status: 500 })
      }

      const { data: inserted } = await supabase
        .from("farmers_signups")
        .select("*")
        .eq("id", newId)
        .maybeSingle()

      finalRow = inserted || { id: newId, ...insertData }
    }

    // Build response
    const farmerData = {
      id: finalRow.id,
      name: finalRow.name,
      age: finalRow.age,
      country: finalRow.country,
      phoneNumber: finalRow.phone,
      email: finalRow.email,
      language: finalRow.language,
      farmingType: finalRow.farming_type,
      crops: finalRow.crops || [],
      farmLocation: finalRow.state
        ? { state: finalRow.state, district: finalRow.district }
        : undefined,
      soilType: finalRow.soil_type,
      farmAreaAcres: finalRow.farm_area_acres,
      irrigationType: finalRow.irrigation_type,
      createdAt: finalRow.created_at,
      enhancedProfileComplete: finalRow.enhanced_profile_complete,
      aiPersonalizationReady: finalRow.ai_personalization_ready,
    }

    return NextResponse.json({
      success: true,
      farmer: farmerData,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
