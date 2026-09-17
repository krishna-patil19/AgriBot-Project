/**
 * lib/sarvam-client.ts
 * Dedicated client for Sarvam AI integration.
 * Supports Saaras v3 (STT), Bulbul v3 (TTS), and Mayura v1 (Translation).
 */

export class SarvamClient {
    private baseUrl = "https://api.sarvam.ai"

    private get key(): string {
        return process.env.SARVAM_API_KEY || ""
    }

    constructor() {
        if (!this.key && typeof window === "undefined") {
            console.warn("[Sarvam] Warning: SARVAM_API_KEY is not defined in environment variables.")
        }
    }

    private normalizeLangCode(code: string): string {
        if (code === "en") return "en-IN"
        if (code === "mr") return "mr-IN"
        if (code === "hi") return "hi-IN"
        return code
    }

    /**
     * Speech-to-Text using Saaras v1
     */
    async speechToText(audioFile: File, language: string = "hi"): Promise<string> {
        const apiKey = this.key
        if (!apiKey) throw new Error("SARVAM_API_KEY is missing")

        console.log(`[Sarvam STT] Starting transcription for ${language}, file: ${audioFile.name}, size: ${audioFile.size}`)

        const formData = new FormData()
        formData.append("file", audioFile)
        formData.append("model", "saaras:v1")
        formData.append("timestamp_format", "none")

        const langCode = this.normalizeLangCode(language)
        formData.append("language_code", langCode)

        try {
            console.log(`[Sarvam STT] Fetching ${this.baseUrl}/speech-to-text with ${langCode}...`)
            const response = await fetch(`${this.baseUrl}/speech-to-text`, {
                method: "POST",
                headers: {
                    "api-subscription-key": apiKey,
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

    async translate(text: string, source: string, target: string): Promise<string> {
        const apiKey = this.key
        if (!apiKey) throw new Error("SARVAM_API_KEY is missing")
        if (!text || text.trim().length === 0) return ""

        const srcCode = this.normalizeLangCode(source)
        const tgtCode = this.normalizeLangCode(target)

        console.log(`[Sarvam Translate] Request: ${srcCode} -> ${tgtCode}, length: ${text.length} chars`)

        // Split by lines to strictly preserve Markdown formatting (bullet points, headers)
        // because translation APIs often strip or flatten newlines.
        const lines = text.split('\n')
        const translatedLines: string[] = []

        // Process sequentially to respect rate limits
        for (const line of lines) {
            if (!line.trim()) {
                translatedLines.push("")
                continue
            }

            // Extract Markdown list formatting (- , * , 1. ) to preserve it
            const match = line.match(/^(\s*[-*0-9.]+\s+)(.*)/)
            let prefix = ""
            let content = line

            if (match) {
                prefix = match[1]
                content = match[2]
            }

            if (!content.trim()) {
                translatedLines.push(line)
                continue
            }

            try {
                let translated = ""
                // If a single line is still too long, chunk by sentences
                if (content.length > 900) {
                    translated = await this.translateChunked(content, srcCode, tgtCode, 900)
                } else {
                    translated = await this.translateSingle(content, srcCode, tgtCode)
                }
                translatedLines.push(prefix + translated)
            } catch (err) {
                console.warn("[Sarvam Translate] Line translation failed, falling back to original:", err)
                translatedLines.push(line)
            }
        }

        return translatedLines.join("\n")
    }

    private async translateSingle(text: string, source: string, target: string): Promise<string> {
        const apiKey = this.key
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

            const response = await fetch(`${this.baseUrl}/translate`, {
                method: "POST",
                headers: {
                    "api-subscription-key": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                throw new Error(`Sarvam Translation Error ${response.status}`)
            }

            const data = await response.json()
            return data.translated_text || ""
        } catch (error) {
            throw error
        }
    }

    /**
     * Translate a very long single line by splitting into sentences
     */
    private async translateChunked(text: string, source: string, target: string, maxChars: number): Promise<string> {
        const sentences = text.split(/(?<=[.!?])\s+/)
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
        return translatedChunks.join(" ")
    }

    /**
     * Text-to-Speech using Sarvam Bulbul v3
     */
    async textToSpeech(text: string, language: string = "hi"): Promise<string> {
        const apiKey = this.key
        if (!apiKey) throw new Error("SARVAM_API_KEY is missing")

        // Convert structured AI response into natural spoken text
        const cleanText = this.prepareTextForSpeech(text, language)

        if (!cleanText) return ""

        // Sarvam Bulbul v3 per-request max characters recommendation (~500-800 chars)
        // Ensure we cut at a sentence boundary rather than midway through words
        let ttsText = cleanText
        if (ttsText.length > 700) {
            const truncated = ttsText.substring(0, 700)
            const lastBreak = Math.max(
                truncated.lastIndexOf("।"),
                truncated.lastIndexOf("."),
                truncated.lastIndexOf("!"),
                truncated.lastIndexOf("?")
            )
            ttsText = (lastBreak > 200 ? truncated.substring(0, lastBreak + 1) : truncated).trim()
            if (!ttsText.match(/[.!?।]$/)) {
                ttsText += language === "hi" || language === "mr" ? "।" : "."
            }
        }

        // Available Bulbul v3 speakers: aditya, ritu, ashutosh, priya, neha, rahul, pooja, rohan, simran, kavya, amit, dev, ishita, shreya, ratan, varun, manan, sumit, roopa, kabir, aayan, shubh, advait, anand, tanya, tarun, sunny, mani, gokul, vijay, shruti, suhani, mohit, kavitha, rehan, soham, rupali
        // Best expressive natural voices:
        // - Marathi (mr): 'rupali' (natural, clear Marathi) or 'soham'
        // - Hindi (hi): 'ritu' (warm, friendly, articulate) or 'priya'
        // - English/Others: 'priya' or 'kavya'
        const langCode = this.normalizeLangCode(language)
        const speaker = language === "mr" ? "rupali" : language === "hi" ? "ritu" : "priya"
        const model = "bulbul:v3"

        try {
            const response = await fetch(`${this.baseUrl}/text-to-speech`, {
                method: "POST",
                headers: {
                    "api-subscription-key": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: [ttsText],
                    target_language_code: langCode,
                    model: model,
                    speaker: speaker,
                    pitch: 0,
                    pace: 1.0,
                    loudness: 1.0,
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
     * Convert structured AI text (markdown, lists, emojis, technical symbols) into natural spoken prose.
     * This is critical for making TTS sound conversational and human rather than robotic.
     */
    prepareTextForSpeech(text: string, language: string = "en"): string {
        if (!text) return ""

        let spoken = text
            // Remove code blocks entirely
            .replace(/```[\s\S]*?```/g, "")
            // Remove inline code ticks
            .replace(/`([^`]+)`/g, "$1")
            // Remove images
            .replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
            // Replace markdown links with just the link text
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
            // Remove raw URLs
            .replace(/https?:\/\/\S+/g, "")
            // Remove markdown headers
            .replace(/^#+\s+/gm, "")
            // Remove bold/italic/strikethrough markers
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/\*([^*]+)\*/g, "$1")
            .replace(/__([^_]+)__/g, "$1")
            .replace(/_([^_]+)_/g, "$1")
            .replace(/~~([^~]+)~~/g, "$1")
            // Remove blockquote markers
            .replace(/^\s*>\s*/gm, "")
            // Convert list bullet points to gentle pauses
            .replace(/^\s*[-*•]\s+/gm, "")
            .replace(/^\s*\d+\.\s+/gm, "")
            // Remove table dividers
            .replace(/\|/g, " ")
            // Format units and ranges smoothly
            .replace(/(\w+)\/(\w+)/g, "$1 per $2")
            .replace(/(\d+)\s*-\s*(\d+)/g, language === "hi" ? "$1 से $2" : language === "mr" ? "$1 ते $2" : "$1 to $2")
            .replace(/(\d+)%/g, language === "hi" ? "$1 प्रतिशत" : language === "mr" ? "$1 टक्के" : "$1 percent")
            // Remove all emojis
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}]/gu, "")
            // Replace multiple newlines with natural pauses
            .replace(/\n{2,}/g, ". ")
            .replace(/\n/g, ", ")
            // Clean up special characters while strictly preserving Devanagari and Latin letters
            .replace(/[^a-zA-Z0-9\s\u0900-\u097F\u0980-\u09FF.,!?;:।'"()-]/g, " ")
            // Clean up repetitive or doubled punctuation
            .replace(/\s+([.,!?;:।])/g, "$1")
            .replace(/([.,!?;:।])\1+/g, "$1")
            .replace(/,\s*\./g, ".")
            .replace(/\.\s*,/g, ".")
            // Collapse whitespace
            .replace(/\s+/g, " ")
            .trim()

        // Strip any leading punctuation
        spoken = spoken.replace(/^[.,!?;:।\s]+/, "").trim()

        // Ensure text ends with proper sentence termination
        if (spoken && !spoken.match(/[.!?।]$/)) {
            spoken += language === "hi" || language === "mr" ? "।" : "."
        }

        return spoken
    }
}

export const sarvamClient = new SarvamClient()
