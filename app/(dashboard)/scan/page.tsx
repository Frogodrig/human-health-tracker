// Updated Scan page with improved error handling
"use client";

import { useState } from "react";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, Keyboard, AlertCircle, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

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
      {product && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-green-600">Product Found!</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold text-lg">{product.name}</p>
                  {product.brand && (
                    <p className="text-sm text-gray-600">{product.brand}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Calories:</span>{" "}
                    {product.calories}
                  </div>
                  <div>
                    <span className="font-medium">Protein:</span>{" "}
                    {product.protein}g
                  </div>
                  <div>
                    <span className="font-medium">Carbs:</span>{" "}
                    {product.carbohydrates}g
                  </div>
                  <div>
                    <span className="font-medium">Fat:</span> {product.fat}g
                  </div>
                </div>

                {product.nutriGrade && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Nutri-Grade:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        product.nutriGrade === "A"
                          ? "bg-green-100 text-green-800"
                          : product.nutriGrade === "B"
                          ? "bg-yellow-100 text-yellow-800"
                          : product.nutriGrade === "C"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.nutriGrade}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button className="flex-1">Add to Today&apos;s Intake</Button>
              <Button variant="outline" className="flex-1">
                Save for Later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Link href="/add-food">
              <Button variant="outline" className="w-full">
                Add Food Manually
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                View Today&apos;s Intake
              </Button>
            </Link>
            <Link href="/camera">
              <Button variant="outline" className="w-full">
                Take Food Photo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
