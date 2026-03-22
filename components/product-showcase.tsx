"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Bug, Zap, Star, TrendingUp, Camera } from "lucide-react"
import { DiseaseDetective } from "@/components/disease-detective"

interface ProductShowcaseProps {
  language: string
}

function ProductShowcase({ language }: ProductShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState("fungicides")

  const products = {
    fungicides: [
      {
        name: "ADEPIDYN®",
        activeIngredient: "Pydiflumetofen",
        description: "Revolutionary SDHI fungicide for broad-spectrum disease control",
        crops: ["Wheat", "Barley", "Rice", "Soybeans"],
        efficacy: 95,
        features: ["Long-lasting protection", "Resistance management", "Yield preservation"],
        price: "₹2,450/L",
        rating: 4.8,
      },
      {
        name: "MIRAVIS®",
        activeIngredient: "Pydiflumetofen + Propiconazole",
        description: "Dual-mode fungicide for enhanced disease management",
        crops: ["Corn", "Soybeans", "Wheat"],
        efficacy: 92,
        features: ["Dual mode of action", "Preventive + curative", "Stress tolerance"],
        price: "₹3,200/L",
        rating: 4.7,
      },
    ],
    herbicides: [
      {
        name: "ACURON®",
        activeIngredient: "Atrazine + S-metolachlor + Mesotrione + Bicyclopyrone",
        description: "Four-way herbicide for complete weed control",
        crops: ["Corn", "Sugarcane"],
        efficacy: 98,
        features: ["Broad spectrum", "Residual control", "Crop safety"],
        price: "₹4,100/L",
        rating: 4.9,
      },
    ],
    insecticides: [
      {
        name: "CRUISER®",
        activeIngredient: "Thiamethoxam",
        description: "Systemic seed treatment for early season protection",
        crops: ["Cotton", "Corn", "Soybeans", "Wheat"],
        efficacy: 94,
        features: ["Seed treatment", "Systemic action", "Plant vigor"],
        price: "₹1,850/L",
        rating: 4.6,
      },
    ],
  }

  const categories = [
    { id: "fungicides", name: "Fungicides", icon: Shield, count: 2 },
    { id: "herbicides", name: "Herbicides", icon: Bug, count: 1 },
    { id: "insecticides", name: "Insecticides", icon: Zap, count: 1 },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🛡️ AgriDetect - Crop Protection & Disease Detection
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          AI-powered disease detection with AgriBot crop protection solutions
        </p>
      </div>

      <Tabs defaultValue="disease-detection" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="disease-detection" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Disease Detection
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Product Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disease-detection">
          <DiseaseDetective />
        </TabsContent>

        <TabsContent value="products">
          {/* Category Selection */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-green-600 text-green-600 hover:bg-green-50"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products[selectedCategory as keyof typeof products]?.map((product, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-green-700 dark:text-green-400">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.activeIngredient}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{product.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">{product.description}</p>

                  {/* Efficacy */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Efficacy Rate</span>
                      <span className="font-semibold">{product.efficacy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${product.efficacy}%` }}></div>
                    </div>
                  </div>

                  {/* Crops */}
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Suitable Crops:</h5>
                    <div className="flex flex-wrap gap-1">
                      {product.crops.map((crop, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Key Features:</h5>
                    <ul className="text-sm space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price and Action */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <span className="text-lg font-bold text-green-600">{product.price}</span>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Get AI Recommendation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Recommendation Panel */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                AI-Powered Product Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">🎯 Precision Matching</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI analyzes your crop, soil, weather, and pest pressure to recommend the optimal protection
                    strategy.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">💰 Cost Optimization</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Smart algorithms calculate the most cost-effective treatment plans while maximizing yield
                    protection.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">🌱 Resistance Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Proactive rotation strategies to prevent resistance development and ensure long-term efficacy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { ProductShowcase }
export default ProductShowcase
