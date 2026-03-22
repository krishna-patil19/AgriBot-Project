"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { LucideIcon } from "lucide-react"
import { getTranslation } from "@/lib/translations"

export interface AIAgent {
  id: string
  name: string
  description: string
  icon: LucideIcon
  success: number
  specialtyKey: string
  metrics: string[]
  color: string
}

interface AIAgentCardProps {
  agent: AIAgent
  onActivate: () => void
  language: string
  onSeedSageActivate?: () => void
}

export function AIAgentCard({ agent, onActivate, language, onSeedSageActivate }: AIAgentCardProps) {
  const [isActive, setIsActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [response, setResponse] = useState("")
  const t = (key: any) => getTranslation(language as any, key)

  const handleActivate = async () => {
    setIsActive(true)
    setIsProcessing(true)
    onActivate()

    if (agent.id === "seed-sage" && onSeedSageActivate) {
      console.log("[v0] Seed Sage agent activated - triggering redirect to seeds tab")
      setTimeout(() => {
        onSeedSageActivate()
        // Dispatch custom event for seeds hub to listen to
        window.dispatchEvent(new CustomEvent("seedSageActivated"))
      }, 1000)
    }

    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      setResponse(getAgentResponse(agent.id, language))
    }, 2000)
  }

  const getAgentResponse = (agentId: string, lang: string) => {
    const responses = {
      "agri-detect": {
        en: "Analyzing your crop image. Recommending targeted treatment for optimal pest control with 96% effectiveness.",
        hi: "आपकी फसल की छवि का विश्लेषण कर रहे हैं। 96% प्रभावशीलता के साथ कीट नियंत्रण के लिए लक्षित उपचार की सिफारिश कर रहे हैं।",
        mr: "तुमच्या पिकाच्या प्रतिमेचे विश्लेषण करत आहे. 96% प्रभावीतेसह कीटक नियंत्रणासाठी लक्ष्यित उपचारांची शिफारस करत आहे.",
      },
      "seed-sage": {
        en: "🧬 Seed Sage activated! Analyzing your soil genetics and farm profile for premium variety recommendations.",
        hi: "🧬 सीड सेज सक्रिय! प्रीमियम किस्म की सिफारिशों के लिए आपकी मिट्टी और फार्म प्रोफाइल का विश्लेषण कर रहा है।",
        mr: "🧬 सीड सेज सक्रिय! प्रीमियम वाणांच्या शिफारसींसाठी तुमच्या मातीचे आणि फार्म प्रोफाइलचे विश्लेषण करत आहे.",
      },
      "market-oracle": {
        en: "Real-time market analysis shows price opportunities across 500+ mandis for your crops.",
        hi: "रियल-टाइम बाजार विश्लेषण आपकी फसलों के लिए 500+ मंडियों में मूल्य के अवसर दिखाता है।",
        mr: "रिअल-टाइम बाजार विश्लेषण तुमच्या पिकांसाठी 500+ मंडींमध्ये किमतीच्या संधी दाखवते.",
      },
      "weather-intel": {
        en: "Processing hyper-local weather alerts. Rain expected in your district within 48 hours.",
        hi: "हाइपर-लोकल मौसम अलर्ट संसाधित किए जा रहे हैं। आपके जिले में 48 घंटों में बारिश की संभावना है।",
        mr: "हायपर-लोकल हवामान सूचनांवर प्रक्रिया करत आहे. तुमच्या जिल्ह्यात 48 तासांत पावसाची शक्यता आहे.",
      },
      "voice-ai": {
        en: 'Voice interface ready. Say "Check my farm status" to start AI-powered summary.',
        hi: 'वॉयस इंटरफेस तैयार। AI-संचालित सारांश शुरू करने के लिए "मेरे फार्म की स्थिति जांचें" कहें।',
        mr: 'व्हॉइस इंटरफेस तयार. AI-चालित सारांश सुरू करण्यासाठी "माझ्या फार्मची स्थिती तपासा" म्हणा.',
      },
    }

    return (
      (responses as Record<string, Record<string, string>>)[agentId]?.[lang] ||
      (responses as Record<string, Record<string, string>>)[agentId]?.en ||
      "AI agent activated and ready to assist!"
    )
  }

  const IconComponent = agent.icon

  return (
    <Card
      className={`flex flex-col h-full transition-all duration-300 hover:shadow-lg border-2 ${isActive ? "border-green-500 shadow-green-100" : "border-gray-200 dark:border-gray-700"
        }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${agent.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg leading-tight mb-1">{agent.name}</CardTitle>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{t(agent.specialtyKey as any)}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              {agent.success}% {t("successRate")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed min-h-[40px] mb-4">
          {agent.description}
        </p>

        <div className="space-y-2 mb-6">
          {agent.metrics.map((metric, index) => (
            <div key={index} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              {metric}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <Button
            onClick={handleActivate}
            disabled={isProcessing}
            className={`w-full font-medium ${isActive
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              }`}
          >
            {isProcessing ? t("ragChatbot") + "..." : isActive ? t("active") : t("activate")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
