import { type NextRequest, NextResponse } from "next/server"

import { farmerDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const storedFarmer = farmerDatabase.get(email)

    if (!storedFarmer || storedFarmer.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const { password: _, ...farmerData } = storedFarmer

    return NextResponse.json({
      success: true,
      farmer: farmerData,
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
