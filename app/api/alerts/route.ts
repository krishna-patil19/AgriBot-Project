import { NextRequest, NextResponse } from "next/server"
import { ALERT_RULES, AlertData } from "@/lib/alert-rules"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { farmer, language = 'en' } = body

    if (!farmer) {
      return NextResponse.json({ error: "Farmer data required" }, { status: 400 })
    }

    const { state, district } = farmer.farmLocation || {}
    let weatherData = null
    let mandiData = []

    // 1. Fetch Weather
    try {
        const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ""
        const query = district ? `${district}, ${state}, India` : "Maharashtra, India"
        
        // Geocode
        const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OPENWEATHER_API_KEY}`)
        if (geoResponse.ok) {
            const geoResult = await geoResponse.json()
            if (geoResult?.length > 0) {
                const { lat, lon } = geoResult[0]
                const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`)
                if (weatherRes.ok) {
                    weatherData = await weatherRes.json()
                }
            }
        }
    } catch (e) {
        console.error("[Alerts] Weather fetch failed:", e)
    }

    // 2. Fetch Mandi Prices via the official API (if DATA_GOV_API_KEY exists)
    try {
        const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY || ""
        if (DATA_GOV_API_KEY && state) {
            let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_API_KEY}&format=json&filters[state]=${encodeURIComponent(state)}`
            if (district) {
                url += `&filters[district]=${encodeURIComponent(district)}`
            }
            url += `&limit=5`
            const mandiRes = await fetch(url)
            if (mandiRes.ok) {
                const mandiResult = await mandiRes.json()
                if (mandiResult?.records) {
                    mandiData = mandiResult.records
                }
            }
        }
    } catch (e) {
        console.error("[Alerts] Mandi fetch failed:", e)
    }

    // 3. Evaluate Rules
    const dataContext: AlertData = {
        farmer,
        weather: weatherData,
        mandiPrices: mandiData
    }

    const activeAlerts = ALERT_RULES.filter(rule => {
        try {
            return rule.check(dataContext)
        } catch (e) {
            return false
        }
    }).map(rule => ({
        id: rule.id,
        message: rule.message(dataContext, language),
        priority: rule.priority
    }))

    return NextResponse.json({ alerts: activeAlerts })

  } catch (error: any) {
    console.error("[Alerts] Error processing rules:", error)
    return NextResponse.json({ error: "Failed to process alerts" }, { status: 500 })
  }
}
