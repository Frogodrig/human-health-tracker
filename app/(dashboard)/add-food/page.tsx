// Manual food entry page
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store";
import { productAPI } from "@/lib/api/api";
import { calculateNutriGrade } from "@/lib/utils/utils";
import type { ProductData, ManualEntryForm } from "@/types";
import {
  Search,
  Plus,
  Loader2,
  Calculator,
  AlertCircle,
  Check,
} from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  nutriGrade?: "A" | "B" | "C" | "D";
}

interface FoodEntrySubmission {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  quantity: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  productId?: string;
}

export default function AddFoodPage() {
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();

  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductData[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(
    null
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Manual entry form
  const [manualForm, setManualForm] = useState<ManualEntryForm>({
    name: "",
    brand: "",
    servingSize: 100,
    servingUnit: "g",
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    quantity: 1,
    mealType: "BREAKFAST",
  });

  // Search for products
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const results = await productAPI.searchByName(searchQuery);
      setSearchResults(results);
      setSelectedProduct(null);
    } catch (error) {
      showError(
        "Search Failed",
        "Failed to search for products. Please try again.",
        error
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a product from search results
  const handleSelectProduct = (product: ProductData) => {
    setSelectedProduct(product);
    setManualForm({
      ...manualForm,
      name: product.name,
      brand: product.brand || "",
      servingSize: product.serving.size,
      servingUnit: product.serving.unit,
      calories: product.calories,
      protein: product.protein,
      carbohydrates: product.carbohydrates,
      fat: product.fat,
    });
  };

  // Calculate nutrition per serving
  const calculatePerServing = () => {
    const factor = manualForm.quantity * (manualForm.servingSize / 100);
    return {
      calories: Math.round(manualForm.calories * factor),
      protein: Math.round(manualForm.protein * factor * 10) / 10,
      carbohydrates: Math.round(manualForm.carbohydrates * factor * 10) / 10,
      fat: Math.round(manualForm.fat * factor * 10) / 10,
    };
  };

  // Submit food entry
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!manualForm.name.trim()) {
      showError("Validation Error", "Please enter a food name.");
      return;
    }

    setSubmitLoading(true);
    try {
      const nutritionData = calculatePerServing();

      const response = await fetch("/api/intake/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          nutrition: nutritionData,
          productId: selectedProduct?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add food entry");
      }

      showSuccess(
        "Food Added!",
        `${
          manualForm.name
        } has been added to your ${manualForm.mealType.toLowerCase()}.`
      );
      router.push("/dashboard");
    } catch (error) {
      showError("Error", "Failed to add food entry. Please try again.", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const calculatedNutrition = calculatePerServing();
  const nutriGrade = calculateNutriGrade({
    calories: manualForm.calories,
    protein: manualForm.protein,
    carbohydrates: manualForm.carbohydrates,
    fat: manualForm.fat,
    sugars: 0, // Will add this field later
    saturatedFat: 0, // Will add this field later
    sodium: 0, // Will add this field later
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Food</h1>
        <p className="text-gray-600">
          Search for foods or enter nutrition information manually
        </p>
      </div>

      {/* Food Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Search Foods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for food (e.g., 'banana', 'chicken breast')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? "border-green-500 bg-green-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      {product.brand && (
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {product.nutriGrade && (
                        <Badge
                          variant={
                            product.nutriGrade === "A" ? "default" : "secondary"
                          }
                          className={
                            product.nutriGrade === "A"
                              ? "bg-green-100 text-green-800"
                              : product.nutriGrade === "B"
                              ? "bg-yellow-100 text-yellow-800"
                              : product.nutriGrade === "C"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {product.nutriGrade}
                        </Badge>
                      )}
                      {selectedProduct?.id === product.id && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                    <span>Cal: {product.calories}</span>
                    <span>P: {product.protein}g</span>
                    <span>C: {product.carbohydrates}g</span>
                    <span>F: {product.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Food Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Food Name *</Label>
                <Input
                  id="name"
                  value={manualForm.name}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, name: e.target.value })
                  }
                  placeholder="Enter food name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand (Optional)</Label>
                <Input
                  id="brand"
                  value={manualForm.brand}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, brand: e.target.value })
                  }
                  placeholder="Enter brand name"
                />
              </div>
            </div>

            {/* Serving Size */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="servingSize">Serving Size *</Label>
                <Input
                  id="servingSize"
                  type="number"
                  value={manualForm.servingSize}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      servingSize: Number(e.target.value),
                    })
                  }
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="servingUnit">Unit</Label>
                <Select
                  value={manualForm.servingUnit}
                  onValueChange={(value) =>
                    setManualForm({ ...manualForm, servingUnit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">grams (g)</SelectItem>
                    <SelectItem value="ml">milliliters (ml)</SelectItem>
                    <SelectItem value="oz">ounces (oz)</SelectItem>
                    <SelectItem value="cup">cup</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                    <SelectItem value="slice">slice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={manualForm.quantity}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      quantity: Number(e.target.value),
                    })
                  }
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* Nutrition Information */}
            <div>
              <Label className="text-base font-medium">
                Nutrition per {manualForm.servingSize}
                {manualForm.servingUnit}
              </Label>
              <div className="grid gap-4 md:grid-cols-4 mt-3">
                <div>
                  <Label htmlFor="calories">Calories *</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={manualForm.calories}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        calories: Number(e.target.value),
                      })
                    }
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g) *</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={manualForm.protein}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        protein: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="carbohydrates">Carbs (g) *</Label>
                  <Input
                    id="carbohydrates"
                    type="number"
                    value={manualForm.carbohydrates}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        carbohydrates: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g) *</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={manualForm.fat}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        fat: Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Meal Type */}
            <div>
              <Label>Meal Type</Label>
              <Select
                value={manualForm.mealType}
                onValueChange={(value) =>
                  setManualForm({ ...manualForm, mealType: value as any })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                  <SelectItem value="SNACK">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Nutrition Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center">
                  <Calculator className="mr-2 h-4 w-4" />
                  Total Nutrition (for {manualForm.quantity} serving
                  {manualForm.quantity !== 1 ? "s" : ""})
                </h3>
                <Badge
                  variant={nutriGrade === "A" ? "default" : "secondary"}
                  className={
                    nutriGrade === "A"
                      ? "bg-green-100 text-green-800"
                      : nutriGrade === "B"
                      ? "bg-yellow-100 text-yellow-800"
                      : nutriGrade === "C"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  Nutri-Grade {nutriGrade}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {calculatedNutrition.calories}
                  </div>
                  <div className="text-xs text-gray-600">Calories</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {calculatedNutrition.protein}g
                  </div>
                  <div className="text-xs text-gray-600">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {calculatedNutrition.carbohydrates}g
                  </div>
                  <div className="text-xs text-gray-600">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {calculatedNutrition.fat}g
                  </div>
                  <div className="text-xs text-gray-600">Fat</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Food...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to{" "}
                  {manualForm.mealType.charAt(0) +
                    manualForm.mealType.slice(1).toLowerCase()}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
