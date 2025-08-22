import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useFoodRecognition } from "@/hooks/use-food-recognition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  RotateCcw,
  AlertCircle,
  Zap,
  Grid,
  Barcode,
  Loader2,
} from "lucide-react";
import { DetectedFood } from "@/types/ml";

interface CameraScannerProps {
  onCapture?: (imageData: string) => void;
  onError?: (error: string) => void;
  onFoodDetected?: (food: DetectedFood) => void;
  className?: string;
  mode?: "food" | "barcode";
  onModeChange?: (mode: "food" | "barcode") => void;
}

export function CameraScanner({
  onCapture,
  onError,
  onFoodDetected,
  className = "",
  mode: initialMode = "food",
  onModeChange,
}: CameraScannerProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [isLiveDetection, setIsLiveDetection] = useState(false);
  const [mode, setMode] = useState<"food" | "barcode">(initialMode || "food");
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [modalFood, setModalFood] = useState<DetectedFood | null>(null);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [diarySuccess, setDiarySuccess] = useState("");
  const [diaryError, setDiaryError] = useState("");

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

  const {
    detectFoods,
    isLoading: foodLoading,
    confidence,
  } = useFoodRecognition();

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

  // Handle live detection (only in food mode)
  useEffect(() => {
    if (mode === "food" && isLiveDetection && isActive) {
      detectionIntervalRef.current = setInterval(async () => {
        const imageData = getFrame();
        if (imageData) {
          try {
            const results = await detectFoods(imageData);
            setDetectedFoods(results);
            if (results.length > 0 && onFoodDetected) {
              onFoodDetected(results[0]);
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
  }, [mode, isLiveDetection, isActive, detectFoods, getFrame, onFoodDetected]);

  const handleCapture = async () => {
    if (!isActive || isProcessing) return;
    setIsProcessing(true);
    setFlashActive(true);
    try {
      const imageData = getFrame();
      if (imageData) {
        setTimeout(() => setFlashActive(false), 200);
        if (mode === "food") {
          const results = await detectFoods(imageData);
          setDetectedFoods(results);
          if (results.length > 0 && onFoodDetected) {
            onFoodDetected(results[0]);
          }
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

  const handleModeToggle = () => {
    const newMode = mode === "food" ? "barcode" : "food";
    setMode(newMode);
    if (onModeChange) onModeChange(newMode);
    setDetectedFoods([]);
    setIsLiveDetection(false);
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
            {/* Detection results overlay (only in food mode) */}
            {mode === "food" &&
              detectedFoods.map((food, index) =>
                food.boundingBox ? (
                  <div
                    key={index}
                    className="absolute border-2 border-green-500 bg-green-500/20 transition-all duration-300"
                    style={{
                      left: `${food.boundingBox.x}%`,
                      top: `${food.boundingBox.y}%`,
                      width: `${food.boundingBox.width}%`,
                      height: `${food.boundingBox.height}%`,
                      zIndex: 40,
                    }}
                    aria-label={`Detected food: ${food.name}`}
                    tabIndex={0}
                  >
                    <div className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-1 text-sm rounded-t shadow">
                      {food.name} ({Math.round(food.confidence * 100)}%)
                    </div>
                    {food.nutrition && (
                      <div className="absolute left-0 top-full mt-2 w-56 max-w-xs bg-white text-gray-900 rounded shadow-lg p-3 text-xs animate-fade-in z-50">
                        <div className="font-semibold mb-1">
                          Nutrition (per 100g)
                        </div>
                        <ul className="space-y-1">
                          <li>
                            Calories:{" "}
                            <span className="font-bold">
                              {food.nutrition.calories}
                            </span>{" "}
                            kcal
                          </li>
                          <li>
                            Protein:{" "}
                            <span className="font-bold">
                              {food.nutrition.protein}
                            </span>{" "}
                            g
                          </li>
                          <li>
                            Carbs:{" "}
                            <span className="font-bold">
                              {food.nutrition.carbohydrates}
                            </span>{" "}
                            g
                          </li>
                          <li>
                            Fat:{" "}
                            <span className="font-bold">
                              {food.nutrition.fat}
                            </span>{" "}
                            g
                          </li>
                        </ul>
                        <button
                          className="mt-2 w-full bg-green-600 text-white rounded py-1 text-xs font-medium hover:bg-green-700 transition"
                          aria-label="Add to Diary"
                          onClick={() => setModalFood(food)}
                        >
                          Add to Diary
                        </button>
                      </div>
                    )}
                  </div>
                ) : null
              )}
            {/* Confidence indicator (only in food mode) */}
            {mode === "food" && isLiveDetection && (
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Confidence: {Math.round(confidence * 100)}%
              </div>
            )}
            {mode === "food" && detectedFoods.length > 0 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-green-600 text-white px-4 py-2 rounded shadow animate-fade-in">
                Food detected!
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
                disabled={
                  !isActive || isProcessing || (mode === "food" && foodLoading)
                }
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
              {mode === "food" && (
                <Button
                  variant={isLiveDetection ? "default" : "secondary"}
                  size="icon"
                  onClick={() => setIsLiveDetection(!isLiveDetection)}
                  disabled={foodLoading}
                  title="Toggle Live Detection"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant={mode === "food" ? "default" : "secondary"}
                size="icon"
                onClick={handleModeToggle}
                title={
                  mode === "food"
                    ? "Switch to Barcode Mode"
                    : "Switch to Food Mode"
                }
              >
                <Barcode className="h-4 w-4" />
              </Button>
            </div>
            {foodLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                <Loader2
                  className="h-10 w-10 animate-spin text-white"
                  aria-label="Loading"
                />
              </div>
            )}
            {error && (
              <div className="absolute top-0 left-0 right-0 z-30 bg-red-600 text-white text-center py-2">
                {error}
              </div>
            )}
            {/* Add to Diary Modal */}
            {modalFood && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-w-full animate-fade-in">
                  <h2 className="font-bold text-lg mb-2">Add to Diary</h2>
                  <div className="mb-2">{modalFood.name}</div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setDiaryLoading(true);
                      setDiaryError("");
                      setDiarySuccess("");
                      const form = e.target as HTMLFormElement;
                      const servingSize = Number(
                        (form["servingSize"] as HTMLInputElement).value
                      );
                      const mealType = (form["mealType"] as HTMLSelectElement)
                        .value;
                      try {
                        const res = await fetch("/api/intake/entry", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: modalFood.name,
                            servingSize,
                            servingUnit: "g",
                            quantity: 1,
                            mealType,
                            nutrition: {
                              ...modalFood.nutrition,
                              calories: Math.round(
                                (modalFood.nutrition?.calories || 0) *
                                  (servingSize / 100)
                              ),
                              protein:
                                Math.round(
                                  (modalFood.nutrition?.protein || 0) *
                                    (servingSize / 100) *
                                    10
                                ) / 10,
                              carbohydrates:
                                Math.round(
                                  (modalFood.nutrition?.carbohydrates || 0) *
                                    (servingSize / 100) *
                                    10
                                ) / 10,
                              fat:
                                Math.round(
                                  (modalFood.nutrition?.fat || 0) *
                                    (servingSize / 100) *
                                    10
                                ) / 10,
                            },
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to add entry");
                        setDiarySuccess("Added to diary!");
                        setTimeout(() => setModalFood(null), 1200);
                      } catch {
                        setDiaryError("Failed to add entry");
                      } finally {
                        setDiaryLoading(false);
                      }
                    }}
                  >
                    <label className="block text-xs mb-1">
                      Serving size (g):
                    </label>
                    <input
                      name="servingSize"
                      type="number"
                      min="1"
                      max="1000"
                      defaultValue={100}
                      className="w-full border rounded px-2 py-1 mb-2 text-xs"
                      required
                    />
                    <label className="block text-xs mb-1">Meal type:</label>
                    <select
                      name="mealType"
                      className="w-full border rounded px-2 py-1 mb-2 text-xs"
                      defaultValue="LUNCH"
                    >
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                      <option value="SNACK">Snack</option>
                    </select>
                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white rounded py-1 text-xs font-medium hover:bg-green-700 transition"
                      disabled={diaryLoading}
                    >
                      {diaryLoading ? "Adding..." : "Add"}
                    </button>
                    {diarySuccess && (
                      <div className="text-green-600 text-xs mt-2">
                        {diarySuccess}
                      </div>
                    )}
                    {diaryError && (
                      <div className="text-red-600 text-xs mt-2">
                        {diaryError}
                      </div>
                    )}
                    <button
                      type="button"
                      className="w-full mt-2 text-xs underline text-gray-500"
                      onClick={() => setModalFood(null)}
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
