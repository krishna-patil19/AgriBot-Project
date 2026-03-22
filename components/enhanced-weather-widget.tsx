"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getTranslation } from "@/lib/translations"
import type { Language } from "@/lib/translations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
  MapPin,
  Droplets,
  Wind,
  RefreshCw,
  AlertTriangle,
  Eye,
  Gauge,
  Brain,
} from "lucide-react"

interface WeatherData {
  location: string
  current: {
    temp: number
    description: string
    icon: string
    humidity: number
    windSpeed: number
    feelsLike: number
    pressure?: number
    visibility?: number
    uvIndex?: number
  }
  daily: Array<{
    date: string
    temp: {
      day: number
      night: number
      min: number
      max: number
    }
    description: string
    icon: string
    humidity: number
    windSpeed: number
    pop: number
  }>
}

const getWeatherIcon = (iconCode: string) => {
  const iconMap: { [key: string]: any } = {
    "01d": Sun, "01n": Sun,
    "02d": Cloud, "02n": Cloud,
    "03d": Cloud, "03n": Cloud,
    "04d": Cloud, "04n": Cloud,
    "09d": CloudRain, "09n": CloudRain,
    "10d": CloudRain, "10n": CloudRain,
    "11d": CloudRain, "11n": CloudRain,
    "13d": CloudSnow, "13n": CloudSnow,
    "50d": Cloud, "50n": Cloud,
  }
  return iconMap[iconCode] || Cloud
}

const getWeatherAdvice = (weather: WeatherData) => {
  const temp = weather.current.temp
  const description = weather.current.description.toLowerCase()
  const humidity = weather.current.humidity

  if (description.includes("rain")) {
    return {
      type: "warning",
      messageKey: "adviceRain" as const,
      color: "from-blue-500 to-cyan-500",
    }
  } else if (temp > 35) {
    return {
      type: "alert",
      messageKey: "adviceHighTemp" as const,
      color: "from-red-500 to-orange-500",
    }
  } else if (humidity > 80) {
    return {
      type: "warning",
      messageKey: "adviceHighHumidity" as const,
      color: "from-teal-500 to-green-500",
    }
  } else {
    return {
      type: "success",
      messageKey: "adviceGoodConditions" as const,
      color: "from-green-500 to-emerald-500",
    }
  }
}

export function EnhancedWeatherWidget() {
  const { farmer, language } = useAuth()
  const t = (key: any) => getTranslation(language as Language, key)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // FIX: Always derive location from the user's specific signup data
  const profileLocation = farmer?.farmLocation?.district
    ? `${farmer.farmLocation.district}, ${farmer.farmLocation.state || "Maharashtra"}, India`
    : "Maharashtra, India"

  const fetchWeatherData = useCallback(async (locationName: string, lat?: number, lon?: number) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ location: locationName })
      if (lat !== undefined && lon !== undefined) {
        params.append("lat", lat.toString())
        params.append("lon", lon.toString())
      }

      const response = await fetch(`/api/weather?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch weather data")
      }

      setWeatherData(data)
    } catch (err: any) {
      setError(err.message || "Unable to sync with local weather station")
      console.error("Weather fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (!navigator.geolocation) {
      fetchWeatherData(profileLocation)
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        // Fetch weather immediately using GPS coords
        await fetchWeatherData(profileLocation, latitude, longitude)
      },
      (geoError) => {
        console.warn("GPS Access Denied. Using profile location:", profileLocation)
        fetchWeatherData(profileLocation)
      },
      { timeout: 8000 }
    )
  }, [profileLocation, fetchWeatherData])

  useEffect(() => {
    if (farmer) {
      handleRefresh()
    }
  }, [farmer, handleRefresh])

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <span className="text-xl text-green-700">{t("analyzingWeather")} {profileLocation}...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !weatherData) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="border-red-200 bg-red-50 shadow-xl">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 text-lg mb-4">{error}</p>
            <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
              {t("retryWeather")} {profileLocation}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const WeatherIcon = getWeatherIcon(weatherData.current.icon)
  const advice = getWeatherAdvice(weatherData)

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <CloudRain className="h-8 w-8" />
            {t("weatherTitle")}
          </CardTitle>
          <div className="flex items-center gap-2 text-green-100">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">{weatherData.location}</span>
            <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
              {t("live")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Current Temp */}
            <Card className="bg-white border-green-200 shadow-lg">
              <CardContent className="p-6 text-center">
                <WeatherIcon className="h-20 w-20 text-green-600 mx-auto mb-4" />
                <div className="text-5xl font-bold text-green-800 mb-2">{weatherData.current.temp}°C</div>
                <div className="text-lg text-green-600 capitalize font-medium">{weatherData.current.description}</div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card className="bg-white border-blue-200 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-500" /> {t("humidity")}</span>
                  <span className="font-bold">{weatherData.current.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><Wind className="w-5 h-5 text-gray-500" /> {t("wind")}</span>
                  <span className="font-bold">{weatherData.current.windSpeed} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><Gauge className="w-5 h-5 text-purple-500" /> {t("pressure")}</span>
                  <span className="font-bold">{weatherData.current.pressure} hPa</span>
                </div>
              </CardContent>
            </Card>

            {/* Smart Advice */}
            <Card className={`bg-gradient-to-br ${advice.color} text-white shadow-lg`}>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5" /> {t("agribotAdvice")}
                </h3>
                <p className="text-white/90 leading-relaxed">{t(advice.messageKey as any)}</p>
              </CardContent>
            </Card>
          </div>

          {/* 7-Day Mini Forecast */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            {weatherData.daily.slice(0, 7).map((day, i) => {
              const DayIcon = getWeatherIcon(day.icon)
              return (
                <div key={i} className="bg-white p-3 rounded-xl border border-green-100 text-center shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">
                    {i === 0 ? t("today") : new Date(Date.now() + i * 86400000).toLocaleDateString(language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN", { weekday: "short" })}
                  </div>
                  <DayIcon className="w-6 h-6 mx-auto my-2 text-green-600" />
                  <div className="text-sm font-bold">{day.temp.max}°</div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center">
            <Button onClick={handleRefresh} size="lg" className="bg-green-600 hover:bg-green-700">
              <RefreshCw className="mr-2 h-4 w-4" /> {t("syncWeather")} {profileLocation}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}