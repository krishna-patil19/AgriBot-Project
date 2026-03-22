import { type NextRequest, NextResponse } from "next/server"
import { farmerDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        if (!data.email) {
            return NextResponse.json({ error: "Email is required to identify user" }, { status: 400 })
        }

        const existingUser = farmerDatabase.get(data.email)

        // Update user record
        const updatedFarmer = {
            ...(existingUser || {}),
            ...data,
            id: existingUser?.id || `farmer-${Date.now()}`,
            createdAt: existingUser?.createdAt || new Date().toISOString(),
        }

        farmerDatabase.set(data.email, updatedFarmer)

        return NextResponse.json({
            success: true,
            farmer: updatedFarmer,
            message: "Farmer profile updated successfully",
        })
    } catch (error) {
        console.error("Update error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
