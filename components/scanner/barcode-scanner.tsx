// Updated Barcode scanning component
"use client";

import { useEffect, useRef, useState } from "react";
import { useScannerStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, X, Camera, AlertCircle } from "lucide-react";
import Quagga from "@ericblade/quagga2"; // Updated import

interface BarcodeScannerProps {
  onScanComplete: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({
  onScanComplete,
  onClose,
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isQuaggaInitialized, setIsQuaggaInitialized] = useState(false); // Track initialization manually
  const {
    isScanning,
    scannerError,
    startScanning,
    stopScanning,
    setScannerError,
    setLastScannedCode,
  } = useScannerStore();

  useEffect(() => {
    if (!scannerRef.current) return;

    const initScanner = async () => {
      try {
        setIsInitializing(true);
        setScannerError(null);

        // Check for camera permissions first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop()); // Stop the test stream

        // Initialize Quagga2 with the proper target element
        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: scannerRef.current || undefined, // Pass the DOM element directly
              constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 },
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: 0, // Set to 0 as per Quagga2 docs
            frequency: 10,
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
              ],
            },
            locate: true,
          },
          (err) => {
            if (err) {
              console.error("Quagga initialization error:", err);
              setScannerError(
                "Failed to initialize camera. Please check permissions."
              );
              setIsInitializing(false);
              return;
            }

            console.log("Quagga2 initialized successfully");
            setIsQuaggaInitialized(true);
            Quagga.start();
            startScanning();
            setIsInitializing(false);
          }
        );

        // Set up barcode detection
        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          console.log("Barcode detected:", code);

          if (code && code.length >= 8) {
            // Valid barcode length
            setLastScannedCode(code);
            onScanComplete(code);
            stopQuagga();
          }
        });
      } catch (error) {
        console.error("Scanner initialization error:", error);
        setScannerError(
          "Camera access denied. Please enable camera permissions."
        );
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      stopQuagga();
    };
  }, []); // Empty dependency array is correct here

  const stopQuagga = () => {
    if (isQuaggaInitialized) {
      // Use our own tracking instead of Quagga.initialized
      try {
        Quagga.stop();
        Quagga.offDetected(); // Remove all event listeners
        setIsQuaggaInitialized(false);
      } catch (error) {
        console.error("Error stopping Quagga:", error);
      }
    }
    stopScanning();
  };

  const handleClose = () => {
    stopQuagga();
    onClose();
  };

  if (scannerError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{scannerError}</AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Scan Barcode</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {isInitializing && (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Initializing camera...</p>
            </div>
          )}

          <div
            ref={scannerRef}
            className={`w-full h-64 bg-black rounded-lg overflow-hidden ${
              isInitializing ? "hidden" : "block"
            }`}
          />

          {isScanning && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-green-500 w-48 h-32 rounded-lg animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Position the barcode within the green frame
          </p>
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Camera className="h-3 w-3 mr-1" />
            Make sure the barcode is clearly visible and well-lit
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Enter Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
