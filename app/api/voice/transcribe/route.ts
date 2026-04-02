import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { sarvamClient } from "@/lib/sarvam-client"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

/**
 * POST /api/voice/transcribe
 * Transcribes audio using Sarvam AI (for Hindi/Marathi) 
 * or Groq Whisper (for English and fallback)
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Voice transcription API called")

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = (formData.get("language") as string) || "en"

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log(`[STT Route] Processing language: ${language}, file: ${audioFile.name}`)

    // Switch: Use Sarvam for ALL languages to ensure high accuracy for Indian accents including English
    if (language === "hi" || language === "mr" || language === "en") {
      try {
        const sarvamApiKey = process.env.SARVAM_API_KEY;
        if (sarvamApiKey) {
          console.log(`[STT Route] Using Sarvam AI for ${language}`)
          const transcript = await sarvamClient.speechToText(audioFile, language);
          if (transcript) {
            return NextResponse.json({
              text: transcript,
              language: language,
              provider: "sarvam"
            })
          }
        }
      } catch (err) {
        console.error("[STT Route] Sarvam STT error, falling back to Groq", err)
      }
    }

    // Fallback or English: Use Groq Whisper
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    let processedFile = audioFile
    if (audioFile.type.includes("webm")) {
      processedFile = new File([audioFile], "audio.webm", { type: "audio/webm" })
    }

    console.log("[STT Route] Using Groq API with model: whisper-large-v3-turbo")

    const languageCode = language === "hi" ? "hi" : language === "mr" ? "mr" : "en"
    const promptMap: Record<string, string> = {
      "mr": "हा एक मराठी ऑडिओ आहे. कृपया केवळ मराठीत लिप्यंतरण करा, इंग्रजीत भाषांतर करू नका.",
      "hi": "यह एक हिंदी ऑडियो है। कृपया केवल हिंदी में ट्रांसक्राइब करें, अंग्रेजी में अनुवाद न करें।",
      "en": "This is an English audio recording. Please transcribe it in English."
    }

    const transcription = await groq.audio.transcriptions.create({
      file: processedFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: languageCode,
      prompt: promptMap[languageCode] || promptMap["en"],
    })

    console.log("[STT Route] Groq Transcription successful")

    return NextResponse.json({
      text: transcription.text,
      language: language,
      provider: "groq"
    })
  } catch (error: any) {
    console.error("[STT Route] Fatal error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}
