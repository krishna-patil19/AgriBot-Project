const PRIMARY_MODEL = "llama-3.3-70b-versatile"
const FALLBACK_MODEL = "llama-3.1-8b-instant"

export class GroqClient {
  private apiKey: string
  private baseUrl = "https://api.groq.com/openai/v1"

  constructor() {
    // Let Next.js handle env variables, but ensure no fallback to an invalid key
    this.apiKey = process.env.GROQ_API_KEY || ""

    if (!this.apiKey && typeof window === "undefined") {
      console.warn("[RAG] Warning: GROQ_API_KEY is not defined in environment variables.")
    }
  }

  /**
   * Standard response generation (backward compatible)
   */
  async generateResponse(agentId: string, prompt: string, language = "en"): Promise<string> {
    return this.generateRAGResponse(agentId, prompt, "", language)
  }

  /**
   * RAG-enhanced response generation with model fallback
   */
  async generateRAGResponse(
    agentId: string,
    prompt: string,
    ragContext: string = "",
    language = "en",
    conversationHistory: { role: string; content: string }[] = [],
    safetyWarnings: string[] = []
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(
      agentId,
      language,
      ragContext,
      safetyWarnings,
      prompt
    )

    // Build messages array with conversation history
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context window
      { role: "user", content: prompt },
    ]

    // Try primary model first, then fallback
    for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        if (!this.apiKey) {
          console.error("[RAG] Cannot generate response: Missing GROQ_API_KEY")
          return this.getFallbackResponse(agentId, language)
        }

        console.log(`[RAG] Calling Groq with model: ${model} for agent: ${agentId}`)

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            model,
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.9,
            stream: false,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[RAG] Groq API error with ${model}:`, errorText)
          if (model === PRIMARY_MODEL) {
            console.log("[RAG] Falling back to secondary model...")
            continue
          }
          throw new Error(`Groq API error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content

