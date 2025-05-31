import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useFoodRecognition } from "@/hooks/use-food-recognition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RotateCcw, AlertCircle, Zap, Grid } from "lucide-react";
import { DetectedFood } from "@/types/ml";

interface CameraScannerProps {
  onCapture?: (imageData: string) => void;
  onError?: (error: string) => void;
  onFoodDetected?: (food: DetectedFood) => void;
  className?: string;
}

export function CameraScanner({
  onCapture,
  onError,
  onFoodDetected,
  className = "",
}: CameraScannerProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [isLiveDetection, setIsLiveDetection] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    getFrame,
    isActive,
    error,
    devices,
  } = useCamera({
    facingMode: "environment",
    width: 1280,
    height: 720,
  });

  const { detectFoods, modelLoaded, confidence } = useFoodRecognition();

  const containerRef = useRef<HTMLDivElement>(null);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle live detection
  useEffect(() => {
    if (isLiveDetection && isActive && modelLoaded) {
      // Run detection every 500ms
      detectionIntervalRef.current = setInterval(async () => {
        const imageData = getFrame();
        if (imageData) {
          try {
            const results = await detectFoods(imageData);
            setDetectedFoods(results);
            if (results.length > 0 && onFoodDetected) {
              onFoodDetected(results[0]); // Notify parent of the highest confidence detection
            }
          } catch (err) {
            console.error("Live detection error:", err);
          }
        }
      }, 500);
    } else if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [
    isLiveDetection,
    isActive,
    modelLoaded,
    detectFoods,
    getFrame,
    onFoodDetected,
  ]);

  const handleCapture = async () => {
    if (!isActive || isProcessing) return;

    setIsProcessing(true);
    setFlashActive(true);

    try {
      const imageData = getFrame();
      if (imageData) {
        // Trigger flash effect
        setTimeout(() => setFlashActive(false), 200);

        // Process image with food recognition
        const results = await detectFoods(imageData);
        setDetectedFoods(results);
        if (results.length > 0 && onFoodDetected) {
          onFoodDetected(results[0]); // Notify parent of the highest confidence detection
        }

        if (onCapture) {
          onCapture(imageData);
        }
      }
    } catch (err) {
      if (onError) {
        onError(err instanceof Error ? err.message : "Failed to process image");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchCamera = () => {
    if (devices.length > 1) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const currentDevice = devices.find(
        (device) =>
          device.deviceId ===
          stream?.getVideoTracks()[0]?.getSettings().deviceId
      );
      const nextDevice = devices.find(
        (device) => device.deviceId !== currentDevice?.deviceId
      );
      if (nextDevice) {
        switchCamera(nextDevice.deviceId);
      }
    }
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div ref={containerRef} className="relative aspect-video w-full bg-black">
        {error ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Flash effect */}
            {flashActive && (
              <div className="absolute inset-0 bg-white opacity-50 transition-opacity duration-200" />
            )}

            {/* Grid overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="grid grid-cols-3 grid-rows-3 h-full">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>
            )}

            {/* Detection results overlay */}
            {detectedFoods.map((food, index) => (
              <div
                key={index}
                className="absolute border-2 border-green-500 bg-green-500/20 transition-all duration-300"
                style={{
                  left: `${food.boundingBox.x}%`,
                  top: `${food.boundingBox.y}%`,
                  width: `${food.boundingBox.width}%`,
                  height: `${food.boundingBox.height}%`,
                }}
              >
                <div className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-1 text-sm rounded-t">
                  {food.name} ({Math.round(food.confidence * 100)}%)
                </div>
              </div>
            ))}

            {/* Confidence indicator */}
            {isLiveDetection && (
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-black/50 p-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleSwitchCamera}
                disabled={devices.length <= 1}
                title="Switch Camera"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={handleCapture}
                disabled={!isActive || isProcessing || !modelLoaded}
                title="Capture"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setFlashActive(true)}
                title="Flash"
              >
                <Zap className="h-4 w-4" />
              </Button>
              <Button
                variant={isLiveDetection ? "default" : "secondary"}
                size="icon"
                onClick={() => setIsLiveDetection(!isLiveDetection)}
                disabled={!modelLoaded}
                title="Toggle Live Detection"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
