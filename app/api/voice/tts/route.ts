import { type NextRequest, NextResponse } from "next/server"
import { sarvamClient } from "@/lib/sarvam-client"

/**
 * POST /api/voice/tts
 * Generate high-quality regional audio using Sarvam AI (for Hindi/Marathi) 
 * or OpenAI API (for English and fallback)
 */
export async function POST(request: NextRequest) {
    try {
        const { text, language = "en" } = await request.json()

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 })
        }

        console.log(`[TTS Route] Generating audio for language: ${language}, text length: ${text.length}`)

        // Switch: Use Sarvam for regional languages, OpenAI for English/Fallback
        if (language === "hi" || language === "mr") {
            try {
                const sarvamApiKey = process.env.SARVAM_API_KEY;
                if (sarvamApiKey) {
                    console.log(`[TTS Route] Using Sarvam AI for ${language}`)
                    const audioBase64 = await sarvamClient.textToSpeech(text, language);
                    if (audioBase64) {
                        return NextResponse.json({
                            success: true,
                            audioBase64,
                            provider: "sarvam"
                        })
                    }
                }
            } catch (err) {
                console.error("[TTS Route] Sarvam error, falling back to OpenAI", err)
            }
        }

        // Fallback or English: Use OpenAI
        const openAiApiKey = process.env.OPENAI_API_KEY;
        if (!openAiApiKey) {
            throw new Error("No OPENAI_API_KEY set in environment")
        }

        // Clean text of markdown and technical symbols for OpenAI
        const cleanText = text
            .replace(/```[\s\S]*?```/g, "")
            .replace(/#+\s/g, "")
            .replace(/[*_~`]/g, "")
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
            .replace(/\|/g, " ")
            .replace(/\n+/g, " ")
            .trim()

        const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openAiApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tts-1",
                input: cleanText,
                voice: "nova",
                response_format: "mp3"
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API Error: ${openaiResponse.status}`);
        }

        const arrayBuffer = await openaiResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const audioBase64 = buffer.toString('base64');

        return NextResponse.json({
            success: true,
            audioBase64,
            provider: "openai"
        })

    } catch (error: any) {
        console.error("[TTS Route] Fatal Error:", error)
        return NextResponse.json(
            { error: "TTS generation failed", details: error.message },
            { status: 500 }
        )
    }
}
