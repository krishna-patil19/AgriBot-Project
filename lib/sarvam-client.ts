/**
 * lib/sarvam-client.ts
 * Dedicated client for Sarvam AI integration.
 * Supports Saaras v3 (STT), Bulbul v3 (TTS), and Mayura v1 (Translation).
 */

export class SarvamClient {
    private apiKey: string
    private baseUrl = "https://api.sarvam.ai"

    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY || ""
    }

    /**
     * Speech-to-Text using Saaras v3
     */
    async speechToText(audioFile: File, language: string = "hi"): Promise<string> {
        if (!this.apiKey) throw new Error("SARVAM_API_KEY is missing")

        console.log(`[Sarvam STT] Starting transcription for ${language}, file: ${audioFile.name}, size: ${audioFile.size}`)

        const formData = new FormData()
        formData.append("file", audioFile)
        formData.append("model", "saaras:v1") // Using v1 for better stability with various webm/wav types
        formData.append("timestamp_format", "none")

        // Map language codes correctly for Sarvam STT
        const langCode = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN"
        formData.append("language_code", langCode)

        try {
            console.log(`[Sarvam STT] Fetching ${this.baseUrl}/speech-to-text with ${langCode}...`)
            const response = await fetch(`${this.baseUrl}/speech-to-text`, {
                method: "POST",
                headers: {
                    "api-subscription-key": this.apiKey,
                },
                body: formData,
            })

            console.log(`[Sarvam STT] Response status: ${response.status}`)

            if (!response.ok) {
                const err = await response.text()
                console.error("[Sarvam STT] API Error:", response.status, err)
                throw new Error(`Sarvam STT Error ${response.status}: ${err}`)
            }

            const data = await response.json()
            console.log("[Sarvam STT] Success! Transcript length:", data.transcript?.length)
            return data.transcript || ""
        } catch (error) {
            console.error("[Sarvam] STT failed unexpectedly:", error)
            throw error
        }
    }

    /**
     * Translate text using Mayura v1
     * Mayura has a 1000 character limit per request, so we chunk long texts.
     */
    async translate(text: string, source: string, target: string): Promise<string> {
        if (!this.apiKey) throw new Error("SARVAM_API_KEY is missing")
        if (!text || text.trim().length === 0) return ""

        console.log(`[Sarvam Translate] Request: ${source} -> ${target}, length: ${text.length} chars`)

        // Mayura v1 has 1000 char limit — chunk if needed
        const MAX_CHARS = 900
        if (text.length > MAX_CHARS) {
            console.log(`[Sarvam Translate] Text exceeds ${MAX_CHARS} chars, chunking...`)
            return this.translateChunked(text, source, target, MAX_CHARS)
        }

        return this.translateSingle(text, source, target)
    }

    private async translateSingle(text: string, source: string, target: string): Promise<string> {
        try {
            const body = {
                input: text,
                source_language_code: source,
                target_language_code: target,
                model: "mayura:v1",
                mode: "formal",
                speaker_gender: "Female",
                enable_preprocessing: true,
            }

            console.log("[Sarvam Translate] Sending request:", JSON.stringify(body).substring(0, 200))

            const response = await fetch(`${this.baseUrl}/translate`, {
                method: "POST",
                headers: {
                    "api-subscription-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const err = await response.text()
                console.error("[Sarvam Translate] API Error:", response.status, err)
                throw new Error(`Sarvam Translation Error ${response.status}: ${err}`)
            }

            const data = await response.json()
            console.log("[Sarvam Translate] Success, translated:", data.translated_text?.substring(0, 80))
            return data.translated_text || ""
        } catch (error) {
            console.error("[Sarvam Translate] Failed:", error)
            throw error
        }
    }

    /**
     * Translate long text by splitting into paragraphs first to preserve structure
     */
    private async translateChunked(text: string, source: string, target: string, maxChars: number): Promise<string> {
        // Split by paragraphs first (double newline)
        const paragraphs = text.split(/\n\n+/)
        const translatedParagraphs: string[] = []

        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
                translatedParagraphs.push("")
                continue
            }

            // If a single paragraph is still too long, split by sentences
            if (paragraph.length > maxChars) {
                const sentences = paragraph.split(/(?<=[.!?])\s+/)
                const sentenceChunks: string[] = []
                let current = ""

                for (const sentence of sentences) {
                    if ((current + " " + sentence).length > maxChars && current.length > 0) {
                        sentenceChunks.push(current.trim())
                        current = sentence
                    } else {
                        current = current ? current + " " + sentence : sentence
                    }
                }
                if (current.trim()) sentenceChunks.push(current.trim())

                const translatedChunks: string[] = []
                for (const chunk of sentenceChunks) {
                    try {
                        translatedChunks.push(await this.translateSingle(chunk, source, target))
                    } catch {
                        translatedChunks.push(chunk)
                    }
                }
                translatedParagraphs.push(translatedChunks.join(" "))
            } else {
                try {
                    translatedParagraphs.push(await this.translateSingle(paragraph, source, target))
                } catch {
                    translatedParagraphs.push(paragraph)
                }
            }
        }

        return translatedParagraphs.join("\n\n")
    }

    /**
     * Text-to-Speech using Bulbul v2
     */
    async textToSpeech(text: string, language: string = "hi"): Promise<string> {
        if (!this.apiKey) throw new Error("SARVAM_API_KEY is missing")

        // Convert structured AI response into natural spoken text
        const cleanText = this.prepareTextForSpeech(text)

        // TTS has limits — truncate to ~500 chars for voice
        const ttsText = cleanText.length > 500 ? cleanText.substring(0, 497) + "." : cleanText

        // Map language codes correctly — Marathi gets its own code
        const langCode = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN"

        try {
            const response = await fetch(`${this.baseUrl}/text-to-speech`, {
                method: "POST",
                headers: {
                    "api-subscription-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: [ttsText],
                    target_language_code: langCode,
                    model: "bulbul:v2",
                    speaker: "anushka",
                    pitch: 0,
                    pace: 0.9,
                    loudness: 1.2,
                    speech_sample_rate: 24000
                }),
            })

            if (!response.ok) {
                const err = await response.text()
                console.error("[Sarvam TTS] API Error:", response.status, err)
                throw new Error(`Sarvam TTS Error ${response.status}: ${err}`)
            }

            const data = await response.json()
            return data.audios?.[0] || ""
        } catch (error) {
            console.error("[Sarvam] TTS failed:", error)
            throw error
        }
    }

    /**
     * Convert structured AI text (markdown, lists, emojis) into natural spoken prose.
     * This is critical for making TTS sound human rather than robotic.
     */
    private prepareTextForSpeech(text: string): string {
        let spoken = text
            // Remove code blocks entirely
            .replace(/```[\s\S]*?```/g, "")
            // Remove markdown headers but keep the text
            .replace(/#+\s/g, "")
            // Remove bold/italic/strikethrough markers
            .replace(/[*_~`]/g, "")
            // Replace markdown links with just the text
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
            // Remove image references
            .replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
            // Remove URLs
            .replace(/https?:\/\/[^\s]+/g, "")
            // Remove blockquote markers
            .replace(/>\s/g, "")
            // Remove table dividers
            .replace(/\|/g, " ")
            // Remove all emojis
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/gu, "")

        // Replace line breaks with natural pauses (periods)
        // Multiple newlines = stronger pause
        spoken = spoken
            .replace(/\n{2,}/g, ". ")
            .replace(/\n/g, ", ")

        // Clean up leftover symbols
        spoken = spoken
            .replace(/[^a-zA-Z0-9\s\u0900-\u097F\u0980-\u09FF.,!?;:'"()-]/g, " ")
            // Fix double punctuation from conversions
            .replace(/[.,]{2,}/g, ".")
            .replace(/,\s*\./g, ".")
            .replace(/\.\s*,/g, ".")
            // Collapse multiple spaces
            .replace(/\s+/g, " ")
            .trim()

        // Ensure text ends with proper punctuation for natural stopping
        if (spoken && !spoken.match(/[.!?]$/)) {
            spoken += "."
        }

        return spoken
    }
}

export const sarvamClient = new SarvamClient()
