/**
 * FAISS-Inspired In-Memory RAG Engine
 * 
 * Zero-dependency vector store with TF-IDF embeddings and cosine similarity search.
 * Designed for agricultural knowledge retrieval across 8 specialized agents.
 * 
 * Architecture:
 * - Text chunking with configurable overlap
 * - TF-IDF bag-of-words embeddings
 * - Cosine similarity search (FAISS-inspired flat index)
 * - Domain-specific metadata tagging for agent routing
 * - Safety-filtered retrieval
 * - Auto-loads baseline agricultural knowledge on startup
 */

import { SEED_KNOWLEDGE_BASE } from "./seed-knowledge"
import { KISANVAANI_KNOWLEDGE } from "./kisanvaani-knowledge"
import { FALCON_AGRI_KNOWLEDGE } from "./falcon-agri-knowledge"
import { FARMERS_CALL_KNOWLEDGE } from "./farmers-call-knowledge"

export interface RAGDocument {
  id: string
  content: string
  embedding: number[]
  metadata: {
    source: string
    agentDomain?: string
    chunkIndex: number
    totalChunks: number
    timestamp: string
    type: "csv" | "text" | "pdf" | "manual"
  }
}

export interface RAGSearchResult {
  document: RAGDocument
  score: number
  relevance: "high" | "medium" | "low"
}

interface VocabularyEntry {
  index: number
  idf: number
}

// Agricultural domain stopwords to filter out
const AGRI_STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "and", "but", "or",
  "not", "no", "nor", "so", "yet", "both", "either", "neither", "each",
  "every", "all", "any", "few", "more", "most", "other", "some", "such",
  "than", "too", "very", "just", "also", "about", "up", "out", "if",
  "then", "this", "that", "these", "those", "it", "its", "i", "me",
  "my", "we", "our", "you", "your", "he", "him", "his", "she", "her",
  "they", "them", "their", "what", "which", "who", "whom", "when",
  "where", "why", "how", "am", "get", "got", "make", "made"
])

// Safety guardrails - topics to flag
const SAFETY_KEYWORDS = [
  "poison", "harmful", "toxic dose", "kill", "dangerous chemical",
  "overdose", "illegal", "banned substance"
]

class FAISSInspiredIndex {
  private documents: RAGDocument[] = []
  private vocabulary: Map<string, VocabularyEntry> = new Map()
  private vocabSize: number = 0
  private isDirty: boolean = true // Flag to rebuild IDF when docs change

  /**
   * Tokenize and normalize text for embedding
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 2 && !AGRI_STOPWORDS.has(word))
  }

  /**
   * Build/rebuild the vocabulary from all documents
   */
  private buildVocabulary(): void {
    if (!this.isDirty) return

    const docFrequency: Map<string, number> = new Map()
    const allTerms: Set<string> = new Set()

    // Count document frequency for each term
    for (const doc of this.documents) {
      const terms = new Set(this.tokenize(doc.content))
      for (const term of terms) {
        allTerms.add(term)
        docFrequency.set(term, (docFrequency.get(term) || 0) + 1)
      }
    }

    // Build vocabulary with IDF scores
    this.vocabulary.clear()
    let index = 0
    const totalDocs = Math.max(this.documents.length, 1)

    for (const term of allTerms) {
      const df = docFrequency.get(term) || 0
      const idf = Math.log((totalDocs + 1) / (df + 1)) + 1 // Smoothed IDF
      this.vocabulary.set(term, { index, idf })
      index++
    }

    this.vocabSize = index
    this.isDirty = false

    // Recompute all embeddings with updated vocabulary
    for (const doc of this.documents) {
      doc.embedding = this.computeEmbedding(doc.content)
    }
  }

