import csv
import json

DOMAIN_KEYWORDS = {
    "agri-detect": ["disease", "pest", "insect", "blight", "rot", "fungus", "virus", "symptom", "lesion", "infection", "pathogen", "aphid", "worm", "infestation", "control measure"],
    "seed-sage": ["seed", "variety", "hybrid", "germination", "sowing", "cultivar", "seedling", "nursery", "propagation", "duration", "spacing"],
    "market-oracle": ["price", "mandi", "market", "rate", "trade", "export", "import", "wholesale", "retail", "commodity", "loan", "kcc", "bank", "subsidy", "financial"],
    "weather-intel": ["weather", "rain", "temperature", "humidity", "forecast", "storm", "drought", "monsoon", "climate", "frost"],
    "rotation-master": ["rotation", "soil health", "nutrient", "nitrogen", "phosphorus", "legume", "fallow", "intercrop", "soil condition", "fym", "compost"],
    "irrigation-planner": ["irrigation", "water", "drip", "sprinkler", "canal", "groundwater", "moisture", "scheduling", "water stagnation", "drain"],
    "training-hub": ["fertilizer", "pesticide", "herbicide", "organic", "dosage", "safety", "application", "training", "ppe", "spraying", "dosage", "urea", "dap", "ssp", "mop", "borax"],
}

def detect_domain(text):
    lower = text.lower()
    best_domain = "voice-ai" # fallback to general/voice-ai
    best_score = 0
    for domain, kws in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in lower)
        if score > best_score:
            best_score = score
            best_domain = domain
    return best_domain

csv_path = r"C:\Users\Diacto\.cache\kagglehub\datasets\daskoushik\farmers-call-query-data-qa\versions\5\questionsv4.csv"
output_path = r"c:\Users\Diacto\Agribot-project\lib\farmers-call-knowledge.ts"

categorized_data = {domain: [] for domain in DOMAIN_KEYWORDS.keys()}
categorized_data["voice-ai"] = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 5000: break
        question = row['questions'].strip()
        answer = row['answers'].strip()
        if not question or not answer: continue
        
        text = f"Q: {question} A: {answer}"
        domain = detect_domain(text)
        categorized_data[domain].append(text)

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("/**\n * Farmers Call Query Dataset (Kaggle)\n * Source: daskoushik/farmers-call-query-data-qa\n * Curated 5000 real-world Q&A entries across domains.\n */\n\n")
    f.write("export const FARMERS_CALL_KNOWLEDGE: { domain: string; entries: string[] }[] = [\n")
    for domain, entries in categorized_data.items():
        if not entries: continue
        f.write(f"    {{\n        domain: \"{domain}\",\n        entries: [\n")
        for entry in entries:
            # Escape backslashes and quotes for TS string template
            escaped_entry = entry.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ")
            f.write(f"            \"{escaped_entry}\",\n")
        f.write("        ]\n    },\n")
    f.write("];\n")

print(f"Successfully generated {output_path}")
