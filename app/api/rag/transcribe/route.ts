import { type NextRequest, NextResponse } from "next/server"
import { sarvamClient } from "@/lib/sarvam-client"

/**
 * POST /api/rag/transcribe
 * Transcribe audio using Sarvam AI Saaras v3 (Optimized for Indian languages)
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const audioFile = formData.get("audio") as File | null
        const language = (formData.get("language") as string) || "en"

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
        }

        console.log(`[Sarvam Transcribe] Processing audio: ${audioFile.name} (${audioFile.size} bytes) for ${language}`)

        // If it's English, we could still use Whisper or Sarvam. 
        // Sarvam Saaras v3 is excellent for Indian-accented English too.
        const transcript = await sarvamClient.speechToText(audioFile, language)

        console.log("[Sarvam Transcribe] Complete:", transcript.substring(0, 100))

        return NextResponse.json({
            success: true,
            text: transcript,
            language: language,
        })
    } catch (error: any) {
        console.error("[Sarvam Transcribe] Error:", error)

        // Return a friendly error so the UI can update
        return NextResponse.json(
            {
                error: "Transcription failed",
                details: error.message || "Unknown error",
                // Provide a dummy text if the API key is missing to show the flow
                text: process.env.SARVAM_API_KEY === "your_sarvam_key_here" ? "(Sarvam API Key required for transcription)" : null
            },
            { status: 500 }
        )
    }
}
