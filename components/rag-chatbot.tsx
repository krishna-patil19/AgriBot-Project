"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Send,
    Paperclip,
    Bot,
    User,
    Sparkles,
    Trash2,
    Shield,
    Zap,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Image as ImageIcon,
    Mic,
    Upload,
    X,
    ChevronLeft,
    Database,
    Activity,
    ArrowLeft,
    Volume2,
    VolumeX,
    Globe,
    Music,
    Keyboard
} from "lucide-react"
import { useRAGChat, type ChatMessage } from "@/hooks/use-rag-chat"
import { useAuth } from "@/contexts/auth-context"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getTranslation } from "@/lib/translations"
import { DevanagariSuggestions, DevanagariKeys } from "./marathi-keyboard"

// Agent definitions
const AGENTS = [
    { id: "agri-detect", name: "AgriDetect", icon: "🔬", color: "from-red-500 to-rose-600", bgLight: "bg-red-50", textColor: "text-red-700", borderColor: "border-red-200", descriptionKey: "agriDetectDesc", specialtyKey: "computerVision", reliability: 94 },
    { id: "seed-sage", name: "Seed Sage", icon: "🌱", color: "from-green-500 to-emerald-600", bgLight: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-200", descriptionKey: "seedSageDesc", specialtyKey: "agronomyAI", reliability: 92 },
    { id: "market-oracle", name: "Market Oracle", icon: "📊", color: "from-purple-500 to-violet-600", bgLight: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200", descriptionKey: "marketOracleDesc", specialtyKey: "economicsAI", reliability: 95 },
    { id: "weather-intel", name: "Weather Intel", icon: "🌦️", color: "from-blue-500 to-sky-600", bgLight: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200", descriptionKey: "weatherIntelDesc", specialtyKey: "meteorologyAI", reliability: 89 },
    { id: "rotation-master", name: "Rotation Master", icon: "🔄", color: "from-amber-500 to-yellow-600", bgLight: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200", descriptionKey: "rotationMasterDesc", specialtyKey: "soilOptimizer", reliability: 88 },
    { id: "irrigation-planner", name: "Irrigation Planner", icon: "💧", color: "from-cyan-500 to-teal-600", bgLight: "bg-cyan-50", textColor: "text-cyan-700", borderColor: "border-cyan-200", descriptionKey: "irrigationPlannerDesc", specialtyKey: "resourceAI", reliability: 91 },
    { id: "training-hub", name: "Training Hub", icon: "📚", color: "from-teal-500 to-green-600", bgLight: "bg-teal-50", textColor: "text-teal-700", borderColor: "border-teal-200", descriptionKey: "trainingHubDesc", specialtyKey: "educationAI", reliability: 96 },
    { id: "maha-yojana", name: "MahaYojana AI", icon: "🏛️", color: "from-yellow-500 to-amber-600", bgLight: "bg-yellow-50", textColor: "text-yellow-700", borderColor: "border-yellow-200", descriptionKey: "mahaYojanaDesc", specialtyKey: "schemesAI", reliability: 91 },
]

interface RAGChatbotFullProps {
    onBack?: () => void
    initialAgent?: string | null
    isMobileCompact?: boolean
}

export function RAGChatbotFull({ onBack, initialAgent = null, isMobileCompact = false }: RAGChatbotFullProps) {
    const { farmer, language, setLanguage } = useAuth()
    const t = (key: any) => getTranslation(language, key)
    const [inputValue, setInputValue] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [devKeyboardOpen, setDevKeyboardOpen] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const datasetInputRef = useRef<HTMLInputElement>(null)

    const recorder = useVoiceRecorder()
    const wasRecordingRef = useRef(false)

    const {
        messages,
        isLoading,
        activeAgent,
        selectedAgent,
        setSelectedAgent,
        uploadStatus,
        sendMessage,
        uploadImage,
        uploadAudio,
        handleVoiceMessage,
        uploadDocument,
        clearChat,
    } = useRAGChat({ farmerData: farmer, language, initialAgent })

    // Handle recording stop
    useEffect(() => {
        // Only process if we just stopped recording (transition from true -> false)
        if (wasRecordingRef.current && !recorder.isRecording && recorder.recordingTime > 0) {
            const audioFile = recorder.getAudioFile()
            if (audioFile) {
                handleVoiceMessage(audioFile, imagePreview)
                // If an image was used with voice, clear it after processing
                if (imagePreview) {
                    setImagePreview(null)
                    setPendingImageFile(null)
                }
            }
        }
        wasRecordingRef.current = recorder.isRecording
    }, [recorder.isRecording, recorder.recordingTime, handleVoiceMessage, imagePreview, recorder])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    const handleSend = () => {
        if (pendingImageFile) {
            uploadImage(pendingImageFile, inputValue || undefined)
            setImagePreview(null)
            setPendingImageFile(null)
            setInputValue("")
            return
        }
        if (inputValue.trim()) {
            sendMessage(inputValue)
            setInputValue("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        setImagePreview(url)
        setPendingImageFile(file)
        e.target.value = ""
    }

    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        uploadAudio(file)
        e.target.value = ""
    }

    const handleMarathiKeyClick = (char: string) => {
        setInputValue(prev => prev + char)
        inputRef.current?.focus()
    }

    const handleMarathiSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion)
        sendMessage(suggestion)
        setDevKeyboardOpen(false)
    }

    const handleMarathiBackspace = () => {
        setInputValue(prev => prev.slice(0, -1))
        inputRef.current?.focus()
    }

    const handleDatasetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        uploadDocument(file)
        e.target.value = ""
    }

    const getAgent = (id?: string) => AGENTS.find(a => a.id === id) || AGENTS[6]

    return (
        <div className={`${isMobileCompact ? "h-full" : "h-screen"} flex bg-slate-50 dark:bg-gray-950 overflow-hidden`}>
            {/* ============================================================ */}
            {/* SIDEBAR — Agent Details */}
            {/* ============================================================ */}
            <aside className={`${sidebarOpen ? "w-80" : "w-0"} flex-shrink-0 transition-all duration-300 overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900`}>
                <div className="w-80 h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            {onBack && (
                                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-500 hover:text-slate-700 -ml-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="text-xs font-medium">{t("sidebarDashboard")}</span>
                                </Button>
                            )}
                            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 ml-auto">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white" title={t("chatbotTooltip")}>{t("agribotHub")} - {t("ragChatbot")}</h2>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">{t("agentsOnline")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent Auto-Route Toggle */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => setSelectedAgent(null)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${!selectedAgent
                                ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!selectedAgent ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("autoRoute")}</p>
                                <p className="text-[10px] text-slate-500">{t("autoRouteDesc")}</p>
                            </div>
                            {!selectedAgent && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />}
                        </button>
                    </div>

                    {/* Agent List */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                        {AGENTS.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group ${selectedAgent === agent.id
                                    ? `${agent.bgLight} dark:bg-slate-800 border-2 ${agent.borderColor} dark:border-slate-700 shadow-sm transform scale-[1.02]`
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent"
                                    } ${activeAgent === agent.id ? "ring-2 ring-offset-2 ring-emerald-400" : ""}`}
                            >
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                    <span className="text-base">{agent.icon}</span>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{agent.name}</p>
                                        {activeAgent === agent.id && (
                                            <Activity className="w-3 h-3 text-emerald-500 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate">{t(agent.descriptionKey as any)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-[9px] font-bold text-emerald-600" title="Reliability Index based on historical success">RI: {agent.reliability}%</span>
                                    {selectedAgent === agent.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Upload Section */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("knowledgeBaseTab")}</p>
                        <input ref={datasetInputRef} type="file" className="hidden" accept=".csv,.txt,.pdf,.md,.json" onChange={handleDatasetSelect} />
                        <button
                            onClick={() => datasetInputRef.current?.click()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group"
                        >
                            <Database className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-xs text-slate-500 group-hover:text-emerald-600">{t("uploadDataset")}</span>
                        </button>
                        {uploadStatus && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium ${uploadStatus === "uploading" ? "bg-blue-50 text-blue-700" :
                                uploadStatus === "success" ? "bg-green-50 text-green-700" :
                                    "bg-red-50 text-red-700"
                                }`}>
                                {uploadStatus === "uploading" && <><Loader2 className="w-3 h-3 animate-spin" /> {t("indexing")}</>}
                                {uploadStatus === "success" && <><CheckCircle2 className="w-3 h-3" /> {t("indexed")}</>}
                                {uploadStatus === "error" && <><AlertTriangle className="w-3 h-3" /> {t("failed")}</>}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ============================================================ */}
            {/* MAIN CHAT AREA */}
            {/* ============================================================ */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Chat Header */}
                <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {!sidebarOpen && (
                                <button onClick={() => setSidebarOpen(true)} className="hidden md:block p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 mr-1">
                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                </button>
                            )}
                            {selectedAgent ? (
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getAgent(selectedAgent).color} flex items-center justify-center shadow-lg shadow-${getAgent(selectedAgent).color.split("-")[1]}-500/30 transform transition-transform hover:scale-105`}>
                                        <span className="text-xl sm:text-2xl drop-shadow-sm">{getAgent(selectedAgent).icon}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-sm sm:text-lg font-black ${getAgent(selectedAgent).textColor} dark:text-white tracking-tight leading-tight truncate`}>{getAgent(selectedAgent).name}</h3>
                                        <p className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{t(getAgent(selectedAgent).specialtyKey as any)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm sm:shadow-lg shadow-emerald-500/30 flex-shrink-0">
                                        <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{t("autoRoutingMode")}</h3>
                                        <p className="text-[9px] sm:text-[10px] text-slate-500 truncate leading-tight mt-0.5">{t("autoRoutingDesc")}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <div className="relative group">
                                <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                                    <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="text-[10px] sm:text-xs font-semibold">
                                        {language === "en" ? "English" : language === "hi" ? "हिंदी" : "मराठी"}
                                    </span>
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                                    <button onClick={() => setLanguage("en")} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${language === "en" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-700"}`}>English</button>
                                    <button onClick={() => setLanguage("hi")} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${language === "hi" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-700"}`}>हिंदी</button>
                                    <button onClick={() => setLanguage("mr")} className={`w-full text-left px-4 py-2 text-sm border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 ${language === "mr" ? "text-emerald-600 font-bold bg-emerald-50/50" : "text-slate-700"}`}>मराठी</button>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={clearChat} className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-5">
                        {/* Welcome state */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-4 sm:py-20 h-full">
                                <div className="hidden sm:flex w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-green-50 items-center justify-center mb-6 shadow-sm">
                                    <Sparkles className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h3 className="hidden sm:block text-xl font-bold text-slate-800 dark:text-white mb-2">{t("personalAssistantTitle")}</h3>
                                <p className="hidden sm:block text-sm text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md leading-relaxed">
                                    {t("personalAssistantDesc")}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-2xl px-2 sm:px-0 mt-auto sm:mt-0">
                                    {[
                                        { emoji: "🔬", text: t("detectDisease"), query: "My wheat leaves have brown spots and yellowing, what disease is this?" },
                                        { emoji: "🌱", text: t("bestSeeds"), query: "What are the best wheat seeds for sandy soil in Rajasthan?" },
                                        { emoji: "📊", text: t("mandiPrices"), query: "What is the current mandi price for rice in Punjab?" },
                                        { emoji: "💧", text: t("irrigationSchedule"), query: "How should I schedule drip irrigation for tomatoes in summer?" },
                                    ].map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(s.query)}
                                            className="flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-3 sm:p-5 bg-white dark:bg-slate-800 border sm:border-2 border-slate-100 dark:border-slate-700 rounded-2xl sm:rounded-3xl hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group h-24 sm:h-auto"
                                        >
                                            <span className="text-2xl sm:text-4xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-sm">{s.emoji}</span>
                                            <span className="text-[10px] sm:text-sm text-slate-700 dark:text-slate-300 font-bold text-center group-hover:text-emerald-700 leading-tight">{s.text}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-8 mb-4 sm:mb-0">
                                    <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1.5 group">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{t("uploadImage")}</span>
                                    </button>
                                    <button onClick={() => audioInputRef.current?.click()} className="flex flex-col items-center gap-1.5 group">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                                            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{t("uploadAudio")}</span>
                                    </button>
                                    <button onClick={() => datasetInputRef.current?.click()} className="flex flex-col items-center gap-1.5 group">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{t("knowledgeBaseTab")}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Message bubbles */}
                        {messages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} getAgent={getAgent} />
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-md px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                        <span className="text-xs text-slate-400 italic">
                                            {activeAgent ? `${getAgent(activeAgent).name} ${t("analyzing")}` : t("routingToAgent")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Image Preview */}
                {imagePreview && (
                    <div className="px-6 pb-2">
                        <div className="max-w-3xl mx-auto">
                            <div className="relative inline-block">
                                <img src={imagePreview} alt="Preview" className="h-24 rounded-xl border-2 border-emerald-200 shadow-sm" />
                                <button
                                    onClick={() => { setImagePreview(null); setPendingImageFile(null) }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden file inputs */}
                <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                <input ref={audioInputRef} type="file" className="hidden" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm" onChange={handleAudioSelect} />
                <input ref={datasetInputRef} type="file" className="hidden" accept=".csv,.txt,.pdf,.md,.json" onChange={handleDatasetSelect} />

                {/* Input Bar */}
                <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 px-6 py-4">
                    <div className="max-w-3xl mx-auto">
                        {/* Continuous Suggestions (All Languages) */}
                        <div className="mb-3">
                            <DevanagariSuggestions
                                language={language}
                                onSuggestionClick={handleMarathiSuggestionClick}
                                inputValue={inputValue}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Media buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                    title="Upload image for analysis"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => audioInputRef.current?.click()}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                                    title="Upload audio message"
                                >
                                    <Music className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => datasetInputRef.current?.click()}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                    title="Upload dataset for knowledge base"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                {/* Real-time Microphone Button */}
                                <button
                                    onClick={() => recorder.isRecording ? recorder.stopRecording() : recorder.startRecording()}
                                    className={`p-2.5 rounded-xl transition-all ${recorder.isRecording
                                        ? "bg-red-100 text-red-600 animate-pulse"
                                        : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                        }`}
                                    title={recorder.isRecording ? "Stop Recording" : "Speak to AI"}
                                >
                                    <Mic className="w-5 h-5" />
                                </button>

                                {/* Devanagari Keyboard Trigger (Hindi & Marathi) */}
                                {(language === "mr" || language === "hi") && (
                                    <button
                                        onClick={() => setDevKeyboardOpen(!devKeyboardOpen)}
                                        className={`p-2.5 rounded-xl transition-all ${devKeyboardOpen
                                            ? "bg-emerald-100 text-emerald-600"
                                            : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                            }`}
                                        title={language === "hi" ? "Hindi Virtual Keyboard" : "Marathi Virtual Keyboard"}
                                    >
                                        <Keyboard className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Text input */}
                            <div className="flex-1">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        pendingImageFile
                                            ? t("placeholderImage")
                                            : selectedAgent
                                                ? t("placeholderAgent").replace("{name}", getAgent(selectedAgent).name)
                                                : t("placeholderDefault")
                                    }
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all placeholder:text-slate-400"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Send button */}
                            <Button
                                onClick={handleSend}
                                disabled={(!inputValue.trim() && !pendingImageFile) || isLoading}
                                className="h-11 w-11 p-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25 disabled:opacity-30 disabled:shadow-none flex-shrink-0 transition-all"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </Button>
                        </div>
                        {devKeyboardOpen && (language === "mr" || language === "hi") && (
                            <div className="mt-4">
                                <DevanagariKeys
                                    language={language as "hi" | "mr"}
                                    onKeyClick={handleMarathiKeyClick}
                                    onBackspace={handleMarathiBackspace}
                                />
                            </div>
                        )}
                        <p className="text-center text-[9px] text-slate-400 mt-2 font-medium">
                            {t("ragPowered")} • 7 {t("agentsTab")} • {t("vectorStore")} • {t("safetyGuardrails")}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

// ============================================================
// GLOBAL AUDIO MANAGER — shared across all MessageBubble instances
// This ensures only one audio plays at a time across the entire app
// ============================================================
let globalCurrentAudio: HTMLAudioElement | null = null

function stopGlobalAudio() {
    if (globalCurrentAudio) {
        globalCurrentAudio.pause()
        globalCurrentAudio = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
    }
}

// ============================================================
// Message Bubble Component
// ============================================================

function MessageBubble({ message, getAgent }: { message: ChatMessage; getAgent: (id?: string) => typeof AGENTS[0] }) {
    const { language } = useAuth()
    const t = (key: any) => getTranslation(language as any, key)
    const agent = getAgent(message.agentId)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoadingAudio, setIsLoadingAudio] = useState(false)

    // Translate RAG source names to the selected language
    const translateSourceName = (source: string): string => {
        if (language === 'en') return source
        const sourceMap: Record<string, Record<string, string>> = {
            'AgriBot Pre-loaded Knowledge': { hi: 'एग्रीबोट पूर्व-लोड ज्ञानकोश', mr: 'ॲग्रीबोट पूर्व-लोड ज्ञानकोष' },
            'Expert Farmer Call Q&A': { hi: 'विशेषज्ञ किसान कॉल प्रश्नोत्तरी', mr: 'तज्ञ शेतकरी कॉल प्रश्नोत्तरी' },
            'Falcon Agriculture Dataset': { hi: 'फाल्कन कृषि डेटासेट', mr: 'फाल्कन कृषी डेटासेट' },
            'KisanVaani Agriculture Q&A': { hi: 'किसानवाणी कृषि प्रश्नोत्तरी', mr: 'किसानवाणी कृषी प्रश्नोत्तरी' },
            'Local Soil Health': { hi: 'स्थानीय मिट्टी स्वास्थ्य', mr: 'स्थानिक माती आरोग्य' },
        }
        return sourceMap[source]?.[language] || source
    }

    // Track if THIS bubble's audio is the one currently playing globally
    const myAudioRef = useRef<HTMLAudioElement | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (myAudioRef.current) {
                if (globalCurrentAudio === myAudioRef.current) {
                    stopGlobalAudio()
                }
                myAudioRef.current = null
            }
        }
    }, [])

    const speakWithBrowserTTS = useCallback((text: string) => {
        if (!("speechSynthesis" in window)) return

        stopGlobalAudio()

        const utterance = new SpeechSynthesisUtterance(text)

        const voices = window.speechSynthesis.getVoices()
        const langMap: Record<string, string[]> = {
            "en": ["en-IN", "en-US", "en-GB"],
            "hi": ["hi-IN", "hi"],
            "mr": ["mr-IN", "mr"]
        }

        const targetLangs = langMap[language as keyof typeof langMap] || ["en-IN"]
        const selectedVoice = voices.find(v =>
            targetLangs.some(l => v.lang.toLowerCase().includes(l.toLowerCase()))
        )

        if (selectedVoice) {
            utterance.voice = selectedVoice
        } else {
            utterance.lang = targetLangs[0]
        }

        // Softer, more humble tone
        utterance.rate = 0.85
        utterance.pitch = 1.05

        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)

        window.speechSynthesis.speak(utterance)
    }, [language])

    const hasAutoPlayed = useRef<string | null>(null)

    const playAudio = useCallback(async (overrideUrl?: string, isAutoPlay = false) => {
        // If THIS bubble is currently playing and user clicks stop
        if (isPlaying && !isAutoPlay) {
            stopGlobalAudio()
            myAudioRef.current = null
            setIsPlaying(false)
            return
        }

        if (isLoadingAudio) return

        const cleanText = message.content
            .replace(/```[\s\S]*?```/g, "")
            .replace(/#+\s/g, "")
            .replace(/[*_~`]/g, "")
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
            .replace(/https?:\/\/[^\s]+/g, "")
            .replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
            .replace(/>\s/g, "")
            .replace(/\|/g, " ")
            .replace(/[-+*]\s/g, " ")
            .replace(/\d+\.\s/g, " ")
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
            .replace(/[^\w\s\u0900-\u097F\u0980-\u09FF.,!?;:]/g, " ")
            .replace(/\s+/g, " ")
            .trim()

        if (!cleanText) return

        try {
            const urlToUse = typeof overrideUrl === "string" ? overrideUrl : undefined
            const finalAudioUrl = urlToUse || message.audioUrl
            let audioUrl = finalAudioUrl

            if (!audioUrl) {
                setIsLoadingAudio(true)

                const response = await fetch('/api/voice/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: cleanText, language })
                })

                if (!response.ok) throw new Error('Failed to generate audio')

                const ttsData = await response.json()

                if (ttsData.success && ttsData.audioBase64) {
                    const byteCharacters = atob(ttsData.audioBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
                    audioUrl = URL.createObjectURL(audioBlob)
                } else {
                    throw new Error('Failed to parse audio base64')
                }
            }

            // CRITICAL: Stop ANY currently playing audio globally before starting new one
            stopGlobalAudio()

            const audio = new Audio(audioUrl)
            myAudioRef.current = audio
            globalCurrentAudio = audio

            audio.onplay = () => {
                setIsPlaying(true)
                setIsLoadingAudio(false)
            }

            audio.onpause = () => setIsPlaying(false)
            audio.onended = () => {
                setIsPlaying(false)
                myAudioRef.current = null
                if (globalCurrentAudio === audio) globalCurrentAudio = null
                if (!finalAudioUrl) URL.revokeObjectURL(audioUrl!)
            }

            audio.onerror = (e) => {
                console.error("Audio playback error:", e)
                setIsPlaying(false)
                setIsLoadingAudio(false)
                myAudioRef.current = null
                if (globalCurrentAudio === audio) globalCurrentAudio = null
                speakWithBrowserTTS(cleanText)
            }

            await audio.play()
        } catch (error) {
            console.error("TTS Error:", error)
            setIsLoadingAudio(false)
            speakWithBrowserTTS(cleanText)
        }
    }, [isPlaying, isLoadingAudio, message, language, speakWithBrowserTTS])

    // Auto-play for any assistant message
    useEffect(() => {
        if (message.role === "assistant" && hasAutoPlayed.current !== message.id) {
            const timer = setTimeout(() => {
                hasAutoPlayed.current = message.id
                // Trigger auto-play only if not already playing something else
                // We use a safe version of playAudio that doesn't trigger the loop
                playAudio(message.audioUrl, true)
            }, 700)
            return () => clearTimeout(timer)
        }
    }, [message.id, message.audioUrl, playAudio])


    if (message.role === "system") {
        return (
            <div className="flex justify-center">
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 max-w-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t("agribotHub")}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
            </div>
        )
    }

    if (message.role === "user") {
        return (
            <div className="flex items-end gap-3 justify-end">
                <div className="max-w-md">
                    {/* Image attachment */}
                    {message.imageUrl && (
                        <div className="mb-2 flex justify-end">
                            <img src={message.imageUrl} alt="Uploaded" className="max-h-48 rounded-2xl border-2 border-emerald-200 shadow-md" />
                        </div>
                    )}
                    {/* Audio attachment */}
                    {message.audioUrl && (
                        <div className="mb-2 flex justify-end">
                            <audio controls src={message.audioUrl} className="h-10 rounded-full" />
                        </div>
                    )}
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl rounded-br-md px-5 py-3 shadow-md shadow-emerald-500/10">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-[9px] text-emerald-100 mt-1.5 text-right">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                </div>
            </div>
        )
    }

    // Assistant message
    return (
        <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-sm">{message.agentIcon || agent.icon}</span>
            </div>
            <div className="flex-1 max-w-xl">
                {/* Agent badge + metadata */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[11px] font-bold ${agent.textColor} uppercase tracking-wider`}>
                        {message.agentName || agent.name}
                    </span>
                    {message.confidence !== undefined && message.confidence > 0 && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-emerald-200 text-emerald-600" title="Confidence score for this specific query matching the agent">
                            {Math.round(message.confidence * 100)}% {t("intentMatch")}
                        </Badge>
                    )}
                    {message.isMultiAgent && message.secondaryAgent && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-blue-200 text-blue-600">
                            +{message.secondaryAgent.icon} {message.secondaryAgent.name}
                        </Badge>
                    )}
                </div>

                {/* Safety warnings */}
                {message.safetyFlags && message.safetyFlags.length > 0 && (
                    <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Shield className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-700 uppercase">{t("safetyGuardrails")}</span>
                        </div>
                        {message.safetyFlags.map((flag, i) => (
                            <p key={i} className="text-[10px] text-amber-600">{flag}</p>
                        ))}
                    </div>
                )}

                {/* Message body with Markdown */}
                <div className={`${agent.bgLight} dark:bg-slate-900 border-2 ${agent.borderColor} dark:border-slate-700 rounded-3xl rounded-tl-sm px-6 py-4 shadow-sm`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-emerald prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-emerald-600 prose-strong:text-slate-900 dark:prose-strong:text-white [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* RAG sources */}
                {message.ragSources && message.ragSources.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {message.ragSources.map((src, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 font-medium whitespace-nowrap">
                                {translateSourceName(src.source)}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[9px] text-slate-400">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {/* TTS Button */}
                    <button
                        onClick={() => playAudio()}
                        className={`p-1 rounded-full transition-colors flex items-center justify-center ml-1 ${isPlaying ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                        title={isPlaying ? "Stop Audio" : "Play Audio in regional language"}
                    >
                        {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
