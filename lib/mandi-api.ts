export interface MandiPriceRecord {
    state: string;
    district: string;
    market: string;
    commodity: string;
    variety: string;
    grade: string;
    arrival_date: string;
    min_price: number;
    max_price: number;
    modal_price: number;
}

export interface MandiPricesResponse {
    records: MandiPriceRecord[];
    total: number;
}

const COMMODITY_SYNONYMS: Record<string, string[]> = {
    "Rice": ["Paddy(Dhan)(Common)", "Paddy(Dhan)(Grade A)", "Rice"],
    "Wheat": ["Wheat"],
    "Onion": ["Onion"],
    "Tomato": ["Tomato"],
    "Potato": ["Potato"],
    "Cotton": ["Cotton"],
    "Soyabean": ["Soyabean"],
    "Maize": ["Maize"],
    "Gram": ["Gram Raw(Whole)", "Gram(Whole)", "Bengal Gram(Gram)"],
    "Tur": ["Arhar (Tur/Red Gram)(Whole)", "Tur"],
    "Moong": ["Moong(Green Gram)(Whole)", "Moong"],
    "Urad": ["Black Gram (Urad)(Whole)", "Urad"],
    "Mustard": ["Mustard", "Mustard Seed"],
    "Sugarcane": ["Sugarcane"],
    "Groundnut": ["Groundnut"],
};

/**
 * Fetches real-time mandi prices from the data.gov.in API.
 */
export async function fetchMandiPrices(
    commodity: string,
    state?: string
): Promise<MandiPriceRecord[]> {
    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey) {
        console.warn("DATA_GOV_API_KEY is not set. Cannot fetch mandi prices.");
        return [];
    }

    try {
        const formattedState = state ? state.charAt(0).toUpperCase() + state.slice(1).toLowerCase() : "";
        const formattedCommodity = commodity ? commodity.charAt(0).toUpperCase() + commodity.slice(1).toLowerCase() : "";

        // Determine search keywords (original + synonyms)
        const searchKeywords = COMMODITY_SYNONYMS[formattedCommodity] || [formattedCommodity];

        console.log(`[Mandi API] Searching for ${formattedCommodity} (Keywords: ${searchKeywords.join(", ")}) in ${formattedState}`);

        const baseUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=10`;

        for (const keyword of searchKeywords) {
            let url = baseUrl + `&filters[commodity]=${encodeURIComponent(keyword)}`;
            if (formattedState) {
                url += `&filters[state]=${encodeURIComponent(formattedState)}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 3600 }
            });

            if (!response.ok) continue;

            const data: MandiPricesResponse = await response.json();
            if (data.records && data.records.length > 0) {
                return data.records;
            }
        }

        return [];

    } catch (error) {
        console.error("Error fetching mandi prices:", error);
        return [];
    }
}
