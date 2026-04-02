"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { type Language, getTranslation } from "@/lib/translations"

// Import the global audio manager from rag-chatbot to prevent cross-component collision
// We'll use our own reference but always stop the global one first
let voiceWidgetAudio: HTMLAudioElement | null = null

function stopVoiceWidgetAudio() {
    if (voiceWidgetAudio) {
        voiceWidgetAudio.pause()
        voiceWidgetAudio = null
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
    }
}

interface VoiceAIInterfaceProps {
  language: Language
}

export function VoiceAIInterface({ language }: VoiceAIInterfaceProps) {
  const { farmer } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversation, setConversation] = useState<Array<{ type: "user" | "ai"; message: string; timestamp: string }>>(
    [],
  )
  const recorder = useVoiceRecorder()
  const wasRecordingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = (key: any) => getTranslation(language as Language, key)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation])

  useEffect(() => {
    const greetings = {
      en: `Hello ${farmer?.name || "Farmer"}! I'm your AgriBot Voice AI assistant. Ask me about weather, market rates, or crop advice.`,
      hi: `नमस्कार ${farmer?.name || "किसान जी"}! मैं आपकी AgriBot वॉइस AI सहायिका हूँ। मुझसे मौसम, बाजार दर, या फसल सलाह के बारे में पूछें।`,
      mr: `नमस्कार ${farmer?.name || "शेतकरी जी"}! मी तुमची AgriBot व्हॉइस AI सहायिका आहे. मला हवामान, बाजार दर किंवा पीक सल्ल्याबद्दल विचारा.`,
    }

    const greeting = greetings[language as keyof typeof greetings] || greetings.en
    setConversation([
      {
        type: "ai",
        message: greeting,
        timestamp: new Date().toISOString(),
      },
    ])
  }, [language, farmer?.name])

  // Handle recording stop and process audio
  useEffect(() => {
    // Only process if we just stopped recording (transition from true -> false)
    if (wasRecordingRef.current && !recorder.isRecording) {
      const audioFile = recorder.getAudioFile()
      if (audioFile) {
        processAudio(audioFile)
      }
    }
    wasRecordingRef.current = recorder.isRecording
  }, [recorder.isRecording, recorder])

  const handleVoiceToggle = () => {
    if (recorder.isRecording) {
      recorder.stopRecording()
    } else {
      stopSpeaking()
      recorder.startRecording()
    }
  }

  // Use Sarvam TTS to speak text (handles Hindi/Marathi numbers correctly)
  const speakWithSarvam = useCallback(async (text: string) => {
    try {
      // Clean text for TTS
      const cleanText = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/#+\s/g, "")
        .replace(/[*_~`]/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/\|/g, " ")
        .replace(/\n+/g, " ")
        .trim()

      if (!cleanText) return

      const ttsRes = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, language })
      })

      const ttsData = await ttsRes.json()

      if (ttsData.success && ttsData.audioBase64) {
        const byteCharacters = atob(ttsData.audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);

        // Stop any currently playing audio globally
        stopVoiceWidgetAudio()

        const audio = new Audio(audioUrl);
        voiceWidgetAudio = audio;

        audio.onplay = () => setIsSpeaking(true)
        audio.onended = () => {
          setIsSpeaking(false)
          voiceWidgetAudio = null
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          setIsSpeaking(false)
          voiceWidgetAudio = null
          URL.revokeObjectURL(audioUrl)
          // Last resort: browser TTS fallback
          speakWithBrowserTTS(cleanText)
        }

        await audio.play()
      } else {
        // Fallback to browser TTS
        speakWithBrowserTTS(text)
      }
    } catch (err) {
      console.error("Sarvam TTS failed:", err)
      speakWithBrowserTTS(text)
    }
  }, [language])

  // Browser TTS fallback (used only when Sarvam fails)
  const speakWithBrowserTTS = (text: string) => {
    if (!("speechSynthesis" in window)) return

    stopVoiceWidgetAudio()

    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/#+\s/g, "")
      .replace(/[*_~`]/g, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .replace(/\|/g, " ")
      .replace(/\n+/g, " ")
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)

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

    // Softer, humble tone
    utterance.rate = 0.85
    utterance.pitch = 1.05

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const processAudio = async (audioFile: File) => {
    setIsProcessing(true)

    try {
      console.log("[v0] Transcribing audio with Groq Whisper")

      const formData = new FormData()
      formData.append("audio", audioFile)
      formData.append("language", language)

      // Add placeholder user message to conversation
      setConversation((prev) => [
        ...prev,
        {
          type: "user",
          message: t("transcribing"),
          timestamp: new Date().toISOString(),
        },
      ])

      // Transcribe audio using Groq Whisper (via /api/voice/transcribe)
      const transcribeResponse = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const { text } = await transcribeResponse.json()
      console.log("[v0] Transcription result:", text)

      // Update user message with text
      setConversation((prev) =>
        prev.map((msg, i) => i === prev.length - 1 && msg.type === "user" ? { ...msg, message: text } : msg)
      )

      // Get AI response
      const conversationHistory = conversation.map(msg => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.message
      }))

      const chatResponse = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language,
          farmerData: farmer,
          conversationHistory: conversationHistory,
        }),
      })

      if (!chatResponse.ok) {
        throw new Error("Chat response failed")
      }

      const { response } = await chatResponse.json()

      // Add AI response to conversation
      setConversation((prev) => [
        ...prev,
        {
          type: "ai",
          message: response,
          timestamp: new Date().toISOString(),
        },
      ])

      // Generate and play TTS using Sarvam (handles Hindi numbers correctly)
      await speakWithSarvam(response)
    } catch (error) {
      console.error("[v0] Error processing audio:", error)
      setConversation((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 && msg.type === "user"
            ? { ...msg, message: t("transcriptionFailed") }
            : msg
        )
      )
      setConversation((prev) => [
        ...prev,
        {
          type: "ai",
          message: t("voiceErrorFallback"),
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  const stopSpeaking = () => {
    stopVoiceWidgetAudio()
    setIsSpeaking(false)
  }

  // handleVoiceToggle moved above

  const getLanguageDisplay = () => {
    const languages = {
      en: { name: "English", flag: "🇺🇸", code: "US" },
      hi: { name: "हिंदी", flag: "🇮🇳", code: "IN" },
      mr: { name: "मराठी", flag: "🇮🇳", code: "IN" },
    }
    return languages[language as keyof typeof languages] || languages.en
  }

  const currentLang = getLanguageDisplay()

  return (
    <div className="space-y-6">
      {/* Voice Control Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            {t("voiceControlCenter")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Voice Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              className={`w-32 h-32 rounded-full text-white transition-all duration-300 ${recorder.isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200"
                : isProcessing
                  ? "bg-yellow-500 hover:bg-yellow-600 animate-spin"
                  : "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                }`}
            >
              <div className="flex flex-col items-center">
                {isProcessing ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-sm">{t("voiceProcessing")}</span>
                  </>
                ) : recorder.isRecording ? (
                  <>
                    <MicOff className="w-8 h-8 mb-2" />
                    <span className="text-sm">{t("voiceStop")}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 mb-2" />
                    <span className="text-sm">{t("voiceSpeak")}</span>
                  </>
                )}
              </div>
            </Button>
          </div>

          {/* Status Badge */}
          <div className="text-center">
            <Badge
              variant={recorder.isRecording ? "destructive" : isProcessing ? "secondary" : "default"}
              className="text-sm px-4 py-2"
            >
              {isProcessing ? t("indexing") : recorder.isRecording ? `${t("voiceListening")} ${recorder.recordingTime}s` : t("voiceReady")}
            </Badge>
          </div>

          {/* Language Display */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">{currentLang.flag}</span>
              <span className="font-medium">{currentLang.code}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{currentLang.name}</span>
            </div>
          </div>

          {/* Audio Controls */}
          {isSpeaking && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={stopSpeaking}
                className="flex items-center gap-2 bg-transparent"
              >
                <VolumeX className="w-4 h-4" />
                {t("voiceStopSpeaking")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t("voiceConversation")}
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              {t("activeStatus")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar" ref={scrollRef}>
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${msg.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs opacity-70 flex items-center gap-1">
                      {msg.type === "user" ? (
                        <>
                          <Mic className="w-3 h-3" />
                          {t("userLabel")}
                        </>
                      ) : (
                        <>🤖 {t("botLabel")}</>
                      )}
                    </div>
                    {msg.type === "ai" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakWithSarvam(msg.message)}
                        className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.message}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
