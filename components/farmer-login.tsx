"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getTranslation, type Language } from "@/lib/translations"
import { Tractor, Lock, Mail, Loader2, AlertCircle } from "lucide-react"

interface FarmerLoginProps {
  language: Language
  onLoginSuccess: () => void
  onSwitchToSignup: () => void
  onBack?: () => void
}

export function FarmerLogin({ language, onLoginSuccess, onSwitchToSignup, onBack }: FarmerLoginProps) {
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const t = (key: any) => getTranslation(language, key)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const success = await login(email, password)

      if (success) {
        onLoginSuccess()
      } else {
        setErrorMsg(t("invalidCredentials"))
      }
    } catch (error) {
      setErrorMsg(t("loginError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-green-100">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full mb-4 relative">
            {onBack && (
              <button
                onClick={onBack}
                className="absolute left-[-40px] top-1 text-green-600 hover:text-green-800 transition-colors"
                title="Back"
              >
                <div className="bg-white p-2 rounded-full shadow-sm border border-green-100 hover:shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </div>
              </button>
            )}
            <Tractor className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-green-800">{t("loginTitle")}</h2>
          <p className="text-gray-600 mt-2">{t("loginSubtitle")}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" /> {t("emailLabel")}
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" /> {t("passwordLabel")}
            </Label>
            <Input
              id="login-password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("authenticating")}
              </>
            ) : (
              t("signInSecurely")
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={onSwitchToSignup} className="text-sm text-green-700 hover:underline font-medium">
            {t("dontHaveAccount")} {t("createOne")}
          </button>
        </div>
      </div>
    </div>
  )
}
