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
  const [isQuaggaInitialized, setIsQuaggaInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const {
    isScanning,
    scannerError,
    startScanning,
    stopScanning,
    setScannerError,
    setLastScannedCode,
  } = useScannerStore();

  // Ensure component is mounted before initializing
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Wait for component to mount and scanner ref to be available
    if (!isMounted || !scannerRef.current) return;

    // Add a small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      initScanner();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      stopQuagga();
    };
  }, [isMounted]); // Depend on isMounted to ensure proper initialization

  const initScanner = async () => {
    // Double-check scanner ref is available
    if (!scannerRef.current) {
      console.error("Scanner ref not available");
      setScannerError("Scanner container not ready");
      setIsInitializing(false);
      return;
    }

    try {
      setIsInitializing(true);
      setScannerError(null);

      // Check for camera permissions first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch (permissionError) {
        console.error("Camera permission error:", permissionError);
        setScannerError(
          "Camera access denied. Please enable camera permissions in your browser settings."
        );
        setIsInitializing(false);
        return;
      }

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());

      // Ensure the interactive element exists
      const targetElement = document.querySelector("#interactive");
      if (!targetElement) {
        console.error("Scanner target element not found");
        setScannerError(
          "Scanner initialization error. Please refresh and try again."
        );
        setIsInitializing(false);
        return;
      }

      console.log("Initializing Quagga with target:", targetElement);

      // Initialize Quagga2 with proper configuration
      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#interactive") || undefined, // Use querySelector to ensure we get the element
            constraints: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "environment",
            },
          },
          locator: {
            patchSize: "medium",
            halfSample: true,
          },
          numOfWorkers: 0,
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
              "Failed to initialize camera. Please check permissions and try again."
            );
            setIsInitializing(false);
            return;
          }

          console.log("Quagga2 initialized successfully");
          setIsQuaggaInitialized(true);

          // Start Quagga after successful initialization
          try {
            Quagga.start();
            startScanning();
          } catch (startError) {
            console.error("Error starting Quagga:", startError);
            setScannerError("Failed to start camera stream");
          }

          setIsInitializing(false);
        }
      );

      // Set up barcode detection handler
      Quagga.onDetected((result) => {
        if (!result?.codeResult?.code) return;

        const code = result.codeResult.code;
        console.log("Barcode detected:", code);

        if (code && code.length >= 8) {
          setLastScannedCode(code);
          onScanComplete(code);
          stopQuagga();
        }
      });

      // Set up process handler to catch any errors during processing
      Quagga.onProcessed((result) => {
        if (result && result.boxes) {
          // This ensures Quagga is processing frames correctly
          console.log("Processing frame");
        }
      });
    } catch (error) {
      console.error("Scanner initialization error:", error);
      setScannerError(
        error instanceof Error
          ? error.message
          : "Camera access denied. Please enable camera permissions."
      );
      setIsInitializing(false);
    }
  };

  const stopQuagga = () => {
    if (isQuaggaInitialized) {
      try {
        Quagga.stop();
        Quagga.offDetected(); // Remove all event listeners
        Quagga.offProcessed(); // Remove process listeners
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
            id="interactive"
            className={`relative w-full h-64 bg-black rounded-lg overflow-hidden viewport ${
              isInitializing ? "hidden" : "block"
            }`}
            style={{
              minHeight: "256px",
              position: "relative",
            }}
          >
            {/* Video element will be inserted here by Quagga */}
          </div>

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
