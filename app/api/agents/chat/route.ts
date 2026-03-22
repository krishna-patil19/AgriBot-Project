import { type NextRequest, NextResponse } from "next/server"
import { groqClient } from "@/lib/groq-client"

export async function POST(request: NextRequest) {
  try {
    const { agentId, message, language = "en" } = await request.json()

    if (!agentId || !message) {
      return NextResponse.json({ error: "Agent ID and message are required" }, { status: 400 })
    }

    console.log("[v0] Processing chat request for agent:", agentId)

    // Generate AI response using Groq
    const response = await groqClient.generateResponse(agentId, message, language)

    console.log("[v0] Chat response generated successfully")

    return NextResponse.json({
      success: true,
      response,
      agentId,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Agent chat error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
