/**
 * Multi-Agent Router
 * 
 * Intent detection and query routing for 8 specialized agricultural AI agents.
 * Uses keyword matching with weighted scoring and confidence thresholds.
 * Supports coordinated multi-agent responses when queries span multiple domains.
 */

export interface AgentRoute {
    agentId: string
    agentName: string
    confidence: number
    icon: string
    color: string
    specialty: string
}

export interface RoutingResult {
    primary: AgentRoute
    secondary: AgentRoute | null
    isMultiAgent: boolean
    safetyFlags: string[]
}

// Agent definitions with routing keywords and weights
const AGENT_DEFINITIONS: Record<string, {
    name: string
    icon: string
    color: string
    specialty: string
    keywords: { term: string; weight: number }[]
    contextKeywords: string[] // Broader context terms (lower weight)
}> = {
    "agri-detect": {
        name: "AgriDetect",
        icon: "🔬",
        color: "bg-red-500",
        specialty: "Crop Disease & Pest Detection",
        keywords: [
            { term: "disease", weight: 3 },
            { term: "pest", weight: 3 },
            { term: "insect", weight: 2.5 },
            { term: "blight", weight: 3 },
            { term: "rot", weight: 2.5 },
            { term: "fungus", weight: 3 },
            { term: "virus", weight: 2 },
            { term: "symptom", weight: 2.5 },
            { term: "infection", weight: 3 },
            { term: "spots", weight: 2 },
            { term: "wilt", weight: 2.5 },
            { term: "leaf", weight: 1.5 },
            { term: "detect", weight: 2 },
            { term: "identify", weight: 1.5 },
            { term: "diagnosis", weight: 3 },
            { term: "pathogen", weight: 3 },
            { term: "larvae", weight: 2.5 },
            { term: "aphid", weight: 3 },
            { term: "caterpillar", weight: 2.5 },
            { term: "mildew", weight: 3 },
            { term: "yellowing", weight: 2 },
            { term: "brown", weight: 1 },
        ],
        contextKeywords: ["crop", "plant", "field", "farm", "damage", "attack", "image", "photo"]
    },
    "seed-sage": {
        name: "Seed Sage",
        icon: "🌱",
        color: "bg-green-500",
        specialty: "Region-Based Seed Recommendation",
        keywords: [
            { term: "seed", weight: 3 },
            { term: "variety", weight: 3 },
            { term: "hybrid", weight: 3 },
            { term: "germination", weight: 3 },
            { term: "sowing", weight: 2.5 },
            { term: "cultivar", weight: 3 },
            { term: "seedling", weight: 2.5 },
            { term: "nursery", weight: 2 },
            { term: "propagation", weight: 2 },
            { term: "planting", weight: 2 },
            { term: "yield", weight: 1.5 },
            { term: "resistant", weight: 1.5 },
            { term: "breed", weight: 2 },
            { term: "genetic", weight: 2 },
            { term: "recommend", weight: 1 },
            { term: "best crop", weight: 2.5 },
            { term: "which crop", weight: 2.5 },
            { term: "what to plant", weight: 3 },
            { term: "what should i grow", weight: 3 },
        ],
        contextKeywords: ["region", "soil", "season", "climate", "zone", "area"]
    },
    "market-oracle": {
        name: "Market Oracle",
        icon: "📊",
        color: "bg-purple-500",
        specialty: "Mandi Price & Market Analysis",
        keywords: [
            { term: "price", weight: 4 },
            { term: "mandi", weight: 3.5 },
            { term: "market", weight: 2.5 },
            { term: "rate", weight: 3 },
            { term: "भाव", weight: 3.5 }, // Marathi/Hindi for rate/price
            { term: "मंडी", weight: 4 }, // Hindi for Mandi
            { term: "बाजार", weight: 3 }, // Hindi/Marathi for market
            { term: "किंमत", weight: 3.5 }, // Marathi for price
            { term: "दर", weight: 3 }, // Marathi/Hindi for rate
            { term: "sell", weight: 2 },
            { term: "trade", weight: 2.5 },
            { term: "export", weight: 2 },
            { term: "wholesale", weight: 2.5 },
            { term: "retail", weight: 2 },
            { term: "commodity", weight: 2.5 },
            { term: "trend", weight: 2 },
            { term: "demand", weight: 2 },
            { term: "supply", weight: 2 },
            { term: "profit", weight: 2 },
            { term: "income", weight: 1.5 },
            { term: "cost", weight: 3.5 },
            { term: "value", weight: 1.5 },
            { term: "auction", weight: 2.5 },
            { term: "buyer", weight: 2 },
            { term: "msp", weight: 3 },
            { term: "minimum support price", weight: 3.5 },
        ],
        contextKeywords: ["earn", "money", "revenue", "forecast", "analytics", "विक्री", "खरेदी", "नफा"]
    },
    "weather-intel": {
        name: "Weather Intelligence",
        icon: "🌦️",
        color: "bg-blue-500",
        specialty: "Weather Forecasting & Alerts",
        keywords: [
            { term: "weather", weight: 3.5 },
            { term: "rain", weight: 3 },
            { term: "rainfall", weight: 3 },
            { term: "temperature", weight: 3 },
            { term: "humidity", weight: 3 },
            { term: "forecast", weight: 3 },
            { term: "storm", weight: 3 },
            { term: "drought", weight: 3 },
            { term: "monsoon", weight: 3.5 },
            { term: "climate", weight: 2 },
            { term: "wind", weight: 2.5 },
            { term: "hail", weight: 3 },
            { term: "frost", weight: 3 },
            { term: "cold", weight: 1.5 },
            { term: "hot", weight: 1.5 },
            { term: "flood", weight: 2.5 },
            { term: "cyclone", weight: 3 },
            { term: "thunder", weight: 2.5 },
            { term: "sunny", weight: 2 },
            { term: "cloud", weight: 2 },
        ],
        contextKeywords: ["today", "tomorrow", "week", "season", "alert", "warning"]
    },
    "rotation-master": {
        name: "Rotation Master",
        icon: "🔄",
        color: "bg-amber-500",
        specialty: "Crop Rotation Planning",
        keywords: [
            { term: "rotation", weight: 3.5 },
            { term: "soil health", weight: 3 },
            { term: "nutrient", weight: 2.5 },
            { term: "nitrogen", weight: 2.5 },
            { term: "phosphorus", weight: 2.5 },
            { term: "potassium", weight: 2.5 },
            { term: "legume", weight: 2 },
            { term: "fallow", weight: 3 },
            { term: "intercrop", weight: 3 },
            { term: "crop cycle", weight: 3.5 },
            { term: "companion", weight: 2 },
            { term: "succession", weight: 2.5 },
            { term: "depleted", weight: 2 },
            { term: "replenish", weight: 2 },
            { term: "cover crop", weight: 3 },
            { term: "green manure", weight: 3 },
            { term: "previous crop", weight: 3 },
            { term: "next crop", weight: 2.5 },
            { term: "after harvest", weight: 2 },
        ],
        contextKeywords: ["plan", "schedule", "sequence", "alternate", "cycle"]
    },
    "irrigation-planner": {
        name: "Irrigation Planner",
        icon: "💧",
        color: "bg-cyan-500",
        specialty: "Water-Optimized Irrigation",
        keywords: [
            { term: "irrigation", weight: 3.5 },
            { term: "water", weight: 2.5 },
            { term: "drip", weight: 3 },
            { term: "sprinkler", weight: 3 },
            { term: "canal", weight: 2.5 },
            { term: "groundwater", weight: 3 },
            { term: "moisture", weight: 2.5 },
            { term: "scheduling", weight: 2 },
            { term: "watering", weight: 3 },
            { term: "pump", weight: 2 },
            { term: "borewell", weight: 2.5 },
            { term: "flood irrigation", weight: 3 },
            { term: "micro irrigation", weight: 3.5 },
            { term: "water table", weight: 3 },
            { term: "conserve", weight: 1.5 },
            { term: "evaporation", weight: 2 },
            { term: "mulch", weight: 2 },
            { term: "dry", weight: 1.5 },
        ],
        contextKeywords: ["save", "efficient", "resource", "shortage", "supply"]
    },
    "training-hub": {
        name: "Training Hub",
        icon: "📚",
        color: "bg-teal-500",
        specialty: "Fertilizer & Pesticide Guidance",
        keywords: [
            { term: "fertilizer", weight: 3 },
            { term: "pesticide", weight: 3 },
            { term: "herbicide", weight: 3 },
            { term: "fungicide", weight: 3 },
            { term: "insecticide", weight: 3 },
            { term: "organic", weight: 2 },
            { term: "dosage", weight: 3 },
            { term: "safety", weight: 2 },
            { term: "application", weight: 1.5 },
            { term: "training", weight: 2 },
            { term: "ppe", weight: 3 },
            { term: "spray", weight: 2.5 },
            { term: "chemical", weight: 2 },
            { term: "bio", weight: 1.5 },
            { term: "compost", weight: 2.5 },
            { term: "manure", weight: 2 },
            { term: "urea", weight: 3 },
            { term: "dap", weight: 3 },
            { term: "npk", weight: 3 },
            { term: "neem", weight: 2 },
            { term: "precaution", weight: 2.5 },
            { term: "how to apply", weight: 2.5 },
            { term: "mixing", weight: 2 },
        ],
        contextKeywords: ["guide", "tutorial", "learn", "best practice", "method"]
    },
    "maha-yojana": {
        name: "MahaYojana AI",
        icon: "🏛️",
        color: "bg-yellow-500",
        specialty: "Government Schemes & Subsidies",
        keywords: [
            { term: "scheme", weight: 3.5 },
            { term: "yojana", weight: 3.5 },
            { term: "subsidy", weight: 3.5 },
            { term: "mahadbt", weight: 4 },
            { term: "loan", weight: 3.5 },
            { term: "grant", weight: 3 },
            { term: "insurance", weight: 3 },
            { term: "vima", weight: 3 },
            { term: "pmkisan", weight: 4 },
            { term: "pm-kisan", weight: 4 },
            { term: "pmfby", weight: 4 },
            { term: "government", weight: 2.5 },
            { term: "apply", weight: 2.5 },
            { term: "eligibility", weight: 3 },
            { term: "document", weight: 2.5 },
            { term: "fundkar", weight: 3 },
            { term: "magel tyala", weight: 3.5 },
            { term: "shet tale", weight: 3.5 },
        ],
        contextKeywords: ["benefit", "money", "help", "support", "state", "central"]
    },
}


