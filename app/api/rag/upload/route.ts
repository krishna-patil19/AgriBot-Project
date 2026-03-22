import { type NextRequest, NextResponse } from "next/server"
import { ragEngine } from "@/lib/rag-engine"

/**
 * POST /api/rag/upload
 * Ingest documents (CSV/TXT/PDF text) into the RAG knowledge base
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            )
        }

        console.log(`[RAG Upload] Processing file: ${file.name} (${file.size} bytes)`)

        const text = await file.text()
        const fileName = file.name.toLowerCase()
        let chunksIndexed = 0

        if (fileName.endsWith(".csv")) {
            chunksIndexed = ragEngine.ingestCSV(text, file.name)
        } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
            chunksIndexed = ragEngine.ingestText(text, file.name, "text")
        } else if (fileName.endsWith(".pdf")) {
            // PDF text extraction: for now, treat as plain text
            // In production, use a PDF parser library
            chunksIndexed = ragEngine.ingestText(text, file.name, "pdf")
        } else {
            // Try as plain text
            chunksIndexed = ragEngine.ingestText(text, file.name, "text")
        }

        console.log(`[RAG Upload] Indexed ${chunksIndexed} chunks from ${file.name}`)

        const stats = ragEngine.getStats()

        return NextResponse.json({
            success: true,
            fileName: file.name,
            fileSize: file.size,
            chunksIndexed,
            totalDocuments: stats.totalDocuments,
            message: `Successfully indexed ${chunksIndexed} knowledge chunks from "${file.name}"`,
        })
    } catch (error) {
        console.error("[RAG Upload] Error:", error)
        return NextResponse.json(
            {
                error: "Failed to process file upload",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/rag/upload
 * Get current RAG knowledge base stats
 */
export async function GET() {
    const stats = ragEngine.getStats()
    return NextResponse.json({
        ...stats,
        status: "active",
    })
}
