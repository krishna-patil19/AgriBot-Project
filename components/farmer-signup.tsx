"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { type Language, getTranslation } from "@/lib/translations"
import { Leaf, User, MapPin, Droplets } from "lucide-react"

interface FarmerSignupProps {
  language: Language
  onSignupComplete: () => void
  onSwitchToLogin?: () => void
  onBack?: () => void
  mode?: "signup" | "update"
  initialData?: any
  onUpdateComplete?: () => void
}

export const FarmerSignup: React.FC<FarmerSignupProps> = ({
  language,
  onSignupComplete,
  onSwitchToLogin,
  onBack,
  mode = "signup",
  initialData,
  onUpdateComplete,
}) => {
  const { signup, updateFarmer } = useAuth() as any // updateFarmer will be added soon
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    age: initialData?.age?.toString() || "",
    country: initialData?.country || "India",
    email: initialData?.email || "",
    password: initialData?.password || "",
    farmingType: (initialData?.farmingType as any) || ("single" as "single" | "multiple"),
    crops: (initialData?.crops as string[]) || ([] as string[]),
    otherCrop: "",
    farmLocation: {
      state: initialData?.farmLocation?.state || "",
      district: initialData?.farmLocation?.district || "",
    },
    soilType: initialData?.soilType || "",
    farmAreaAcres: initialData?.farmAreaAcres?.toString() || "",
    irrigationType: initialData?.irrigationType || "",
  })

  const cropsList = ["wheat", "pomegranate", "tomato", "cotton", "sugarcane", "rice", "maize", "soybean", "others"]
  const soilTypes = ["sandy", "loamy", "clay"]
  const irrigationTypes = ["drip", "flood", "rainfed"]

  const t = (key: any) => getTranslation(language, key)

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleCropToggle = (crop: string) => {
    setFormData((prev) => ({
      ...prev,
      crops: prev.crops.includes(crop) ? prev.crops.filter((c) => c !== crop) : [...prev.crops, crop],
    }))
  }

  const handleSubmit = async () => {
    setError("")

    if (!formData.email || !formData.password) {
      setError(t("emailPasswordRequired"))
      return
    }

    if (!formData.farmLocation.district || !formData.farmLocation.state) {
      setError(t("locationRequired"))
      return
    }

    const finalCrops =
      formData.crops.includes("others") && formData.otherCrop
        ? [...formData.crops.filter((c) => c !== "others"), formData.otherCrop]
        : formData.crops

    // Normalize data types for the backend
    const signupData = {
      name: formData.name,
      age: formData.age ? Number.parseInt(formData.age) : 0,
      country: formData.country,
      email: formData.email,
      password: formData.password,
      language,
      farmingType: formData.farmingType,
      crops: finalCrops,
      farmLocation: formData.farmLocation,
      soilType: formData.soilType || "",
      farmAreaAcres: formData.farmAreaAcres ? Number.parseFloat(formData.farmAreaAcres) : 0,
      irrigationType: formData.irrigationType || "",
    }

    if (mode === "update") {
      const success = await updateFarmer(signupData)
      if (success) {
        onUpdateComplete?.()
      } else {
        setError(t("updateFailed"))
      }
      return
    }

    const success = await signup(signupData as any)
    if (success) {
      onSignupComplete()
    } else {
      setError(t("signupFailed"))
    }
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const isStep1Valid = mode === "update"
    ? formData.name.length > 2 && formData.email.includes("@")
    : formData.name.length > 2 && formData.email.includes("@") && formData.password.length >= 6

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-100">
              <User className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">{t("personalInfo")}</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("namePlaceholder")}
                className="border-green-200 focus-visible:ring-green-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">{t("age")}</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder={t("agePlaceholder")}
                  className="border-green-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t("country")}</Label>
                <Input
                  id="country"
                  value={formData.country}
                  readOnly
                  className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                readOnly={mode === "update"}
                className={`border-green-200 focus-visible:ring-green-600 ${mode === "update" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")} *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="border-green-200 focus-visible:ring-green-600"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-100">
              <Leaf className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">{t("cropDetails")}</h3>
            </div>
            <div className="space-y-2">
              <Label>{t("farmingType")}</Label>
              <Select
                value={formData.farmingType}
                onValueChange={(value: "single" | "multiple") => handleInputChange("farmingType", value)}
              >
                <SelectTrigger className="border-green-200 focus:ring-green-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t("singleCrop")}</SelectItem>
                  <SelectItem value="multiple">{t("multipleCrops")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              <Label>{t("selectCrops")}</Label>
              <div className="grid grid-cols-2 gap-3 bg-green-50/50 p-4 rounded-lg border border-green-100">
                {cropsList.map((crop) => (
                  <div key={crop} className="flex items-center space-x-2">
                    <Checkbox
                      id={crop}
                      checked={formData.crops.includes(crop)}
                      onCheckedChange={() => handleCropToggle(crop)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label htmlFor={crop} className="text-sm font-medium capitalize cursor-pointer">
                      {t(crop as any)}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.crops.includes("others") && (
                <div className="animate-in fade-in mt-3">
                  <Input
                    value={formData.otherCrop}
                    onChange={(e) => handleInputChange("otherCrop", e.target.value)}
                    placeholder={t("specifyCrop")}
                    className="border-green-200 focus-visible:ring-green-600"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-100">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">{t("locationSoil")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">{t("state")} *</Label>
                <Input
                  id="state"
                  value={formData.farmLocation.state}
                  onChange={(e) => handleInputChange("farmLocation.state", e.target.value)}
                  placeholder={t("statePlaceholder")}
                  className="border-green-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">{t("district")} *</Label>
                <Input
                  id="district"
                  value={formData.farmLocation.district}
                  onChange={(e) => handleInputChange("farmLocation.district", e.target.value)}
                  placeholder={t("districtPlaceholder")}
                  className="border-green-200"
                />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label>{t("soilType")}</Label>
              <Select value={formData.soilType} onValueChange={(value) => handleInputChange("soilType", value)}>
                <SelectTrigger className="border-green-200 focus:ring-green-600">
                  <SelectValue placeholder={t("selectSoilPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {soilTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {t(type as any)} {t("soilType")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="farmArea">{t("farmArea")}</Label>
              <Input
                id="farmArea"
                type="number"
                step="0.1"
                value={formData.farmAreaAcres}
                onChange={(e) => handleInputChange("farmAreaAcres", e.target.value)}
                placeholder={t("farmAreaPlaceholder")}
                className="border-green-200"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-100">
              <Droplets className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">{t("irrigationSustain")}</h3>
            </div>
            <div className="space-y-2">
              <Label>{t("irrigationType")}</Label>
              <Select
                value={formData.irrigationType}
                onValueChange={(value) => handleInputChange("irrigationType", value)}
              >
                <SelectTrigger className="border-green-200 focus:ring-green-600">
                  <SelectValue placeholder={t("irrigationPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {irrigationTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {t(type as any)} {t("irrigationType")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl border-green-100">
        <CardHeader className="bg-white rounded-t-xl pb-6 border-b border-gray-100 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 top-6 text-green-600 hover:text-green-800 transition-colors"
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
          <CardTitle className="text-2xl font-bold text-green-800 text-center">
            {mode === "update" ? "Update Farm Profile" : "Create AGRIBOT Account"}
          </CardTitle>
          <div className="mt-6">
            <Progress value={(currentStep / 4) * 100} className="h-2 bg-green-100 [&>div]:bg-green-600" />
            <div className="flex justify-between mt-2 text-xs font-medium text-green-600">
              <span>{t("personalInfo")}</span>
              <span>{t("cropDetails")}</span>
              <span>{t("locationSoil")}</span>
              <span>{t("irrigationSustain")}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8 bg-white/50 backdrop-blur-sm rounded-b-xl">
          {renderStep()}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center mt-6 border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              {t("previous")}
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={currentStep === 1 && !isStep1Valid}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[100px] shadow-md transition-all"
              >
                {t("next")}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[150px] shadow-md transition-all"
              >
                {mode === "update" ? "Update Profile" : t("completeSetup")}
              </Button>
            )}
          </div>

          {onSwitchToLogin && mode !== "update" && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                {t("dontHaveAccount")}{" "}
                <button
                  onClick={onSwitchToLogin}
                  className="text-green-600 hover:text-green-800 font-semibold transition-colors"
                >
                  {t("login")}
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
