import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
})

export async function POST(request: NextRequest) {
  try {
    console.log("[Voice Chat] API called")

    const { text, language, farmerData } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    console.log(`[Voice Chat] Processing query in ${language}: "${text.substring(0, 50)}..."`)

    // Step 1: Generate response directly in the user's language
    // Llama 3.3 handles regional languages natively with MUCH higher accuracy
    // and context awareness than the double translation approach.
    const systemPrompt = getVoiceSystemPrompt(language, farmerData)

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })

    const response = completion.choices[0]?.message?.content || "I'm processing your request..."

    console.log("[Voice Chat] Response generated successfully")

    return NextResponse.json({
      response,
      language,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Voice Chat] Error:", error)
    return NextResponse.json({ error: "Failed to process voice query" }, { status: 500 })
  }
}

function getVoiceSystemPrompt(language: string, farmerData: any): string {
  const prompts = {
    en: `You are AgriBot's Voice AI Assistant for farmers. You have access to the farmer's profile:
- Name: ${farmerData?.name || "Farmer"}
- Crops: ${farmerData?.crops?.join(", ") || "Various crops"}
- Location: ${farmerData?.farmLocation?.state || "India"}, ${farmerData?.farmLocation?.district || ""}
- Soil Type: ${farmerData?.soilType || "Mixed"}
- Farm Area: ${farmerData?.farmAreaAcres || "Small"} acres

Provide helpful, accurate responses about:
- Weather conditions and forecasts
- Mandi market rates and pricing
- Crop recommendations and AgriBot products
- Farming techniques and best practices
- Disease identification and treatment

Keep responses concise (2-3 sentences) and farmer-friendly. Always mention relevant AgriBot products when appropriate.
CRITICAL: You MUST respond only in English. Do not use any other language.`,

    hi: `आप AgriBot के किसान वॉइस AI असिस्टेंट हैं। आपके पास किसान की प्रोफाइल है:
- नाम: ${farmerData?.name || "किसान"}
- फसलें: ${farmerData?.crops?.join(", ") || "विभिन्न फसलें"}
- स्थान: ${farmerData?.farmLocation?.state || "भारत"}, ${farmerData?.farmLocation?.district || ""}
- मिट्टी का प्रकार: ${farmerData?.soilType || "मिश्रित"}

इन विषयों पर सहायक, सटीक जवाब दें:
1. 🌦️ मौसम की स्थिति और पूर्वानुमान
2. 💰 मंडी बाजार दरें और मूल्य निर्धारण
3. 🌱 फसल सिफारिशें और AgriBot उत्पाद
4. 🚜 खेती की तकनीक और सर्वोत्तम प्रथाएं
5. 🔬 रोग पहचान और उपचार

जवाब संक्षिप्त (2-3 वाक्य) और किसान-अनुकूल रखें। उपयुक्त होने पर हमेशा संबंधित AgriBot उत्पादों का उल्लेख करें।
CRITICAL: आपको केवल हिंदी में ही उत्तर देना चाहिए। किसी अन्य भाषा का उपयोग न करें। विशेष रूप से, अंग्रेजी का उपयोग बिल्कुल न करें।`,

    mr: `तुम्ही AgriBot चे शेतकरी व्हॉइस AI असिस्टंट आहात. तुमच्याकडे शेतकऱ्याची प्रोफाइल आहे:
- नाव: ${farmerData?.name || "शेतकरी"}
- पिके: ${farmerData?.crops?.join(", ") || "विविध पिके"}
- स्थान: ${farmerData?.farmLocation?.state || "भारत"}, ${farmerData?.farmLocation?.district || ""}
- मातीचा प्रकार: ${farmerData?.soilType || "मिश्र"}

या विषयांवर उपयुक्त, अचूक उत्तरे द्या:
1. 🌦️ हवामान परिस्थिती आणि अंदाज
2. 💰 मंडी बाजार दर आणि किंमत
3. 🌱 पीक शिफारसी आणि AgriBot उत्पादने
4. 🚜 शेती तंत्र आणि सर्वोत्तम पद्धती
5. 🔬 रोग ओळख आणि उपचार

उत्तरे संक्षिप्त (२-३ वाक्ये) आणि शेतकरी-अनुकूल ठेवा. योग्य असताना नेहमी संबंधित AgriBot उत्पादनांचा उल्लेख करा।
CRITICAL: तुम्ही फक्त मराठीतच उत्तर दिले पाहिजे. इतर कोणत्याही भाषेचा वापर करू नका. विशेषतः, इंग्रजीचा अजिबात वापर करू नका. तुमचा टोन अनौपचारिक आणि मैत्रीपूर्ण असावा, जसा तुम्ही गप्पा मारत आहात.`,
  }

  return prompts[language as keyof typeof prompts] || prompts.en
}
