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

        const openaiKey = process.env.OPENAI_API_KEY || ""
        const groqKey = process.env.GROQ_API_KEY || ""

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
        const userPrompt = prompt || "Analyze this image. Identify the crop/plant and assess its health condition. If the plant is healthy, indicate so and provide general care tips without unnecessary chemical treatments. If diseased or pest-affected, identify the specific issue, severity, and treatments."

        // Multi-provider vision model candidates
        const modelConfigs: Array<{ provider: "openai" | "groq"; model: string; key: string; url: string }> = []

        if (openaiKey) {
            modelConfigs.push(
                { provider: "openai", model: "gpt-4o-mini", key: openaiKey, url: "https://api.openai.com/v1/chat/completions" },
                { provider: "openai", model: "gpt-4o", key: openaiKey, url: "https://api.openai.com/v1/chat/completions" }
            )
        }

        if (groqKey) {
            modelConfigs.push(
                { provider: "groq", model: "llama-3.2-11b-vision-preview", key: groqKey, url: "https://api.groq.com/openai/v1/chat/completions" }
            )
        }

        let analysis = ""
        let finalModel = ""
        let lastError = ""

        for (const config of modelConfigs) {
            try {
                console.log(`[Vision] Attempting analysis with provider: ${config.provider}, model: ${config.model}`)
                const response = await fetch(config.url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${config.key}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: config.model,
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
                        temperature: 0.2,
                        max_tokens: 1024,
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    analysis = data.choices[0]?.message?.content || ""
                    if (analysis) {
                        finalModel = `${config.provider}:${config.model}`
                        break
                    }
                } else {
                    const err = await response.text()
                    console.warn(`[Vision] Model ${config.model} failed:`, err)
                    lastError = `${response.status} - ${err}`
                }
            } catch (e: any) {
                console.error(`[Vision] Exception with ${config.model}:`, e)
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

        console.log(`[Vision] Analysis complete using ${finalModel}`)

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
            en: `You are AgriDetect, an expert agricultural vision and crop health AI.
Thoroughly inspect and analyze the uploaded image before answering:

🔍 **MANDATORY VISUAL INSPECTION STEPS**:
1. Examine all visual details: leaves (surface, margins, veins), flowers, fruits, stems, and soil.
2. Check for actual visual evidence: discoloration, spots, wilting, powdery mildew, pest presence, or healthy green tissue.
3. Base your analysis STRICTLY on visible evidence. Do NOT assume or invent diseases that are not visible.

🌱 **RESPONSE STRUCTURE**:
1. 🌱 **Plant/Crop Identification**: Common name and botanical name.
2. 🩺 **Health Assessment**: State clearly whether the plant is **Healthy** or has an active problem.

- **IF THE PLANT IS HEALTHY (No visible disease/pest)**:
  - State: "Health Status: Healthy & Flourishing"
  - Provide brief, practical care tips (watering, sunlight, ideal soil).
  - DO NOT output disease severity, chemical pesticides, fungicides, or hypothetical problem treatments.

- **IF A DISEASE, PEST, OR NUTRIENT DEFICIENCY IS VISIBLE**:
  - 🔬 **Diagnosis**: Specific disease/pest/deficiency name based on visible evidence.
  - 📋 **Observed Symptoms**: What is physically visible on the plant in the photo.
  - ⚠️ **Severity**: Low / Medium / High / Critical.
  - 💊 **Treatment**: Organic remedies and targeted chemical treatments with proper dosages.
  - 🛡️ **Prevention**: Actionable prevention steps.
  - 🌿 **Sustainability Tip**: Eco-friendly approach.

${ragContext ? `Use the following Expert Knowledge Base context if applicable for specific remedies:\n${ragContext}` : ""}

Be direct, scientifically grounded, farmer-friendly, and concise.`,
            hi: `आप AgriDetect हैं, एक विशेषज्ञ कृषि दृष्टि और फसल स्वास्थ्य AI सहायक।
अपलोड की गई छवि का सटीक विश्लेषण करें और पौधे की स्थिति के अनुसार उत्तर दें:

1. 🌱 **फसल/पौधे की पहचान**: पौधे/फसल का नाम (सामान्य और वैज्ञानिक नाम) बताएं।
2. 🩺 **स्वास्थ्य स्थिति**: स्पष्ट बताएं कि पौधा **स्वस्थ (Healthy)** है या इसमें कोई रोग, कीट या पोषक तत्वों की कमी है।

**स्थिति अनुसार निर्देश**:
- **यदि पौधा स्वस्थ है (कोई रोग/कीट नहीं है)**:
  - स्पष्ट रूप से बताएं कि पौधा स्वस्थ है।
  - सामान्य देखभाल के संक्षिप्त सुझाव दें (पानी, धूप, पोषण)।
  - स्वस्थ पौधे के लिए अनावश्यक रासायनिक उपचार, फफूंदनाशक या बीमारी की रोकथाम न बताएं।

- **यदि कोई रोग, कीट या समस्या दिखाई दे**:
  - 🔬 **रोग/कीट पहचान**: विशिष्ट समस्या का नाम बताएं।
  - 📋 **लक्षण**: पौधे पर दिखाई देने वाले लक्षण बताएं।
  - ⚠️ **गंभीरता**: कम / मध्यम / अधिक।
  - 💊 **उपचार**: जैविक और रासायनिक उपाय।
  - 🛡️ **रोकथाम**: आगे बचाव के उपाय।

${ragContext ? `सटीक सलाह के लिए इस ज्ञानकोश का उपयोग करें:\n${ragContext}` : ""}

**महत्वपूर्ण निर्देश**:
1. अपना पूरा उत्तर केवल **हिंदी** में ही दें।
2. आप एक महिला सहायक हैं। अपने हिंदी उत्तरों में **स्त्रीलिंग (Feminine)** व्याकरणिक शब्दों का उपयोग करें (जैसे "रही हूँ", "बताती हूँ", "आई है")।`,
            mr: `तुम्ही AgriDetect आहात, एक तज्ञ कृषी दृष्टी आणि पीक आरोग्य AI सहाय्यक.
अपलोड केलेल्या प्रतिमेचे अचूक विश्लेषण करा आणि वनस्पतीच्या स्थितीनुसार प्रतिसाद द्या:

1. 🌱 **पीक/वनस्पती ओळख**: वनस्पती/पिकाचे नाव (सामान्य आणि वैज्ञानिक नाव) सांगा.
2. 🩺 **आरोग्य स्थिती**: वनस्पती **निरोगी (Healthy)** आहे की त्यात कोणताही रोग, कीड किंवा समस्या आहे ते स्पष्ट सांगा.

**स्थितीनुसार सूचना**:
- **जर वनस्पती निरोगी असेल (कोणताही रोग/कीड दिसत नाही)**:
  - वनस्पती पूर्णपणे निरोगी असल्याचे स्पष्ट सांगा.
  - सामान्य काळजी घेण्याच्या सोप्या टिप्स द्या (पाणी, सूर्यप्रकाश, माती).
  - निरोगी वनस्पतीसाठी अनावश्यक कीटकनाशके, बुरशीनाशके किंवा रासायनिक उपचार देऊ नका.

- **जर कोणताही रोग, कीड किंवा समस्या दिसत असेल**:
  - 🔬 **रोग/कीड ओळख**: समस्येचे नाव सांगा.
  - 📋 **लक्षणे**: वनस्पतीवर दिसणारी लक्षणे सांगा.
  - ⚠️ **तीव्रता**: कमी / मध्यम / गंभीर.
  - 💊 **उपचार**: सेंद्रिय आणि रासायनिक उपाय.
  - 🛡️ **प्रतिबंध**: भविष्यातील संरक्षणासाठी उपाय.

${ragContext ? `तज्ञ सल्ल्यासाठी या ज्ञानकोशाचा वापर करा:\n${ragContext}` : ""}

**महत्त्वाच्या सूचना**:
1. तुमचे पूर्ण उत्तर फक्त **मराठीतच** द्या.
2. तुम्ही एक महिला सहाय्यक आहात. तुमच्या मराठी उत्तरांमध्ये **स्त्रीलिंगी (Feminine)** व्याकरणिक शब्दांचा वापर करा (उदा. "करते", "सांगते").`,
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
