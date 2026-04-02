"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Mic,
  Sprout,
  TrendingUp,
  RotateCcw,
  LogOut,
  Tractor,
  Scan,
  CloudRain,
  Droplets,
  BookOpen,
  MapPin,
  Layers,
  Database,
  Upload,
  MessageCircle,
  Globe,
  Landmark
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getTranslation } from "@/lib/translations"
import { EnhancedWeatherWidget } from "@/components/enhanced-weather-widget"
import { AIAgentCard, type AIAgent } from "@/components/ai-agent-card"
import { VoiceAIInterface } from "@/components/voice-ai-interface"
import { EnhancedAuthWrapper } from "@/components/enhanced-auth-wrapper"
import { RAGChatbotFull } from "@/components/rag-chatbot"
import { FarmerSignup } from "@/components/farmer-signup"
import { SmartAlertBanner } from "@/components/smart-alert-banner"

function AgribotPlatform() {
  const { farmer, language, setLanguage, logout } = useAuth()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [showChatbot, setShowChatbot] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [showUpdateProfile, setShowUpdateProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKnowledgeBaseUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadStatus("uploading")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/rag/upload", { method: "POST", body: formData })
      const data = await response.json()
      if (data.success) {
        setUploadStatus(`✅ Indexed ${data.chunksIndexed} chunks from ${data.fileName}`)
      } else {
        setUploadStatus("❌ Upload failed")
      }
    } catch {
      setUploadStatus("❌ Upload failed")
    }
    setTimeout(() => setUploadStatus(null), 5000)
    event.target.value = ""
  }

  const t = (key: any) => getTranslation(language, key)

  const aiAgents: AIAgent[] = [
    { id: "agri-detect", name: "AgriDetect", description: t("agriDetectDesc"), icon: Scan, success: 94, specialtyKey: "computerVision", metrics: [t("metricRealtimeAnalysis"), t("metricHighAccuracy")], color: "bg-red-500" },
    { id: "seed-sage", name: "Seed Sage", description: t("seedSageDesc"), icon: Sprout, success: 92, specialtyKey: "agronomyAI", metrics: [t("metricClimateMatched"), t("metricYieldBoost")], color: "bg-green-500" },
    { id: "market-oracle", name: "Market Oracle", description: t("marketOracleDesc"), icon: TrendingUp, success: 95, specialtyKey: "economicsAI", metrics: [t("metricLivePrices"), t("metricTrendAnalysis")], color: "bg-purple-500" },
    { id: "weather-intel", name: "Weather Intelligence", description: t("weatherIntelDesc"), icon: CloudRain, success: 89, specialtyKey: "meteorologyAI", metrics: [t("metricHyperlocalData"), t("metricEarlyWarnings")], color: "bg-blue-500" },
    { id: "rotation-master", name: "Rotation Master", description: t("rotationMasterDesc"), icon: RotateCcw, success: 88, specialtyKey: "soilOptimizer", metrics: [t("metricNutrientBalance"), t("metricPestDisruption")], color: "bg-amber-500" },
    { id: "irrigation-planner", name: "Irrigation Planner", description: t("irrigationPlannerDesc"), icon: Droplets, success: 91, specialtyKey: "resourceAI", metrics: [t("metricWaterSavings"), t("metricDroughtPrep")], color: "bg-cyan-500" },
    { id: "training-hub", name: "Training Hub", description: t("trainingHubDesc"), icon: BookOpen, success: 96, specialtyKey: "educationAI", metrics: [t("metricSafetyFirst"), t("metricBestPractices")], color: "bg-teal-500" },
    { id: "maha-yojana", name: "MahaYojana AI", description: t("mahaYojanaDesc"), icon: Landmark, success: 91, specialtyKey: "schemesAI", metrics: [t("metricMahaDBTAid"), t("metricPMKISANInfo")], color: "bg-yellow-500" },
  ]

  return (
    <>
      {/* DESKTOP VIEW */}
      <div className="hidden md:block">
        {/* FULL-PAGE CHATBOT VIEW */}
        {showChatbot && (
          <RAGChatbotFull onBack={() => {
            setShowChatbot(false)
            setActiveAgentId(null)
          }} initialAgent={activeAgentId} />
        )}

        {/* DASHBOARD VIEW */}
        {!showChatbot && (
          <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
          {/* 1. TOP HEADER */}
          <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-green-200 shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tractor className="w-8 h-8 text-green-600" />
                <h1 className="text-xl font-bold text-green-800 dark:text-green-400 tracking-tight">{t("agribotHub")}</h1>
              </div>
              <div className="flex items-center gap-3">
                {/* RAG Chatbot Button */}
                <Button
                  onClick={() => {
                    setActiveAgentId(null)
                    setShowChatbot(true)
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full px-5 gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-green-700 transition-all"
                  title={t("chatbotTooltip")}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-semibold">{t("ragChatbot")}</span>
                </Button>
                {/* Language Switcher */}
                <div className="relative ml-2 border-l border-green-200 dark:border-green-800 pl-4">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {language === "en" ? "EN" : language === "hi" ? "HI" : "MR"}
                    </span>
                  </button>
                  <select 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={language || "en"}
                    onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "mr")}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="mr">मराठी</option>
                  </select>
                </div>
                {farmer && (
                  <div className="flex items-center gap-4 ml-2">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold leading-none">{farmer?.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{farmer?.farmingType === 'single' ? t('singleCropFarmer') : farmer?.farmingType === 'multiple' ? t('multiCropFarmer') : t('farmerName')}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout} className="text-red-500 hover:bg-red-50" title={t("logout")}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <SmartAlertBanner />

          <main className="container mx-auto px-4 py-6 space-y-10">

            {/* 2. LIVE INTELLIGENCE - DYNAMICALLY UPDATED */}
            <section aria-label="Live Intelligence">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  {t("liveIntelligence")}: {farmer?.farmLocation?.district || t("localRegion")}
                </h2>
              </div>
              {/* Weather widget handles its own location via AuthContext */}
              <EnhancedWeatherWidget />
            </section>

            {/* 3. AGENT HUB GRID & KNOWLEDGE BASE */}
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t("aiCommandCenter")}</h2>
                  <p className="text-sm text-slate-500">{t("aiCommandDesc")}</p>
                </div>
                <TabsList className="bg-slate-100 p-1 rounded-full">
                  <TabsTrigger value="dashboard" className="rounded-full px-6">{t("agentsTab")}</TabsTrigger>
                  <TabsTrigger value="voice" className="rounded-full px-6">{t("voiceAITab")}</TabsTrigger>
                  <TabsTrigger value="knowledge-base" className="rounded-full px-6">{t("knowledgeBaseTab")}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {aiAgents.map((agent) => (
                    <AIAgentCard
                      key={agent.id}
                      agent={agent}
                      onActivate={() => {
                        setActiveAgentId(agent.id)
                        setShowChatbot(true)
                      }}
                      language={language}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="voice">
                <VoiceAIInterface language={language} />
              </TabsContent>

              {/* NEW: DATASET UPLOAD / KNOWLEDGE BASE TAB */}
              <TabsContent value="knowledge-base">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-emerald-600" />
                        {t("datasetIngestion")}
                      </CardTitle>
                      <CardDescription>
                        {t("datasetIngestionDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-6">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Upload className="h-8 w-8 text-emerald-600" />
                      </div>
                      <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.pdf,.txt,.md" onChange={handleKnowledgeBaseUpload} />
                      <Button onClick={() => fileInputRef.current?.click()}>
                        {t("selectDataset")}
                      </Button>
                      {uploadStatus && (
                        <p className="mt-3 text-xs font-medium text-emerald-600">{uploadStatus}</p>
                      )}
                      <p className="mt-4 text-[10px] text-slate-400 uppercase font-bold">{t("ragIndexed")}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t("activeSources")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium">AgriBot_Pre-loaded_Knowledge</span>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">{t("active")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">KisanVaani_Agriculture_QA</span>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">{t("active")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium">Farmer_Call_Expert_QA</span>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">{t("active")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Falcon_Agriculture_Dataset</span>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">{t("active")}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium">Local_Soil_Health.csv</span>
                          </div>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">{t("active")}</span>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {t("referencingFiles").replace("{area}", String(farmer?.farmAreaAcres || "0"))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* 4. AGRI-DATA INTEGRATION (Farm Summary) */}
            <section className="pt-6 border-t border-slate-200">
              <div className="bg-emerald-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-xl">
                <Layers className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-emerald-800 opacity-30" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1">
                    <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">{t("locationSoil")}</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-300" />
                      <span className="text-lg font-bold">{farmer?.farmLocation?.district || t("unknownRegion")}</span>
                    </div>
                    <p className="text-sm opacity-70 leading-tight">{t('dataSyncText')}</p>
                  </div>

                  <div className="flex flex-col justify-center">
                    <p className="text-emerald-400 text-[10px] font-bold uppercase">{t("soilType")}</p>
                    <p className="text-xl font-bold capitalize">{farmer?.soilType ? t(farmer.soilType.toLowerCase() as any) || farmer.soilType : t('notAnalyzed')}</p>
                  </div>

                  <div className="flex flex-col justify-center">
                    <p className="text-emerald-400 text-[10px] font-bold uppercase">{t("farmArea")}</p>
                    <p className="text-xl font-bold">{farmer?.farmAreaAcres || "0"} {t('acres')}</p>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      variant="secondary"
                      className="bg-emerald-800 text-emerald-100 border-none hover:bg-emerald-700"
                      onClick={() => setShowUpdateProfile(true)}
                    >
                      {t("completeSetup")}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

          </main>

          <footer className="py-10 text-center">
            <p className="text-xs text-slate-400">{t("footerText")}</p>
          </footer>
        </div>
        )}
      </div>

      {/* MOBILE VIEW: Always show Chatbot directly with small weather footer */}
      <div className="md:hidden flex flex-col h-[100dvh] bg-slate-50 dark:bg-gray-950">
        <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-green-200 px-4 py-3 flex items-center justify-between shadow-sm z-50">
          <div className="flex items-center gap-2">
            <Tractor className="w-6 h-6 text-green-600" />
            <h1 className="text-base font-bold text-green-800 dark:text-green-400 tracking-tight">{t("agribotHub")}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 transition-colors">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold">
                  {language === "en" ? "EN" : language === "hi" ? "HI" : "MR"}
                </span>
              </button>
              <select 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={language || "en"}
                  onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "mr")}
              >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="mr">मराठी</option>
              </select>
            </div>
            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={logout} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <RAGChatbotFull isMobileCompact={true} initialAgent={activeAgentId} onBack={() => {}} />
        </div>

        <div className="flex-shrink-0 z-50">
          <EnhancedWeatherWidget compact={true} />
        </div>
      </div>
      {showUpdateProfile && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm shadow-2xl overflow-y-auto pt-10 pb-20 px-4">
          <div className="max-w-2xl mx-auto relative">
            <FarmerSignup
              language={language}
              mode="update"
              initialData={farmer}
              onUpdateComplete={() => setShowUpdateProfile(false)}
              onBack={() => setShowUpdateProfile(false)}
              onSignupComplete={() => { }} // Not used in update mode
            />
            <Button
              variant="ghost"
              className="absolute right-0 top-0 text-white hover:bg-white/10"
              onClick={() => setShowUpdateProfile(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Page() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <EnhancedAuthWrapper />
  return <AgribotPlatform />
}