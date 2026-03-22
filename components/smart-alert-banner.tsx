"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AlertCircle, Thermometer, CloudRain, TrendingUp, Snowflake, X } from "lucide-react"

interface Alert {
  id: string
  message: string
  priority: "high" | "medium" | "low"
}

export function SmartAlertBanner() {
  const { farmer, language } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isVisible, setIsVisible] = useState(true)

  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!farmer) return

    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farmer, language: language || 'en' }),
        })
        const data = await response.json()
        if (data.alerts?.length > 0) {
          setAlerts(data.alerts)
          setIsVisible(true)
        }
      } catch (e) {
        console.error("Failed to fetch smart alerts:", e)
      }
    }

    fetchAlerts()
    
    // Poll every 30 minutes
    const interval = setInterval(fetchAlerts, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [farmer, language])

  if (!isVisible || alerts.length === 0) return null

  // Show the highest priority alert first
  const sortedAlerts = [...alerts].sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1
      if (b.priority === "high" && a.priority !== "high") return 1
      return 0
  })
  const alert = sortedAlerts[0]

  const getIcon = (id: string) => {
    if (id === "high-temp") return <Thermometer className="h-4 w-4" />
    if (id === "heavy-rain") return <CloudRain className="h-4 w-4" />
    if (id.includes("price")) return <TrendingUp className="h-4 w-4" />
    if (id === "cold-snap-warning") return <Snowflake className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const getBgColor = (priority: string) => {
    if (priority === "high") return "bg-red-50 text-red-700 border-red-200"
    if (priority === "medium") return "bg-yellow-50 text-yellow-800 border-yellow-200"
    return "bg-blue-50 text-blue-700 border-blue-200"
  }

  const tCritical = language === 'hi' ? 'महत्वपूर्ण चेतावनी' : language === 'mr' ? 'महत्त्वाची सूचना' : 'CRITICAL ALERT'
  const tSmart = language === 'hi' ? 'स्मार्ट सुझाव' : language === 'mr' ? 'स्मार्ट अलर्ट' : 'SMART ALERT'
  const tShowMore = (n: number) => language === 'hi' ? `${n} और अलर्ट देखें` : language === 'mr' ? `आणखी ${n} अलर्ट पहा` : `Show ${n} more alert${n > 1 ? 's' : ''}`
  const tAllActive = (n: number) => language === 'hi' ? `सभी सक्रिय अलर्ट (${n})` : language === 'mr' ? `सर्व सक्रिय अलर्ट (${n})` : `All Active Alerts (${n})`
  const tShowLess = language === 'hi' ? 'कम देखें' : language === 'mr' ? 'कमी पहा' : 'Show Less'

  return (
    <div className={`w-full border-b shadow-sm animate-in slide-in-from-top ${getBgColor(alert.priority)}`}>
      <div className="px-4 py-3 flex items-start justify-between container mx-auto">
        
        <div className="flex items-start gap-3 w-full">
          <div className="flex-shrink-0 bg-white/50 p-1.5 rounded-full mt-0.5">
              {getIcon(alert.id)}
          </div>
          
          <div className="flex flex-col w-full">
              {!isExpanded ? (
                  <div 
                    className={`flex items-start md:items-center flex-col md:flex-row gap-1.5 md:gap-3 ${alerts.length > 1 ? 'cursor-pointer' : ''}`} 
                    onClick={() => alerts.length > 1 && setIsExpanded(true)}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full ${alert.priority === 'high' ? 'bg-red-200/60 text-red-800' : 'bg-yellow-200/60 text-yellow-800'}`}>
                            {alert.priority === "high" ? tCritical : tSmart}
                        </span>
                        <span className="hidden md:inline text-black/20 font-bold">•</span>
                    </div>
                    
                    <p className="text-sm font-medium leading-snug">
                        {alert.message}
                    </p>
                    
                    {alerts.length > 1 && (
                        <button className="text-[11px] font-bold underline opacity-80 hover:opacity-100 whitespace-nowrap mt-0.5 md:mt-0 shrink-0">
                            {tShowMore(alerts.length - 1)}
                        </button>
                    )}
                  </div>
              ) : (
                  <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-1">
                          <span className="font-bold uppercase text-xs tracking-wider opacity-80">{tAllActive(alerts.length)}</span>
                          <button onClick={() => setIsExpanded(false)} className="text-xs font-bold underline opacity-80 hover:opacity-100 mr-2">
                              {tShowLess}
                          </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {sortedAlerts.map((a, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <div className="mt-0.5 opacity-80 shrink-0">
                                    {getIcon(a.id)}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`w-fit font-bold uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded-sm mb-0.5 leading-none ${a.priority === 'high' ? 'bg-red-200/60 text-red-800' : 'bg-yellow-200/60 text-yellow-800'}`}>
                                        {a.priority === "high" ? tCritical : tSmart}
                                    </span>
                                    <p className="text-sm font-medium leading-tight">{a.message}</p>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>
              )}
          </div>
        </div>

        <button 
            onClick={(e) => { e.stopPropagation(); setIsVisible(false) }} 
            className="ml-4 flex-shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors self-start"
            title="Dismiss alerts"
        >
          <X className="h-4 w-4 opacity-70" />
        </button>
      </div>
    </div>
  )
}