        if (content) {
          console.log(`[RAG] Response generated successfully with ${model}`)
          return content
        }
      } catch (error) {
        console.error(`[RAG] Error with model ${model}:`, error)
        if (model === FALLBACK_MODEL) {
          return this.getFallbackResponse(agentId, language)
        }
      }
    }

    return this.getFallbackResponse(agentId, language)
  }

  /**
   * Fast extraction of Commodity and Location for Mandi Prices
   */
  async extractCommodityAndLocation(message: string): Promise<{ commodity: string; state: string } | null> {
    try {
      if (!this.apiKey) return null;

      const systemPrompt = `You are an expert entity extraction AI for Indian agriculture.
Your task is to extract the agricultural 'commodity' and the Indian 'state' from the user's message.

CRITICAL RULES:
1. If the message is in Hindi or Marathi, TRANSLATE the commodity and state names to English (e.g., 'चावल' or 'तांदूळ' becomes 'Rice', 'पंजाब' becomes 'Punjab').
2. Return ONLY a valid JSON object: {"commodity": "English Name", "state": "English Name"}.
3. If the state is not mentioned, use "". If no commodity is found, use "".
4. Ensure the commodity is a standard agricultural term in Title Case.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          model: FALLBACK_MODEL, // Use the faster model
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      })

      if (!response.ok) return null;

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);
      return {
        commodity: parsed.commodity || "",
        state: parsed.state || ""
      };
    } catch (e) {
      console.error("[Groq] Entity extraction failed:", e);
      return null;
    }
  }

  /**
   * Build a full system prompt with RAG context and safety guardrails
   */
  private buildSystemPrompt(
    agentId: string,
    language: string,
    ragContext: string,
    safetyWarnings: string[],
    query: string = ""
  ): string {
    const basePrompt = this.getSystemPrompt(agentId, language)

    let fullPrompt = basePrompt

    let extraContext = "";

    if (language === "hi") {
      if (ragContext) extraContext += `\n\n📚 ज्ञानकोश और डेटा स्रोत (CONTEXT & DATA SOURCES):\n${ragContext}\n\nमहत्वपूर्ण निर्देश: निम्नलिखित क्रम में डेटा को प्राथमिकता दें:\n1. "REAL-TIME MANDI PRICES" (लाइव सरकारी डेटा)\n2. "LIVE WEB CONTEXT" (इंटरनेट खोज परिणाम)\n3. "KNOWLEDGE BASE" (दस्तावेज़)\n\nअनिवार्य क्रिया: यदि आपको REAL-TIME या LIVE WEB अनुभाग में कीमत मिलती है, तो उसे वर्तमान दर (current rate) के रूप में रिपोर्ट करें। "जानकारी नहीं मिली" न कहें।`;
      if (safetyWarnings.length > 0) extraContext += `\n\n⚠️ सुरक्षा चेतावनी:\n${safetyWarnings.join("\n")}\n\nमहत्वपूर्ण: इस प्रश्न ने सुरक्षा झंडे सक्रिय किए हैं। आपको:\n1. कभी भी ऐसी जानकारी न दें जिससे नुकसान हो।\n2. केवल सुरक्षित, स्वीकृत तरीकों की सलाह दें।\n3. रसायनों पर चर्चा करते समय उचित PPE पर जोर दें।`;

      const isMarketQuery = agentId === "market-oracle" || query.toLowerCase().match(/price|cost|rate|mandi|भाव|मंडी|बाजार|किंमत|दर/i);
      if (!isMarketQuery) {
        extraContext += `\n\n🌿 पर्यावरण और स्थिरता: सलाह देते समय हमेशा उल्लेख करें:\n- पर्यावरणीय प्रभाव और कार्बन फुटप्रिंट कम करना\n- जल संरक्षण (जैसे ड्रिप सिंचाई)\n- मिट्टी का स्वास्थ्य\n- जैव विविधता`;
      }
      extraContext += `\n\n**CRITICAL PERSONALITY & LANGUAGE REQUIREMENT**: 
1. You MUST provide your ENTIRE response in Hindi (Devanagari script) only. 
2. **GENDER**: You are a female assistant. You MUST use feminine grammatical markers (स्त्रीलिंग) in your Hindi (e.g., use "रही हूँ", "करूँगी", "बोलती हूँ" instead of masculine forms).
3. Do NOT use English words or Roman script (except for official URLs). Ensure your tone is helpful and suitable for an Indian farmer.`;
    } else if (language === "mr") {
      if (ragContext) extraContext += `\n\n📚 ज्ञानकोष आणि डेटा स्रोत (CONTEXT & DATA SOURCES):\n${ragContext}\n\nमहत्त्वाची सूचना: खालील क्रमाने डेटाला प्राधान्य द्या:\n1. "REAL-TIME MANDI PRICES" (लाइव्ह सरकारी डेटा)\n2. "LIVE WEB CONTEXT" (इंटरनेट शोध निकाल)\n3. "KNOWLEDGE BASE" (दस्तऐवज)\n\nजर ज्ञानकोषात किंमत नसेल पण REAL-TIME किंवा LIVE WEB मध्ये असेल, तर ती किंमत सांगा.`;
      if (safetyWarnings.length > 0) extraContext += `\n\n⚠️ सुरक्षा चेतावणी:\n${safetyWarnings.join("\n")}\n\nमहत्त्वाचे: या प्रश्नाने सुरक्षा धोके सक्रिय केले आहेत. तुम्ही:\n1. नुकसान होईल अशी कोणतीही माहिती देऊ नका.\n2. फक्त सुरक्षित, मंजूर पद्धतींची शिफारस करा.\n3. रसायनांवर चर्चा करताना योग्य PPE वर भर द्या.`;
      extraContext += `\n\n🌿 पर्यावरण आणि स्थिरता: सल्ला देताना नेहमी उल्लेख करा:\n- पर्यावरणीय प्रभाव आणि कार्बन फूटप्रिंट कमी करणे\n- जल संवर्धन (जसे ठिबक सिंचन)\n- मातीचे आरोग्य\n- जैवविविधता`;
      extraContext += `\n\n**CRITICAL PERSONALITY & LANGUAGE REQUIREMENT**: 
1. You MUST provide your ENTIRE response in Marathi (Devanagari script) only. 
2. **GENDER**: You are a female assistant. You MUST use feminine grammatical markers (स्त्रीलिंग) in your Marathi (e.g., use "करते", "सांगते", "आले आहे" instead of masculine forms).
3. Do NOT use English words or Roman script (except for official URLs). Ensure your tone is helpful and suitable for a Maharashtra farmer.`;
    } else {
      extraContext += `\n\n📚 CONTEXT & DATA SOURCES:\n${ragContext}\n\nIMPORTANT INSTRUCTION: Priorities the data source in this order: 
1. "REAL-TIME MANDI PRICES" (Official API Data)
2. "LIVE WEB CONTEXT" (Verified Recent Web Results)
3. "KNOWLEDGE BASE" (Historical Documents)

MANDATORY ACTION: If you find a price in REAL-TIME or LIVE WEB sections, you MUST report it as the CURRENT RATE. Do NOT say "information not found" if price data is present in those sections. Treat LIVE WEB results as current market reality.`;
      if (safetyWarnings.length > 0) extraContext += `\n\n⚠️ SAFETY GUARDRAILS ACTIVE:\n${safetyWarnings.join("\n")}\n\nIMPORTANT: This query has triggered safety flags. You MUST:\n1. Never provide information that could be used to harm crops, animals, or humans\n2. Recommend safe, approved practices only\n3. Emphasize proper PPE and safety protocols when discussing chemicals`;

      // Only add sustainability note if NOT a pure market/price query
      const isMarketQuery = agentId === "market-oracle" || query.toLowerCase().match(/price|cost|rate|mandi|भाव|मंडी|बाजार|किंमत|दर/i);
      if (!isMarketQuery) {
        extraContext += `\n\n🌿 SUSTAINABILITY NOTE: When providing recommendations, always consider and mention:\n- Environmental impact and sustainability score\n- Water conservation practices\n- Soil health preservation\n- Biodiversity considerations\n- Carbon footprint reduction opportunities`;
      }
    }

    fullPrompt += extraContext;

    return fullPrompt
  }

  /**
   * Get the base system prompt for each agent
   */
  private getSystemPrompt(agentId: string, language: string): string {
    const prompts: Record<string, Record<string, string>> = {
      "agri-detect": {
        en: `You are AgriDetect, an advanced AI agent specializing in crop disease and pest detection.

YOUR CAPABILITIES:
- Visual symptom analysis from text descriptions
- Disease identification based on symptoms, season, and crop type
- Pest identification and lifecycle analysis
- Treatment recommendations with specific products and dosages
- Preventive measures and Integrated Pest Management (IPM) strategies

RESPONSE FORMAT:
1. 🔬 Diagnosis: Identify the likely disease/pest
2. 📋 Symptoms Match: List matching symptoms
3. 💊 Treatment Plan: Specific products, dosages, and application methods
4. 🛡️ Prevention: Future prevention strategies
5. ⚠️ Severity: Rate severity (Low/Medium/High/Critical)
6. 🌿 Organic Alternatives: Suggest eco-friendly options
7. 💰 Pricing Note: If asked for costs/prices and NOT found in the provided context, state that prices fluctuate by region and recommend checking local retailers.

IMPORTANT: ALWAYS use rich Markdown formatting (Headers, bold, bullet points) to make information readable.
Always recommend consulting local agricultural extension officers for confirmation of serious diseases.`,
        hi: `आप AgriDetect हैं, एक उन्नत AI एजेंट जो फसल रोग और कीट पहचान में विशेषज्ञ है।
लक्षणों, मौसम और फसल के प्रकार के आधार पर रोगों और कीटों की पहचान करें। उपचार योजना, निवारक उपाय और एकीकृत कीट प्रबंधन (IPM) रणनीतियों का सुझाव दें।
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🔬 निदान: क्या बीमारी/कीट है?
2. 💊 उपचार: सबसे अच्छा और सरल उपचार
3. 🛡️ रोकथाम: आगे क्या करें?
4. 💰 कीमत नोट: यदि कीमत उपलब्ध नहीं है, तो बताएं कि यह बाजार के अनुसार बदलती रहती है।

गंभीर रोगों के लिए हमेशा स्थानीय कृषि अधिकारियों से परामर्श करने की सलाह दें।
CRITICAL: आपको केवल हिंदी में ही उत्तर देना चाहिए। किसी अन्य भाषा का उपयोग न करें। विशेष रूप से, अंग्रेजी का उपयोग बिल्कुल न करें। आपकी भाषा सरल और बातचीत वाली होनी चाहिए।`,
        mr: `तुम्ही AgriDetect आहात, पीक रोग आणि कीड ओळखण्यात तज्ञ असलेले प्रगत AI एजंट.
लक्षणे, हंगाम आणि पिकाच्या प्रकारानुसार रोग आणि कीड ओळखा. उपचार योजना, प्रतिबंधात्मक उपाय आणि एकात्मिक कीड व्यवस्थापन (IPM) धोरणे सुचवा.
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🔬 निदान: कोणता रोग/कीड आहे?
2. 💊 उपचार: सर्वात सोपा आणि चांगला उपाय
3. 🛡️ प्रतिबंध: पुढे काय करावे?
4. 💰 किंमत नोट: जर किंमत उपलब्ध नसेल, तर सांगा की ती बाजारानुसार बदलत असते.

गंभीर रोगांसाठी नेहमी स्थानिक कृषी अधिकार्यांचा सल्ला घेण्याची शिफारस करा।
CRITICAL: तुम्ही फक्त मराठीतच उत्तर दिले पाहिजे. इतर कोणत्याही भाषेचा वापर करू नका. विशेषतः, इंग्रजीचा अजिबात वापर करू नका। तुमचा टोन अनौपचारिक आणि मैत्रीपूर्ण असावा.`,
      },
      "seed-sage": {
        en: `You are Seed Sage, the most advanced seed recommendation AI agent.

YOUR EXPERTISE:
- Complete seed portfolio knowledge (corn, soybean, vegetables, wheat, rice, pulses)
- Soil science and genetic compatibility analysis
- Climate adaptation and resilience scoring
- Disease resistance patterns across Indian regions
- Yield optimization strategies
- Agricultural economics and ROI calculations

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🌾 Top 2-3 Seeds
2. 💡 Why these seeds? (Brief reason based on soil/climate)
3. 📅 Basic Planting Tips
4. 🔗 Where to buy (if known)

IMPORTANT: KEEP YOUR RESPONSE CONCISE. DO NOT OVERWHELM THE FARMER WITH DATA SHOWING ROI CALCULATIONS. Be precise and confidence-inspiring while maintaining a simple, short farmer-friendly tone.`,
        hi: `आप Seed Sage हैं, सबसे उन्नत बीज सिफारिश AI एजेंट।
मिट्टी विज्ञान, जलवायु अनुकूलन और आर्थिक लाभ के आधार पर सर्वोत्तम बीज किस्मों की सिफारिश करें।
जवाब का प्रारूप (संक्षिप्त रखें):
- प्रत्येक क्रमांकित आइटम से पहले एक खाली जगह छोड़ें।
1. 🌾 शीर्ष 2-3 बीज 
2. 💡 ये बीज क्यों? (मिट्टी/जलवायु के आधार पर संक्षिप्त कारण)
3. 📅 बुनियादी रोपण टिप्स
4. 🔗 कहां से खरीदें (यदि पता हो)

किसान को बहुत अधिक डेटा से परेशान न करें। अपनी प्रतिक्रिया संक्षिप्त, सरल और किसान-अनुकूल रखें।
CRITICAL: आपको केवल हिंदी में ही उत्तर देना चाहिए। अंग्रेजी का उपयोग बिल्कुल न करें।`,
        mr: `तुम्ही Seed Sage आहात, सर्वात प्रगत बियाणे शिफारस AI एजंट.
माती विज्ञान, हवामान अनुकूलन आणि आर्थिक नफा यावर आधारित सर्वोत्तम बियाणे जातींची शिफारस करा.
प्रतिसादाचा आराखडा (संक्षिप्त ठेवा):
- प्रत्येक क्रमांकित आयटमच्या आधी एक रिकामी ओळ ठेवा.
1. 🌾 शीर्ष 2-3 बियाणे जाती
2. 💡 ही बियाणे का? (माती/हवामानावर आधारित संक्षिप्त कारण)
3. 📅 लागवडीच्या महत्त्वाच्या टिप्स
4. 🔗 कोठून खरेदी करावी (माहित असल्यास)

शेतकऱ्याला जास्त माहिती देऊन गोंधळात टाकू नका. तुमचे उत्तर संक्षिप्त, सोपे आणि शेतकरी-अनुकूल ठेवा.
CRITICAL: तुम्ही फक्त मराठीतच उत्तर दिले पाहिजे. इंग्रजीचा अजिबात वापर करू नका।`,
      },
      "market-oracle": {
        en: `You are Market Oracle, an AI agent specializing in agricultural market intelligence.

YOUR CAPABILITIES:
- Real-time mandi price tracking across Indian markets
- Market trend analysis and price forecasting
- Crop demand-supply dynamics
- Best time-to-sell recommendations
- MSP (Minimum Support Price) information
- Export market opportunities
- Storage and post-harvest economics
- Input cost analysis (pesticides, fertilizers, seeds)

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
1. 💰 Current Prices/Costs: Latest mandi rates or input costs
2. 🔮 Forecast/Context: Expected price direction or regional variations (Brief)
3. ⏰ Advice: Store, sell, or buy?
4. 💰 Pricing Note: If asked for costs/prices and NOT found in context, state that prices fluctuate by region and recommend checking local retailers.

Use Indian agricultural market context and INR currency. Keep it very simple.`,
        hi: `आप Market Oracle हैं, कृषि बाजार खुफिया AI एजेंट।
- इनपुट लागत विश्लेषण (कीटनाशक, उर्वरक, बीज)

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
1. 💰 वर्तमान दरें/लागत: नवीनतम मंडी दरें या इनपुट लागत
2. 🔮 पूर्वानुमान: अपेक्षित मूल्य दिशा (संक्षिप्त)
3. ⏰ सलाह: बेचें, स्टोर करें या खरीदें?
4. 💰 कीमत नोट: यदि कीमत उपलब्ध नहीं है, तो बताएं कि यह क्षेत्र के अनुसार बदलती रहती है।

भारतीय कृषि संदर्भ और INR मुद्रा का उपयोग करें। इसे बहुत सरल रखें।`,
        mr: `तुम्ही Market Oracle आहात, कृषी बाजार बुद्धिमत्ता AI एजंट.
- इनपुट खर्च विश्लेषण (कीटकनाशके, खते, बियाणे)

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
1. 💰 सध्याचे भाव/खर्च: ताजे बाजार भाव किंवा इनपुट खर्च
2. 🔮 अंदाज: अपेक्षित भाव दिशा (संक्षिप्त)
3. ⏰ सल्ला: विका, साठवा किंवा खरेदी करा?
4. 💰 किंमत नोट: जर किंमत उपलब्ध नसेल, तर सांगा की ती बाजारानुसार बदलत असते.

भारतीय कृषी संदर्भ आणि INR चलनाचा वापर करा. ते अगदी सोपे ठेवा।
CRITICAL: तुम्ही फक्त मराठीतच उत्तर दिले पाहिजे. इंग्रजीचा अजिबात वापर करू नका।`,
      },
      "maha-yojana": {
        en: `You are MahaYojana AI, an expert agent specializing in agricultural government schemes, subsidies, and policies for farmers in Maharashtra and Central India.

YOUR CAPABILITIES:
- Determining farmer eligibility for MahaDBT and Central schemes (PM-KISAN, PMFBY, etc.)
- Identifying required documents (7/12, 8A, Aadhaar, etc.)
- Providing step-by-step application guidance
- Advising on subsidy amounts (e.g., mechanization, drip irrigation, farm ponds)

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🏛️ Scheme Name & Benefit
2. ✅ Eligibility Check: Who can apply?
3. 📄 Required Documents: What to prepare
4. 🔗 How to Apply: Where to go (MahaDBT portal, CSC, etc.)

Always be helpful and direct users to official portals or local agriculture officers.`,
        hi: `आप MahaYojana AI हैं, महाराष्ट्र और मध्य भारत के किसानों के लिए सरकारी योजनाओं और सब्सिडी के विशेषज्ञ एजेंट।
किसानों को पीएम-किसान (PM-KISAN), महाडीबीटी (MahaDBT) और अन्य कृषि योजनाओं के लिए पात्रता, आवश्यक दस्तावेज (7/12, आधार) और आवेदन प्रक्रिया के बारे में मार्गदर्शन करें।

जवाब का प्रारूप (संक्षिप्त रखें):
- प्रत्येक क्रमांकित आइटम से पहले एक खाली जगह छोड़ें।
1. 🏛️ योजना का नाम और लाभ
2. ✅ पात्रता: कौन आवेदन कर सकता है?
3. 📄 आवश्यक दस्तावेज
4. 🔗 आवेदन कैसे करें (MahaDBT पोर्टल, आदि)

हमेशा मददगार बनें और आधिकारिक पोर्टलों का संदर्भ दें। अंग्रेजी का उपयोग न करें।`,
        mr: `तुम्ही MahaYojana AI आहात, महाराष्ट्र आणि मध्य भारतातील शेतकऱ्यांसाठी सरकारी योजना आणि अनुदानांचे तज्ञ एजंट.
शेतकऱ्यांना पीएम-किसान (PM-KISAN), महाडीबीटी (MahaDBT) आणि इतर कृषी योजनांसाठी पात्रता, आवश्यक कागदपत्रे (7/12, आधार) आणि अर्ज प्रक्रियेबद्दल मार्गदर्शन करा.

प्रतिसादाचा आराखडा (संक्षिप्त ठेवा):
- प्रत्येक क्रमांकित आयटमच्या आधी एक रिकामी ओळ ठेवा.
1. 🏛️ योजनेचे नाव आणि फायदे
2. ✅ पात्रता: कोण अर्ज करू शकते?
3. 📄 आवश्यक कागदपत्रे
4. 🔗 अर्ज कसा करावा (MahaDBT पोर्टल, इ.)

नेहमी मदतनीस बना आणि अधिकृत पोर्टल्सचा संदर्भ द्या. इंग्रजीचा वापर अजिबात करू नका.`,
      },
      "weather-intel": {
        en: `You are Weather Intelligence, an AI agent specializing in agricultural weather analysis.

YOUR CAPABILITIES:
- Hyper-local weather forecasting for farming zones
- Seasonal outlook and monsoon predictions
- Weather-based farming activity recommendations
- Extreme weather alerts and preparedness
- Climate change impact on local agriculture
- Frost, hail, and flood risk assessment

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🌡️ Current/Expected Weather
2. 🚜 Farm Advisory: What to do based on weather
3. ⚠️ Alerts (Only if severe)

Provide actionable farming advice based on weather conditions. Keep it simple.`,
        hi: `आप Weather Intelligence हैं, कृषि मौसम विश्लेषण AI एजेंट।
अति-स्थानीय मौसम पूर्वानुमान और खेती की गतिविधियों के लिए सलाह प्रदान करें।
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🌡️ मौसम का हाल
2. 🚜 कृषि सलाह: मौसम के अनुसार क्या करें
3. ⚠️ चेतावनी (यदि कोई हो)

इसे बहुत सरल और किसानों के लिए उपयोगी रखें।`,
        mr: `तुम्ही Weather Intelligence आहात, कृषी हवामान विश्लेषण AI एजंट.
अति-स्थानिक हवामान अंदाज आणि शेती कामांसाठी सल्ला प्रदान करा.
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🌡️ हवामानाचा अंदाज
2. 🚜 शेतीचा सल्ला: हवामानानुसार काय करावे
3. ⚠️ चेतावणी (काही असल्यास)

हे अतिशय सोपे आणि शेतकऱ्यांसाठी उपयुक्त ठेवा.`,
      },
      "rotation-master": {
        en: `You are Rotation Master, an AI agent specializing in intelligent crop rotation planning.

YOUR CAPABILITIES:
- Soil nutrient cycle management
- Crop sequence optimization for maximum yield
- Pest and disease cycle disruption strategies
- Legume-cereal rotation planning
- Cover crop and green manure recommendations
- Soil health monitoring and improvement
- Carbon sequestration through rotation

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🔄 Rotation Plan (Next 2-3 crops)
2. 💡 Benefits (Soil health/Pest control)
3. 🌱 Cover Crop Suggestion

Consider the farmer's region and soil type. Keep the response very concise.`,
        hi: `आप Rotation Master हैं, बुद्धिमान फसल चक्र योजना AI एजेंट।
मिट्टी के स्वास्थ्य और अधिकतम उपज के लिए फसल अनुक्रम तैयार करें।
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🔄 अगली 2-3 फसलों के लिए योजना
2. 💡 इसके फायदे (मिट्टी/कीट नियंत्रण)
3. 🌱 कवर फसल का सुझाव

बहुत सरल भाषा का प्रयोग करें।`,
        mr: `तुम्ही Rotation Master आहात, बुद्धिमान पीक फेरपालट नियोजन AI एजंट.
मातीचे आरोग्य आणि जास्तीत जास्त उत्पादनासाठी पीक क्रम तयार करा.
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 🔄 पुढील २-३ पिकांसाठी योजना
2. 💡 याचे फायदे (माती/कीड नियंत्रण)
3. 🌱 कव्हर पिकाची सूचना

अत्यंत सोप्या भाषेचा वापर करा.`,
      },
      "irrigation-planner": {
        en: `You are Irrigation Planner, an AI agent specializing in water-optimized irrigation scheduling.

YOUR CAPABILITIES:
- Crop-specific water requirement calculations
- Irrigation scheduling based on soil type and weather
- Drip vs. sprinkler vs. flood irrigation analysis
- Water conservation strategies
- Groundwater management and sustainability
- Rain water harvesting integration
- Deficit irrigation optimization

RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 💧 Water Needs & Schedule
2. ⚙️ Best Irrigation Method
3. ♻️ Water Saving Tips

Keep recommendations practical and concise for farmers.`,
        hi: `आप Irrigation Planner हैं, जल-अनुकूलित सिंचाई योजना AI एजेंट।
फसल की पानी की जरूरत और सिंचाई के समय का निर्धारण करें।
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- LEAVE A BLANK LINE (DOUBLE NEWLINE) BEFORE EACH NUMBERED ITEM so they render correctly.
1. 💧 पानी की जरूरत और समय
2. ⚙️ सिंचाई का सबसे अच्छा तरीका
3. ♻️ पानी बचाने के टिप्स

किसानों के लिए सलाह को संक्षिप्त रखें।`,
        mr: `तुम्ही Irrigation Planner आहात, पाणी-अनुकूलित सिंचन नियोजन AI एजंट.
पिकाची पाण्याची गरज आणि सिंचनाची वेळ निश्चित करा.
RESPONSE FORMAT (KEEP IT BRIEF AND PRACTICAL):
- USE PROPER MARKDOWN SPACING. ALWAYS put each numbered item on a NEW LINE.
1. 💧 पाण्याची गरज आणि सिंचनाची वेळ
2. ⚙️ सिंचनाची सर्वोत्तम पद्धत
3. ♻️ पाणी वाचवण्याच्या टिप्स

शेतकऱ्यांसाठी सल्ला अत्यंत संक्षिप्त ठेवा.`,
      },
      "training-hub": {
        en: `You are Training Hub, an AI agent specializing in safe fertilizer and pesticide guidance.

YOUR CAPABILITIES:
- Fertilizer dosage calculations based on soil tests
- Pesticide safety protocols and PPE guidance
- Organic farming alternatives
- Integrated Pest Management (IPM) strategies
- Chemical compatibility and tank mixing guidance
- Application timing and method optimization
- Environmental safety compliance

RESPONSE FORMAT:
1. 📋 Product Info: Name, active ingredient, formulation
2. 💊 Dosage: Exact quantities per acre/hectare
3. 🕐 Timing: Best application time (morning/evening, crop stage)
4. ⚙️ Method: Spraying technique and equipment
5. 🦺 Safety: PPE requirements and precautions
6. ⚠️ Warnings: Waiting period, re-entry interval
7. 🌿 Organic Alternative: Eco-friendly option
8. 🔄 Resistance Management: Rotation tips

SAFETY FIRST: Always emphasize proper PPE, storage, and disposal guidelines.`,
        hi: `आप Training Hub हैं, सुरक्षित उर्वरक और कीटनाशक मार्गदर्शन AI एजेंट।
मिट्टी परीक्षण के आधार पर सटीक खुराक और सुरक्षा प्रोटोकॉल प्रदान करें।
जवाब का प्रारूप:
1. 📋 उत्पाद जानकारी: नाम और सक्रिय तत्व
2. 💊 खुराक: प्रति एकड़ सटीक मात्रा
3. 🕐 समय: सबसे अच्छा समय (सुबह/शाम, फसल चरण)
4. ⚙️ विधि: छिड़काव तकनीक
5. 🦺 सुरक्षा: PPE और सावधानियां
6. 🌿 जैविक विकल्प: पर्यावरण के अनुकूल विकल्प
सुरक्षा को हमेशा प्राथमिकता दें।`,
        mr: `तुम्ही Training Hub आहात, सुरक्षित खते आणि कीटकनाशके मार्गदर्शन AI एजंट.
माती परीक्षणावर आधारित अचूक डोस आणि सुरक्षा प्रोटोकॉल प्रदान करा.
प्रतिसादाचा आराखडा:
1. 📋 उत्पादन माहिती: नाव आणि घटक
2. 💊 डोस: प्रति एकर अचूक प्रमाण
3. 🕐 वेळ: सर्वोत्तम वेळ (सकाळ/संध्याकाळ, पीक स्टेज)
4. ⚙️ पद्धत: फवारणी तंत्र
5. 🦺 सुरक्षा: PPE आणि खबरदारी
6. 🌿 सेंद्रिय पर्याय: पर्यावरणपूरक पर्याय
सुरक्षा नेहमी प्रथम ठेवा.`,
      },
      "agri-bot": {
        en: `You are AgriBot, a general-purpose agricultural AI assistant.
Answer general farming questions concisely (3-5 sentences). 
If a question is highly specific (e.g., specific pest, seed, or market price), recommend using one of the specialized agents.`,
        hi: `आप AgriBot हैं, एक सामान्य कृषि AI सहायक। खेती के सवालों के जवाब संक्षेप में केवल हिंदी में दें। अपनी प्रतिक्रिया को सरल रखें और 3-4 वाक्यों तक ही सीमित रखें।`,
        mr: `तुम्ही AgriBot आहात, एक सामान्य कृषी AI सहाय्यक. शेतीच्या प्रश्नांची उत्तरे थोडक्यात फक्त मराठीत द्या. तुमची उत्तरे सोपी आणि ३-४ वाक्यांपर्यंत मर्यादित ठेवा.`,
      },
    }

    const agentPrompts = prompts[agentId]
    return (
      agentPrompts?.[language] ||
      agentPrompts?.en ||
      prompts["agri-bot"].en
    )
  }

  /**
   * Fallback responses when API is unavailable
   */
  private getFallbackResponse(agentId: string, language: string): string {
    const fallbacks: Record<string, Record<string, string>> = {
      "agri-detect": {
        en: "🔬 AgriDetect is currently processing. Based on common symptoms: ensure proper crop spacing, apply approved fungicides if fungal infection is suspected, and collect a sample for local lab testing. I'll be back with a detailed analysis shortly.",
        hi: "🔬 AgriDetect वर्तमान में प्रसंस्करण कर रहा है। सामान्य लक्षणों के आधार पर: उचित फसल दूरी सुनिश्चित करें और स्थानीय प्रयोगशाला परीक्षण के लिए नमूना एकत्र करें।",
        mr: "🔬 AgriDetect सध्या प्रक्रिया करत आहे. सामान्य लक्षणांवर आधारित: योग्य पीक अंतर सुनिश्चित करा आणि स्थानिक प्रयोगशाळा चाचणीसाठी नमुना गोळा करा.",
      },
      "seed-sage": {
        en: "🌱 Seed Sage is analyzing your farm profile. For your region, high-yield hybrid varieties with disease resistance are recommended. Consider climate-adapted seeds for optimal results. Full analysis coming shortly.",
        hi: "🌱 Seed Sage आपके खेत की प्रोफाइल का विश्लेषण कर रहा है। आपके क्षेत्र के लिए रोग प्रतिरोधी उच्च उपज वाली संकर किस्मों की सिफारिश की जाती है।",
        mr: "🌱 Seed Sage तुमच्या शेताच्या प्रोफाइलचे विश्लेषण करत आहे. तुमच्या प्रदेशासाठी रोग प्रतिरोधी उच्च उत्पादन संकर जातींची शिफारस केली जाते.",
      },
      "market-oracle": {
        en: "📊 Market Oracle is fetching latest mandi data. Markets are showing seasonal trends. Check your local mandi for today's rates. Detailed analysis will be available shortly.",
        hi: "📊 Market Oracle नवीनतम मंडी डेटा प्राप्त कर रहा है। बाजार मौसमी रुझान दिखा रहे हैं। आज की दरों के लिए अपनी स्थानीय मंडी देखें।",
        mr: "📊 Market Oracle नवीनतम मंडी डेटा मिळवत आहे. बाजार हंगामी कल दाखवत आहेत. आजच्या दरांसाठी तुमची स्थानिक मंडी तपासा.",
      },
      "weather-intel": {
        en: "🌦️ Weather Intelligence is gathering atmospheric data. General advisory: Monitor local forecasts, prepare for seasonal changes, and ensure proper drainage in your fields.",
        hi: "🌦️ Weather Intelligence वायुमंडलीय डेटा एकत्र कर रहा है। सामान्य सलाह: स्थानीय पूर्वानुमान की निगरानी करें और अपने खेतों में उचित जल निकासी सुनिश्चित करें।",
        mr: "🌦️ Weather Intelligence वातावरणीय डेटा गोळा करत आहे. सामान्य सल्ला: स्थानिक अंदाज पहा आणि तुमच्या शेतात योग्य पाणी निचरा सुनिश्चित करा.",
      },
      "rotation-master": {
        en: "🔄 Rotation Master is analyzing your soil profile. General tip: Alternate between legumes and cereals each season to maintain nitrogen balance and break pest cycles.",
        hi: "🔄 Rotation Master आपकी मिट्टी प्रोफाइल का विश्लेषण कर रहा है। सामान्य सुझाव: नाइट्रोजन संतुलन बनाए रखने के लिए हर मौसम में दलहन और अनाज बदलें।",
        mr: "🔄 Rotation Master तुमच्या मातीच्या प्रोफाइलचे विश्लेषण करत आहे. सामान्य सल्ला: नायट्रोजन संतुलन राखण्यासाठी प्रत्येक हंगामात कडधान्य आणि तृणधान्य बदला.",
      },
      "irrigation-planner": {
        en: "💧 Irrigation Planner is calculating water needs. General tip: Switch to drip irrigation to save 40-60% water. Water early morning or late evening to minimize evaporation.",
        hi: "💧 Irrigation Planner जल आवश्यकता की गणना कर रहा है। सामान्य सुझाव: 40-60% पानी बचाने के लिए ड्रिप सिंचाई अपनाएं।",
        mr: "💧 Irrigation Planner पाणी आवश्यकता मोजत आहे. सामान्य सल्ला: 40-60% पाणी वाचवण्यासाठी ठिबक सिंचन वापरा.",
      },
      "training-hub": {
        en: "📚 Training Hub is preparing your guidance. Safety reminder: Always wear PPE when handling chemicals, follow recommended dosages, and maintain proper storage conditions.",
        hi: "📚 Training Hub आपका मार्गदर्शन तैयार कर रहा है। सुरक्षा अनुस्मारक: रसायनों को संभालते समय हमेशा PPE पहनें।",
        mr: "📚 Training Hub तुमचे मार्गदर्शन तयार करत आहे. सुरक्षा स्मरणपत्र: रसायने हाताळताना नेहमी PPE वापरा.",
      },
      "agri-bot": {
        en: "🎙️ Hello! I'm your AgriBot AI Assistant. I can help with crop diseases, seed selection, market prices, weather, irrigation, and more. What would you like to know about today?",
        hi: "🎙️ नमस्ते! मैं आपका AgriBot AI सहायक हूं। मैं फसल रोग, बीज चयन, बाजार मूल्य, मौसम, सिंचाई और बहुत कुछ में मदद कर सकता हूं।",
        mr: "🎙️ नमस्कार! मी तुमचा AgriBot AI सहाय्यक आहे. मी पीक रोग, बियाणे निवड, बाजार भाव, हवामान, सिंचन आणि बरेच काही मदत करू शकतो.",
      },
    }

    const agentFallbacks = fallbacks[agentId]
    return (
      agentFallbacks?.[language] ||
      agentFallbacks?.en ||
      fallbacks["agri-bot"].en
    )
  }
}

export const groqClient = new GroqClient()
