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

        // Clean text of markdown, bullet points, technical symbols for natural conversational speech
        const cleanText = sarvamClient.prepareTextForSpeech(text, language)

        if (!cleanText) {
            return NextResponse.json({ error: "No speakable text found" }, { status: 400 })
        }

        // Limit length to avoid timeouts on very long texts (up to ~800 chars for smooth playback)
        const ttsText = cleanText.length > 800 ? cleanText.substring(0, 797) + "..." : cleanText

        // Fallback or English: Use OpenAI HD TTS with the natural, warm 'nova' voice
        const openAiApiKey = process.env.OPENAI_API_KEY;
        if (!openAiApiKey) {
            throw new Error("No OPENAI_API_KEY set in environment")
        }

        const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openAiApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tts-1-hd",
                input: ttsText,
                voice: "nova",
                speed: 1.0,
                response_format: "mp3"
            })
        });

        if (!openaiResponse.ok) {
            const errText = await openaiResponse.text();
            throw new Error(`OpenAI API Error ${openaiResponse.status}: ${errText}`);
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