// Safety keywords that trigger guardrails
const SAFETY_TRIGGERS = [
    { term: "poison", severity: "high" as const },
    { term: "kill animals", severity: "high" as const },
    { term: "toxic dose", severity: "high" as const },
    { term: "banned", severity: "medium" as const },
    { term: "illegal", severity: "high" as const },
    { term: "overdose", severity: "high" as const },
    { term: "harmful chemical", severity: "medium" as const },
    { term: "dangerous mix", severity: "high" as const },
]

/**
 * Route a user query to the most appropriate agent(s)
 */
export function routeQuery(query: string): RoutingResult {
    const lowerQuery = query.toLowerCase()

    // Safety check
    const safetyFlags: string[] = []
    for (const trigger of SAFETY_TRIGGERS) {
        if (lowerQuery.includes(trigger.term)) {
            safetyFlags.push(`⚠️ ${trigger.severity.toUpperCase()}: Query mentions "${trigger.term}" — AI safety guardrails engaged`)
        }
    }

    // Score each agent
    const scores: { agentId: string; score: number }[] = []

    for (const [agentId, definition] of Object.entries(AGENT_DEFINITIONS)) {
        let score = 0

        // Primary keyword matching
        for (const { term, weight } of definition.keywords) {
            if (lowerQuery.includes(term)) {
                score += weight
            }
        }

        // Context keyword matching (lower weight)
        for (const contextTerm of definition.contextKeywords) {
            if (lowerQuery.includes(contextTerm)) {
                score += 0.5
            }
        }

        scores.push({ agentId, score })
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    const topScore = scores[0]
    const secondScore = scores[1]

    // Build primary route
    const primaryDef = AGENT_DEFINITIONS[topScore.agentId]
    const primary: AgentRoute = {
        agentId: topScore.agentId,
        agentName: primaryDef.name,
        confidence: Math.min(topScore.score / 6, 1), // Normalize to 0-1
        icon: primaryDef.icon,
        color: primaryDef.color,
        specialty: primaryDef.specialty
    }

    // If top score is very low, default to a general help persona
    if (topScore.score < 1.5) {
        primary.agentId = "agri-bot" // Generic ID
        primary.agentName = "AgriBot"
        primary.confidence = 0.5
        primary.icon = "🤖"
        primary.color = "bg-slate-500"
        primary.specialty = "General Assistant"
    }

    // Check for multi-agent routing
    let secondary: AgentRoute | null = null
    let isMultiAgent = false

    if (secondScore && secondScore.score > 2 && (secondScore.score / topScore.score) > 0.5) {
        const secondDef = AGENT_DEFINITIONS[secondScore.agentId]
        secondary = {
            agentId: secondScore.agentId,
            agentName: secondDef.name,
            confidence: Math.min(secondScore.score / 6, 1),
            icon: secondDef.icon,
            color: secondDef.color,
            specialty: secondDef.specialty
        }
        isMultiAgent = true
    }

    return { primary, secondary, isMultiAgent, safetyFlags }
}

/**
 * Get agent definition by ID
 */
export function getAgentDefinition(agentId: string) {
    return AGENT_DEFINITIONS[agentId] || {
        name: "AgriBot",
        icon: "🤖",
        color: "bg-slate-500",
        specialty: "General Assistant",
        keywords: [],
        contextKeywords: []
    }
}

/**
 * Get all agent definitions
 */
export function getAllAgents() {
    return Object.entries(AGENT_DEFINITIONS).map(([id, def]) => ({
        id,
        ...def
    }))
}
/**
 * Detect if the query requires live real-time information from the web
 */
export function needsLiveSearch(query: string): boolean {
    const lowerQuery = query.toLowerCase()
    const liveKeywords = [
        "today", "now", "currently", "latest", "war", "conflict", "israel", "iran",
        "news", "breaking", "russia", "ukraine", "election", "budget 2024", "budget 2025",
        "recent", "newest", "price", "cost", "how much", "rate", "live"
    ]

    return liveKeywords.some(keyword => lowerQuery.includes(keyword))
}