  /**
   * Compute TF-IDF embedding for a text
   */
  private computeEmbedding(text: string): number[] {
    const terms = this.tokenize(text)
    const embedding = new Array(this.vocabSize).fill(0)

    if (terms.length === 0) return embedding

    // Term frequency
    const tf: Map<string, number> = new Map()
    for (const term of terms) {
      tf.set(term, (tf.get(term) || 0) + 1)
    }

    // TF-IDF
    for (const [term, count] of tf) {
      const vocabEntry = this.vocabulary.get(term)
      if (vocabEntry) {
        const normalizedTF = count / terms.length
        embedding[vocabEntry.index] = normalizedTF * vocabEntry.idf
      }
    }

    // L2 normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm
      }
    }

    return embedding
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    let dotProduct = 0
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
    }
    return dotProduct // Vectors are already L2-normalized
  }

  /**
   * Add a document to the index
   */
  addDocument(doc: RAGDocument): void {
    this.documents.push(doc)
    this.isDirty = true
  }

  /**
   * Search for similar documents (FAISS flat index style)
   */
  search(query: string, topK: number = 5, agentDomain?: string): RAGSearchResult[] {
    if (this.documents.length === 0) return []

    // Rebuild vocabulary if needed
    this.buildVocabulary()

    const queryEmbedding = this.computeEmbedding(query)

    // Score all documents
    let results: RAGSearchResult[] = this.documents
      .filter(doc => !agentDomain || !doc.metadata.agentDomain || doc.metadata.agentDomain === agentDomain)
      .map(doc => {
        const score = this.cosineSimilarity(queryEmbedding, doc.embedding)
        return {
          document: doc,
          score,
          relevance: (score > 0.5 ? "high" : score > 0.2 ? "medium" : "low") as "high" | "medium" | "low"
        }
      })
      .filter(r => r.score > 0.05) // Minimum threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return results
  }

  /**
   * Get document count
   */
  get size(): number {
    return this.documents.length
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents = []
    this.vocabulary.clear()
    this.vocabSize = 0
    this.isDirty = true
  }
}

// ============================================================
// Main RAG Engine Class
// ============================================================

export class RAGEngine {
  private index: FAISSInspiredIndex
  private documentCounter: number = 0
  private initialized: boolean = false

  constructor() {
    this.index = new FAISSInspiredIndex()
    this.initializeKnowledgeBase()
  }

  /**
   * Pre-load the agricultural knowledge base
   */
  private initializeKnowledgeBase() {
    if (this.initialized) return

    console.log("[RAG Engine] Initializing pre-loaded agricultural knowledge base...")
    let totalEntries = 0

    for (const domainData of SEED_KNOWLEDGE_BASE) {
      for (const entry of domainData.entries) {
        this.ingestText(entry, "AgriBot Pre-loaded Knowledge", "manual")
        totalEntries++
      }
    }

    // Load KisanVaani agriculture QA dataset
    let kisanVaaniEntries = 0
    for (const domainData of KISANVAANI_KNOWLEDGE) {
      for (const entry of domainData.entries) {
        this.ingestText(entry, "KisanVaani Agriculture QA", "manual")
        totalEntries++
        kisanVaaniEntries++
      }
    }

    // Load Farmers Call Query Dataset (Kaggle)
    let farmersCallEntries = 0
    for (const domainData of FARMERS_CALL_KNOWLEDGE) {
      for (const entry of domainData.entries) {
        this.ingestText(entry, "Expert Farmer Call Q&A", "manual")
        totalEntries++
        farmersCallEntries++
      }
    }

    // Load Falcon agriculture dataset (unique entries)
    let falconEntries = 0
    for (const domainData of FALCON_AGRI_KNOWLEDGE) {
      for (const entry of domainData.entries) {
        this.ingestText(entry, "Falcon Agriculture Dataset", "manual")
        totalEntries++
        falconEntries++
      }
    }

    this.initialized = true
    console.log(`[RAG Engine] Initialized with ${totalEntries} knowledge entries (${kisanVaaniEntries} KisanVaani + ${farmersCallEntries} FarmerCalls + ${falconEntries} Falcon) across 7 domains.`)
  }

