import { type NextRequest, NextResponse } from "next/server"
import { groqClient } from "@/lib/groq-client"
import { ragEngine } from "@/lib/rag-engine"
import { routeQuery, needsLiveSearch } from "@/lib/agent-router"
import { performWebSearch } from "@/lib/web-search"

/**
 * POST /api/rag/chat
 * Unified RAG chatbot endpoint with multi-agent routing
 */
export async function POST(request: NextRequest) {
    try {
        const {
            message,
            language = "en",
            agentId: requestedAgentId,
            farmerData,
            conversationHistory = []
        } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            )
        }

        console.log("[RAG Chat] Processing message:", message.substring(0, 100))

        // Step 1: Route query to appropriate agent
        const routing = routeQuery(message)
        const agentId = requestedAgentId || routing.primary.agentId

        console.log(`[RAG Chat] Routed to: ${routing.primary.agentName} (confidence: ${routing.primary.confidence.toFixed(2)})`)
        if (routing.isMultiAgent) {
            console.log(`[RAG Chat] Secondary agent: ${routing.secondary?.agentName}`)
        }

        // Step 2: Search RAG knowledge base
        const ragResults = ragEngine.search(message, 5, agentId)
        const ragContext = ragEngine.buildContext(ragResults)

        console.log(`[RAG Chat] Retrieved ${ragResults.length} context chunks`)

        // Step 3: Safety check
        const safety = ragEngine.checkSafety(message)
        const allSafetyFlags = [...routing.safetyFlags, ...safety.warnings]

        // Step 4: Build farmer context string
        let farmerContext = ""
        if (farmerData) {
            farmerContext = `\n\nFarmer Profile:\n- Name: ${farmerData.name || "Unknown"}\n- Location: ${farmerData.farmLocation?.state || "India"}, ${farmerData.farmLocation?.district || ""}\n- Crops: ${farmerData.crops?.join(", ") || "Not specified"}\n- Soil: ${farmerData.soilType || "Not analyzed"}\n- Area: ${farmerData.farmAreaAcres || "Unknown"} acres\n- Irrigation: ${farmerData.irrigationType || "Not specified"}`
        }

        // Step 4b: Check for Live Web Search requirement
        if (needsLiveSearch(message)) {
            console.log("[RAG Chat] Live search triggered for query:", message)
            const webContext = await performWebSearch(message)
            if (webContext) {
                farmerContext += webContext
            }
        }

        // Step 4c: Market Intelligence (Mandi Prices/Costs)
        // Trigger if routed to market-oracle OR if query explicitly mentions price/cost
        const queryIncludesPrice = message.toLowerCase().match(/price|cost|rate|mandi|भाव|मंडी|बाजार|किंमत|दर/i);

        if (agentId === "market-oracle" || queryIncludesPrice) {
            console.log("[Market Oracle] Market intelligence triggered. Extracting commodity and location...");
            const extraction = await groqClient.extractCommodityAndLocation(message);

            if (extraction && extraction.commodity) {
                const { fetchMandiPrices } = await import('@/lib/mandi-api');
                const prices = await fetchMandiPrices(extraction.commodity, extraction.state);

                if (prices.length > 0) {
                    console.log(`[Market Oracle] Found ${prices.length} real-time mandi prices.`);
                    let priceContext = `\n\nREAL-TIME MANDI PRICES (DATA.GOV.IN):\n`;
                    prices.forEach((p, idx) => {
                        priceContext += `${idx + 1}. ${p.commodity} in ${p.market}, ${p.district}, ${p.state} - Min: ₹${p.min_price}, Modal: ₹${p.modal_price}, Max: ₹${p.max_price} (Date: ${p.arrival_date})\n`;
                    });
                    farmerContext += priceContext;
                } else {
                    console.log("[Market Oracle] No official API data. Triggering specialized price web search.");
                    const searchQuery = `current mandi price of ${extraction.commodity} in ${extraction.state || 'India'} today`;
                    const webPrices = await performWebSearch(searchQuery);
                    if (webPrices) {
                        farmerContext += webPrices;
                        console.log(`[Market Oracle] Successfully added web search fallback data (${webPrices.length} chars)`);
                    } else {
                        console.warn("[Market Oracle] Web search fallback returned empty results.");
                        farmerContext += `\n\n[NOTICE]: Real-time pricing search was performed for ${extraction.commodity} in ${extraction.state || 'India'} but no data was returned from external sources.`;
                    }
                }
            } else {
                console.warn("[Market Oracle] Extraction failed to find a commodity.");
                farmerContext += `\n\n[NOTICE]: Unable to determine the specific crop from your request to fetch live prices.`;
            }
        }

        // Step 5: High-Quality Response Generation
        // We now generate the response directly in the user's requested language.
        // Groq's Llama 3.3 has high native proficiency in Hindi and Marathi, which
        // provides much better accuracy and cultural nuance than double translation.
        const fullContext = ragContext + farmerContext
        let response = await groqClient.generateRAGResponse(
            agentId,
            message,
            fullContext,
            language,
            conversationHistory,
            allSafetyFlags
        )

        // Step 6: Build response with metadata
        const ragSources = ragResults
            .filter(r => r.relevance !== "low")
            .map(r => ({
                source: r.document.metadata.source,
                relevance: r.relevance,
                score: Math.round(r.score * 100) / 100,
                domain: r.document.metadata.agentDomain
            }))

        return NextResponse.json({
            success: true,
            response,
            agentId,
            agentName: routing.primary.agentName,
            agentIcon: routing.primary.icon,
            agentColor: routing.primary.color,
            confidence: routing.primary.confidence,
            isMultiAgent: routing.isMultiAgent,
            secondaryAgent: routing.secondary ? {
                id: routing.secondary.agentId,
                name: routing.secondary.agentName,
                icon: routing.secondary.icon,
            } : null,
            ragSources,
            safetyFlags: allSafetyFlags,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("[RAG Chat] Error:", error)
        return NextResponse.json(
            {
                error: "Failed to process message",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}
