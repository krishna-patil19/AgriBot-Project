"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Language, getTranslation } from "@/lib/translations"

interface LanguageSelectorProps {
  onLanguageSelect: (language: Language) => void
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelect }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)

  const languages = [
    { code: "en" as Language, name: "English", nativeName: "English" },
    { code: "hi" as Language, name: "Hindi", nativeName: "हिंदी" },
    { code: "mr" as Language, name: "Marathi", nativeName: "मराठी" },
  ]

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-800">
            {selectedLanguage ? getTranslation(selectedLanguage, "selectLanguage") : "Select Your Language"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLanguage === lang.code ? "default" : "outline"}
              className={`w-full h-16 text-lg ${selectedLanguage === lang.code ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"
                }`}
              onClick={() => setSelectedLanguage(lang.code)}
            >
              <div className="text-center">
                <div className="font-semibold">{lang.nativeName}</div>
                <div className="text-sm opacity-75">{lang.name}</div>
              </div>
            </Button>
          ))}

          {selectedLanguage && (
            <Button onClick={handleContinue} className="w-full mt-6 bg-green-600 hover:bg-green-700">
              {getTranslation(selectedLanguage, "continue")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
