import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ""

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const location = searchParams.get("location")

    let finalLat = lat
    let finalLon = lon

    if (!finalLat || !finalLon) {
      if (!location) {
        return NextResponse.json({ error: "Location or coordinates are required" }, { status: 400 })
      }

      // Hierarchical geocoding attempts
      const geocodeQueries = [
        location, // Full query: "District, State, India"
        location.split(",")[0].trim(), // Just District: "District"
        "Maharashtra, India" // Absolute fallback
      ]

      let geoData = []
      for (const query of geocodeQueries) {
        console.log(`[Weather] Attempting geocode for: ${query}`)
        try {
          const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OPENWEATHER_API_KEY}`,
          )

          if (geoResponse.ok) {
            const results = await geoResponse.json()
            if (results && Array.isArray(results) && results.length > 0) {
              geoData = results
              console.log(`[Weather] Successfully geocoded ${query} to:`, results[0].lat, results[0].lon)
              break
            }
          }
        } catch (e) {
          console.error(`[Weather] Geocode attempt failed for ${query}:`, e)
        }
      }

      if (geoData.length === 0) {
        return NextResponse.json({
          error: `Location '${location}' could not be resolved.`,
          details: "Please ensure your farm location is correct in your profile."
        }, { status: 404 })
      }

      finalLat = geoData[0].lat.toString()
      finalLon = geoData[0].lon.toString()
    }

    // Fetch current weather
    const currentWeatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${finalLat}&lon=${finalLon}&units=metric&appid=${OPENWEATHER_API_KEY}`,
    )

    // Fetch 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${finalLat}&lon=${finalLon}&units=metric&appid=${OPENWEATHER_API_KEY}`,
    )

    if (!currentWeatherResponse.ok || !forecastResponse.ok) {
      console.error("API Response Status:", currentWeatherResponse.status, forecastResponse.status)
      throw new Error("Failed to fetch weather data from OpenWeatherMap")
    }

    const currentWeatherData = await currentWeatherResponse.json()
    const forecastData = await forecastResponse.json()

    const dailyForecasts = []
    const processedDates = new Set()

    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000).toDateString()
      if (!processedDates.has(date) && dailyForecasts.length < 5) {
        processedDates.add(date)
        dailyForecasts.push({
          date: new Date(item.dt * 1000).toLocaleDateString("en-IN"),
          temp: {
            day: Math.round(item.main.temp),
            night: Math.round(item.main.temp_min),
            min: Math.round(item.main.temp_min),
            max: Math.round(item.main.temp_max),
          },
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          pop: Math.round((item.pop || 0) * 100),
        })
      }
    }

    // Format the response
    const formattedData = {
      location: location || currentWeatherData.name || `${finalLat}, ${finalLon}`,
      current: {
        temp: Math.round(currentWeatherData.main.temp),
        description: currentWeatherData.weather[0].description,
        icon: currentWeatherData.weather[0].icon,
        humidity: currentWeatherData.main.humidity,
        windSpeed: currentWeatherData.wind.speed,
        feelsLike: Math.round(currentWeatherData.main.feels_like),
        pressure: currentWeatherData.main.pressure,
        visibility: currentWeatherData.visibility,
      },
      daily: dailyForecasts,
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
