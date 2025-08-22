// Updated Barcode scanning component using react-zxing
"use client";

import { useState, useEffect } from "react";
import { useScannerStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CameraSkeleton } from "@/components/ui/skeletons";
import { useApiToast } from "@/hooks/use-toast";
import { Loader2, X, AlertCircle, Flashlight, RotateCcw } from "lucide-react";
import { useZxing } from "react-zxing";

interface BarcodeScannerProps {
  onScanComplete: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({
  onScanComplete,
  onClose,
}: BarcodeScannerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { barcodeScanned, scanError } = useApiToast();
  const {
    isScanning,
    scannerError,
    startScanning,
    stopScanning,
    setScannerError,
    setLastScannedCode,
  } = useScannerStore();

  // Use react-zxing hook
  const { ref, torch } = useZxing({
    onDecodeResult(result) {
      if (result?.getText()) {
        const barcodeText = result.getText();
        setLastScannedCode(barcodeText);
        barcodeScanned(`Barcode: ${barcodeText}`);
        onScanComplete(barcodeText);
        stopScanning();
      }
    },
    onError(err) {
      const errorMessage = err instanceof Error ? err.message : "Camera error";
      setError(errorMessage);
      setScannerError(errorMessage);
      scanError("barcode", errorMessage);
      setIsLoading(false);
    },
    timeBetweenDecodingAttempts: 300,
    constraints: {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    },
    paused: !isScanning,
  });

  // Handle video element ready state
  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // Start scanning when component mounts
  useEffect(() => {
    startScanning();

    // Set a timeout to stop loading if camera doesn't initialize within 10 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("Camera initialization timed out. Please try again.");
      }
    }, 10000);

    return () => {
      stopScanning();
      clearTimeout(timeout);
    };
  }, [startScanning, stopScanning, isLoading]);

  // Torch toggle handler
  const handleToggleTorch = async () => {
    if (torch.isAvailable) {
      if (torch.isOn) {
        await torch.off();
      } else {
        await torch.on();
      }
    }
  };

  // Close handler
  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardContent className="flex flex-col items-center p-4">
        <div className="w-full flex justify-between items-center mb-2">
          <span className="font-semibold text-lg">Scan Barcode</span>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X />
          </Button>
        </div>
        <div className="relative w-full flex flex-col items-center">
          {isLoading ? (
            <CameraSkeleton />
          ) : (
            <>
              <video
                ref={ref}
                className="rounded border w-full h-64 object-cover bg-black"
                autoPlay
                muted
                playsInline
                onLoadedMetadata={handleVideoLoad}
                onCanPlay={handleVideoLoad}
              />
              {torch.isAvailable && (
                <Button
                  variant={torch.isOn ? "default" : "outline"}
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleToggleTorch}
                  aria-label="Toggle Flashlight"
                >
                  <Flashlight
                    className={torch.isOn ? "text-yellow-400" : undefined}
                  />
                </Button>
              )}
            </>
          )}
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 mt-4">
            <Loader2 className="animate-spin" />
            <span>Initializing camera...</span>
          </div>
        )}
        {(error || scannerError) && (
          <Alert variant="destructive" className="mt-4 w-full">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="space-y-2">
              <p>{error || scannerError}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setScannerError(null);
                  setIsLoading(true);
                  startScanning();
                }}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                <RotateCcw className="mr-2 h-3 w-3" />
                Retry Camera
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2 mt-4 w-full">
          <Button variant="secondary" onClick={handleClose} className="w-full">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
