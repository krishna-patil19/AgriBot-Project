"use client"

import { useState, useCallback, useRef } from "react"

export interface ChatMessage {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    agentId?: string
    agentName?: string
    agentIcon?: string
    agentColor?: string
    confidence?: number
    ragSources?: { source: string; relevance: string; score: number }[]
    safetyFlags?: string[]
    isMultiAgent?: boolean
    secondaryAgent?: { id: string; name: string; icon: string } | null
    timestamp: string
    // Media attachments
    imageUrl?: string
    audioUrl?: string
    fileName?: string
}

interface UseRAGChatOptions {
    farmerData?: any
    language?: string
    initialAgent?: string | null
}

export function useRAGChat(options: UseRAGChatOptions = {}) {
    // Store message histories separately for each agent and auto-route mode
    const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({
        "auto-route": [],
    })
    const [isLoading, setIsLoading] = useState(false)
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const [selectedAgent, setSelectedAgent] = useState<string | null>(options.initialAgent || null)
    const [uploadStatus, setUploadStatus] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Get current thread messages based on selected agent
    const currentAgentKey = selectedAgent || "auto-route"
    const messages = messagesMap[currentAgentKey] || []

    // Helper to update messages for the currently selected agent
    const updateCurrentMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
        setMessagesMap(prevMap => {
            const prevMessages = prevMap[currentAgentKey] || []
            return {
                ...prevMap,
                [currentAgentKey]: updater(prevMessages)
            }
        })
    }, [currentAgentKey])

    /**
     * Send a text message to the RAG chatbot
     */
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}_user`,
            role: "user",
            content: text.trim(),
            timestamp: new Date().toISOString(),
        }

        updateCurrentMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        const conversationHistory = messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
        }))

        try {
            abortControllerRef.current = new AbortController()

            const response = await fetch("/api/rag/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    language: options.language || "en",
                    agentId: selectedAgent,
                    farmerData: options.farmerData,
                    conversationHistory,
                }),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) throw new Error(`API error: ${response.status}`)

            const data = await response.json()

            const assistantMessage: ChatMessage = {
                id: `msg_${Date.now()}_assistant`,
                role: "assistant",
                content: data.response,
                agentId: data.agentId,
                agentName: data.agentName,
                agentIcon: data.agentIcon,
                agentColor: data.agentColor,
                confidence: data.confidence,
                ragSources: data.ragSources,
                safetyFlags: data.safetyFlags,
                isMultiAgent: data.isMultiAgent,
                secondaryAgent: data.secondaryAgent,
                timestamp: data.timestamp,
            }

            try {
                const ttsRes = await fetch("/api/voice/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: data.response,
                        language: options.language || "en"
                    })
                })
                const ttsData = await ttsRes.json()
                if (ttsData.success && ttsData.audioBase64) {
                    assistantMessage.audioUrl = `data:audio/wav;base64,${ttsData.audioBase64}`
                }
            } catch (ttsErr) {
                console.error("TTS generation failed:", ttsErr)
            }

            updateCurrentMessages(prev => [...prev, assistantMessage])
            setActiveAgent(data.agentId)
        } catch (error: any) {
            if (error.name === "AbortError") return

            const errorMessage: ChatMessage = {
                id: `msg_${Date.now()}_error`,
                role: "assistant",
                content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                agentId: "voice-ai",
                agentName: "Voice AI Assistant",
                agentIcon: "🎙️",
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, messages, selectedAgent, options.language, options.farmerData, updateCurrentMessages])

    /**
     * Upload and analyze an image
     */
    const uploadImage = useCallback(async (file: File, prompt?: string) => {
        setIsLoading(true)

        // Convert to base64
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })

        // Add user message with image preview
        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}_user_img`,
            role: "user",
            content: prompt || "🖼️ Analyze this image",
            imageUrl: base64,
            fileName: file.name,
            timestamp: new Date().toISOString(),
        }
        updateCurrentMessages(prev => [...prev, userMessage])

        try {
            const response = await fetch("/api/rag/vision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64,
                    prompt: prompt || undefined,
                    language: options.language || "en",
                    agentId: selectedAgent || "agri-detect",
                }),
            })

            const data = await response.json()

            const assistantMessage: ChatMessage = {
                id: `msg_${Date.now()}_vision`,
                role: "assistant",
                content: data.analysis || "Image analysis complete.",
                agentId: data.agentId || "agri-detect",
                agentName: "AgriDetect",
                agentIcon: "🔬",
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, assistantMessage])
            setActiveAgent("agri-detect")
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}_err`,
                role: "assistant",
                content: "Failed to analyze the image. Please try again.",
                agentId: "voice-ai",
                agentIcon: "🎙️",
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }, [selectedAgent, options.language, updateCurrentMessages])

    /**
     * Upload and transcribe audio, then get AI response
     */
    const uploadAudio = useCallback(async (file: File) => {
        setIsLoading(true)

        const audioUrl = URL.createObjectURL(file)

        const userMessage: ChatMessage = {
            id: `msg_${Date.now()}_user_audio`,
            role: "user",
            content: "🎤 Voice message",
            audioUrl,
            fileName: file.name,
            timestamp: new Date().toISOString(),
        }
        updateCurrentMessages(prev => [...prev, userMessage])

        try {
            // Step 1: Transcribe audio
            const formData = new FormData()
            formData.append("audio", file)
            formData.append("language", options.language || "en")

            const transcribeRes = await fetch("/api/voice/transcribe", {
                method: "POST",
                body: formData,
            })

            const transcribeData = await transcribeRes.json()

            if (!transcribeData.text) {
                throw new Error("Transcription failed")
            }

            // Show transcription as system message
            const transcriptionMsg: ChatMessage = {
                id: `msg_${Date.now()}_transcription`,
                role: "system",
                content: `📝 **Transcription:** "${transcribeData.text}"`,
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, transcriptionMsg])

            // Step 2: Send transcribed text to RAG chat
            const chatRes = await fetch("/api/rag/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: transcribeData.text,
                    language: options.language || "en",
                    agentId: selectedAgent,
                    farmerData: options.farmerData,
                }),
            })

            const chatData = await chatRes.json()

            const assistantMessage: ChatMessage = {
                id: `msg_${Date.now()}_voice_resp`,
                role: "assistant",
                content: chatData.response,
                agentId: chatData.agentId,
                agentName: chatData.agentName,
                agentIcon: chatData.agentIcon,
                confidence: chatData.confidence,
                ragSources: chatData.ragSources,
                timestamp: chatData.timestamp,
            }
            updateCurrentMessages(prev => [...prev, assistantMessage])
            setActiveAgent(chatData.agentId)
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}_err`,
                role: "assistant",
                content: "Failed to process the audio. Please try again or type your question.",
                agentId: "voice-ai",
                agentIcon: "🎙️",
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }, [selectedAgent, options.language, options.farmerData, updateCurrentMessages])

    /**
     * Handle direct voice message from microphone
     */
    const handleVoiceMessage = useCallback(async (file: File, imageBase64?: string | null) => {
        setIsLoading(true)
        const voiceMsgId = `msg_${Date.now()}_voice_placeholder`

        // Add placeholder message
        const placeholderMessage: ChatMessage = {
            id: voiceMsgId,
            role: "user",
            content: "🎤 Recording... (transcribing)",
            imageUrl: imageBase64 || undefined,
            timestamp: new Date().toISOString(),
        }
        updateCurrentMessages(prev => [...prev, placeholderMessage])

        try {
            // Step 1: Transcribe
            const formData = new FormData()
            formData.append("audio", file)
            formData.append("language", options.language || "en")

            const transcribeRes = await fetch("/api/voice/transcribe", {
                method: "POST",
                body: formData,
            })
            const transcribeData = await transcribeRes.json()

            if (!transcribeData.text) {
                throw new Error("Transcription failed")
            }

            const transcribedText = transcribeData.text

            // Update placeholder with transcribed text
            updateCurrentMessages(prev =>
                prev.map(m => m.id === voiceMsgId ? { ...m, content: `🎤 ${transcribedText}` } : m)
            )

            // Step 2: If we have an image, it's a vision query
            if (imageBase64) {
                const visionRes = await fetch("/api/rag/vision", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageBase64,
                        prompt: transcribedText,
                        language: options.language || "en",
                        agentId: selectedAgent || "agri-detect",
                    }),
                })
                const visionData = await visionRes.json()

                const assistantMessage: ChatMessage = {
                    id: `msg_${Date.now()}_vision_voice`,
                    role: "assistant",
                    content: visionData.analysis || "Analysis complete.",
                    agentId: visionData.agentId || "agri-detect",
                    agentName: "AgriDetect",
                    agentIcon: "🔬",
                    timestamp: new Date().toISOString(),
                }
                updateCurrentMessages(prev => [...prev, assistantMessage])
                setActiveAgent(visionData.agentId || "agri-detect")
            } else {
                // Regular chat query
                const chatRes = await fetch("/api/rag/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: transcribedText,
                        language: options.language || "en",
                        agentId: selectedAgent,
                        farmerData: options.farmerData,
                    }),
                })
                const chatData = await chatRes.json()

                const assistantMessage: ChatMessage = {
                    id: `msg_${Date.now()}_voice_chat`,
                    role: "assistant",
                    content: chatData.response,
                    agentId: chatData.agentId,
                    agentName: chatData.agentName,
                    agentIcon: chatData.agentIcon,
                    timestamp: chatData.timestamp,
                    ragSources: chatData.ragSources,
                }

                // Step 3: Generate Sarvam TTS for the response
                try {
                    const ttsRes = await fetch("/api/voice/tts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: chatData.response,
                            language: options.language || "en"
                        })
                    })
                    const ttsData = await ttsRes.json()
                    if (ttsData.success && ttsData.audioBase64) {
                        assistantMessage.audioUrl = `data:audio/wav;base64,${ttsData.audioBase64}`

                        // We no longer auto-play here to avoid "detached" audio.
                        // The MessageBubble will handle auto-play if audioUrl is present.
                    }
                } catch (ttsErr) {
                    console.error("TTS generation failed:", ttsErr)
                }

                updateCurrentMessages(prev => [...prev, assistantMessage])
                setActiveAgent(chatData.agentId)
            }
        } catch (error) {
            console.error("Voice processing error:", error)
            updateCurrentMessages(prev =>
                prev.map(m => m.id === voiceMsgId ? { ...m, content: "🎤 (Failed to transcribe audio)" } : m)
            )
            const errorMsg: ChatMessage = {
                id: `msg_${Date.now()}_err`,
                role: "assistant",
                content: "I couldn't hear or process that correctly. Please try again.",
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }, [selectedAgent, options.language, options.farmerData, updateCurrentMessages])

    /**
     * Upload a document to the RAG knowledge base
     */
    const uploadDocument = useCallback(async (file: File) => {
        setUploadStatus("uploading")

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/rag/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const data = await response.json()

            const systemMessage: ChatMessage = {
                id: `msg_${Date.now()}_system`,
                role: "system",
                content: `📄 **${data.fileName}** indexed successfully!\n${data.chunksIndexed} knowledge chunks added to the RAG engine.\nTotal documents: ${data.totalDocuments}`,
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, systemMessage])
            setUploadStatus("success")
            setTimeout(() => setUploadStatus(null), 3000)
            return data
        } catch (error) {
            setUploadStatus("error")
            setTimeout(() => setUploadStatus(null), 3000)

            const errorMessage: ChatMessage = {
                id: `msg_${Date.now()}_error`,
                role: "system",
                content: "❌ Failed to upload document. Please try again.",
                timestamp: new Date().toISOString(),
            }
            updateCurrentMessages(prev => [...prev, errorMessage])
            return null
        }
    }, [updateCurrentMessages])

    const clearChat = useCallback(() => {
        updateCurrentMessages(() => [])
        setActiveAgent(null)
    }, [updateCurrentMessages])

    const cancelRequest = useCallback(() => {
        abortControllerRef.current?.abort()
        setIsLoading(false)
    }, [])

    return {
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
        cancelRequest,
    }
}
