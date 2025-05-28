// Development API testing component
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { productAPI, APIError, NetworkError } from "@/lib/api/api";
import type { ProductData } from "@/types";
import { CheckCircle, XCircle, Loader2, Search } from "lucide-react";

export function APITestComponent() {
  const [testBarcode, setTestBarcode] = useState("3017620422003"); // Nutella barcode for testing
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    type: "barcode" | "search";
    success: boolean;
    data?: ProductData | ProductData[];
    error?: string;
    timing?: number;
  } | null>(null);

  const testBarcodeSearch = async () => {
    if (!testBarcode.trim()) return;

    setLoading(true);
    setResults(null);
    const startTime = Date.now();

    try {
      const product = await productAPI.searchByBarcode(testBarcode);
      const timing = Date.now() - startTime;

      setResults({
        type: "barcode",
        success: true,
        data: product || undefined,
        timing,
      });
    } catch (error) {
      const timing = Date.now() - startTime;
      setResults({
        type: "barcode",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timing,
      });
    } finally {
      setLoading(false);
    }
  };

  const testProductSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResults(null);
    const startTime = Date.now();

    try {
      const products = await productAPI.searchByName(searchQuery);
      const timing = Date.now() - startTime;

      setResults({
        type: "search",
        success: true,
        data: products,
        timing,
      });
    } catch (error) {
      const timing = Date.now() - startTime;
      setResults({
        type: "search",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timing,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = (product: ProductData) => (
    <div key={product.id} className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{product.name}</h4>
          {product.brand && (
            <p className="text-sm text-gray-600">{product.brand}</p>
          )}
        </div>
        {product.nutriGrade && (
          <Badge
            variant={product.nutriGrade === "A" ? "default" : "secondary"}
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
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>Cal: {product.calories}</div>
        <div>Protein: {product.protein}g</div>
        <div>Carbs: {product.carbohydrates}g</div>
        <div>Fat: {product.fat}g</div>
      </div>

      {product.barcode && (
        <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>API Testing Tool</CardTitle>
        <p className="text-sm text-gray-600">
          Test the OpenFoodFacts API integration
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Barcode Test */}
        <div className="space-y-3">
          <h3 className="font-medium">Test Barcode Lookup</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode (e.g., 3017620422003)"
              value={testBarcode}
              onChange={(e) => setTestBarcode(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={testBarcodeSearch}
              disabled={loading || !testBarcode.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
            </Button>
          </div>
        </div>

        {/* Search Test */}
        <div className="space-y-3">
          <h3 className="font-medium">Test Product Search</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search for products (e.g., 'coca cola')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={testProductSearch}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h3 className="font-medium">
                {results.type === "barcode"
                  ? "Barcode Lookup"
                  : "Product Search"}{" "}
                Results
              </h3>
              {results.timing && (
                <Badge variant="outline">{results.timing}ms</Badge>
              )}
            </div>

            {results.success ? (
              <div className="space-y-3">
                {results.type === "barcode" ? (
                  results.data ? (
                    renderProduct(results.data as ProductData)
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No product found for this barcode.
                      </AlertDescription>
                    </Alert>
                  )
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Found {(results.data as ProductData[])?.length || 0}{" "}
                      products
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(results.data as ProductData[])?.map(renderProduct)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Test Cases */}
        <div className="space-y-3">
          <h3 className="font-medium">Quick Test Cases</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestBarcode("3017620422003")}
            >
              Nutella (Working)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestBarcode("0000000000000")}
            >
              Invalid Barcode
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("coca cola")}
            >
              Search: Coca Cola
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("xyz123invalid")}
            >
              Search: Invalid
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
