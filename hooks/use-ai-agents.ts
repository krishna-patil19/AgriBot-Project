"use client"

import { useState, useCallback } from "react"

interface Agent {
  id: string
  name: string
  status: "idle" | "active" | "processing"
  lastResponse?: string
}

export function useAIAgents() {
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map())

  const activateAgent = useCallback(async (agentId: string) => {
    setAgents((prev) => {
      const newAgents = new Map(prev)
      newAgents.set(agentId, {
        id: agentId,
        name: agentId,
        status: "processing",
      })
      return newAgents
    })

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          message: `Hello, I need assistance with ${agentId}`,
          language: "en",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to activate agent")
      }

      const data = await response.json()

      setAgents((prev) => {
        const newAgents = new Map(prev)
        const agent = newAgents.get(agentId)
        if (agent) {
          agent.status = "active"
          agent.lastResponse = data.response
        }
        return newAgents
      })
    } catch (error) {
      console.error("Agent activation failed:", error)
      setAgents((prev) => {
        const newAgents = new Map(prev)
        const agent = newAgents.get(agentId)
        if (agent) {
          agent.status = "idle"
          agent.lastResponse = "Sorry, I'm currently unavailable. Please try again later."
        }
        return newAgents
      })
    }
  }, [])

  const getAgentResponse = useCallback(async (agentId: string, message: string, language = "en"): Promise<string> => {
    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          message,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get agent response")
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error("Failed to get agent response:", error)
      return "I'm sorry, I'm having trouble processing your request right now."
    }
  }, [])

  return {
    agents,
    activateAgent,
    getAgentResponse,
  }
}
