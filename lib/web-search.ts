export async function performWebSearch(query: string): Promise<string> {
    console.log(`[v0] Performing enhanced live web search for: "${query}"`);

    try {
        // Broaden the search query for better results if it's a price query
        const refinedQuery = query.toLowerCase().includes("price") ? `${query} mandi rate today` : query;

        const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(refinedQuery)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });

        if (!response.ok) {
            console.warn("[v0] Web search failed with status:", response.status);
            return "";
        }

        const html = await response.text();

        // Direct class-based extraction for DuckDuckGo HTML
        const titleRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        const snippetRegex = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

        let titles: string[] = [];
        let snippets: string[] = [];
        let match;

        while ((match = titleRegex.exec(html)) !== null && titles.length < 6) {
            titles.push(match[1].replace(/<[^>]*>/g, "").trim());
        }

        while ((match = snippetRegex.exec(html)) !== null && snippets.length < 6) {
            snippets.push(match[1].replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").trim());
        }

        let combinedResults: string[] = [];
        for (let i = 0; i < titles.length; i++) {
            combinedResults.push(`[Result ${i + 1}]:\nTitle: ${titles[i]}\nSnippet: ${snippets[i] || "N/A"}`);
        }

        // Price detection (handles ₹, Rs, per kg, per quintal, etc)
        const priceRegex = /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)(?:\/\w+)?(?:\s*per\s*\w+)?/gi;
        const priceMatches = html.match(priceRegex);

        let priceContext = "";
        if (priceMatches && priceMatches.length > 0) {
            const uniquePrices = Array.from(new Set(priceMatches)).slice(0, 8);
            priceContext = `\n\n--- DETECTED PRICE POINTS ---\n- Rates Found: ${uniquePrices.join(", ")}\n------------------------------\n`;
        }

        if (combinedResults.length === 0) {
            return priceContext;
        }

        return `\n\n--- LIVE WEB CONTEXT (EXTERNAL DATA) ---\n${combinedResults.join("\n\n")}${priceContext}\n\nNOTE: These results were retrieved from the live web to provide the latest pricing and market data.\n----------------------------------------\n`;

    } catch (error) {
        console.error("[v0] Web search error:", error);
        return "";
    }
}
