import { type NextRequest, NextResponse } from "next/server"
import { sarvamClient } from "@/lib/sarvam-client"

/**
 * POST /api/rag/tts
 * Convert text to speech using Sarvam Bulbul v3
 */
export async function POST(request: NextRequest) {
    try {
        const { text, language } = await request.json()

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 })
        }

        console.log(`[Sarvam TTS Route] Converting text to speech for ${language}:\n${text.substring(0, 100)}...`)

        const audioBase64 = await sarvamClient.textToSpeech(text, language)
        const audioBuffer = Buffer.from(audioBase64, 'base64')

        // Return the audio as the response body
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Disposition": "attachment; filename=\"speech.wav\"",
                // Cache the response since the same text shouldn't change its audio output much
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            },
        })
    } catch (error: any) {
        console.error("[Sarvam TTS Route] Error:", error)
        return NextResponse.json(
            { error: "Text-to-speech failed", details: error.message },
            { status: 500 }
        )
    }
}
