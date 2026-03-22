import { type NextRequest, NextResponse } from "next/server"
import { ragEngine } from "@/lib/rag-engine"

/**
 * POST /api/rag/vision
 * Analyze images using Groq's vision-capable model (llama-3.2-90b-vision-preview)
 */
export async function POST(request: NextRequest) {
    try {
        const { imageBase64, prompt, language = "en", agentId = "agri-detect" } = await request.json()

        if (!imageBase64) {
            return NextResponse.json({ error: "No image data provided" }, { status: 400 })
        }

        console.log(`[Vision] Processing image for agent: ${agentId} in language: ${language}`)

        const apiKey = process.env.GROQ_API_KEY || ""

        // Step 1: Optional RAG search to assist vision model with expert knowledge
        let ragContext = ""
        if (prompt) {
            const ragResults = ragEngine.search(prompt, 3, agentId)
            ragContext = ragEngine.buildContext(ragResults)
        } else {
            // Generic context for crop diseases if no prompt
            const ragResults = ragEngine.search("common crop pests and diseases treatment", 3, agentId)
            ragContext = ragEngine.buildContext(ragResults)
        }

        const systemPrompt = getVisionPrompt(agentId, language, ragContext)
        const userPrompt = prompt || "Analyze this image. First, identify the crop/plant. Then, identify any diseases, pests, or issues. Suggest treatments based on the provided context."

        // Step 2: Analysis using Groq Vision
        // Llama 4 Scout is the latest stable vision model on Groq as of March 2026
        const primaryModel = "meta-llama/llama-4-scout-17b-16e-instruct"
        const secondaryModel = "pixtral-12b"
        const fallbackModel = "llama-3.2-90b-vision-preview"

        const tryModels = [primaryModel, secondaryModel, fallbackModel]
        let analysis = ""
        let finalModel = ""
        let lastError = ""

        for (const modelId of tryModels) {
            try {
                console.log(`[Vision] Attempting analysis with model: ${modelId}`)
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: "system", content: systemPrompt },
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: userPrompt },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                                        },
                                    },
                                ],
                            },
                        ],
                        temperature: 0.1,
                        max_tokens: 1024,
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    analysis = data.choices[0]?.message?.content || ""
                    if (analysis) {
                        finalModel = modelId
                        break
                    }
                } else {
                    const err = await response.text()
                    console.warn(`[Vision] Model ${modelId} failed:`, err)
                    lastError = `${response.status} - ${err}`
                }
            } catch (e: any) {
                console.error(`[Vision] Exception with ${modelId}:`, e)
                lastError = e.message
            }
        }

        if (!analysis) {
            console.error("[Vision] All models failed. Last error:", lastError)
            return NextResponse.json({
                success: true,
                analysis: `${getFallbackVisionResponse(agentId, language)}\n\n---\n**Debug Info (All Models Failed):** ${lastError.substring(0, 200)}`,
                model: "none",
                agentId,
            })
        }


        console.log("[Vision] Analysis complete")

        return NextResponse.json({
            success: true,
            analysis,
            model: finalModel,
            agentId,
        })
    } catch (error) {
        console.error("[Vision] Error:", error)
        return NextResponse.json(
            { error: "Failed to analyze image", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}

function getVisionPrompt(agentId: string, language: string, ragContext: string = ""): string {
    const prompts: Record<string, Record<string, string>> = {
        "agri-detect": {
            en: `You are AgriDetect, an expert crop disease and pest detection AI. Analyze the image and provide:
1. 🌱 **Crop Identification**: Identify the crop/plant species correctly.
2. 🔬 **Identification**: What disease/pest/issue is visible.
3. 📋 **Symptoms**: Describe observed symptoms in detail.
4. ⚠️ **Severity**: Rate as Low/Medium/High/Critical.
5. 💊 **Treatment**: Specific products, dosages, organic alternatives.
6. 🛡️ **Prevention**: Steps to prevent recurrence.
7. 🌿 **Sustainability Tip**: Eco-friendly approach.

${ragContext ? `Use the following Expert Knowledge Base context for precise treatment advice:\n${ragContext}` : ""}

Be scientific yet farmer-friendly.`,
            hi: `आप AgriDetect हैं, एक विशेषज्ञ फसल रोग और कीट पहचान AI। छवि का विश्लेषण करें और प्रदान करें:
1. 🌱 **फसल की पहचान**: फसल/पौधे की प्रजाति की सही पहचान करें।
2. 🔬 **पहचान**: क्या रोग/कीट/समस्या दिखाई दे रही है।
3. 💊 **उपचार**: विशिष्ट उत्पाद, खुराक और जैविक विकल्प।
4. 🛡️ **रोकथाम**: पुनरावृत्ति को रोकने के उपाय।

${ragContext ? `सटीक उपचार सलाह के लिए इस विशेषज्ञ ज्ञानकोश का उपयोग करें:\n${ragContext}` : ""}

**महत्वपूर्ण निर्देश**:
1. अपना पूरा उत्तर केवल **हिंदी** में ही दें।
2. आप एक महिला सहायक हैं। अपने हिंदी उत्तरों में **स्त्रीलिंग (Feminine)** व्याकरणिक शब्दों का उपयोग करें (जैसे "रही हूँ", "बताती हूँ", "आई है")।`,
            mr: `तुम्ही AgriDetect आहात, एक तज्ञ पीक रोग आणि कीड ओळखणारे AI. प्रतिमेचे विश्लेषण करा आणि खालील माहिती द्या:
1. 🌱 **पीक ओळख**: पिकाची/वनस्पतीची प्रजाती अचूक ओळखा.
2. 🔬 **ओळख**: कोणता रोग/कीड/समस्या दिसत आहे.
3. 💊 **उपचार**: विशिष्ट उत्पादने, डोस आणि सेंद्रिय पर्याय.
4. 🛡️ **प्रतिबंध**: पुन्हा उद्भवू नये म्हणून उपाय.

${ragContext ? `अचूक उपचार सल्ल्यासाठी या तज्ञ ज्ञानकोशाचा वापर करा:\n${ragContext}` : ""}

**महत्त्वाच्या सूचना**:
1. तुमचे पूर्ण उत्तर फक्त **मराठीतच** द्या.
2. तुम्ही एक महिला सहाय्यक आहात. तुमच्या मराठी उत्तरांमध्ये **स्त्रीलिंगी (Feminine)** व्याकरणिक शब्दांचा वापर करा (उदा. "करते", "सांगते", "आले आहे").`,
        }
    }

    const agentPrompts = prompts[agentId] || prompts["agri-detect"]
    return agentPrompts[language] || agentPrompts.en
}

function getFallbackVisionResponse(agentId: string, language: string): string {
    return `🔬 **Image Analysis (Offline Mode)**

I've received your image. While the vision model is currently processing, here are general recommendations:

1. **Take Multiple Angles**: Photograph the affected area from different angles for better diagnosis
2. **Note the Pattern**: Observe if symptoms spread in a pattern (circular = fungal, random = viral)
3. **Check Nearby Plants**: See if neighboring plants show similar symptoms
4. **Sample Collection**: Collect a small sample and visit your nearest Agricultural Extension Officer

💡 **Tip**: Upload a clear, well-lit close-up image for the most accurate AI diagnosis.

I'll provide a detailed analysis once the vision model is available.`
}
