import csv
import re

# Stopwords similar to RAGEngine
AGRI_STOPWORDS = {"the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "and", "but", "or", "not", "no", "nor", "so", "yet", "both", "either", "neither", "each", "every", "all", "any", "few", "more", "most", "other", "some", "such", "than", "too", "very", "just", "also", "about", "up", "out", "if", "then", "this", "that", "these", "those", "it", "its", "i", "me", "my", "we", "our", "you", "your", "he", "him", "his", "she", "her", "they", "them", "their", "what", "which", "who", "whom", "when", "where", "why", "how", "am", "get", "got", "make", "made"}

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
    best_domain = "general"
    best_score = 0
    for domain, kws in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in lower)
        if score > best_score:
            best_score = score
            best_domain = domain
    return best_domain if best_score >= 1 else "general"

csv_path = r"C:\Users\Diacto\.cache\kagglehub\datasets\daskoushik\farmers-call-query-data-qa\versions\5\questionsv4.csv"
stats = {}

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 5000: break
        text = f"{row['questions']} {row['answers']}"
        domain = detect_domain(text)
        stats[domain] = stats.get(domain, 0) + 1

print("Domain Distribution in first 5000 rows:")
for dom, count in sorted(stats.items(), key=lambda x: x[1], reverse=True):
    print(f"{dom}: {count}")
