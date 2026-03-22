"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getTranslation } from "@/lib/translations"
import { FarmerLogin } from "./farmer-login"
import { FarmerSignup } from "./farmer-signup"
import { Button } from "@/components/ui/button"
import { Tractor, UserPlus, LogIn } from "lucide-react"

export function EnhancedAuthWrapper() {
  const router = useRouter()
  const { language, setLanguage, isAuthenticated } = useAuth()
  const [view, setView] = useState<"language" | "choice" | "login" | "signup">("language")

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (view === "language") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-green-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Tractor className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-6">{getTranslation(language, "selectLanguage")}</h2>
          <div className="space-y-3">
            {[
              { id: "en", name: "English", native: "English" },
              { id: "hi", name: "Hindi", native: "हिन्दी" },
              { id: "mr", name: "Marathi", native: "मराठी" },
            ].map((lang) => (
              <Button
                key={lang.id}
                onClick={() => {
                  setLanguage(lang.id as any)
                  setView("choice")
                }}
                variant={language === lang.id ? "default" : "outline"}
                className={`w-full py-6 text-lg flex justify-between items-center px-6 ${language === lang.id ? "bg-green-600 hover:bg-green-700" : "border-green-200 text-green-700 hover:bg-green-50"
                  }`}
              >
                <span className="font-semibold">{lang.native}</span>
                <span className="text-sm opacity-70">{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (view === "login") {
    return (
      <FarmerLogin
        language={language}
        onLoginSuccess={() => router.push("/")}
        onSwitchToSignup={() => setView("signup")}
        onBack={() => setView("choice")}
      />
    )
  }

  if (view === "signup") {
    return (
      <FarmerSignup
        language={language}
        onSignupComplete={() => setView("login")}
        onSwitchToLogin={() => setView("login")}
        onBack={() => setView("choice")}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-green-100 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <Tractor className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-green-800 mb-2">AGRIBOT</h1>
        <p className="text-gray-600 mb-8 font-medium">{getTranslation(language, "appSubtitle")}</p>

        <div className="space-y-4">
          <Button
            onClick={() => setView("signup")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg flex items-center justify-center gap-2 shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            {getTranslation(language, "newFarmer")}
          </Button>

          <Button
            onClick={() => setView("login")}
            variant="outline"
            className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 py-6 text-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {getTranslation(language, "existingFarmer")}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100 text-left text-sm text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">Project Evaluator Info:</p>
          <p>Powered by LLaMA-2 & RAG Architecture.</p>
          <p>Mock login is active for presentations.</p>
        </div>
      </div>
    </div>
  )
}
