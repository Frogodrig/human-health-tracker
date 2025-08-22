// Updated Scan page with improved error handling
"use client";

import { useState } from "react";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, Keyboard, AlertCircle, Wifi, WifiOff, Info } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { NutrientBreakdownPieChart } from "@/components/charts/macro-pie-chart";
import NutritionLabelTable from "@/components/ui/NutritionLabelTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PokemonCard from "@/components/PokemonCard";

export default function ScanPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");

  const { scanBarcode, clearResults, isLoading, product, error, errorType } =
    useBarcodeScanner();

  const handleScanComplete = async (barcode: string) => {
    console.log("Scanned barcode:", barcode);
    setShowScanner(false);
    await scanBarcode(barcode);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      await scanBarcode(manualBarcode.trim());
    }
  };

  const getErrorIcon = () => {
    switch (errorType) {
      case "network":
        return <WifiOff className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = () => {
    switch (errorType) {
      case "network":
        return "destructive";
      case "validation":
        return "default";
      default:
        return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Food</h1>
        <p className="text-gray-600">
          Use your camera to scan barcodes or enter them manually
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> If you&apos;ve already granted camera
            permission for food recognition, you may need to click &quot;Retry
            Camera&quot; to allow camera access for barcode scanning.
          </p>
        </div>
      </div>

      {/* Scan Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="mr-2 h-5 w-5" />
              Camera Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Use your device camera to scan product barcodes
            </p>
            <Button
              onClick={() => setShowScanner(true)}
              className="w-full"
              disabled={isLoading}
            >
              Start Camera
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Keyboard className="mr-2 h-5 w-5" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="barcode">Barcode Number</Label>
                <Input
                  id="barcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter 8-14 digit barcode..."
                  pattern="[0-9]{8,14}"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !manualBarcode.trim()}
              >
                {isLoading ? "Looking up..." : "Look Up Product"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant={getErrorVariant()}>
          {getErrorIcon()}
          <AlertDescription>
            {error}
            {errorType === "network" && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scanBarcode(manualBarcode || "")}
                  disabled={isLoading}
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Product Result */}
      {isLoading && !product && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Loading Product...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1 space-y-2">
                <div className="h-6 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {product && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-green-600">
              Nutrition Intelligence
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            {/* Warning for missing critical fields */}
            {["calories", "protein", "carbohydrates", "fat"].some(
              (key) => typeof product[key as keyof typeof product] !== "number"
            ) && (
              <Alert variant="default" className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span
                  className="ml-2 underline text-blue-700 cursor-help relative"
                  tabIndex={0}
                  aria-describedby="tooltip-missing-nutrition"
                  onMouseEnter={() => {
                    const tooltip = document.getElementById(
                      "tooltip-missing-nutrition"
                    );
                    if (tooltip) tooltip.style.display = "block";
                  }}
                  onMouseLeave={() => {
                    const tooltip = document.getElementById(
                      "tooltip-missing-nutrition"
                    );
                    if (tooltip) tooltip.style.display = "none";
                  }}
                >
                  Why?
                  <span
                    id="tooltip-missing-nutrition"
                    role="tooltip"
                    style={{ display: "none" }}
                    className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black text-white text-xs whitespace-pre-line max-w-xs break-words shadow-lg"
                  >
                    This product is missing key nutrition info (calories,
                    protein, carbs, or fat). You can help improve it on Open
                    Food Facts!
                  </span>
                </span>
                <a
                  href={`https://world.openfoodfacts.org/product/${
                    product.barcode || ""
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-700 underline"
                >
                  Help complete this product
                </a>
              </Alert>
            )}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition Label</TabsTrigger>
              </TabsList>
              <div className="mt-4" />
              <TabsContent value="summary">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  {/* Product Card */}
                  <div className="w-full md:w-1/3 flex justify-center">
                    <PokemonCard product={product} />
                  </div>
                  {/* Nutrient Grid & Chart */}
                  <div className="flex-1 flex flex-col gap-4 w-full md:w-2/3">
                    {/* Pie chart and Nutri-Grade: ensure vertical centering and no cutoff */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center mt-2 min-h-[300px]">
                      <div className="flex-1 min-w-[220px] flex items-center justify-center h-full">
                        <NutrientBreakdownPieChart
                          nutrients={[
                            {
                              name: "Protein",
                              value:
                                typeof product.protein === "number"
                                  ? product.protein
                                  : 0,
                              color: "#3b82f6",
                            },
                            {
                              name: "Carbohydrates",
                              value:
                                typeof product.carbohydrates === "number"
                                  ? product.carbohydrates
                                  : 0,
                              color: "#f59e0b",
                            },
                            {
                              name: "Fat",
                              value:
                                typeof product.fat === "number"
                                  ? product.fat
                                  : 0,
                              color: "#8b5cf6",
                            },
                            {
                              name: "Sugars",
                              value:
                                typeof product.sugars === "number"
                                  ? product.sugars
                                  : 0,
                              color: "#f43f5e",
                            },
                            {
                              name: "Sodium",
                              value:
                                typeof product.sodium === "number"
                                  ? product.sodium
                                  : 0,
                              color: "#06b6d4",
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="nutrition">
                <div className="mt-4">
                  <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" /> Full Nutrition
                    Label
                  </div>
                  <NutritionLabelTable
                    nutrients={
                      product as unknown as Record<string, number | undefined>
                    }
                    servingSize={`${product.serving.size} ${product.serving.unit}`}
                    netWeight={product.netWeight}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
