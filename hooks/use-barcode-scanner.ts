// Updated Custom hook for barcode scanning
import { useState, useCallback } from "react";
import { useScannerStore } from "@/store";
import { productAPI, APIError, NetworkError } from "@/lib/api/api";
import type { ProductData } from "@/types";

interface UseBarcodeScanner {
  scanBarcode: (barcode: string) => Promise<void>;
  clearResults: () => void;
  isLoading: boolean;
  product: ProductData | null;
  error: string | null;
  errorType: "network" | "api" | "validation" | "unknown" | null;
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "network" | "api" | "validation" | "unknown" | null
  >(null);

  const { setLastScannedCode } = useScannerStore();

  const scanBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode?.trim()) {
        setError("Please provide a valid barcode");
        setErrorType("validation");
        return;
      }

      setIsLoading(true);
      setError(null);
      setErrorType(null);
      setProduct(null);

      try {
        setLastScannedCode(barcode);
        const productData = await productAPI.searchByBarcode(barcode);

        if (productData) {
          setProduct(productData);
          setError(null);
          setErrorType(null);
        } else {
          setError(
            "Product not found in our database. You can add it manually."
          );
          setErrorType("api");
        }
      } catch (err) {
        console.error("Barcode scan error:", err);

        if (err instanceof NetworkError) {
          setError(
            "Network connection failed. Please check your internet connection and try again."
          );
          setErrorType("network");
        } else if (err instanceof APIError) {
          if (err.code === "INVALID_BARCODE") {
            setError(
              "This barcode format is not supported. Please try a different barcode."
            );
            setErrorType("validation");
          } else {
            setError(
              err.message ||
                "Failed to fetch product information. Please try again."
            );
            setErrorType("api");
          }
        } else {
          setError("An unexpected error occurred. Please try again.");
          setErrorType("unknown");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [setLastScannedCode]
  );

  const clearResults = useCallback(() => {
    setProduct(null);
    setError(null);
    setErrorType(null);
  }, []);

  return {
    scanBarcode,
    clearResults,
    isLoading,
    product,
    error,
    errorType,
  };
}