  /**
   * Chunk text into overlapping segments
   */
  private chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
    const chunks: string[] = []
    const sentences = text.split(/(?<=[.!?\n])\s+/)
    let currentChunk = ""

    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        // Keep overlap from previous chunk
        const words = currentChunk.split(/\s+/)
        const overlapWords = words.slice(-Math.floor(overlap / 5))
        currentChunk = overlapWords.join(" ") + " " + sentence
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks.length > 0 ? chunks : [text]
  }

  /**
   * Detect which agent domain a text chunk belongs to
   */
  private detectDomain(text: string): string | undefined {
    const lower = text.toLowerCase()
    const domainKeywords: Record<string, string[]> = {
      "agri-detect": ["disease", "pest", "insect", "blight", "rot", "fungus", "virus", "symptom", "lesion", "infection", "pathogen"],
      "seed-sage": ["seed", "variety", "hybrid", "germination", "sowing", "cultivar", "seedling", "nursery", "propagation"],
      "market-oracle": ["price", "mandi", "market", "rate", "trade", "export", "import", "wholesale", "retail", "commodity"],
      "weather-intel": ["weather", "rain", "temperature", "humidity", "forecast", "storm", "drought", "monsoon", "climate"],
      "rotation-master": ["rotation", "soil health", "nutrient", "nitrogen", "phosphorus", "legume", "fallow", "intercrop"],
      "irrigation-planner": ["irrigation", "water", "drip", "sprinkler", "canal", "groundwater", "moisture", "scheduling"],
      "training-hub": ["fertilizer", "pesticide", "herbicide", "organic", "dosage", "safety", "application", "training", "ppe"],
      "voice-ai": ["voice", "speech", "language", "translate", "multilingual"]
    }

    let bestDomain: string | undefined
    let bestScore = 0

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const score = keywords.filter(kw => lower.includes(kw)).length
      if (score > bestScore) {
        bestScore = score
        bestDomain = domain
      }
    }

    return bestScore >= 2 ? bestDomain : undefined
  }

  /**
   * Check for safety concerns in text
   */
  checkSafety(text: string): { safe: boolean; warnings: string[] } {
    const lower = text.toLowerCase()
    const warnings: string[] = []

    for (const keyword of SAFETY_KEYWORDS) {
      if (lower.includes(keyword)) {
        warnings.push(`Safety flag: content mentions "${keyword}"`)
      }
    }

    return {
      safe: warnings.length === 0,
      warnings
    }
  }

  /**
   * Ingest raw text into the RAG engine
   */
  ingestText(text: string, source: string = "manual", type: "csv" | "text" | "pdf" | "manual" = "text"): number {
    const chunks = this.chunkText(text)
    const timestamp = new Date().toISOString()

    for (let i = 0; i < chunks.length; i++) {
      this.documentCounter++
      const domain = this.detectDomain(chunks[i])

      const doc: RAGDocument = {
        id: `doc_${this.documentCounter}`,
        content: chunks[i],
        embedding: [], // Will be computed when building vocabulary
        metadata: {
          source,
          agentDomain: domain,
          chunkIndex: i,
          totalChunks: chunks.length,
          timestamp,
          type
        }
      }

      this.index.addDocument(doc)
    }

    return chunks.length
  }

  /**
   * Ingest CSV data — each row becomes a searchable document
   */
  ingestCSV(csvText: string, source: string = "csv_upload"): number {
    const lines = csvText.split("\n").map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) return 0

    const headers = lines[0].split(",").map(h => h.trim())
    let totalChunks = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim())
      const rowText = headers
        .map((header, idx) => `${header}: ${values[idx] || "N/A"}`)
        .join(". ")

      totalChunks += this.ingestText(rowText, source, "csv")
    }

    return totalChunks
  }

  /**
   * Search for relevant context given a query
   */
  search(query: string, topK: number = 5, agentDomain?: string): RAGSearchResult[] {
    return this.index.search(query, topK, agentDomain)
  }

  /**
   * Build a RAG context string from search results
   */
  buildContext(results: RAGSearchResult[]): string {
    if (results.length === 0) return ""

    const contextParts = results
      .filter(r => r.relevance !== "low")
      .map((r, i) => `[Source ${i + 1}: ${r.document.metadata.source} (${r.relevance} relevance)]\n${r.document.content}`)

    return contextParts.length > 0
      ? `\n\n--- RETRIEVED KNOWLEDGE BASE CONTEXT ---\n${contextParts.join("\n\n")}\n--- END CONTEXT ---\n`
      : ""
  }

  /**
   * Get stats about the indexed documents
   */
  getStats(): { totalDocuments: number; domainDistribution: Record<string, number> } {
    const stats = {
      totalDocuments: this.index.size,
      domainDistribution: {} as Record<string, number>
    }

    return stats
  }

  /**
   * Clear all indexed documents
   */
  clear(): void {
    this.index.clear()
    this.documentCounter = 0
  }
}

// Singleton instance for the application
export const ragEngine = new RAGEngine()
