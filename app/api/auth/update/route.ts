import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { fallbackFarmers, isSupabaseConnectionError } from "@/lib/db"

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

    // Try to find the farmer by id or email in Supabase
    let existingFarmer: any = null
    let isDbOffline = false

    try {
      if (data.id) {
        const { data: byId, error: errId } = await supabase
          .from("farmers_signups")
          .select("*")
          .eq("id", data.id)
          .maybeSingle()
        if (errId && isSupabaseConnectionError(errId)) isDbOffline = true
        else existingFarmer = byId
      }

      if (!existingFarmer && data.email && !isDbOffline) {
        const { data: byEmail, error: errEmail } = await supabase
          .from("farmers_signups")
          .select("*")
          .eq("email", data.email)
          .maybeSingle()
        if (errEmail && isSupabaseConnectionError(errEmail)) isDbOffline = true
        else existingFarmer = byEmail
      }
    } catch (err) {
      isDbOffline = true
    }

    let finalRow: any

    if (!isDbOffline && existingFarmer) {
      // UPDATE existing farmer in Supabase
      const { error: updateError } = await supabase
        .from("farmers_signups")
        .update(rowData)
        .eq("id", existingFarmer.id)

      if (updateError) {
        if (isSupabaseConnectionError(updateError)) {
          isDbOffline = true
        } else {
          console.error("Update error:", updateError.message)
          return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 })
        }
      } else {
        const { data: updated } = await supabase
          .from("farmers_signups")
          .select("*")
          .eq("id", existingFarmer.id)
          .maybeSingle()
        finalRow = updated || existingFarmer
      }
    }

    if (isDbOffline || !existingFarmer) {
      // Fallback: update or create in fallbackFarmers map
      const lookupEmail = data.email?.toLowerCase()
      let local = lookupEmail ? fallbackFarmers.get(lookupEmail) : null

      if (!local && data.id) {
        for (const f of fallbackFarmers.values()) {
          if (f.id === data.id) {
            local = f
            break
          }
        }
      }

      const updatedLocal = {
        id: local?.id || data.id || crypto.randomUUID(),
        name: data.name ?? local?.name ?? "Farmer",
        age: data.age !== undefined ? Number(data.age) : local?.age ?? 30,
        country: data.country ?? local?.country ?? "India",
        phone: data.phoneNumber ?? local?.phone,
        email: data.email ?? local?.email ?? "farmer@agribot.local",
        password: local?.password ?? "agribot_default",
        language: data.language ?? local?.language ?? "en",
        farming_type: data.farmingType ?? local?.farming_type ?? "single",
        crops: data.crops ?? local?.crops ?? [],
        state: data.farmLocation?.state ?? local?.state,
        district: data.farmLocation?.district ?? local?.district,
        soil_type: data.soilType ?? local?.soil_type,
        farm_area_acres: data.farmAreaAcres !== undefined ? Number(data.farmAreaAcres) : local?.farm_area_acres,
        irrigation_type: data.irrigationType ?? local?.irrigation_type,
        created_at: local?.created_at ?? new Date().toISOString(),
        enhanced_profile_complete: data.enhancedProfileComplete ?? local?.enhanced_profile_complete ?? true,
        ai_personalization_ready: data.aiPersonalizationReady ?? local?.ai_personalization_ready ?? true,
      }

      fallbackFarmers.set(updatedLocal.email.toLowerCase(), updatedLocal)
      finalRow = updatedLocal
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
      message: "Profile updated successfully" + (isDbOffline ? " (offline fallback)" : ""),
    })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

